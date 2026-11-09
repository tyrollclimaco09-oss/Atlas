import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {reconcileCanonicalLearning} from './canonical-learning-adapter.mjs';

const fixturePath=new URL('./fixtures/buf-min-real-schema-pregame-20261109.json',import.meta.url);
const cliPath=fileURLToPath(new URL('./reconcile-canonical-learning-cli.mjs',import.meta.url));
const raw=readFileSync(fixturePath,'utf8');
const snapshot=()=>JSON.parse(raw);
const audit=p=>reconcileCanonicalLearning(p);

test('source export is one pre-event prediction and one matching canonical observation',()=>{
  const p=snapshot();
  assert.equal(p.experiment.experiment_key,'ATLAS-20261109-FEATURE-ORACLE-CALIBRATION-FREEZE-V1');
  assert.equal(p.frozen_cohort.frozen_case_count,1);
  assert.equal(p.predictions.length,1);
  assert.equal(p.observations.length,1);
  assert.equal(p.predictions[0].event_id,p.observations[0].event_id);
  assert.equal(p.predictions[0].candidate_key,p.observations[0].candidate_key);
});
test('actual frozen prediction and neutral baseline retain correct pregame values',()=>{
  const p=snapshot(),f=p.predictions[0],o=p.observations[0];
  assert(Math.abs(f.predicted_probability-0.4968750406894683)<1e-12);
  assert.equal(o.baseline_output.predicted_probability,0.5);
  assert(Date.parse(f.features_observed_at)<Date.parse(f.frozen_at));
  assert(Date.parse(f.frozen_at)<Date.parse(f.event_start_at));
  assert(Date.parse(p.frozen_cohort.holdout_start)<Date.parse(f.event_start_at));
});
test('source extract never mistakes self-reported public price for exact accepted book quote',()=>{
  const p=snapshot();
  assert.deepEqual(p.quotes,[]);
  assert.equal(p.export_audit.native_quote_count,0);
  assert.equal(p.export_audit.no_real_bet_execution,true);
});
test('actual source records cannot create official outcome or market identity by assumption',()=>{
  const p=snapshot();
  assert.deepEqual(p.official_outcomes,[]);
  assert.deepEqual(p.identities,[]);
  assert.equal(p.export_audit.official_outcome_count,0);
  assert.equal(p.export_audit.attested_identity_count,0);
});
test('real-schema adapter currently returns HOLD, not an invented outcome sample',()=>{
  const r=audit(snapshot());
  assert.equal(r.disposition,'HOLD_NO_MODEL_CALIBRATION');
  assert.equal(r.packet,null);
  assert.equal(r.counts.raw_observations,1);
  assert.equal(r.counts.with_numeric_eligible_forecast,0);
  assert.equal(r.counts.held_cases,1);
  assert.equal(r.case_audit[0].matched_predictions,1);
  assert.equal(r.case_audit[0].matched_outcomes,0);
  assert.equal(r.case_audit[0].matched_identities,0);
  assert.equal(r.case_audit[0].matched_quotes,0);
  assert(r.case_audit[0].reasons.includes('MISSING_OR_AMBIGUOUS_OFFICIAL_OUTCOME'));
  assert(r.case_audit[0].reasons.includes('MISSING_OR_AMBIGUOUS_VERIFIED_IDENTITY'));
});
test('actual read-only CLI replay states no model skill or financial performance',()=>{
  const r=spawnSync(process.execPath,[cliPath],{input:raw,encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  const out=JSON.parse(r.stdout);
  assert.equal(out.adapter_disposition,'HOLD_NO_MODEL_CALIBRATION');
  assert.equal(out.evidence_gate_disposition,'NOT_EVALUATED');
  assert.equal(out.forecast_metrics,null);
  assert.equal(out.pricing_metrics,null);
  assert.equal(out.production_authority,false);
  assert.equal(out.virtual_bankroll_affected,false);
});
test('a fabricated official result without a matching market identity stays HOLD',()=>{
  const p=snapshot(),f=p.predictions[0];
  p.official_outcomes.push({candidate_key:f.candidate_key,event_id:f.event_id,market_id:'UNVERIFIED',
    binary_outcome:1,verified_official_source:true,source_uri:'fixture:untrusted',
    observed_at:'2026-11-10T06:00:00Z',invalid_market:false,void_or_push:false});
  const r=audit(p);
  assert.equal(r.packet,null);
  assert(r.case_audit[0].reasons.includes('MISSING_OR_AMBIGUOUS_VERIFIED_IDENTITY'));
});
test('a forged provider identity with no timestamped official verification cannot promote',()=>{
  const p=snapshot(),f=p.predictions[0];
  p.identities.push({candidate_key:f.candidate_key,event_id:f.event_id,market_id:'NONE',
    verified_current_team:false,verified_event_teams:false,verified_market_identity:false,
    verified_settlement_rules:false,source_uri:null,source_observed_at:null});
  assert(audit(p).case_audit[0].reasons.includes('OFFICIAL_IDENTITY_AND_MARKET_PROOF_MISSING'));
});
test('cohort cannot grow after original selection and still pass preregistration',()=>{
  const p=snapshot(),other={...p.observations[0],candidate_key:'POSTGAME-ADDED-PICK'};
  p.observations.push(other);
  const r=audit(p);
  assert(r.blockers.includes('FROZEN_CASE_COUNT_MISMATCH'));
  assert.equal(r.packet,null);
});
test('cohort cannot drop a losing observation without violating frozen count',()=>{
  const p=snapshot();p.observations=[];
  const r=audit(p);
  assert(r.blockers.includes('NO_CANONICAL_OBSERVATIONS'));
  assert(r.blockers.includes('FROZEN_CASE_COUNT_MISMATCH'));
});
test('we do not reuse another experiment to claim the same model observation',()=>{
  const p=snapshot();
  p.observations[0].experiment_id='00000000-0000-4000-8000-000000000000';
  assert(audit(p).blockers.includes('UNRELATED_EXPERIMENT_OBSERVATIONS_PRESENT'));
});
test('wrong event key cannot be rescued using a player name or candidate alias',()=>{
  const p=snapshot();
  p.predictions[0].event_id='00000000-0000-4000-8000-000000000000';
  assert(audit(p).case_audit[0].reasons.includes('MISSING_OR_AMBIGUOUS_FROZEN_PREDICTION'));
});
test('missing originally frozen neutral baseline stays unusable for scoring',()=>{
  const p=snapshot();p.observations[0].baseline_output=null;
  assert(audit(p).case_audit[0].reasons.includes('NUMERIC_FROZEN_BASELINE_MISSING'));
});
test('price independence does not excuse leaked feature timestamps',()=>{
  const p=snapshot(),f=p.predictions[0];
  f.features_observed_at='2026-11-10T02:00:00Z';
  assert(audit(p).case_audit[0].reasons.includes('INDEPENDENT_PRESTART_FORECAST_NOT_PROVEN'));
});

test('a valid canonical event audit does not imply sportsbook identity or provider authentication',()=>{
 const p=snapshot(),a=p.export_audit;
 assert.equal(a.canonical_event_identity_status,'VALID');
 assert.equal(a.canonical_event_provider_bindings,0);
 assert.equal(a.native_event_provider_linked,false);
 assert.equal(a.source_claims_for_case,0);
 assert.equal(p.identities.length,0);
 assert.equal(audit(p).disposition,'HOLD_NO_MODEL_CALIBRATION');
});
test('replaying a date-matched source article never creates an accepted native price',()=>{
 const p=snapshot();
 const candidate=p.predictions[0].candidate_key, event=p.predictions[0].event_id;
 p.quotes=[{candidate_key:candidate,event_id:event,market_id:'UNATTESTED',
 verified_exact_book_quote:false,book:'UNVERIFIED',provider_market_id:null,
 source_uri:'public-article-only',observed_at:'2026-11-09T18:04:43Z',
 odds_decimal:1.5,virtual_stake:1,synthetic_combination:false}];
 const r=audit(p);
 assert.equal(r.packet,null);
 assert.equal(r.case_audit[0].matched_quotes,1);
 assert(r.case_audit[0].reasons.includes('EXACT_VALID_POST_FORECAST_PRICE_NOT_PROVEN'));
});
