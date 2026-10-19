'use strict';

// Best-effort live observation of PUBLIC GitHub review CI.
// Does not authenticate the operator, grant private repo access or change CI
// verdict. UNKNOWN remains UNKNOWN even when the overall test workflow passes.
const {readPublicGitHubStatus}=require('./github-public-status.cjs');

function interpretProbe(report,expectedHead) {
 const headChecked=typeof expectedHead==='string'&&/^[a-f0-9]{40}$/.test(expectedHead);
 const matches=headChecked&&report.head_sha===expectedHead;
 const verifiedSource=report.status!=='UNKNOWN'&&Boolean(report.head_sha);
 return {
  schema:'atlas.remote.public-observation.v1',
  provider:'GitHub PUBLIC REST',read_only:true,authenticated_user:false,
  live_provider_response_observed:verifiedSource,
  adapter_classification:report.status,
  provider_error:report.status==='UNKNOWN'?report.reason:null,
  observed_at:report.observed_at,
  observed_head:report.head_sha,
  expected_ci_commit:headChecked?expectedHead:null,
  same_as_checked_out_commit:headChecked?matches:null,
  current_workflow_may_be_running:report.reason==='CI_NOT_COMPLETED',
  final_verdict:!verifiedSource?'LIVE_UNVERIFIED':
    headChecked&&!matches?'LIVE_HEAD_MISMATCH':
    report.status==='MATCH'?'LIVE_CURRENT_HEAD_GREEN':'LIVE_OBSERVED_NOT_GREEN',
  execution_authority:false,production_approved:false
 };
}
if(require.main===module){
 readPublicGitHubStatus().then(result=>{
  const report=interpretProbe(result,process.env.GITHUB_SHA);
  process.stdout.write('ATLAS_PUBLIC_STATUS_READBACK='+JSON.stringify(report)+'\n');
 }).catch(()=>{
  process.stdout.write('ATLAS_PUBLIC_STATUS_READBACK='+JSON.stringify({
   schema:'atlas.remote.public-observation.v1',final_verdict:'LIVE_UNVERIFIED',
   reason:'PUBLIC_SOURCE_UNAVAILABLE',execution_authority:false,
   production_approved:false
  })+'\n');
 });
}
module.exports=Object.freeze({interpretProbe});
