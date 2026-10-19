'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readPublicGitHubStatus,getJSON,PATHS,REPO,BRANCH,WORKFLOW,EXPECTED_JOBS}=require('./github-public-status.cjs');
const {runStatusIntent}=require('./status-gate.cjs');
const {authorizeIntent}=require('./authz-contract.cjs');
const HEAD='c'.repeat(40);
const NOW='2026-10-19T14:00:00.000Z';
const MS=Date.parse(NOW);
const origin='https://atlas.example.invalid';
const checkout={
 sha:HEAD
};
const workflow={
 workflow_runs:[{
  id:39192000001,head_sha:HEAD,head_branch:BRANCH,path:WORKFLOW,
  status:'completed',conclusion:'success',
  html_url:'https://github.com/'+REPO+'/actions/runs/39192000001'
 }]
};
const jobs={jobs:EXPECTED_JOBS.map(name=>({name,status:'completed',conclusion:'success'}))};
const jobURL='https://api.github.com/repos/'+REPO+'/actions/runs/39192000001/jobs?per_page=20';
function transportWith(map,record=[]){
 return async (url,init)=>{
  record.push({url,init});
  if(!Object.hasOwn(map,url))throw Error('unexpected URL '+url);
  const item=map[url];
  if(item instanceof Error)throw item;
  if(typeof item==='function')return item();
  return new Response(JSON.stringify(item),{
   status:200,headers:{'content-type':'application/json'}
  });
 };
}
const normal=()=>({[PATHS.commit]:[checkout],[PATHS.runs]:workflow,[jobURL]:jobs});
const now=()=>new Date(NOW);
const request=(intent='EXECUTE')=>({action:'STATUS',intent,request_id:'fixed-test',csrf:'test-bound-csrf'});
const trusted=()=>({
 method:'POST',content_type:'application/json',
 origin,allowed_origin:origin,
 session:{verified:true,role:'owner',realm:'ATLAS_REVIEW',
  subject:'reviewer',csrf_token:'test-bound-csrf',
  issued_at:MS-500,expires_at:MS+60_000}
});

test('bounded adapter reads exactly three allowlisted public GET routes and proves current-head jobs',async()=>{
 const calls=[];
 const status=await readPublicGitHubStatus({transport:transportWith(normal(),calls),now});
 assert.equal(status.status,'MATCH');
 assert.equal(status.reason,'CURRENT_HEAD_REVIEW_JOBS_GREEN');
 assert.equal(status.head_sha,HEAD);
 assert.equal(status.ci.run_id,39192000001);
 assert.equal(status.jobs.length,5);
 assert.equal(status.sources.length,3);
 assert.equal(status.credentials_used,false);
 assert.equal(status.provider_bridge_connected,false);
 assert.equal(status.production_authority,false);
 assert.deepEqual(calls.map(x=>x.url),[PATHS.commit,PATHS.runs,jobURL]);
 assert.ok(calls.every(x=>x.init.method==='GET'&&x.init.redirect==='error'&&
  x.init.credentials==='omit'&&x.init.cache==='no-store'));
 assert.ok(calls.every(x=>x.init.headers['X-GitHub-Api-Version']==='2026-03-10'));
 assert.ok(calls.every(x=>!Object.hasOwn(x.init.headers,'Authorization')));
 assert.equal(status.observed_at,NOW);
});

test('source identity and status cannot be provided as caller-defined URLs or extra remote branches',async()=>{
 const client=transportWith(normal());
 await assert.rejects(()=>getJSON('https://evil.invalid/private',client),/URL_NOT_ALLOWLISTED/);
 await assert.rejects(()=>getJSON('https://api.github.com/repos/'+REPO+'/issues',client),/URL_NOT_ALLOWLISTED/);
 await assert.rejects(()=>getJSON('https://api.github.com/repos/'+REPO+'/actions/runs/0/jobs?per_page=20',client),/URL_NOT_ALLOWLISTED/);
 assert.equal(await readPublicGitHubStatus({transport:client,now}).then(x=>x.status),'MATCH');
});

