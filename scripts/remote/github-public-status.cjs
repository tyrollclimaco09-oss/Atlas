'use strict';

// Bounded GitHub PUBLIC REST reader. No ChatGPT plugins, GitHub token,
// cookie, user URL, deployment or write authority. Never expose this as
// an unauthenticated PRIVATE remote endpoint: a server identity gate is
// separately required before this can serve phone users.
const REPO='tyrollclimaco09-oss/Atlas';
const BRANCH='review/pass0-slate-regression-2026-10-16';
const WORKFLOW='.github/workflows/atlas-review-pass1.yml';
const API='https://api.github.com/repos/'+REPO;
const VERSION='atlas.remote.public-github-status.v1';
const EXPECTED_JOBS=Object.freeze([
 'Original baseline provenance',
 'Review code and regression suite',
 'Real Chromium archive smoke',
 'Offline SCOUT and Outcome Intelligence shadow',
 'MasterSave source integrity and drift denials'
]);
const SHA=/^[0-9a-f]{40}$/;
const SAFE_TIME=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/;
const MAX_BYTES=1_000_000;
const PATHS=Object.freeze({
 commit:API+'/commits?sha='+encodeURIComponent(BRANCH)+'&per_page=1',
 runs:API+'/actions/runs?branch='+encodeURIComponent(BRANCH)+'&per_page=5'
});
const own=(v,k)=>v&&typeof v==='object'&&Object.hasOwn(v,k);
const isSha=s=>typeof s==='string'&&SHA.test(s);
const acceptableURL=(id,url)=>typeof url==='string'&&
 url==='https://github.com/'+REPO+'/actions/runs/'+id;
