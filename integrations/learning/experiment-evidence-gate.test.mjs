import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTRACT, evaluateExperimentEvidence } from './experiment-evidence-gate.mjs';
const start = new Date('2026-11-09T00:00:00Z').getTime();
const day = 86400000;
const fx = (n = 150) => ({
  contract: CONTRACT, experiment_key: 'ATLAS-LAB-FIXTURE-001',
  hypothesis: 'model beats held-out market-neutral baseline', model_version: 'TEST_SHADOW_V1',
  frozen_cohort_id: 'freeze-case-sample', baseline_id: 'frozen-control',
  out_of_time_holdout: true, training_cutoff: '2026-11-01T00:00:00Z',
  holdout_start: '2026-11-08T00:00:00Z', model_uses_bookmaker_odds: false,
  independent_model_inputs_verified: true, frozen_case_count: n,
  cases: Array.from({length:n}, (_, i) => {
    const tip = start + i * day / 5;
    const y = (i % 5) < 4 ? 1 : 0;
    return { case_key: 'case-'+i, sport: i%2?'NFL':'NBA', event_id: 'event-'+i,
      market_id:'market-'+i, root_key:'root-'+i, current_team_verified:true,
      event_teams_verified:true, settlement_rules_verified:true,
      frozen_at:new Date(tip-10*3600000).toISOString(),
      features_observed_at:new Date(tip-11*3600000).toISOString(),
      event_start_at:new Date(tip).toISOString(), model_probability: y ? 0.85 : 0.15,
      baseline_probability:0.5, outcome:y, official_outcome_verified:true,
      outcome_observed_at:new Date(tip+2*3600000).toISOString(), invalid_market:false,void_or_push:false,
      exact_book_quote_verified:true, book:'SHADOW_MOCK',book_market_id:'mock-'+i,price_observed_at:new Date(tip-1*3600000).toISOString(),
      odds_decimal:2,virtual_stake:1,synthetic_multi_leg_quote:false };
  })
});
const run = p=> evaluateExperimentEvidence(p);
test('valid prospective synthetic cohort reaches human review, never autonomous promotion',()=>{
  const x=run(fx());assert.equal(x.disposition,'HUMAN_REVIEW_ELIGIBLE_SHADOW_ONLY');
  assert.equal(x.production_authority,false);assert.equal(x.model_weights_changed,false);
  assert.equal(x.cohort.independent_roots,150);assert(x.pricing.net_roi_95.lower_95>0);
});
test('contract must match',()=>assert.throws(()=>run({...fx(),contract:'WRONG'}),/PACKET_INVALID/));
test('cohort accounting refuses missing losers',()=>{
  const p=fx();p.cases.pop();const x=run(p);assert(x.blockers.includes('FROZEN_COHORT_NOT_RECONCILED'));
});
test('model cannot use bookmaker odds as independent input',()=>{
  const p=fx();p.model_uses_bookmaker_odds=true;assert(run(p).blockers.includes('NO_VERIFIED_PRICE_INDEPENDENCE'));
});
test('holdout must be after training cutoff',()=>{
  const p=fx();p.training_cutoff='2026-11-09T03:00:00Z';assert(run(p).blockers.includes('NO_CHRONOLOGICAL_HOLDOUT'));
});
test('forecast after event is blocked',()=>{
  const p=fx();p.cases[0].frozen_at=p.cases[0].event_start_at;
  assert(run(p).rejected_cases[0].reasons.includes('FORECAST_NOT_FROZEN_BEFORE_EVENT_OR_HOLDOUT'));
});
test('source captured after freeze is leakage',()=>{
  const p=fx();p.cases[0].features_observed_at=new Date(start + 100000).toISOString();
  assert(run(p).rejected_cases[0].reasons.includes('LEAKED_FUTURE_FEATURES'));
});
test('wrong team/market identity cannot be admitted',()=>{
  const p=fx();p.cases[0].current_team_verified=false;
  assert(run(p).rejected_cases[0].reasons.includes('SOURCE_IDENTITY_OR_SETTLEMENT_NOT_VERIFIED'));
});
test('missing event id is blocked',()=>{
  const p=fx();p.cases[0].event_id=null;
  assert(run(p).rejected_cases[0].reasons.includes('INCOMPLETE_OFFICIAL_MARKET_IDENTITY'));
});
test('void and invalid are not counted as win or loss',()=>{
  const p=fx();p.cases[0].void_or_push=true;p.cases[1].invalid_market=true;
  assert.equal(run(p).cohort.rejected,2);
});
test('duplicated case id is rejected',()=>{
  const p=fx();p.cases[1].case_key=p.cases[0].case_key;
  assert(run(p).rejected_cases.some(r=>r.reasons.includes('DUPLICATE_OR_MISSING_CASE_ID')));
});
test('repeated root keys do not create artificial independent sample',()=>{
  const p=fx();p.cases[1].root_key=p.cases[0].root_key;
  assert(run(p).blockers.includes('CORRELATED_ROOTS_NOT_ONE_INDEPENDENT_SAMPLE_EACH'));
});
test('tiny overfit-looking cohort never passes human-review gate',()=>{
  const p=fx(20);assert(run(p).blockers.includes('INSUFFICIENT_PROSPECTIVE_SAMPLE'));
});
test('missing price evidence prevents profitability claims',()=>{
  const p=fx();p.cases.forEach(c=>c.exact_book_quote_verified=false);
  const x=run(p);assert(x.blockers.includes('PRICING_INCOMPLETE_OR_SYNTHETIC'));
  assert.equal(x.pricing,null);
});
test('mathematical products do not count as sportsbook-accepted prices',()=>{
  const p=fx();p.cases.forEach(c=>c.synthetic_multi_leg_quote=true);
  assert(run(p).blockers.includes('PRICING_INCOMPLETE_OR_SYNTHETIC'));
});
test('losing offered price blocks profitability despite strong prediction calibration',()=>{
  const p=fx();p.cases.forEach(c=>c.odds_decimal=1.05);
  const x=run(p);assert(x.blockers.includes('NO_ROBUST_POSITIVE_PRICE_ADJUSTED_RETURN'));
  assert(x.forecast.improves_brier_and_log_loss);
});
test('bad baseline performance blocks the promotion gate',()=>{
  const p=fx();p.cases.forEach(c=>c.baseline_probability=c.model_probability);
  assert(run(p).blockers.includes('NO_RELIABLE_HELDOUT_FORECAST_LIFT'));
});
test('unsettled outcome does not score as a loss',()=>{
  const p=fx();p.cases[0].outcome=null;
  assert(run(p).rejected_cases[0].reasons.includes('OUTCOME_NOT_BINARY_OR_NOT_SETTLED'));
});
test('a candidate whose quoted book price was after kickoff is not financially counted',()=>{
  const p=fx();p.cases[0].price_observed_at=new Date(start+1000).toISOString();
  assert(run(p).blockers.includes('PRICING_INCOMPLETE_OR_SYNTHETIC'));
});
test('missing preregistered hypothesis prevents review',()=>{
  const p=fx();p.hypothesis=null;
  assert(run(p).blockers.includes('MISSING_PREREGISTERED_HYPOTHESIS_OR_BASELINE'));
});
test('no real money is ever authorized regardless of result',()=>{
  const r=run(fx());assert.equal(r.uses_real_money,false);assert.equal(r.production_authority,false);
});
test('outcome lacking an official final source is not valid scored evidence',()=>{
  const p=fx();p.cases[0].official_outcome_verified=false;
  assert(run(p).rejected_cases[0].reasons.includes('OFFICIAL_OUTCOME_SOURCE_OR_TIME_NOT_VERIFIED'));
});
test('outcome timestamp must follow game start',()=>{
  const p=fx();p.cases[0].outcome_observed_at=p.cases[0].frozen_at;
  assert(run(p).rejected_cases[0].reasons.includes('OFFICIAL_OUTCOME_SOURCE_OR_TIME_NOT_VERIFIED'));
});
test('book quote cannot precede the independent frozen pre-price forecast',()=>{
  const p=fx();p.cases[0].price_observed_at=new Date(Date.parse(p.cases[0].frozen_at)-1000).toISOString();
  assert(run(p).blockers.includes('PRICING_INCOMPLETE_OR_SYNTHETIC'));
});
test('quote without unique bookmaker market ID is not valid financial evidence',()=>{
  const p=fx();p.cases[0].book_market_id=null;
  assert(run(p).blockers.includes('PRICING_INCOMPLETE_OR_SYNTHETIC'));
});
