/** Execute this test *inside* the original repository, alongside the real PR #37 engine. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {rankOpportunitiesWithPart2} from './part2-opportunity-bridge.mjs';
import {rankOpportunities,OPPORTUNITY_CONTRACT} from './opportunity-value-engine.mjs';
import {betaBinomialResearch} from './part2-shadow-math.mjs';
const packet={contract:OPPORTUNITY_CONTRACT,as_of:'2026-11-12T19:00:00Z',
 virtual_bankroll:50,candidates:[{
  case_key:'S1',sport:'NBA',official_event_id:'nba-1',dependency_root:'nba-root1',
  market_family:'assists',selection:'Player A 6+',market_period:'FULL',
  settlement_rule:'REGULATION_AND_OT',event_start_at:'2026-11-13T00:00:00Z',
  market_currently_offered:false,requires_player:true,official_event_identity_verified:false,
  player_id:'unverified-player',official_current_team_verified:false,official_availability_verified:false,
  model:{model_key:'ORACLE',model_version:'lab',frozen_at:'2026-11-12T18:30:00Z',
   feature_cutoff:'2026-11-12T18:25:00Z',probability:.6,baseline_probability:.5,
   probability_lower95:.4,price_independent:true,prospectively_validated:false,unique_scored_roots:0,
   brier_gain_lower95:0},quote:null
 }]};

test('native PR37 engine and Part2 adapter preserve holds exactly',()=>{
 const baseline=rankOpportunities(packet);
 const supplemental=betaBinomialResearch({prior_alpha:1,prior_beta:1,successes:12,trials:20,decimal_odds:1.90});
 const part2=rankOpportunitiesWithPart2(packet,{S1:supplemental});
 assert.deepEqual(part2.ranked.map(r=>r.blockers),baseline.ranked.map(r=>r.blockers));
 assert.deepEqual(part2.ranked.map(r=>r.stage),baseline.ranked.map(r=>r.stage));
 assert.deepEqual(part2.ranked.map(r=>r.paper_stake_cap),baseline.ranked.map(r=>r.paper_stake_cap));
 assert.equal(part2.summary.qualified_for_shadow_human_review,0);
 assert.equal(part2.ranked[0].part2_research.execution_authorized,false);
 assert.equal(part2.production_authority,false);assert.equal(part2.execution_authority,false);
});
