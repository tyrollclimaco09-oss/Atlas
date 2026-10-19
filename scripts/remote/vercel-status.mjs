import reader from './github-public-status.cjs';

// ATLAS Operator Remote: public GitHub STATUS ONLY.
// Endpoint requires Vercel Authentication on *all* deployment URLs.
// This handler does NOT identify an owner and MUST NOT be used without the
// independently verified Vercel platform protection gate.
const HEADERS=Object.freeze({
  'content-type':'application/json; charset=utf-8',
  'cache-control':'private, no-store, max-age=0',
  'pragma':'no-cache',
  'x-content-type-options':'nosniff',
  'referrer-policy':'no-referrer',
  'x-frame-options':'DENY',
  'content-security-policy':"default-src 'none'; frame-ancestors 'none'",
  'access-control-expose-headers':'',
  'vary':'Cookie'
});
const envelope=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:HEADERS});
const BAD=Object.freeze({
 schema:'atlas.remote.private-status.v1',result:'UNKNOWN',
 auth_boundary:'VERCEL_AUTH_ALL_DEPLOYMENTS_REQUIRED',
 app_login:false,write_authority:false,sportsbook_execution:false
});
export function makeStatusHandler(read=reader.readPublicGitHubStatus){
 if(typeof read!=='function')throw new TypeError('READER_MUST_BE_FUNCTION');
 return async function handle(request){
  if(!request||typeof request.method!=='string'||typeof request.url!=='string')
   return envelope({...BAD,reason:'INVALID_REQUEST'},400);
  if(request.method!=='GET')
   return new Response(JSON.stringify({...BAD,reason:'METHOD_NOT_ALLOWED'}),{
    status:405,headers:{...HEADERS,allow:'GET'}});
  let url;
  try{url=new URL(request.url);}catch{return envelope({...BAD,reason:'INVALID_URL'},400);}
  if(url.pathname!=='/api/status'||url.search!==''||url.hash!=='')
   return envelope({...BAD,reason:'ROUTE_NOT_ALLOWED'},404);
  let data;
  try{data=await read();}
  catch{return envelope({...BAD,reason:'PUBLIC_READ_EXCEPTION'},503);}
  if(!data||data.schema!=='atlas.remote.public-github-status.v1'||
   data.scope!=='PUBLIC_REVIEW_ONLY'||
   data.repo!=='tyrollclimaco09-oss/Atlas'||
   data.branch!=='review/pass0-slate-regression-2026-10-16'||
   !['MATCH','PARTIAL','UNKNOWN','CONFLICT'].includes(data.status)||
   data.credentials_used!==false||data.provider_bridge_connected!==false||
   data.production_authority!==false||
   !Array.isArray(data.sources)||data.sources.length>4)
    return envelope({...BAD,reason:'UNTRUSTED_READER_OUTPUT'},502);
  if(data.status==='MATCH') {
   const expected=[
    'Original baseline provenance',
    'Review code and regression suite',
    'Real Chromium archive smoke',
    'Offline SCOUT and Outcome Intelligence shadow',
    'MasterSave source integrity and drift denials'
   ];
   if(!/^[0-9a-f]{40}$/.test(data.head_sha||'')||
      !data.ci||data.ci.head_sha!==data.head_sha||
      data.ci.status!=='completed'||data.ci.conclusion!=='success'||
      !Number.isSafeInteger(data.ci.run_id)||data.ci.run_id<1||
      data.ci.url!=='https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/'+data.ci.run_id||
      data.sources.length!==4||
      !Array.isArray(data.jobs)||data.jobs.length!==5||
      expected.some(name=>data.jobs.filter(j=>j&&j.name===name&&
        j.status==='completed'&&j.conclusion==='success').length!==1))
     return envelope({...BAD,reason:'INCOMPLETE_MATCH_EVIDENCE'},502);
  }
  // Whitelist every returned field. No secrets/cookies/personal info are forwarded.
  const sources=data.sources.map(x=>({
   provider:typeof x?.provider==='string'?x.provider:'',
   source_ref:typeof x?.source_ref==='string'?x.source_ref:'',
   observed_at:typeof x?.observed_at==='string'?x.observed_at:null,
   status:['MATCH','PARTIAL','UNKNOWN','CONFLICT'].includes(x?.status)?x.status:'UNKNOWN'
  }));
  const jobs=Array.isArray(data.jobs)?data.jobs.slice(0,5).map(x=>({
   name:typeof x?.name==='string'?x.name:'',
   status:typeof x?.status==='string'?x.status:'UNKNOWN',
   conclusion:typeof x?.conclusion==='string'?x.conclusion:null
  })):[];
  const result={
   schema:BAD.schema,
   result:data.status,
   reason:typeof data.reason==='string'?data.reason:'UNKNOWN',
   observed_at:typeof data.observed_at==='string'?data.observed_at:null,
   repository:data.repo,branch:data.branch,
   head_sha:typeof data.head_sha==='string'?data.head_sha:null,
   ci:data.ci?{
    run_id:Number.isSafeInteger(data.ci.run_id)?data.ci.run_id:null,
    status:typeof data.ci.status==='string'?data.ci.status:'UNKNOWN',
    conclusion:typeof data.ci.conclusion==='string'?data.ci.conclusion:null,
    url:typeof data.ci.url==='string'?data.ci.url:null
   }:null,
   jobs,sources,
   auth_boundary:BAD.auth_boundary,
   app_login:false,
   write_authority:false,sportsbook_execution:false,
   blocks:['PRIVATE_CHATGPT_PLUGIN_BRIDGE_NOT_CONNECTED',
    'APP_LEVEL_OWNER_IDENTITY_NOT_IMPLEMENTED']
  };
  return envelope(result,data.status==='UNKNOWN'?503:200);
 };
}
export default {fetch:makeStatusHandler()};
