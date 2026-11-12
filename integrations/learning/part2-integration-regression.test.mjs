import test from 'node:test';
import assert from 'node:assert/strict';
import {rankOpportunities, OPPORTUNITY_CONTRACT} from './opportunity-value-engine.mjs';
import {rankOpportunitiesWithPart2} from './part2-opportunity-bridge.mjs';
import {annotateExistingOpportunityResults, betaBinomialResearch} from './part2-shadow-math.mjs';

function goodCase(case_key='SYN-1', dependency_root='ROOT-1'){
 return {case_key,sport:'NBA',official_event_id:'EVT-1',dependency_root,
 market_family:'assists',selection:'Player X 6+',market_period:'FULL',
 settlement_rule:'REGULATION_AND_OT',event_start_at:'2026-11-13T00:00:00Z',
 market_currently_offered:true,market_restricted:false,requires_player:true,
 player_id:'X',official_current_team_verified:true,official_availability_verified:true,
 official_event_identity_verified:true,
 model:{model_key:'ORACLE',model_version:'SHADOW-A',frozen_at:'2026-11-12T18:00:00Z',feature_cutoff:'2026-11-12T17:59:00Z',
 probability:0.66,baseline_probability:0.5,probability_lower95:0.60,price_independent:true,
 prospectively_validated:true,unique_scored_roots:250,brier_gain_lower95:.006},
 quote:{sportsbook:'synthetic-book',provider_market_id:'synthetic-market',observed_at:'2026-11-12T19:59:00Z',
 selection:'Player X 6+',market_period:'FULL',settlement_rule:'REGULATION_AND_OT',decimal_odds:2.05,
 verified_book_source:true,exact_native_quote:true,execution_grade:true,synthetic_combination:false,book_market_status:'OPEN'}};
}
const packet=(candidates)=>({contract:OPPORTUNITY_CONTRACT,as_of:'2026-11-12T20:00:00Z',virtual_bankroll:100,candidates});
const annotatedResearch=betaBinomialResearch({prior_alpha:1,prior_beta:1,successes:12,trials:20,decimal_odds:1.9});

function checkParity(input, research){
 const original=rankOpportunities(input), bridged=rankOpportunitiesWithPart2(input,research);
 assert.deepEqual(bridged.summary,original.summary);
 assert.deepEqual(bridged.policy,original.policy);
 assert.equal(bridged.production_authority,false);
 assert.equal(bridged.execution_authority,false);
 assert.deepEqual(bridged.ranked.map(({part2_research,...base})=>base),original.ranked);
 assert.equal(original.ranked.some(x=>Object.hasOwn(x,'part2_research')),false);
 return {original,bridged};
}

test('synthetic qualifying input retains PR37 review-only stage, no execution',()=>{
 const {original,bridged}=checkParity(packet([goodCase()]),{'SYN-1':annotatedResearch});
 assert.equal(original.ranked[0].stage,'SHADOW_HUMAN_REVIEW_ONLY');
 assert.equal(bridged.ranked[0].stage,'SHADOW_HUMAN_REVIEW_ONLY');
 assert.equal(bridged.ranked[0].part2_research.execution_authorized,false);
});

test('stale quote creates HOLD; adjunct cannot bypass it',()=>{
 const c=goodCase();c.quote.observed_at='2026-11-12T19:00:00Z';
 const {bridged}=checkParity(packet([c]),{'SYN-1':{...annotatedResearch,execution_authorized:true}});
 assert(bridged.ranked[0].blockers.includes('QUOTE_STALE_OR_UNTIMESTAMPED'));
 assert.equal(bridged.ranked[0].part2_research.execution_authorized,false);
});

test('unverified model/offer creates HOLD; adding posterior never clears it',()=>{
 const c=goodCase();c.model.prospectively_validated=false;c.quote.execution_grade=false;
 const {bridged}=checkParity(packet([c]),{'SYN-1':annotatedResearch});
 assert(bridged.ranked[0].blockers.includes('MODEL_NOT_PROVEN_BETTER_THAN_BASELINE'));
 assert(bridged.ranked[0].blockers.includes('MISSING_OR_INCOMPARABLE_NATIVE_BOOK_PRICE'));
});

test('unqualified missing inputs remain HOLD, missing research is explicit',()=>{
 const c=goodCase();c.quote=null;
 const {bridged}=checkParity(packet([c]),{});
 assert.equal(bridged.ranked[0].part2_research.status,'HOLD_NO_PART2_RESEARCH_PACKET');
});

test('same dependency root triggers original portfolio cap, unaffected by extra math',()=>{
 const c1=goodCase('SYN-1'),c2=goodCase('SYN-2');c2.quote.provider_market_id='synthetic-market-2';
 const {original,bridged}=checkParity(packet([c1,c2]),{'SYN-1':annotatedResearch,'SYN-2':annotatedResearch});
 assert.equal(original.summary.qualified_for_shadow_human_review,1);
 assert.equal(bridged.summary.qualified_for_shadow_human_review,1);
 assert(bridged.ranked.some(r=>r.blockers.includes('PORTFOLIO_ROOT_OR_EVENT_CAP_REACHED')));
});

test('malicious research claim cannot change stages, stakes, production authority',()=>{
 const c=goodCase();c.market_currently_offered=false;
 const claim={...annotatedResearch,stage:'SHADOW_HUMAN_REVIEW_ONLY',paper_stake_cap:9999,
   production_authority:true,execution_authorized:true,statistical_screen_passed:true};
 const {bridged}=checkParity(packet([c]),{'SYN-1':claim});
 assert.equal(bridged.ranked[0].stage,'HOLD_UNQUALIFIED');
 assert.equal(bridged.ranked[0].paper_stake_cap,0);
 assert.equal(bridged.ranked[0].part2_research.production_authority,false);
 assert.equal(bridged.ranked[0].part2_research.execution_authorized,false);
});

test('invalid source-side packet remains a hard error, no bypass',()=>{
 assert.throws(()=>rankOpportunitiesWithPart2({bad:'packet'},{SYN:annotatedResearch}),/OPPORTUNITY_PACKET_INVALID/);
});
