import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {auditRecordedOutcomes} from './outcome-compatibility.mjs';
import {diagnoseRecordedResultResearch,RECORDED_DIAGNOSTIC_CONTRACT} from './recorded-result-research.mjs';

const file=new URL('./fixtures/buf-min-real-schema-recorded-outcome-20261111.json',import.meta.url);
const cli=fileURLToPath(new URL('./reconcile-canonical-learning-cli.mjs',import.meta.url));
const source=readFileSync(file,'utf8');
const fixture=()=>JSON.parse(source);
const run=p=>diagnoseRecordedResultResearch(p,auditRecordedOutcomes(p.recorded_outcomes,p.predictions));
test('real preserved Buffalo result provides only provisional Brier, not calibration authority',()=>{
 const p=fixture(),d=run(p)[0];
 assert.equal(d.contract,RECORDED_DIAGNOSTIC_CONTRACT);
 assert.equal(d.status,'RESEARCH_ONLY_UNVERIFIED_RECORDED_BRIER');
 assert.equal(d.observed_recorded_binary,1);
 assert(Math.abs(d.provisional_model_brier-(1-p.predictions[0].predicted_probability)**2)<1e-12);
 assert.equal(d.provisional_baseline_brier,0.25);
 assert(d.provisional_brier_improvement<0);
 assert.equal(d.independently_authenticated_outcome,false);
 assert.equal(d.forecast_scoring_eligible,false);
 assert.equal(d.pricing_roi_eligible,false);
 assert.equal(d.calibration_sample_count,0);
});
test('same recorded result in duplicate receipts is not a statistical observation',()=>{
 const p=fixture(),r={...p.recorded_outcomes[0],receipt_key:'ANOTHER-RECEIPT'};
 p.recorded_outcomes.push(r);
 const d=run(p);
 assert.equal(d.length,2);
 assert(d.every(x=>x.status==='HOLD_RECORDED_DIAGNOSTIC'));
 assert(d.every(x=>x.blockers.includes('AMBIGUOUS_RECORDED_RESULT_FOR_CASE')));
 assert(d.every(x=>x.provisional_model_brier===null));
});
test('observation with changed event ID cannot acquire a metric',()=>{
 const p=fixture();p.observations[0].event_id='UNRELATED';
 assert(run(p)[0].blockers.includes('BASELINE_OBSERVATION_NOT_UNIQUE'));
});
test('after-start features are rejected even when a score appears in the receipt',()=>{
 const p=fixture();p.predictions[0].features_observed_at='2026-11-10T02:00:00Z';
 assert(run(p)[0].blockers.includes('PRESTART_INDEPENDENT_FORECAST_NOT_PROVEN'));
});
test('a narrative-only baseline cannot be scored as a neutral 50 percent benchmark',()=>{
 const p=fixture();p.observations[0].baseline_output={baseline_read:'equal teams'};
 assert(run(p)[0].blockers.includes('PRESTART_NUMERIC_BASELINE_NOT_PROVEN'));
});
test('result timestamp predating kickoff cannot become postgame evidence',()=>{
 const p=fixture();p.recorded_outcomes[0].evidence_observed_at='2026-11-09T12:00:00Z';
 assert.equal(run(p)[0].status,'HOLD_RECORDED_DIAGNOSTIC');
});
test('provisional result diagnostics do not alter official evidence-gate metrics or readonly CLI state',()=>{
 const r=spawnSync(process.execPath,[cli],{input:source,encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
 const out=JSON.parse(r.stdout);
 assert.equal(out.adapter_disposition,'HOLD_NO_MODEL_CALIBRATION');
 assert.equal(out.evidence_gate_disposition,'NOT_EVALUATED');
 assert.equal(out.forecast_metrics,null);
 assert.equal(out.pricing_metrics,null);
 assert.equal(out.recorded_result_research_diagnostics[0].status,'RESEARCH_ONLY_UNVERIFIED_RECORDED_BRIER');
 assert.equal(out.recorded_result_research_diagnostics[0].calibration_sample_count,0);
 assert.equal(out.real_betting_authority,false);
});
