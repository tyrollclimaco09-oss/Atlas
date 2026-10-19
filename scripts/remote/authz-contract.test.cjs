'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {ACTIONS,authorizeIntent}=require('./authz-contract.cjs');

const NOW=1_800_000_000_000;
const ORIGIN='https://operator.example.invalid';
const request=(action='STATUS',intent='EXECUTE')=>({action,intent,request_id:'req-123',csrf:'session-bound-csrf-secret'});
const context=()=>({
 method:'POST',content_type:'application/json',origin:ORIGIN,allowed_origin:ORIGIN,
 session:{verified:true,role:'owner',realm:'ATLAS_REVIEW',subject:'operator-1',
  csrf_token:'session-bound-csrf-secret',issued_at:NOW-1000,expires_at:NOW+90_000}
});
const grant=(action='MASTERSAVE')=>({
 id:'server-grant-1',action,subject:'operator-1',approved_by_owner:true,
 issued_at:NOW-500,expires_at:NOW+60_000
});

test('action surface is fixed, excludes sportsbook, deployment and privileged admin',()=>{
 assert.deepEqual(Object.keys(ACTIONS),['STATUS','MASTERSAVE','RESTORE','AUDIT','GRAPH','PLUGINS','ARCIII','RESUME']);
 for(const name of ['PLACE_BET','DEPLOY','INSTALL_PLUGIN','LEDGER_WRITE','ADMIN','FINAL_GATE_EXECUTE']){
  const result=authorizeIntent(request(name),context(),NOW);
  assert.equal(result.authorized,false);assert.equal(result.reason,'UNKNOWN_ACTION');
 }
});

test('untrusted client self-assertions never establish login, permissions or consent',()=>{
 assert.equal(authorizeIntent(request(),null,NOW).reason,'NO_TRUSTED_SERVER_CONTEXT');
 for(const badRequest of [
  {...request(),session:{verified:true,role:'owner'}},
  {...request(),approved:true},
  {...request(),grant:'server-grant-1'},
  {action:'MASTERSAVE',intent:'EXECUTE',csrf:'session-bound-csrf-secret'},
  ['MASTERSAVE','EXECUTE']
 ])assert.equal(authorizeIntent(badRequest,context(),NOW).reason,'INVALID_REQUEST_SHAPE');
 const wrong=context();wrong.session.role='admin';
 assert.equal(authorizeIntent(request(),wrong,NOW).reason,'NO_ACTIVE_VERIFIED_OWNER_SESSION');
});

test('method, same-origin, CSRF and session lifetime fail closed',()=>{
 const cases=[
  ['BAD_METHOD_OR_CONTENT_TYPE',x=>x.method='GET'],
  ['BAD_METHOD_OR_CONTENT_TYPE',x=>x.content_type='text/plain'],
  ['UNTRUSTED_ORIGIN',x=>x.origin='https://evil.example'],
  ['UNTRUSTED_ORIGIN',x=>{x.origin='http://operator.example.invalid';x.allowed_origin=x.origin;}],
  ['NO_ACTIVE_VERIFIED_OWNER_SESSION',x=>x.session.expires_at=NOW],
  ['NO_ACTIVE_VERIFIED_OWNER_SESSION',x=>x.session.verified=false],
  ['NO_ACTIVE_VERIFIED_OWNER_SESSION',x=>x.session.realm='PRODUCTION'],
  ['NO_ACTIVE_VERIFIED_OWNER_SESSION',x=>x.session.expires_at=NOW+100_000_000]
 ];
 for(const [reason,mutate] of cases){const c=context();mutate(c);
  assert.equal(authorizeIntent(request(),c,NOW).reason,reason);}
 const mismatch=authorizeIntent({...request(),csrf:'wrong'},context(),NOW);
 assert.equal(mismatch.reason,'CSRF_MISMATCH');
 assert.equal(authorizeIntent(request(),context(),NaN).reason,'INVALID_CLOCK');
});