test('unconfirmed new HEAD prevents an old green CI from appearing current',async()=>{
 const map=normal();
 map[PATHS.runs]={workflow_runs:[{...workflow.workflow_runs[0],head_sha:'b'.repeat(40)}]};
 const result=await readPublicGitHubStatus({transport:transportWith(map),now});
 assert.equal(result.status,'PARTIAL');
 assert.equal(result.reason,'NO_CI_FOR_CURRENT_HEAD');
 assert.equal(result.ci,null);
});

test('CI in progress is PARTIAL, not a green pass',async()=>{
 const map=normal();
 map[PATHS.runs]={workflow_runs:[{...workflow.workflow_runs[0],status:'in_progress',conclusion:null}]};
 const requests=[];
 const result=await readPublicGitHubStatus({transport:transportWith(map,requests),now});
 assert.equal(result.status,'PARTIAL');
 assert.equal(result.reason,'CI_NOT_COMPLETED');
 assert.equal(requests.length,2);
});

test('current-head failing CI and failing jobs become CONFLICT',async()=>{
 const map=normal();
 map[PATHS.runs]={workflow_runs:[{...workflow.workflow_runs[0],conclusion:'failure'}]};
 const result=await readPublicGitHubStatus({transport:transportWith(map),now});
 assert.equal(result.status,'CONFLICT');
 assert.equal(result.reason,'CURRENT_HEAD_CI_FAILURE');
});

test('missing or non-green required jobs cannot masquerade as complete',async()=>{
 const oneMissing=normal();
 oneMissing[jobURL]={jobs:jobs.jobs.slice(1)};
 const a=await readPublicGitHubStatus({transport:transportWith(oneMissing),now});
 assert.equal(a.status,'PARTIAL');
 assert.equal(a.reason,'REQUIRED_JOB_INCOMPLETE_OR_MISSING');
 assert.equal(a.jobs[0].status,'UNKNOWN');
 const pending=normal();
 pending[jobURL]={jobs:jobs.jobs.map((j,i)=>i?j:{...j,conclusion:null,status:'in_progress'})};
 const b=await readPublicGitHubStatus({transport:transportWith(pending),now});
 assert.equal(b.status,'PARTIAL');
 const failing=normal();
 failing[jobURL]={jobs:jobs.jobs.map((j,i)=>i?j:{...j,conclusion:'failure'})};
 const c=await readPublicGitHubStatus({transport:transportWith(failing),now});
 assert.equal(c.status,'CONFLICT');
});

test('rate limit, 404, network or forged provider URLs never produce MATCH',async()=>{
 const rate=normal();
 rate[PATHS.commit]=()=>new Response('{}',{status:403});
 const a=await readPublicGitHubStatus({transport:transportWith(rate),now});
 assert.equal(a.status,'UNKNOWN');assert.equal(a.reason,'RATE_LIMIT_OR_FORBIDDEN');
 const notFound=normal();
 notFound[PATHS.commit]=()=>new Response('{}',{status:404});
 const b=await readPublicGitHubStatus({transport:transportWith(notFound),now});
 assert.equal(b.reason,'GITHUB_HTTP_404');
 const offline=normal();offline[PATHS.commit]=new Error('network down');
 const c=await readPublicGitHubStatus({transport:transportWith(offline),now});
 assert.equal(c.reason,'PUBLIC_SOURCE_UNAVAILABLE');
 const forged=normal();
 forged[PATHS.runs]={workflow_runs:[{...workflow.workflow_runs[0],html_url:'https://attacker.invalid/steal'}]};
 const d=await readPublicGitHubStatus({transport:transportWith(forged),now});
 assert.equal(d.reason,'INVALID_RUN_URL');
});

test('invalid JSON, oversized body or malformed commit fail closed',async()=>{
 const junk=normal();
 junk[PATHS.commit]=()=>new Response('{nope',{status:200});
 assert.equal((await readPublicGitHubStatus({transport:transportWith(junk),now})).reason,'INVALID_PROVIDER_JSON');
 const big=normal();
 big[PATHS.commit]=()=>new Response(JSON.stringify(Array(400000).fill('x')),{status:200});
 assert.equal((await readPublicGitHubStatus({transport:transportWith(big),now})).reason,'OVERSIZED_PROVIDER_RESPONSE');
 const bad=normal();bad[PATHS.commit]=[{sha:'bad'}];
 assert.equal((await readPublicGitHubStatus({transport:transportWith(bad),now})).reason,'INVALID_COMMIT_SCHEMA');
});

