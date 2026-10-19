'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {interpretProbe}=require('./github-public-smoke.cjs');
const sha='a'.repeat(40);
const base={status:'MATCH',reason:'CURRENT_HEAD_REVIEW_JOBS_GREEN',observed_at:'2026-10-19T14:00:00.000Z',head_sha:sha};
test('a real-looking result still distinguishes current CI checkout from current API HEAD',()=>{
 const hit=interpretProbe(base,sha);
 assert.equal(hit.final_verdict,'LIVE_CURRENT_HEAD_GREEN');
 assert.equal(hit.same_as_checked_out_commit,true);
 assert.equal(hit.production_approved,false);
 assert.equal(hit.authenticated_user,false);
 const stale=interpretProbe(base,'b'.repeat(40));
 assert.equal(stale.final_verdict,'LIVE_HEAD_MISMATCH');
 assert.equal(stale.same_as_checked_out_commit,false);
});
test('in-progress or failing current-head workflow does not become a green live proof',()=>{
 for(const status of ['PARTIAL','CONFLICT']){
  const r=interpretProbe({...base,status,reason:status==='PARTIAL'?'CI_NOT_COMPLETED':'CURRENT_HEAD_CI_FAILURE'},sha);
  assert.equal(r.final_verdict,'LIVE_OBSERVED_NOT_GREEN');
  assert.equal(r.current_workflow_may_be_running,status==='PARTIAL');
 }
});
test('no public response is explicitly LIVE_UNVERIFIED even when review branch tests pass',()=>{
 const r=interpretProbe({...base,status:'UNKNOWN',reason:'RATE_LIMIT_OR_FORBIDDEN',head_sha:null},sha);
 assert.equal(r.live_provider_response_observed,false);
 assert.equal(r.final_verdict,'LIVE_UNVERIFIED');
 assert.equal(r.provider_error,'RATE_LIMIT_OR_FORBIDDEN');
 assert.equal(r.execution_authority,false);
});