test('every successful admission is intent-only and never an actual provider execution',()=>{
 for(const name of Object.keys(ACTIONS)){
  const result=authorizeIntent(request(name,'PREVIEW'),context(),NOW);
  assert.deepEqual(result,{authorized:true,admission:'PREVIEW_ONLY',action:name,execution:'NOT_IMPLEMENTED',provider_calls:0});
 }
 for(const name of Object.keys(ACTIONS).filter(x=>ACTIONS[x]==='READ_ONLY')){
  const result=authorizeIntent(request(name),context(),NOW);
  assert.equal(result.admission,'READ_INTENT_ACCEPTED');
  assert.equal(result.execution,'NOT_IMPLEMENTED');
  assert.equal(result.provider_calls,0);
 }
});

test('preview cannot consume a one-time grant; execution without trusted grant always fails',()=>{
 const c=context();c.review_grant=grant();let consumed=0;
 c.consume_grant_once=()=>{consumed++;return true;};
 assert.equal(authorizeIntent(request('MASTERSAVE','PREVIEW'),c,NOW).admission,'PREVIEW_ONLY');
 assert.equal(consumed,0);
 for(const action of ['MASTERSAVE','RESUME']){
  assert.equal(authorizeIntent(request(action),context(),NOW).reason,'MISSING_FRESH_SCOPED_GRANT');
 }
 const noStore=context();noStore.review_grant=grant();
 assert.equal(authorizeIntent(request('MASTERSAVE'),noStore,NOW).reason,'NO_ATOMIC_GRANT_STORE');
});

test('review write grant is short-lived, owner/session/action-scoped, single-use',()=>{
 const used=new Set();const c=context();
 c.review_grant=grant();
 c.consume_grant_once=(id,subject,action,requestId)=>{
  const key=[id,subject,action,requestId].join('|');
  if(used.has(id))return false;used.add(id);return key==='server-grant-1|operator-1|MASTERSAVE|req-123';
 };
 const allowed=authorizeIntent(request('MASTERSAVE'),c,NOW);
 assert.equal(allowed.authorized,true);
 assert.equal(allowed.admission,'REVIEW_WRITE_INTENT_ACCEPTED');
 assert.equal(allowed.execution,'NOT_IMPLEMENTED');
 const replay=authorizeIntent(request('MASTERSAVE'),c,NOW);
 assert.equal(replay.reason,'GRANT_ALREADY_USED_OR_UNAVAILABLE');
 const other=context();other.review_grant=grant();
 other.review_grant.subject='attacker';other.consume_grant_once=()=>true;
 assert.equal(authorizeIntent(request('MASTERSAVE'),other,NOW).reason,'MISSING_FRESH_SCOPED_GRANT');
 const wrong=context();wrong.review_grant=grant('MASTERSAVE');wrong.consume_grant_once=()=>true;
 assert.equal(authorizeIntent(request('RESUME'),wrong,NOW).reason,'MISSING_FRESH_SCOPED_GRANT');
 const stale=context();stale.review_grant=grant();stale.review_grant.expires_at=NOW;stale.consume_grant_once=()=>true;
 assert.equal(authorizeIntent(request('MASTERSAVE'),stale,NOW).reason,'MISSING_FRESH_SCOPED_GRANT');
});

test('grant store outages and explicit denied approvals cannot become a green action',()=>{
 const c=context();c.review_grant=grant();c.consume_grant_once=()=>{throw Error('DB down');};
 assert.equal(authorizeIntent(request('MASTERSAVE'),c,NOW).reason,'GRANT_STORE_UNAVAILABLE');
 c.consume_grant_once=()=>false;
 assert.equal(authorizeIntent(request('MASTERSAVE'),c,NOW).reason,'GRANT_ALREADY_USED_OR_UNAVAILABLE');
 c.review_grant.approved_by_owner=false;
 c.consume_grant_once=()=>true;
 assert.equal(authorizeIntent(request('MASTERSAVE'),c,NOW).reason,'MISSING_FRESH_SCOPED_GRANT');
});
