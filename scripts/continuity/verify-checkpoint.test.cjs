'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const M = require('./verify-checkpoint.cjs');
const source = require('../../docs/continuity/ATLAS_MASTER_CHECKPOINT_2026-10-18.json');
const root = path.resolve(__dirname,'../..');
const clone = x => JSON.parse(JSON.stringify(x));

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'atlas-master-'));
  fs.mkdirSync(path.join(dir,'docs'),{recursive:true});
  const m = clone(source);
  const texts = {
    PRIMARY_HANDOFF:'15 planned. Formal Arc III sign-offs: 0/15\nFloot\nDo not automatically start Pass 1\n',
    HISTORICAL_HANDOFF:'15 planned conceptual passes\nFormally closed Arc III passes:\nFloot is parked\n',
    ARCHITECTURE_INDEX:'Review-only architecture index, no automatic betting.\n'
  };
  for (const file of m.artifacts) {
    const body=Buffer.from(texts[file.role]);
    fs.writeFileSync(path.join(dir,file.path),body);
    file.git_blob_sha=M.gitBlob(body);
  }
  return {dir,m,dispose:()=>fs.rmSync(dir,{recursive:true,force:true})};
}

test('real reviewed Arc III handoff and historical documentation retain exact Git blob identities',()=>{
 const r=M.verifyArtifacts(source,root);
 assert.equal(r.status,'MATCH',JSON.stringify(r));
 assert.equal(r.campaign,'RECONCILED_15_PLANNED_ZERO_CLOSED');
 assert.deepEqual(r.artifacts.map(x=>x.status),['MATCH','MATCH','MATCH']);
});
test('local snapshot can verify WITHOUT claiming proof of live Notion, Create State, Drive or CI',()=>{
 const result=M.audit(source,root);
 assert.equal(result.status,'LOCAL_VERIFIED_EXTERNAL_NOT_PROVEN');
 assert.equal(result.projections.every(x=>x.status==='UNKNOWN'),true);
 assert.equal(result.ci_live_verified,false);
 assert.equal(result.production_approved,false);
 assert.equal(result.automatic_betting,false);
 assert.equal(result.arc_iii_passes_formally_closed,0);
});
test('one changed handoff byte blocks the entire MasterSave, even if primary copy stays intact',()=>{
 const f=fixture();
 try {
  const target=f.m.artifacts.find(x=>x.role==='HISTORICAL_HANDOFF');
  fs.appendFileSync(path.join(f.dir,target.path),'unverified pass 16\n');
  const checked=M.audit(f.m,f.dir);
  assert.equal(checked.status,'CONFLICT');
  assert.equal(checked.local.artifacts.find(x=>x.role==='HISTORICAL_HANDOFF').status,'CONFLICT');
 } finally { f.dispose(); }
});
test('missing or renamed architecture source never silently becomes a verified backup',()=>{
 const f=fixture();
 try {
  fs.unlinkSync(path.join(f.dir,f.m.artifacts[2].path));
  const checked=M.audit(f.m,f.dir);
  assert.equal(checked.status,'CONFLICT');
  assert.equal(checked.local.artifacts[2].status,'MISSING');
 } finally { f.dispose(); }
});
test('checkpoint cannot redefine 15-pass Arc III closure or re-open Floot',()=>{
 for(const mutate of [
  m=>m.arc_iii.planned=14,
  m=>m.arc_iii.formally_closed=3,
  m=>m.arc_iii.floot='ACTIVE',
  m=>m.evidence_run.conclusion='failure',
  m=>m.evidence_run.head_sha='f'.repeat(40),
  m=>m.next_action='AUTO_DEPLOY'
 ]) {
  const c=clone(source);mutate(c);
  assert.throws(()=>M.verifyShape(c),/SNAPSHOT_SCHEMA/);
 }
});
test('duplicate canon role, extra authority field, path traversal, unsupported blob are refused',()=>{
 for(const mutate of [
  m=>m.artifacts[1].role='PRIMARY_HANDOFF',
  m=>m.artifacts[0].path='../private.txt',
  m=>m.artifacts[0].path='docs/../../secret.md',
  m=>m.artifacts[0].git_blob_sha='0',
  m=>m.artifacts.push(clone(m.artifacts[0])),
  m=>m.execution_authority=true
 ]) {
  const c=clone(source);mutate(c);
  assert.throws(()=>M.verifyShape(c),/SNAPSHOT_/);
 }
});
test('projection text requires exact checkpoint, immutable commit AND handoff path, not a synthetic verified flag',()=>{
 const pathRef=source.artifacts[0].path;
 const valid=[source.checkpoint_id,source.anchor_commit_sha,pathRef].join('\n');
 for(const provider of ['notion','create_state','drive']){
  assert.equal(M.projectionCheck(source,provider,valid).status,'POINTER_MATCH_ONLY');
  assert.equal(M.projectionCheck(source,provider,undefined).status,'UNKNOWN');
  for(const removed of [source.checkpoint_id,source.anchor_commit_sha,pathRef]){
   const stale=valid.replace(removed,'STALE_OR_DIFFERENT');
   const result=M.projectionCheck(source,provider,stale);
   assert.equal(result.status,'CONFLICT');
   assert.ok(result.missing.length===1);
  }
  assert.equal(M.projectionCheck(source,provider,JSON.stringify({verified:true})).status,'CONFLICT');
 }
});
test('partial external pointers do not erase local integrity, but disagreeing projection marks CONFLICT',()=>{
 const f=fixture();
 try {
  const primary=f.m.artifacts[0].path;
  const valid=[f.m.checkpoint_id,f.m.anchor_commit_sha,primary].join(' ');
  let result=M.audit(f.m,f.dir,{notion:valid});
  assert.equal(result.status,'LOCAL_VERIFIED_EXTERNAL_NOT_PROVEN');
  assert.equal(result.projections[0].status,'POINTER_MATCH_ONLY');
  assert.equal(result.projections[1].status,'UNKNOWN');
  result=M.audit(f.m,f.dir,{notion:valid,drive:'different source'});
  assert.equal(result.status,'CONFLICT');
  assert.equal(result.projections[2].status,'CONFLICT');
 } finally { f.dispose(); }
});
test('historical and primary docs must each explicitly describe the paused 15-pass lineage',()=>{
 const f=fixture();
 try {
  const file=f.m.artifacts.find(x=>x.role==='HISTORICAL_HANDOFF');
  const body=Buffer.from('Unrelated readme');
  fs.writeFileSync(path.join(f.dir,file.path),body);
  file.git_blob_sha=M.gitBlob(body);
  assert.equal(M.verifyArtifacts(f.m,f.dir).status,'CONFLICT');
 } finally { f.dispose(); }
});
