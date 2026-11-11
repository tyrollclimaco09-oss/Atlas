import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {reconcileCanonicalLearning} from './canonical-learning-adapter.mjs';

const original=JSON.parse(readFileSync(new URL('./fixtures/buf-min-real-schema-recorded-outcome-20261111.json',import.meta.url),'utf8'));
const receipt=original.recorded_outcomes[0];
function input(){
 const p=structuredClone(original);
 return p;
}
const run=p=>reconcileCanonicalLearning(p);

test('recorded outcome is visible with original provenance while all scientific holds remain',()=>{
 const p=input(),r=run(p);
 assert.equal(r.counts.with_recorded_outcome,1);
 assert.equal(r.counts.with_official_outcome,0);
 const a=r.recorded_outcome_audit[0];
 assert.equal(a.mapping_version,'ATLAS_RECORDED_OUTCOME_COMPAT_V1');
 assert.equal(a.mapped.binary_outcome,1);
 assert.equal(a.original.receipt_key,receipt.receipt_key);
 assert.equal(a.original.evidence_observed_at,receipt.evidence_observed_at);
 assert.equal(a.original.evidence_source,receipt.evidence_source);
 assert.equal(a.original.provenance_label,'VERIFIED_SOURCE');
 assert.equal(a.verified_official_source,false);
 assert.equal(a.admitted_for_scoring,false);
 assert.equal(r.packet,null);
 assert.equal(r.disposition,'HOLD_NO_MODEL_CALIBRATION');
 assert(r.case_audit[0].reasons.includes('RECORDED_OUTCOME_REQUIRES_SOURCE_ATTESTATION'));
 assert(r.case_audit[0].reasons.includes('MISSING_OR_AMBIGUOUS_VERIFIED_IDENTITY'));
});
test('compatibility never edits a frozen forecast, baseline, or source receipt',()=>{
 const p=input(),before=structuredClone(p);run(p);assert.deepEqual(p,before);
});
test('wrong event cannot be matched by candidate alone',()=>{
 const p=input();p.recorded_outcomes[0].payload.event_id='different';
 assert(run(p).recorded_outcome_audit[0].errors.includes('RECORDED_EVENT_ID_MISMATCH'));
 assert.equal(run(p).counts.with_recorded_outcome,0);
});
test('wrong prediction id cannot be inferred from a result or name',()=>{
 const p=input();p.recorded_outcomes[0].payload.prediction_id='different';
 assert(run(p).recorded_outcome_audit[0].errors.includes('RECORDED_PREDICTION_ID_MISMATCH'));
});
test('unknown receipt schemas remain visible and unsupported',()=>{
 const p=input();delete p.recorded_outcomes[0].payload.buf_win_binary;
 assert(run(p).recorded_outcome_audit[0].errors.includes('UNSUPPORTED_RECORDED_OUTCOME_SCHEMA'));
});
test('narrative strings and booleans cannot become binary results',()=>{
 for(const value of ['1',true,null,2]){
  const p=input();p.recorded_outcomes[0].payload.buf_win_binary=value;
  assert.equal(run(p).counts.with_recorded_outcome,0);
 }
});
test('recorded source timestamp must follow game start',()=>{
 const p=input();p.recorded_outcomes[0].evidence_observed_at=p.predictions[0].frozen_at;
 assert(run(p).recorded_outcome_audit[0].errors.includes('RECORDED_RESULT_TIME_INVALID'));
});
test('duplicate original receipt identities cannot multiply evidence',()=>{
 const p=input();p.recorded_outcomes.push(structuredClone(p.recorded_outcomes[0]));
 const r=run(p);assert.equal(r.counts.with_recorded_outcome,0);
 assert(r.recorded_outcome_audit.every(a=>a.errors.includes('DUPLICATE_RECORDED_RECEIPT')));
});
test('legacy caller verification flags never grant source or model authority',()=>{
 const p=input();p.recorded_outcomes[0].payload.verified_official_source=true;
 const r=run(p);assert.equal(r.recorded_outcome_audit[0].verified_official_source,false);
 assert.equal(r.counts.with_numeric_eligible_forecast,0);assert.equal(r.production_authority,false);
});
test('legacy winner mapping applies only to the declared Buffalo moneyline selection',()=>{
 const p=input();p.predictions[0].root_tags.market_selection='MIN_ML';
 assert(run(p).recorded_outcome_audit[0].errors.includes('UNSUPPORTED_RECORDED_SELECTION'));
});
test('malformed optional recorded-outcome input fails explicitly',()=>{
 const p=input();p.recorded_outcomes={};assert.throws(()=>run(p),/RECORDED_OUTCOMES_INVALID/);
});
test('CLI shows the recorded result without manufacturing score or profit metrics',()=>{
 const cli=fileURLToPath(new URL('./reconcile-canonical-learning-cli.mjs',import.meta.url));
 const r=spawnSync(process.execPath,[cli],{input:JSON.stringify(input()),encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);const o=JSON.parse(r.stdout);
 assert.equal(o.counts.with_recorded_outcome,1);
 assert.equal(o.recorded_outcome_audit[0].mapped.binary_outcome,1);
 assert.equal(o.forecast_metrics,null);assert.equal(o.pricing_metrics,null);
 assert.equal(o.real_betting_authority,false);assert.equal(o.virtual_bankroll_affected,false);
});
test('two distinct recorded receipts remain one forecast case and never authenticate each other',()=>{
 const p=input();const second=structuredClone(p.recorded_outcomes[0]);second.receipt_key='SECOND_SOURCE_RECEIPT';
 p.recorded_outcomes.push(second);const r=run(p);
 assert.equal(r.counts.with_recorded_outcome,1);assert.equal(r.counts.recorded_outcome_records,2);
 assert.equal(r.counts.with_official_outcome,0);assert.equal(r.packet,null);
});
test('learning CLI JSON failures do not echo the input payload',()=>{
 const cli=fileURLToPath(new URL('./reconcile-canonical-learning-cli.mjs',import.meta.url));
 const r=spawnSync(process.execPath,[cli],{input:'private_synthetic_marker{',encoding:'utf8'});
 assert.equal(r.status,2);assert(!r.stderr.includes('private_synthetic_marker'));
 assert(r.stderr.includes('CANONICAL_EXPORT_JSON_INVALID'));
});