test('status bridge never calls GitHub when no trusted session, bad CSRF or spoofed client permission',async()=>{
 let calls=0;
 const reader=async()=>{calls++;return await readPublicGitHubStatus({transport:transportWith(normal()),now});};
 const noAuth=await runStatusIntent(request(),null,MS,reader);
 assert.equal(noAuth.authorization,'DENIED_OR_NOT_EXECUTABLE');
 assert.equal(noAuth.provider_calls,0);
 const bad=await runStatusIntent({...request(),csrf:'fake'},trusted(),MS,reader);
 assert.equal(bad.reason,'CSRF_MISMATCH');
 const fake=await runStatusIntent({...request(),session:{verified:true}},trusted(),MS,reader);
 assert.equal(fake.reason,'INVALID_REQUEST_SHAPE');
 assert.equal(calls,0);
});

test('authenticated preview is not an execution and never makes an external request',async()=>{
 let calls=0;
 const receipt=await runStatusIntent(request('PREVIEW'),trusted(),MS,async()=>{calls++;throw Error('unexpected call');});
 assert.equal(receipt.reason,'PREVIEW_NO_EXTERNAL_READ');
 assert.equal(receipt.authorization,'TRUST_CONTEXT_PREVIEW_ONLY');
 assert.equal(receipt.provider_calls,0);
 assert.equal(calls,0);
});

test('synthetically authenticated STATUS intent returns only a public read receipt',async()=>{
 const reader=()=>readPublicGitHubStatus({transport:transportWith(normal()),now});
 const receipt=await runStatusIntent(request(),trusted(),MS,reader);
 assert.equal(receipt.authorization,'TRUST_CONTEXT_READ_INTENT_ONLY');
 assert.equal(receipt.result,'MATCH');
 assert.equal(receipt.provider_calls,1);
 assert.equal(receipt.head_sha,HEAD);
 assert.equal(receipt.sources.length,3);
 assert.deepEqual(receipt.remaining_blockers,['REAL_IDENTITY_PROVIDER_NOT_WIRED','PRIVATE_HTTPS_HOSTING_NOT_DEPLOYED']);
 assert.equal(authorizeIntent(request(),trusted(),MS).execution,'NOT_IMPLEMENTED');
});

test('write and research intents cannot pass through read-only bridge or consume grants',async()=>{
 let count=0,consumed=0;
 const c=trusted();
 c.review_grant={id:'review-one-use',action:'MASTERSAVE',subject:c.session.subject,
  approved_by_owner:true,issued_at:MS-100,expires_at:MS+10000};
 c.consume_grant_once=()=>{consumed++;return true;};
 const res=await runStatusIntent({...request(),action:'MASTERSAVE'},c,MS,async()=>{count++;});
 assert.equal(res.reason,'ONLY_STATUS_READ_ALLOWED');
 assert.equal(count,0);assert.equal(consumed,0);
 const resume=await runStatusIntent({...request(),action:'RESUME'},c,MS,async()=>{count++;});
 assert.equal(resume.reason,'ONLY_STATUS_READ_ALLOWED');
 assert.equal(count,0);
});

test('adapter errors, fabricated success and transport exhaustion remain UNKNOWN',async()=>{
 const fail=await runStatusIntent(request(),trusted(),MS,async()=>{throw Error('missing network');});
 assert.equal(fail.result,'UNKNOWN');
 assert.equal(fail.provider_calls,1);
 const fake=await runStatusIntent(request(),trusted(),MS,async()=>({
  schema:'atlas.remote.public-github-status.v1',repo:REPO,branch:BRANCH,
  status:'MATCH',credentials_used:true,provider_bridge_connected:true,
  production_authority:true,sources:[]
 }));
 assert.equal(fake.reason,'INVALID_PROVIDER_REPORT');
 assert.equal(fake.authorization,'DENIED_OR_NOT_EXECUTABLE');
});
