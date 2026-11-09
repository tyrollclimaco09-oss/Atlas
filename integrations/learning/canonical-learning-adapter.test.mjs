import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileCanonicalLearning, ADAPTER_CONTRACT} from './canonical-learning-adapter.mjs';
import {evaluateExperimentEvidence} from './experiment-evidence-gate.mjs';

const expId = '77777777-7777-4777-8777-777777777777';
const day = 86400000;
const start = Date.parse('2026-11-09T16:00:00Z');
function fixture(n=1) {
  const obs=[],pred=[],out=[],ids=[],quotes=[];
  for(let i=0;i<n;i++){
    const eventStart=new Date(start+i*day).toISOString();
    const frozen=new Date(start+i*day-3600000*4).toISOString();
    const observed=new Date(start+i*day-3600000*5).toISOString();
    const quoteTime=new Date(start+i*day-3600000).toISOString();
    const settlement=new Date(start+i*day+3600000*3).toISOString();
    const key='fixture-case-'+i,event='event-'+i,market='market-'+i;
    obs.push({id:'observation-'+i,experiment_id:expId,candidate_key:key,event_id:event,observed_at:observed,
      baseline_output:{predicted_probability:0.5,frozen_at:observed,model_version:'BASELINE-1'},
      experimental_output:{state:'hypothesis frozen before event'},outcome_value:null});
    pred.push({candidate_key:key,event_id:event,sport:i%2?'NFL':'NBA',model_key:'MODEL-V1',
      predicted_probability:0.82,frozen_at:frozen,features_observed_at:observed,event_start_at:eventStart,
      independent_inputs_verified:true,root_tags:{root_key:'root-'+i}});
    ids.push({candidate_key:key,event_id:event,market_id:market,verified_current_team:true,
      verified_event_teams:true,verified_market_identity:true,verified_settlement_rules:true,
      source_uri:'https://example.org/official-identity-'+i,source_observed_at:observed});
    out.push({candidate_key:key,event_id:event,market_id:market,verified_official_source:true,
      source_uri:'https://example.org/official-final-'+i,observed_at:settlement,binary_outcome:1,
      invalid_market:false,void_or_push:false});
    quotes.push({candidate_key:key,event_id:event,market_id:market,verified_exact_book_quote:true,
      book:'SHADOW_MOCK',provider_market_id:'provider-'+i,source_uri:'https://example.org/quote-'+i,
      observed_at:quoteTime,synthetic_combination:false,odds_decimal:2,virtual_stake:1});
  }
  return {experiment:{experiment_key:'ATLAS-TEST-COHORT-1',experiment_id:expId},
    frozen_cohort:{model_version:'MODEL-V1',baseline_id:'BASELINE-1',frozen_cohort_id:'freeze-1',
      training_cutoff:'2026-11-01T00:00:00Z',holdout_start:'2026-11-08T00:00:00Z',
      hypothesis:'independent model versus frozen baseline',frozen_case_count:n,
      independent_model_inputs_verified:true,out_of_time_holdout:true},
    observations:obs,predictions:pred,official_outcomes:out,identities:ids,quotes};
}
const call=inputs=>reconcileCanonicalLearning(inputs);
test('valid source-authenticated synthetic case maps to exact evidence packet',()=>{
 const r=call(fixture());assert.equal(r.contract,ADAPTER_CONTRACT);
 assert.equal(r.disposition,'PACKET_READY_FOR_SHADOW_EVALUATION');
 assert.equal(r.packet.cases.length,1);assert.equal(r.packet.cases[0].baseline_probability,0.5);
 assert.equal(r.packet.cases[0].outcome,1);assert.equal(r.virtual_bankroll_affected,false);
});
test('adapter packet integrates with evidence gate and never promotes model automatically',()=>{
 const r=call(fixture(12));const s=evaluateExperimentEvidence(r.packet,{minCases:10,minDays:10});
 assert.equal(s.cohort.valid,12);assert.equal(s.production_authority,false);
 assert.equal(s.model_weights_changed,false);assert.equal(s.uses_real_money,false);
});
test('actual legacy narrative observations with no scored source rows stay HOLD',()=>{
 const f=fixture();f.frozen_cohort=null;f.predictions=[];f.official_outcomes=[];f.quotes=[];f.identities=[];
 f.observations[0].event_id=null;f.observations[0].baseline_output={baseline_read:'Curry absent; preseason role changes?'};
 const r=call(f);assert.equal(r.disposition,'HOLD_NO_MODEL_CALIBRATION');
 assert.equal(r.packet,null);assert.equal(r.counts.held_cases,1);
 assert(r.case_audit[0].reasons.includes('MISSING_CANONICAL_EVENT_ID'));
 assert(r.case_audit[0].reasons.includes('NUMERIC_FROZEN_BASELINE_MISSING'));
});
test('never join by player name or candidate key when event identity differs',()=>{
 const f=fixture();f.official_outcomes[0].event_id='wrong-event';
 assert(call(f).case_audit[0].reasons.includes('MISSING_OR_AMBIGUOUS_OFFICIAL_OUTCOME'));
});
test('duplicate official outcomes fail closed',()=>{
 const f=fixture();f.official_outcomes.push({...f.official_outcomes[0]});
 assert(call(f).case_audit[0].reasons.includes('MISSING_OR_AMBIGUOUS_OFFICIAL_OUTCOME'));
});
test('duplicate predictions fail closed',()=>{
 const f=fixture();f.predictions.push({...f.predictions[0]});
 assert(call(f).case_audit[0].reasons.includes('MISSING_OR_AMBIGUOUS_FROZEN_PREDICTION'));
});
test('missing current team verification blocks',()=>{
 const f=fixture();f.identities[0].verified_current_team=false;
 assert(call(f).case_audit[0].reasons.includes('OFFICIAL_IDENTITY_AND_MARKET_PROOF_MISSING'));
});
test('invalid source timestamps block market identity',()=>{
 const f=fixture();f.identities[0].source_observed_at='2026-11-10T16:00:00Z';
 assert(call(f).case_audit[0].reasons.includes('OFFICIAL_IDENTITY_AND_MARKET_PROOF_MISSING'));
});
test('model with no independent pregame probability cannot be scored',()=>{
 const f=fixture();f.predictions[0].predicted_probability=null;
 assert(call(f).case_audit[0].reasons.includes('INDEPENDENT_PRESTART_FORECAST_NOT_PROVEN'));
});
test('model observed after price freeze leaks future evidence',()=>{
 const f=fixture();f.predictions[0].features_observed_at=new Date(start-60*60000).toISOString();
 assert(call(f).case_audit[0].reasons.includes('INDEPENDENT_PRESTART_FORECAST_NOT_PROVEN'));
});
test('a pregame baseline in prose is not a binary probability',()=>{
 const f=fixture();f.observations[0].baseline_output={baseline_read:'More minutes likely'};
 assert(call(f).case_audit[0].reasons.includes('NUMERIC_FROZEN_BASELINE_MISSING'));
});
test('unknown root cannot count as independent observation',()=>{
 const f=fixture();f.predictions[0].root_tags=null;
 assert(call(f).case_audit[0].reasons.includes('MISSING_SHARED_CAUSAL_ROOT_KEY'));
});
test('no official outcome never defaults to a loss',()=>{
 const f=fixture();f.official_outcomes=[];
 assert(call(f).case_audit[0].reasons.includes('MISSING_OR_AMBIGUOUS_OFFICIAL_OUTCOME'));
 assert.equal(call(f).packet,null);
});
test('official outcome must be after tipoff',()=>{
 const f=fixture();f.official_outcomes[0].observed_at=f.predictions[0].frozen_at;
 assert(call(f).case_audit[0].reasons.includes('OFFICIAL_BINARY_RESULT_NOT_ADMISSIBLE'));
});
test('official settled market identity must exactly match current event',()=>{
 const f=fixture();f.official_outcomes[0].market_id='different-market';
 assert(call(f).case_audit[0].reasons.includes('OFFICIAL_BINARY_RESULT_NOT_ADMISSIBLE'));
});
test('void does not become a scored binary result',()=>{
 const f=fixture();f.official_outcomes[0].void_or_push=true;
 assert(call(f).case_audit[0].reasons.includes('OFFICIAL_BINARY_RESULT_NOT_ADMISSIBLE'));
});
test('missing verified book quote does not create fabricated profitability',()=>{
 const f=fixture();f.quotes=[];
 assert(call(f).case_audit[0].reasons.includes('EXACT_VALID_POST_FORECAST_PRICE_NOT_PROVEN'));
});
test('synthetic SGP price is not an actual bookmaker quote',()=>{
 const f=fixture();f.quotes[0].synthetic_combination=true;
 assert(call(f).case_audit[0].reasons.includes('EXACT_VALID_POST_FORECAST_PRICE_NOT_PROVEN'));
});
test('after-tip quote cannot be counted',()=>{
 const f=fixture();f.quotes[0].observed_at=f.official_outcomes[0].observed_at;
 assert(call(f).case_audit[0].reasons.includes('EXACT_VALID_POST_FORECAST_PRICE_NOT_PROVEN'));
});
test('quote must be after independent model forecast freeze',()=>{
 const f=fixture();f.quotes[0].observed_at=f.observations[0].observed_at;
 assert(call(f).case_audit[0].reasons.includes('EXACT_VALID_POST_FORECAST_PRICE_NOT_PROVEN'));
});
test('missing canonical provider market identity is held',()=>{
 const f=fixture();f.quotes[0].provider_market_id=null;
 assert(call(f).case_audit[0].reasons.includes('EXACT_VALID_POST_FORECAST_PRICE_NOT_PROVEN'));
});
test('unrelated experiment observations cannot enter frozen cohort',()=>{
 const f=fixture();f.observations[0].experiment_id='another-experiment';
 const r=call(f);assert(r.blockers.includes('UNRELATED_EXPERIMENT_OBSERVATIONS_PRESENT'));
 assert.equal(r.packet,null);
});
test('case-drop changes frozen count and blocks evaluation',()=>{
 const f=fixture(2);f.observations.pop();const r=call(f);
 assert(r.blockers.includes('FROZEN_CASE_COUNT_MISMATCH'));
 assert.equal(r.packet,null);
});
test('invalid malformed source arrays reject before processing',()=>{
 const f=fixture();f.quotes=null;
 assert.throws(()=>call(f),/CANONICAL_RECONCILE_INPUT_INVALID/);
});
test('all outputs remain paper only regardless of evidence',()=>{
 const r=call(fixture());assert.equal(r.production_authority,false);
 assert.equal(r.real_betting_authority,false);assert.equal(r.virtual_bankroll_affected,false);
});
