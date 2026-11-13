import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {auditPlayerAvailability,assessAssistForecastEligibility}
  from './scout-availability-evidence-gate.mjs';
const path=fileURLToPath(new URL('./fixtures/nov13-scout-official-publication-review-v0.json',import.meta.url));
const fixture=JSON.parse(readFileSync(path,'utf8'));
test('Nov 13 Curry official PDF + team bulletin rejects old conditional availability',()=>{
 const record=fixture.cases[0];
 const result=auditPlayerAvailability(record.packet);
 assert.equal(result.stage,'HOLD_PLAYER_OUT');
 assert(result.blockers.includes('PLAYER_OFFICIALLY_OUT_OR_REEVALUATION'));
 assert.equal(result.research_observations.length,2);
 assert(result.research_observations.every(x=>x.structural_check==='PASS_STRUCTURAL_ONLY'));
 assert(result.findings_observed.includes('PUBLISHED_PRE_FREEZE_BUT_SCOUT_CAPTURED_AFTER_FREEZE'));
 assert.equal(result.forecast_probability_eligible,false);
});
test('Nov 13 Knicks missing team section never marks Brunson available',()=>{
 const record=fixture.cases[1];
 const result=auditPlayerAvailability(record.packet);
 assert.equal(result.stage,'HOLD_EVIDENCE_OR_PARTICIPATION_UNQUALIFIED');
 assert(result.blockers.includes('NOT_LISTED_IS_NOT_CONFIRMED_AVAILABLE'));
 assert.equal(result.source_authenticated,false);
 assert.equal(result.player_confirmed_available,false);
});
test('real PDF reviewed after original Nov12 evening freeze cannot replace the frozen forecast',()=>{
 for(const item of fixture.cases){
   const result=auditPlayerAvailability(item.packet);
   assert(result.research_observations[0].captured_after_original_freeze);
   assert(result.findings_observed.includes('RECEIPT_NOT_ADMISSIBLE_TO_REWRITE_ORIGINAL_FORECAST'));
   assert.equal(result.production_authority,false);
 }
});
test('PR45 numerics are retained only as conditional research, not live candidates',()=>{
 for(const item of fixture.cases){
  const out=assessAssistForecastEligibility({
    stage:'SHADOW_UNVALIDATED_RESEARCH_PROBABILITIES',
    model_probability:item.conditional_original_probability,
    baseline_probability:item.conditional_baseline_probability},item.packet);
  assert.equal(out.conditional_research_model_probability,item.conditional_original_probability);
  assert.equal(out.eligible_prediction_probability,null);
  assert.equal(out.direct_wager_authority,false);
  assert.equal(out.original_forecast_mutated,false);
 }
});
