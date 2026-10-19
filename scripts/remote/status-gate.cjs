'use strict';

// Review-only bridge contract: no HTTP server, no identity provider,
// no OAuth, no session store, no secrets, no plugin authorization.
// The trusted context MUST be created by independently verified
// server-side middleware; client-submitted context is NEVER sufficient.
const {authorizeIntent}=require('./authz-contract.cjs');
const {VERSION,REPO,BRANCH,readPublicGitHubStatus}=require('./github-public-status.cjs');

const receipt=(code,fields={})=>Object.freeze({
 schema:'atlas.remote.read-receipt.v1',action_id:'STATUS',
 authorization:'DENIED_OR_NOT_EXECUTABLE',
 observed_at:null,result:'UNKNOWN',reason:code,
 sources:[],remaining_blockers:['REAL_IDENTITY_PROVIDER_NOT_WIRED'],
 provider_calls:0,...fields
});

async function runStatusIntent(request,trusted,nowMs,reader=readPublicGitHubStatus) {
 // Never even evaluate a write/research grant through this endpoint.
 if(!request||request.action!=='STATUS')
  return receipt('ONLY_STATUS_READ_ALLOWED');
 const gate=authorizeIntent(request,trusted,nowMs);
 if(!gate.authorized)
  return receipt(gate.reason);
 if(request.intent==='PREVIEW')
  return receipt('PREVIEW_NO_EXTERNAL_READ',{
   authorization:'TRUST_CONTEXT_PREVIEW_ONLY',
   observed_at:new Date(nowMs).toISOString(),
   result:'PARTIAL',remaining_blockers:['PREVIEW_NOT_EXECUTED']
  });
 if(request.intent!=='EXECUTE'||gate.admission!=='READ_INTENT_ACCEPTED')
  return receipt('EXECUTION_NOT_ALLOWED');
 if(typeof reader!=='function')return receipt('PROVIDER_ADAPTER_MISSING');
 // Successful admission means only that the request reached an isolated
 // read-only adapter. The adapter has no bearer-token or write route.
 let report;
 try{report=await reader();}
 catch{return receipt('PUBLIC_PROVIDER_READ_FAILED',{provider_calls:1});}
 if(!report||report.schema!==VERSION||report.repo!==REPO||
    report.branch!==BRANCH||!['MATCH','PARTIAL','UNKNOWN','CONFLICT'].includes(report.status)||
    report.credentials_used!==false||report.provider_bridge_connected!==false||
    report.production_authority!==false||!Array.isArray(report.sources))
  return receipt('INVALID_PROVIDER_REPORT',{provider_calls:1});
 return receipt(report.reason,{
   authorization:'TRUST_CONTEXT_READ_INTENT_ONLY',
   observed_at:report.observed_at,
   result:report.status,
   head_sha:report.head_sha,
   ci:report.ci,
   jobs:report.jobs,
   sources:report.sources,
   remaining_blockers:['REAL_IDENTITY_PROVIDER_NOT_WIRED','PRIVATE_HTTPS_HOSTING_NOT_DEPLOYED',...(report.status==='MATCH'?[]:[report.reason])],
   provider_calls:1
 });
}

module.exports=Object.freeze({runStatusIntent});
