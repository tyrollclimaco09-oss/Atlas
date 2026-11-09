import test from 'node:test';
import assert from 'node:assert/strict';
import {rankOpportunities,OPPORTUNITY_CONTRACT} from './opportunity-value-engine.mjs';
function valid(){
 return {contract:OPPORTUNITY_CONTRACT,as_of:'2026-11-09T20:00:00Z',virtual_bankroll:100,
  candidates:[{case_key:'S1',sport:'NFL',official_event_id:'evt-1',
   dependency_root:'root-1',market_family:'moneyline',selection:'BUF',
   market_period:'FULL',settlement_rule:'REGULAR_PLUS_OVERTIME',
   event_start_at:'2026-11-10T01:15:00Z',market_currently_offered:true,market_restricted:false,
   requires_player:false,official_event_identity_verified:true,
   model:{model_key:'ORACLE',model_version:'A',frozen_at:'2026-11-09T19:00:00Z',
     feature_cutoff:'2026-11-09T18:59:00Z',probability:.66,baseline_probability:.5,
     probability_lower95:.6,price_independent:true,prospectively_validated:true,
     unique_scored_roots:250,brier_gain_lower95:.006},
   quote:{sportsbook:'DraftKings',provider_market_id:'book-mkt-1',
    observed_at:'2026-11-09T19:59:00Z',selection:'BUF',market_period:'FULL',
    settlement_rule:'REGULAR_PLUS_OVERTIME',decimal_odds:2.05,
    verified_book_source:true,exact_native_quote:true,execution_grade:true,
    synthetic_combination:false,book_market_status:'OPEN'}}]};
}
const run=(f,policy={})=>rankOpportunities(f,policy);
test('valid hypothetical authenticated inputs reach shadow human review only',()=>{
 const r=run(valid());assert.equal(r.ranked[0].stage,'SHADOW_HUMAN_REVIEW_ONLY');
 assert.equal(r.summary.qualified_for_shadow_human_review,1);
 assert.equal(r.ranked[0].paper_stake_cap,1);
 assert.equal(r.summary.real_money_staked,0);assert.equal(r.production_authority,false);
});
test('price math computes baseline gap, break-even and conservative EV',()=>{
 const r=run(valid()).ranked[0];
 assert.equal(r.model_baseline_delta,.16);
 assert.equal(r.break_even_probability,.4878);
 assert.equal(r.conservative_ev_per_unit,.23);
 assert.equal(r.modeled_ev_per_unit,.353);
});
test('incomplete packet rejects before scanning',()=>assert.throws(()=>run({}),/PACKET_INVALID/));
test('no outcomes means no validated model and thus HOLD',()=>{
 const f=valid();f.candidates[0].model.prospectively_validated=false;
 assert(run(f).ranked[0].blockers.includes('MODEL_NOT_PROVEN_BETTER_THAN_BASELINE'));
});
test('no out-of-sample sample size cannot promote',()=>{
 const f=valid();f.candidates[0].model.unique_scored_roots=0;
 assert(run(f).summary.qualified_for_shadow_human_review===0);
});
test('a negative Brier confidence bound fails regardless of p',()=>{
 const f=valid();f.candidates[0].model.brier_gain_lower95=-.1;
 assert(run(f).ranked[0].blockers.includes('MODEL_NOT_PROVEN_BETTER_THAN_BASELINE'));
});
test('a quote older than five minutes cannot qualify as live',()=>{
 const f=valid();f.candidates[0].quote.observed_at='2026-11-09T19:40:00Z';
 assert(run(f).ranked[0].blockers.includes('QUOTE_STALE_OR_UNTIMESTAMPED'));
});
test('August 2026 odds cannot fund November opportunities',()=>{
 const f=valid();f.candidates[0].quote.observed_at='2026-08-10T00:07:08Z';
 assert.equal(run(f).summary.qualified_for_shadow_human_review,0);
});
test('the actual ATLAS 2026-11-09 model p=.496875 is unvalidated and HOLD',()=>{
 const f=valid();f.candidates[0].model.probability=.4968750406894683;
 f.candidates[0].model.prospectively_validated=false;f.candidates[0].model.unique_scored_roots=0;
 f.candidates[0].model.probability_lower95=null;
 assert.equal(run(f).ranked[0].stage,'HOLD_UNQUALIFIED');
});
test('unsupported market period/settlement string cannot match a quote',()=>{
 const f=valid();f.candidates[0].market_period='';
 assert(run(f).ranked[0].blockers.includes('MARKET_SELECTION_PERIOD_OR_RULES_UNKNOWN'));
});
test('missing canonical event ID rejects regardless of model quality',()=>{
 const f=valid();f.candidates[0].official_event_id='';
 assert(run(f).ranked[0].blockers.includes('INCOMPLETE_SPORT_EVENT_ROOT'));
});
test('team and player availability is mandatory for player props',()=>{
 const f=valid();const c=f.candidates[0];c.market_family='rushing_yards';c.requires_player=true;c.player_id='player1';
 c.official_current_team_verified=false;
 assert(run(f).ranked[0].blockers.includes('PLAYER_TEAM_OR_AVAILABILITY_NOT_VERIFIED'));
});
test('synthetic parlay pricing is never accepted',()=>{
 const f=valid();f.candidates[0].market_family='sgp';f.candidates[0].quote.synthetic_combination=true;
 assert(run(f).ranked[0].blockers.includes('MISSING_OR_INCOMPARABLE_NATIVE_BOOK_PRICE'));
});
test('current league-partner restricted markets never qualify',()=>{
 const f=valid();f.candidates[0].market_restricted=true;
 assert(run(f).ranked[0].blockers.includes('PARTNER_OR_LEAGUE_RESTRICTED_MARKET'));
});
test('missing source authenticated book quote cannot be replaced by a screenshot',()=>{
 const f=valid();f.candidates[0].quote.verified_book_source=false;
 assert(run(f).ranked[0].blockers.includes('MISSING_OR_INCOMPARABLE_NATIVE_BOOK_PRICE'));
});
test('quote must follow independently frozen model, never anchor the forecast',()=>{
 const f=valid();f.candidates[0].model.frozen_at='2026-11-09T19:59:30Z';
 assert(run(f).ranked[0].blockers.includes('MISSING_OR_INCOMPARABLE_NATIVE_BOOK_PRICE'));
});
test('quote cannot appear in future or after event start',()=>{
 const f=valid();f.candidates[0].quote.observed_at='2026-11-10T02:00:00Z';
 assert(run(f).ranked[0].blockers.includes('MISSING_OR_INCOMPARABLE_NATIVE_BOOK_PRICE'));
});
test('same root duplicated across tickets cannot double debit risk',()=>{
 const f=valid();const copy=structuredClone(f.candidates[0]);copy.case_key='S2';copy.quote.provider_market_id='book-mkt-2';
 f.candidates.push(copy);
 const r=run(f);assert.equal(r.summary.qualified_for_shadow_human_review,1);
 assert.equal(r.summary.illustrative_total_paper_stake,1);
 assert(r.ranked.some(x=>x.stage==='HOLD_PORTFOLIO_CAP'));
});
test('same game event cap applies to distinct independent roots',()=>{
 const f=valid();f.virtual_bankroll=100;f.candidates=Array.from({length:6},(_,i)=>{
 const c=structuredClone(f.candidates[0]);c.case_key='case'+i;c.dependency_root='root'+i;c.quote.provider_market_id='market'+i;return c;});
 const r=run(f);assert(r.summary.illustrative_total_paper_stake<=3);
});
test('no false positive edge if lower-bound EV does not cover the price',()=>{
 const f=valid();f.candidates[0].model.probability_lower95=.45;
 assert(run(f).ranked[0].blockers.includes('NO_CONSERVATIVE_PRICE_ADVANTAGE_AT_CURRENT_QUOTE'));
});
test('unknown virtual bankroll cannot generate a stake',()=>{
 const f=valid();f.virtual_bankroll=null;
 assert(run(f).ranked[0].blockers.includes('NO_RECONCILED_VIRTUAL_BANKROLL'));
});
test('closed market cannot qualify even with favorable theoretical model',()=>{
 const f=valid();f.candidates[0].quote.book_market_status='SUSPENDED';
 assert(run(f).ranked[0].blockers.includes('MARKET_NOT_OPEN'));
});
test('double same case identity refuses portfolio duplicates',()=>{
 const f=valid();f.candidates.push(structuredClone(f.candidates[0]));
 assert(run(f).ranked[1].blockers.includes('DUPLICATE_OR_MISSING_CASE_KEY'));
});
test('missing conservative uncertainty bound always blocks attractive point p',()=>{
 const f=valid();f.candidates[0].model.probability_lower95=null;
 assert(run(f).ranked[0].blockers.includes('NO_USABLE_CONSERVATIVE_PROBABILITY_BOUND'));
});
test('site math cannot bypass authoritative real wagering boundary',()=>{
 const r=run(valid());assert.equal(r.execution_authority,false);
 assert.equal(r.ranked[0].real_money_wagered,0);
 assert.equal(r.result_authority,'RESEARCH_AND_SHADOW_REVIEW_ONLY');
});
