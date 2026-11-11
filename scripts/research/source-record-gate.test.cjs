'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createMoneylineRecordGate,validateMoneylineObservation}=require('./source-record-gate.cjs');
const {packet,quotes,replaceQuotes}=require('./fixtures/reference-snapshot.cjs');
function context(p){return {snapshot:p.snapshots[0],sourceRegistry:p.sourceRegistry,rulesRegistry:p.rulesRegistry,asOfUtc:p.asOfUtc,policy:p.policy};}
const record=p=>({...quotes(p)[0],rawSnapshotId:p.snapshots[0].snapshotId});
test('prepared gate preserves the standalone evidence and source checks',()=>{
 const p=packet(),q=record(p),gate=createMoneylineRecordGate(context(p));
 assert.deepEqual(gate.validate(q),validateMoneylineObservation(q,context(p)));
 assert.equal(gate.validate(q).passed,true);assert.equal(gate.validate(q).source_authenticated,false);
});
test('indexed evidence rejects forged records and duplicate original observation identifiers',()=>{
 const p=packet(),q=record(p),gate=createMoneylineRecordGate(context(p));
 q.outcomes[0].americanOdds=200;
 assert(gate.validate(q).errors.includes('RAW_RECORD_MISMATCH'));
 const rows=quotes(p);rows.push(structuredClone(rows[0]));replaceQuotes(p,rows);
 assert(createMoneylineRecordGate(context(p)).validate(record(p)).errors.includes('RAW_RECORD_MISMATCH'));
});
test('caller-supplied evidence verdict cannot bypass actual hash validation',()=>{
 const p=packet();p.snapshots[0].rawSha256='0'.repeat(64);
 const gate=createMoneylineRecordGate({...context(p),evidence:{passed:true,errors:[]}});
 assert.equal(gate.snapshotValidation.passed,false);
 assert(gate.validate(record(p)).errors.includes('RAW_HASH_MISMATCH'));
});