const knownError=err=>err&&typeof err.code==='string'?err.code:'PUBLIC_SOURCE_UNAVAILABLE';
const failure=(time,reason,source=[],head=null)=>({
 schema:VERSION,scope:'PUBLIC_REVIEW_ONLY',repo:REPO,branch:BRANCH,
 observed_at:time,status:'UNKNOWN',reason,head_sha:head,ci:null,
 jobs:[],sources:source,credentials_used:false,
 provider_bridge_connected:false,production_authority:false
});
function isoTime(now) {
 const d=typeof now==='function'?now():now;
 if(!(d instanceof Date)||!Number.isFinite(d.getTime()))throw Error('INVALID_CLOCK');
 const s=d.toISOString();if(!SAFE_TIME.test(s))throw Error('INVALID_CLOCK');
 return s;
}
function closedError(code){const e=new Error(code);e.code=code;return e;}
async function getJSON(url,transport) {
 if(typeof transport!=='function')throw closedError('HTTP_TRANSPORT_MISSING');
 // The caller cannot specify arbitrary paths, domains, refs, or query strings.
 if(url!==PATHS.commit&&url!==PATHS.runs&&!/^https:\/\/api\.github\.com\/repos\/tyrollclimaco09-oss\/Atlas\/actions\/runs\/[1-9][0-9]{0,15}\/jobs\?per_page=20$/.test(url))
  throw closedError('URL_NOT_ALLOWLISTED');
 const signal=AbortSignal.timeout(5000);
 let response;
 try{
  response=await transport(url,{method:'GET',redirect:'error',cache:'no-store',
   credentials:'omit',signal,headers:{
    'Accept':'application/vnd.github+json',
    'X-GitHub-Api-Version':'2026-03-10',
    'User-Agent':'atlas-operator-review-only'
   }});
 }catch{throw closedError('PUBLIC_SOURCE_UNAVAILABLE');}
 if(!response||typeof response.status!=='number'||typeof response.text!=='function')
  throw closedError('BAD_HTTP_RESPONSE');
 if(response.status!==200)throw closedError(response.status===403||response.status===429?
   'RATE_LIMIT_OR_FORBIDDEN':'GITHUB_HTTP_'+response.status);
 const length=Number(response.headers&&response.headers.get('content-length'));
 if(Number.isFinite(length)&&length>MAX_BYTES)throw closedError('OVERSIZED_PROVIDER_RESPONSE');
 // Use bounded streaming rather than decoding an unbounded provider response.
 if(!response.body||typeof response.body.getReader!=='function')
  throw closedError('NO_BOUNDED_RESPONSE_BODY');
 const reader=response.body.getReader(),buffers=[];let bytes=0;
 try{
  while(true){
   const result=await reader.read();if(result.done)break;
   if(!(result.value instanceof Uint8Array))throw closedError('BAD_STREAM_CHUNK');
   bytes+=result.value.byteLength;
   if(bytes>MAX_BYTES)throw closedError('OVERSIZED_PROVIDER_RESPONSE');
   buffers.push(Buffer.from(result.value));
  }
 }catch(err){try{await reader.cancel();}catch{}throw err.code?err:closedError('BAD_PROVIDER_STREAM');}
 let parsed;
 try{parsed=JSON.parse(Buffer.concat(buffers).toString('utf8'));}catch{throw closedError('INVALID_PROVIDER_JSON');}
 if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)) {
  if(url===PATHS.commit&&Array.isArray(parsed))return parsed;
  throw closedError('INVALID_PROVIDER_SCHEMA');
 }
 return parsed;
}
function summarizeJobs(data) {
 if(!data||!Array.isArray(data.jobs))throw closedError('INVALID_JOBS_SCHEMA');
 const entries=[];
 for(const name of EXPECTED_JOBS){
  const matches=data.jobs.filter(j=>j&&j.name===name);
  if(matches.length!==1){entries.push({name,status:'UNKNOWN',conclusion:null});continue;}
  const j=matches[0];
  entries.push({name,status:typeof j.status==='string'?j.status:'UNKNOWN',
   conclusion:typeof j.conclusion==='string'?j.conclusion:null});
 }
 return entries;
}
async function readPublicGitHubStatus({transport=globalThis.fetch,now=()=>new Date()}={}) {
 const time=isoTime(now);
 const source=[{provider:'GitHub PUBLIC REST',source_ref:PATHS.commit,observed_at:time,status:'UNKNOWN'}];
 let head;
 try{
  const commits=await getJSON(PATHS.commit,transport);
  if(!Array.isArray(commits)||commits.length!==1||!commits[0]||!isSha(commits[0].sha))
   throw closedError('INVALID_COMMIT_SCHEMA');
  head=commits[0].sha;
  source[0].status='MATCH';
  source.push({provider:'GitHub PUBLIC REST',source_ref:PATHS.runs,observed_at:time,status:'UNKNOWN'});
  const runs=await getJSON(PATHS.runs,transport);
  if(!Array.isArray(runs.workflow_runs))throw closedError('INVALID_RUNS_SCHEMA');
  const matching=runs.workflow_runs.filter(r=>r&&r.head_branch===BRANCH&&
     r.path===WORKFLOW&&r.head_sha===head&&Number.isSafeInteger(r.id)&&r.id>0);
  const current=matching[0];
  source[1].status='MATCH';
  if(!current)return {
   ...failure(time,'NO_CI_FOR_CURRENT_HEAD',source,head),
   status:'PARTIAL'
  };
  if(!acceptableURL(current.id,current.html_url))throw closedError('INVALID_RUN_URL');
  const ci={
    run_id:current.id,head_sha:head,status:current.status,
    conclusion:current.conclusion||null,url:current.html_url
  };
  if(current.status!=='completed')return {
   ...failure(time,'CI_NOT_COMPLETED',source,head),
   status:'PARTIAL',ci
  };
  const jobsURL=API+'/actions/runs/'+current.id+'/jobs?per_page=20';
  source.push({provider:'GitHub PUBLIC REST',source_ref:jobsURL,observed_at:time,status:'UNKNOWN'});
  const jobs=summarizeJobs(await getJSON(jobsURL,transport));
  source[2].status='MATCH';
  const fail=ci.conclusion!=='success'||jobs.some(j=>j.conclusion==='failure'||j.conclusion==='cancelled');
  const full=jobs.every(j=>j.status==='completed'&&j.conclusion==='success');
  return {
   schema:VERSION,scope:'PUBLIC_REVIEW_ONLY',repo:REPO,branch:BRANCH,
   observed_at:time,status:fail?'CONFLICT':full?'MATCH':'PARTIAL',
   reason:fail?'CURRENT_HEAD_CI_FAILURE':full?'CURRENT_HEAD_REVIEW_JOBS_GREEN':'REQUIRED_JOB_INCOMPLETE_OR_MISSING',
   head_sha:head,ci,jobs,sources:source,
   credentials_used:false,provider_bridge_connected:false,
   production_authority:false
  };
 }catch(err){
  return failure(time,knownError(err),source,head??null);
 }
}
module.exports=Object.freeze({VERSION,REPO,BRANCH,WORKFLOW,EXPECTED_JOBS,PATHS,
 getJSON,readPublicGitHubStatus});
