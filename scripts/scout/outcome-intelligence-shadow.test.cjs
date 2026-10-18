'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const O=require('./outcome-intelligence-shadow.cjs');
const deep=x=>JSON.parse(JSON.stringify(x));
const e='synthetic-game-a',qb='synthetic-qb',wr='synthetic-wr';
function fixture(weighted=true){
 return {schema_version:O.VERSION,synthetic:true,research_only:true,phase:'PHASE1_PRICE_INDEPENDENT',
  study_id:'synthetic-doubles-lab',frozen_at:'2026-10-17T21:00:00Z',forecast_cutoff:'2026-10-18T16:00:00Z',
  weight_origin:weighted?'SYNTHETIC_ASSUMPTION':'UNESTIMATED',
  events:[{event_id:e,starts_at:'2026-10-19T21:00:00Z'}],
  legs:[
   {leg_id:'synthetic-a',event_id:e,player_id:qb,metric:'pass_attempts',unit:'attempts',selection:'Synthetic QB attempts 31+',comparator:'AT_LEAST',threshold:31},
   {leg_id:'synthetic-b',event_id:e,player_id:wr,metric:'receptions',unit:'receptions',selection:'Synthetic WR receptions 6+',comparator:'AT_LEAST',threshold:6},
   {leg_id:'synthetic-a-over-33',event_id:e,player_id:qb,metric:'pass_attempts',unit:'attempts',selection:'Synthetic QB attempts over 33',comparator:'OVER',threshold:33}
  ],
  worlds:[
   world('synthetic-shootout', 'synthetic-shootout',weighted?0.4:null,34,8),
   world('synthetic-ground','synthetic-ground',weighted?0.1:null,33,3),
   world('synthetic-comeback','synthetic-comeback',weighted?0.15:null,23,9),
   world('synthetic-defensive','synthetic-defensive',weighted?0.35:null,23,2)
  ]};
}
function world(world_id,scenario_id,weight,attempts,catches){
 return {world_id,scenario_id,weight,stats:[
  {event_id:e,player_id:qb,metric:'pass_attempts',unit:'attempts',value:attempts},
  {event_id:e,player_id:wr,metric:'receptions',unit:'receptions',value:catches}
 ]};
}
function ticket(ticket_id,leg_ids,american_odds,stake_cents=100,expression=leg_ids.length===1?'SINGLE':'DOUBLE'){
 return {ticket_id,expression,leg_ids,american_odds,stake_cents,quoted_at:'2026-10-18T10:00:00Z',quote_origin:'SYNTHETIC_DEMO'};
}
const approx=(x,y)=>assert.ok(Math.abs(x-y)<1e-8, x+' != '+y);
test('price-independent freeze is order invariant, immutable, and refuses priced input',()=>{
 const input=fixture(),reordered=deep(input);
 reordered.events.reverse();reordered.legs.reverse();reordered.worlds.reverse();
 for(const w of reordered.worlds)w.stats.reverse();
 const frozen=O.freezeWorlds(input);
 assert.equal(frozen.sha256,O.freezeWorlds(reordered).sha256);
 assert.equal(Object.isFrozen(frozen.input.worlds[0].stats[0]),true);
 assert.equal(input.worlds[0].stats[0].value,34);
 assert.throws(()=>O.freezeWorlds({...fixture(),odds:-110}),/WORLD_CONTRACT/);
 assert.throws(()=>O.freezeWorlds({...fixture(),market_probability:0.8}),/WORLD_CONTRACT/);
});
test('synthetic joint truth table preserves split outcomes and rejects naive independence',()=>{
 const report=O.matrix(O.freezeWorlds(fixture()),'synthetic-a','synthetic-b');
 assert.deepEqual(report.counts,{both:1,first_only:1,second_only:1,neither:1,push_unresolved:0});
 approx(report.hypothetical_joint.both,0.4);
 approx(report.hypothetical_joint.first_only,0.1);
 approx(report.hypothetical_joint.second_only,0.15);
 approx(report.hypothetical_joint.neither,0.35);
 approx(report.hypothetical_independence_product,0.275);
 approx(report.hypothetical_covariance,0.125);
 approx(report.hypothetical_conditional_second_given_first,0.8);
 assert.equal(report.model_skill,'NOT_ESTABLISHED');
 assert.equal(report.execution_authority,false);
});
test('unknown scenario probabilities remain null and never turn counts into fair probabilities',()=>{
 const receipt=O.freezeWorlds(fixture(false));
 const r=O.matrix(receipt,'synthetic-a','synthetic-b');
 assert.equal(r.world_count,4);
 assert.equal(r.hypothetical_joint,null);
 assert.equal(r.hypothetical_independence_product,null);
 assert.equal(r.scenarios[0].assumed_weight,null);
 const settlement=O.settleTickets(receipt,[ticket('synthetic-single',['synthetic-a'],120)]);
 assert.equal(settlement.hypothetical_expected_profit_cents,null);
 assert.equal(settlement.demonstrative_worst_case_cents,-100);
});
test('explicitly independently quoted doubles and singles settle per world with portfolio net table',()=>{
 const receipt=O.freezeWorlds(fixture());
 const report=O.settleTickets(receipt,[
  ticket('synthetic-qb',['synthetic-a'],120),
  ticket('synthetic-wr',['synthetic-b'],110),
  ticket('synthetic-pair',['synthetic-a','synthetic-b'],250)
 ]);
 approx(report.hypothetical_expected_profit_cents,65.5);
 approx(report.hypothetical_roi,65.5/300);
 assert.equal(report.total_stake_cents,300);
 const shootout=report.outcomes.find(x=>x.world_id==='synthetic-shootout');
 approx(shootout.net_profit_cents,120+110+250);
 const ground=report.outcomes.find(x=>x.world_id==='synthetic-ground');
 approx(ground.net_profit_cents,120-100-100);
 assert.equal(report.pricing_stage,'PHASE2_SYNTHETIC_DEMO_ONLY');
 assert.equal(report.execution_authority,false);
});
test('alternate-line threshold equality requires quoted multi-leg void policy; no imaginary reduced odds',()=>{
 const receipt=O.freezeWorlds(fixture());
 const a=O.matrix(receipt,'synthetic-a-over-33','synthetic-b');
 approx(a.hypothetical_joint.push_unresolved,0.1);
 assert.equal(a.hypothetical_covariance,null);
 const multiple=O.settleTickets(receipt,[ticket('synthetic-void-pair',['synthetic-a-over-33','synthetic-b'],275)]);
 assert.equal(multiple.unresolved_void,true);
 assert.equal(multiple.hypothetical_expected_profit_cents,null);
 assert.equal(multiple.demonstrative_best_case_cents,null);
 const single=O.settleTickets(receipt,[ticket('synthetic-void-single',['synthetic-a-over-33'],105)]);
 assert.equal(single.unresolved_void,false);
 assert.equal(single.outcomes.find(w=>w.world_id==='synthetic-ground').settlements[0].status,'PUSH');
 assert.equal(single.outcomes.find(w=>w.world_id==='synthetic-ground').net_profit_cents,0);
});
test('snapshot tampering cannot silently change scenarios or weights',()=>{
 const receipt=O.freezeWorlds(fixture());
 const corrupted=deep(receipt);
 corrupted.input.worlds[0].weight=0.55;
 assert.throws(()=>O.readReceipt(corrupted),/WORLD_RECEIPT_INTEGRITY/);
 assert.throws(()=>O.matrix(corrupted,'synthetic-a','synthetic-b'),/WORLD_RECEIPT_INTEGRITY/);
});
test('unjustified weight totals and missing stat assignments fail before analysis',()=>{
 const a=fixture();a.worlds[0].weight=0.3;
 assert.throws(()=>O.freezeWorlds(a),/WORLD_WEIGHT_SUM/);
 const b=fixture();b.worlds[0].stats.pop();
 assert.throws(()=>O.freezeWorlds(b),/WORLD_STAT_MISSING/);
 const c=fixture();c.worlds[0].stats.push(deep(c.worlds[0].stats[0]));
 assert.throws(()=>O.freezeWorlds(c),/WORLD_STAT_DUPLICATE/);
});
test('strict game start chronology, source-era cutoffs, and no contaminated scenarios',()=>{
 const a=fixture();a.events[0].starts_at='2026-10-18T14:00:00Z';
 assert.throws(()=>O.freezeWorlds(a),/WORLD_EVENT_IDENTITY/);
 const b=fixture();b.frozen_at='2026-10-18T18:00:00Z';
 assert.throws(()=>O.freezeWorlds(b),/WORLD_TIME/);
 const c=fixture();c.legs[0].unit='yards';
 assert.throws(()=>O.freezeWorlds(c),/WORLD_LEG_IDENTITY/);
 const d=fixture();d.worlds[0].weight='0.4';
 assert.throws(()=>O.freezeWorlds(d),/WORLD_WEIGHT/);
});
test('synthetic tickets must declare real joint odds, valid cardinality and quote chronology',()=>{
 const receipt=O.freezeWorlds(fixture());
 assert.throws(()=>O.settleTickets(receipt,[{...ticket('synthetic-qp',['synthetic-a','synthetic-b'],250),quoted_at:'2026-10-17T20:00:00Z'}]),/TICKET_CONTRACT/);
 assert.throws(()=>O.settleTickets(receipt,[{...ticket('synthetic-qp',['synthetic-a','synthetic-b'],250),quote_origin:'BOOK_UNKNOWN'}]),/TICKET_CONTRACT/);
 assert.throws(()=>O.settleTickets(receipt,[ticket('synthetic-qp',['synthetic-a','synthetic-b'],99)]),/TICKET_ODDS/);
 assert.throws(()=>O.settleTickets(receipt,[ticket('synthetic-qp',['synthetic-a','synthetic-b'],250,100,'SINGLE')]),/TICKET_CARDINALITY/);
 assert.throws(()=>O.settleTickets(receipt,[ticket('synthetic-qp',['synthetic-a','synthetic-b'],250,100,'CROSS_GAME')]),/TICKET_CROSS_GAME/);
});
test('a correct SGP stays a synthetic settlement preview; unrelated event requires explicit joint worlds',()=>{
 const s=fixture();
 s.events.push({event_id:'synthetic-game-b',starts_at:'2026-10-20T21:00:00Z'});
 s.legs.push({leg_id:'synthetic-other',event_id:'synthetic-game-b',player_id:'synthetic-guard',metric:'assists',unit:'assists',selection:'Synthetic assists 7+',comparator:'AT_LEAST',threshold:7});
 for(const w of s.worlds)w.stats.push({event_id:'synthetic-game-b',player_id:'synthetic-guard',metric:'assists',unit:'assists',value:w.weight===0.4?8:3});
 const receipt=O.freezeWorlds(s);
 assert.throws(()=>O.settleTickets(receipt,[ticket('synthetic-fake-sgp',['synthetic-a','synthetic-other'],300,100,'SGP')]),/TICKET_SGP_EVENT/);
 const preview=O.settleTickets(receipt,[ticket('synthetic-cross',['synthetic-a','synthetic-other'],300,100,'CROSS_GAME')]);
 assert.equal(preview.outcomes.length,4);
 approx(preview.hypothetical_expected_profit_cents,60);
});
