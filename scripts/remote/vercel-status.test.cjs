'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {resolve}=require('node:path');
const URI=pathToFileURL(resolve(__dirname,'vercel-status.mjs')).href;
const SHA='c'.repeat(40),RUN=39268529074;
const OBS='2026-10-19T16:06:43.797Z';
const URL='https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/'+RUN;
const names=[
 'Original baseline provenance',
 'Review code and regression suite',
 'Real Chromium archive smoke',
 'Offline SCOUT and Outcome Intelligence shadow',
 'MasterSave source integrity and drift denials'
];
const fixture=()=>({
 schema:'atlas.remote.public-github-status.v1',scope:'PUBLIC_REVIEW_ONLY',
 repo:'tyrollclimaco09-oss/Atlas',
 branch:'review/pass0-slate-regression-2026-10-16',observed_at:OBS,
 status:'MATCH',reason:'CURRENT_HEAD_REVIEW_JOBS_GREEN',head_sha:SHA,
 ci:{run_id:RUN,head_sha:SHA,status:'completed',conclusion:'success',url:URL},
 jobs:names.map(name=>({name,status:'completed',conclusion:'success'})),
 sources: Array.from({length:4},(_,i)=>({
  provider:'GitHub PUBLIC REST',
  source_ref:'https://api.github.com/repos/tyrollclimaco09-oss/Atlas/'+(i===2?'actions/runs/'+RUN+'/jobs?per_page=20':'commits?sha=review%2Fpass0-slate-regression-2026-10-16&per_page=1'),
  observed_at:OBS,status:'MATCH'})),
 credentials_used:false,provider_bridge_connected:false,production_authority:false
});
const req=(url='https://private.example.invalid/api/status',method='GET')=>new Request(url,{method});
test('backend module and intentionally empty execution surface are importable',async()=>{
 const mod=await import(URI);
 assert.equal(typeof mod.makeStatusHandler,'function');
 assert.equal(typeof mod.default.fetch,'function');
 assert.equal(mod.default.PUT,undefined);
 assert.equal(mod.default.POST,undefined);
});
test('GET reads only status and returns no-store, no CORS, safe public summary',async()=>{
 const {makeStatusHandler}=await import(URI);
 let calls=0;
 const fn=makeStatusHandler(async()=>{calls++;return fixture();});
 const response=await fn(req());
 assert.equal(response.status,200);
 assert.equal(calls,1);
 assert.match(response.headers.get('cache-control'),/no-store/);
 assert.equal(response.headers.get('access-control-allow-origin'),null);
 assert.equal(response.headers.get('x-content-type-options'),'nosniff');
 const body=await response.json();
 assert.equal(body.result,'MATCH');
 assert.equal(body.head_sha,SHA);
 assert.equal(body.ci.run_id,RUN);
 assert.equal(body.jobs.length,5);
 assert.equal(body.sources.length,4);
 assert.equal(body.app_login,false);
 assert.equal(body.auth_boundary,'VERCEL_AUTH_ALL_DEPLOYMENTS_REQUIRED');
 assert.equal(body.write_authority,false);
 assert.equal(body.sportsbook_execution,false);
 assert.deepEqual(body.blocks,['PRIVATE_CHATGPT_PLUGIN_BRIDGE_NOT_CONNECTED','APP_LEVEL_OWNER_IDENTITY_NOT_IMPLEMENTED']);
});
test('all write verbs and unexpected query or routes deny before invoking GitHub',async()=>{
 const {makeStatusHandler}=await import(URI);
 let calls=0;const fn=makeStatusHandler(async()=>{calls++;return fixture();});
 for(const method of ['POST','PUT','PATCH','DELETE']){
  const resp=await fn(req(undefined,method));
  assert.equal(resp.status,405);
  assert.equal(resp.headers.get('allow'),'GET');
  assert.equal((await resp.json()).reason,'METHOD_NOT_ALLOWED');
 }
 for(const u of ['https://private.example.invalid/api/status?user=all','https://private.example.invalid/api/admin',
                'https://private.example.invalid/api/status/subroute']){
  const resp=await fn(req(u));
  assert.equal(resp.status,404);
  assert.equal((await resp.json()).reason,'ROUTE_NOT_ALLOWED');
 }
 assert.equal(calls,0);
});
test('upstream failures remain unavailable and no provider/token details leak',async()=>{
 const {makeStatusHandler}=await import(URI);
 const fn=makeStatusHandler(async()=>{throw Error('private provider token: SECRET_VALUE');});
 const result=await fn(req());
 assert.equal(result.status,503);
 const text=await result.text();
 assert.doesNotMatch(text,/SECRET_VALUE/);
 assert.match(text,/PUBLIC_READ_EXCEPTION/);
});
test('malicious fake reader cannot claim private plugin connection, prod authority, or other repo',async()=>{
 const {makeStatusHandler}=await import(URI);
 for(const patch of [
 {credentials_used:true},{provider_bridge_connected:true},{production_authority:true},
 {repo:'attacker/private'},{scope:'PRIVATE'},{schema:'evil'}
 ]){
  const fn=makeStatusHandler(async()=>({...fixture(),...patch}));
  const result=await fn(req());
  assert.equal(result.status,502);
  assert.equal((await result.json()).reason,'UNTRUSTED_READER_OUTPUT');
 }
});
test('response includes ONLY allowlisted fields and never arbitrary personal information',async()=>{
 const {makeStatusHandler}=await import(URI);
 const object=fixture();
 object.cookie='authcookie-value';
 object.private_email='private-user@example.invalid';
 object.sources[0].private_token='provider-token';
 object.ci.password='password';
 const result=await makeStatusHandler(async()=>object)(req());
 const text=await result.text();
 for(const item of ['authcookie-value','private-user@example.invalid','provider-token','password'])assert.doesNotMatch(text,new RegExp(item));
});
test('UNCERTAIN/CONFLICT status has no success promotion',async()=>{
 const {makeStatusHandler}=await import(URI);
 for(const [status,http] of [['UNKNOWN',503],['PARTIAL',200],['CONFLICT',200]]){
  const report={...fixture(),status,reason:'SOURCE_UNVERIFIED'};
  const out=await makeStatusHandler(async()=>report)(req());
  assert.equal(out.status,http);
  const body=await out.json();
  assert.equal(body.result,status);
  assert.notEqual(body.result,'MATCH');
 }
});

test('malformed green report is denied even when a reader labels it MATCH',async()=>{
 const {makeStatusHandler}=await import(URI);
 for(const edit of [
  r=>{r.ci.head_sha='a'.repeat(40);},
  r=>{r.jobs[0].conclusion=null;},
  r=>{r.sources.pop();},
  r=>{r.ci.url='javascript:alert(1)';},
  r=>{r.ci.run_id=null;},
  r=>{r.head_sha=null;}
 ]){
  const f=fixture();edit(f);
  const response=await makeStatusHandler(async()=>f)(req());
  assert.equal(response.status,502);
  assert.equal((await response.json()).reason,'INCOMPLETE_MATCH_EVIDENCE');
 }
});
