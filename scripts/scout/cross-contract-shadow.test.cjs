'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('./cross-contract-shadow.cjs');
const O=require('./outcome-intelligence-shadow.cjs');
const H=require('./house-mirror-shadow.cjs');
const G=require('./game-sense-workload-shadow.cjs');
const fixtures=require('./game-sense-workload-shadow.fixtures.cjs');
const copy=x=>JSON.parse(JSON.stringify(x));
const EVENT='synthetic-qb-match',PLAYER='synthetic-qb',SIDE_A='Synthetic QB attempts 31+',SIDE_B='Synthetic QB attempts <=30';
function worldResearch(){
 return {schema_version:O.VERSION,synthetic:true,research_only:true,
  phase:'PHASE1_PRICE_INDEPENDENT',study_id:'synthetic-reconcile-test',
  frozen_at:'2026-10-17T21:00:00Z',forecast_cutoff:'2026-10-18T16:00:00Z',
  weight_origin:'UNESTIMATED',events:[{event_id:EVENT,starts_at:'2026-10-19T21:00:00Z'}],
  legs:[
   {leg_id:'synthetic-over',event_id:EVENT,player_id:PLAYER,metric:'pass_attempts',unit:'attempts',
    selection:SIDE_A,comparator:'AT_LEAST',threshold:31},
   {leg_id:'synthetic-under',event_id:EVENT,player_id:PLAYER,metric:'pass_attempts',unit:'attempts',
    selection:SIDE_B,comparator:'AT_MOST',threshold:30}
  ],
  worlds:[
   {world_id:'synthetic-a',scenario_id:'synthetic-shootout',weight:null,
    stats:[{event_id:EVENT,player_id:PLAYER,metric:'pass_attempts',unit:'attempts',value:34}]},
   {world_id:'synthetic-b',scenario_id:'synthetic-ground',weight:null,
    stats:[{event_id:EVENT,player_id:PLAYER,metric:'pass_attempts',unit:'attempts',value:24}]}
  ]};
}
function marketInput(receipt){
 return {schema_version:H.VERSION,synthetic:true,research_only:true,
  phase:'PHASE2_MARKET_DEMONSTRATION',
  study_id:'synthetic-reconcile-test',event_id:EVENT,starts_at:'2026-10-19T21:00:00Z',
  research_frozen_at:'2026-10-17T21:00:00Z',research_receipt_sha256:receipt.sha256,
  as_of:'2026-10-18T17:00:00Z',max_quote_age_minutes:30,
  market:{market_id:'synthetic-qb-market',side_a:SIDE_A,side_b:SIDE_B,
   rules_id:'synthetic-no-push-rules',settlement:'TWO_OUTCOME_NO_PUSH'},
  quotes:[{book_id:'synthetic-book',provider_family:'synthetic-provider',market_id:'synthetic-qb-market',
   side_a:SIDE_A,side_b:SIDE_B,rules_id:'synthetic-no-push-rules',
   american_a:-110,american_b:-110,captured_at:'2026-10-18T16:55:00Z',origin:'SYNTHETIC_DEMO'}]
 };
}
test('market quote must bind the actual frozen world receipt, event, exact selections and exhaustive two-way sides',()=>{
 const receipt=O.freezeWorlds(worldResearch()),market=marketInput(receipt);
 const result=C.bindMirror(receipt,market,'synthetic-over','synthetic-under');
 assert.equal(result.status,'CONTRACT_MATCH_ONLY');
 assert.equal(result.quote_report.accepted_quote_count,1);
 assert.equal(result.world_receipt_sha256,receipt.sha256);
 assert.equal(result.no_push_complement_proven_for_integer_counts,true);
 assert.equal(result.estimated_probability,null);
 assert.equal(result.edge,null);
 assert.equal(result.execution_authority,false);
});
test('previously valid standalone market receipt string can be forged; reconciliation rejects it',()=>{
 const receipt=O.freezeWorlds(worldResearch()),market=marketInput(receipt);
 market.research_receipt_sha256='b'.repeat(64);
 assert.equal(H.mirror(market).accepted_quote_count,1,'Standalone House Mirror cannot prove foreign receipt authenticity');
 assert.throws(()=>C.bindMirror(receipt,market,'synthetic-over','synthetic-under'),/BIND_RESEARCH_DIGEST/);
});
test('mismatched event, freeze, study, market selection and side IDs cannot be joined',()=>{
 const receipt=O.freezeWorlds(worldResearch());
 for(const [field,value,reason] of [
  ['event_id','synthetic-other','BIND_EVENT'],
  ['research_frozen_at','2026-10-17T22:00:00Z','BIND_FREEZE'],
  ['study_id','synthetic-other','BIND_STUDY']
 ]){
  const bad=marketInput(receipt);bad[field]=value;
  assert.throws(()=>C.bindMirror(receipt,bad,'synthetic-over','synthetic-under'),new RegExp(reason));
 }
 const changed=marketInput(receipt);changed.market.side_a='Different quarterback attempts 31+';
 changed.quotes[0].side_a='Different quarterback attempts 31+';
 assert.throws(()=>C.bindMirror(receipt,changed,'synthetic-over','synthetic-under'),/BIND_SELECTION/);
 assert.throws(()=>C.bindMirror(receipt,marketInput(receipt),'synthetic-over','synthetic-over'),/BIND_SELECTION/);
});
test('absence of a push in sample worlds does not prove an OVER/UNDER integer line is no-push',()=>{
 const original=worldResearch();
 original.legs[0].comparator='OVER';original.legs[0].threshold=31;
 original.legs[1].comparator='UNDER';original.legs[1].threshold=31;
 const receipt=O.freezeWorlds(original);
 const market=marketInput(receipt);
 assert.equal(O.matrix(receipt,'synthetic-over','synthetic-under').counts.push_unresolved,0);
 assert.equal(H.mirror(market).accepted_quote_count,1);
 assert.throws(()=>C.bindMirror(receipt,market,'synthetic-over','synthetic-under'),/BIND_NOT_EXHAUSTIVE_NO_PUSH/);
});
test('wrong same-stat thresholds and different player/stat markets fail exhaustive no-push contract',()=>{
 const input=worldResearch();input.legs[1].threshold=29;
 const receipt=O.freezeWorlds(input);
 assert.throws(()=>C.bindMirror(receipt,marketInput(receipt),'synthetic-over','synthetic-under'),/BIND_NOT_EXHAUSTIVE_NO_PUSH/);
 const changed=worldResearch();changed.legs[1].player_id='synthetic-other';
 for(const w of changed.worlds)w.stats.push({event_id:EVENT,player_id:'synthetic-other',metric:'pass_attempts',unit:'attempts',value:20});
 const receipt2=O.freezeWorlds(changed);
 assert.throws(()=>C.bindMirror(receipt2,marketInput(receipt2),'synthetic-over','synthetic-under'),/BIND_NOT_EXHAUSTIVE_NO_PUSH/);
});
function workloadWorld(){
 const gs=fixtures.baseNBA();
 const event=gs.event_id;
 return {schema_version:O.VERSION,synthetic:true,research_only:true,phase:'PHASE1_PRICE_INDEPENDENT',
  study_id:'synthetic-gs-reconcile',frozen_at:'2026-10-14T11:00:00Z',
  forecast_cutoff:'2026-10-14T16:00:00Z',weight_origin:'UNESTIMATED',
  events:[{event_id:event,starts_at:'2026-10-19T21:00:00Z'}],
  legs:[1,2].map(n=>({leg_id:'synthetic-leg-'+n,event_id:event,player_id:'synthetic-player-'+n,
   metric:'minutes',unit:'minutes',selection:'Synthetic player '+n+' minutes 30+',comparator:'AT_LEAST',threshold:30})),
  worlds:[1,2].map(n=>({world_id:'synthetic-world-'+n,scenario_id:gs.scenario_id,
   weight:null,stats:gs.players.map(p=>({event_id:event,player_id:p.player_id,metric:'minutes',unit:'minutes',value:p.minutes_after}))}))
 };
}
test('complete Game Sense roster minutes align with OI world receipts without gaining causal or predictive authority',()=>{
 const gsReceipt=G.freezeScenario(fixtures.baseNBA());
 const worldReceipt=O.freezeWorlds(workloadWorld());
 const r=C.inspectWorkloadAlignment(worldReceipt,gsReceipt);
 assert.equal(r.status,'MATCHED_SYNTHETIC_ALLOCATION');
 assert.equal(r.player_minutes_checked,7);
 assert.equal(r.matched_world_count,2);
 assert.equal(r.scenario_probability,null);
 assert.equal(r.player_team_binding,'NOT_EXTERNALLY_VERIFIED');
 assert.equal(r.execution_authority,false);
});
test('Game Sense mismatch, missing player minutes and unlinked scenario are each denied',()=>{
 const gsReceipt=G.freezeScenario(fixtures.baseNBA());
 const a=workloadWorld();a.worlds[0].stats[0].value=38;
 assert.throws(()=>C.inspectWorkloadAlignment(O.freezeWorlds(a),gsReceipt),/BIND_GS_MINUTES_MISMATCH/);
 const b=workloadWorld();b.worlds[0].stats.pop();
 assert.throws(()=>C.inspectWorkloadAlignment(O.freezeWorlds(b),gsReceipt),/BIND_GS_MISSING_PLAYER_MINUTES/);
 const c=workloadWorld();for(const w of c.worlds)w.scenario_id='synthetic-unrelated-scenario';
 assert.throws(()=>C.inspectWorkloadAlignment(O.freezeWorlds(c),gsReceipt),/BIND_GS_SCENARIO/);
});
test('one aligned Game Sense path never certifies unrelated model worlds or assigns scenario weights',()=>{
 const gsReceipt=G.freezeScenario(fixtures.baseNBA()),data=workloadWorld();
 data.worlds[1].scenario_id='synthetic-new-coaching-script';
 const r=C.inspectWorkloadAlignment(O.freezeWorlds(data),gsReceipt);
 assert.equal(r.status,'PARTIAL_SCENARIO_COVERAGE');
 assert.equal(r.matched_world_count,1);
 assert.equal(r.unexamined_world_count,1);
 assert.equal(r.scenario_probability,null);
});
test('Game Sense receipt must be intact and independently feasible, not just a matching scenario label',()=>{
 const gs=fixtures.baseNBA(),worldReceipt=O.freezeWorlds(workloadWorld());
 const broken=G.freezeScenario(gs);
 const altered=copy(broken);altered.input.players[0].minutes_after=49;
 assert.throws(()=>C.inspectWorkloadAlignment(worldReceipt,altered),/RECEIPT_INTEGRITY/);
 const invalid=fixtures.baseNBA();invalid.players[0].minutes_after=47;
 assert.throws(()=>C.inspectWorkloadAlignment(worldReceipt,G.freezeScenario(invalid)),/BIND_GS_INELIGIBLE/);
});

test('the paired 30.5 OVER/UNDER markets are exhaustive for integer stat totals',()=>{
 const input=worldResearch();
 input.legs[0].comparator='OVER';input.legs[0].threshold=30.5;
 input.legs[1].comparator='UNDER';input.legs[1].threshold=30.5;
 input.legs[0].selection='Synthetic QB attempts OVER 30.5';
 input.legs[1].selection='Synthetic QB attempts UNDER 30.5';
 const receipt=O.freezeWorlds(input),quote=marketInput(receipt);
 quote.market.side_a=input.legs[0].selection;
 quote.market.side_b=input.legs[1].selection;
 quote.quotes[0].side_a=input.legs[0].selection;
 quote.quotes[0].side_b=input.legs[1].selection;
 const joined=C.bindMirror(receipt,quote,'synthetic-over','synthetic-under');
 assert.equal(joined.no_push_complement_proven_for_integer_counts,true);
 assert.equal(joined.quote_report.accepted_quote_count,1);
 assert.equal(joined.execution_authority,false);
});
test('different half-point thresholds do not form an exhaustive market, even with only two sampled worlds',()=>{
 const input=worldResearch();
 input.legs[0].comparator='OVER';input.legs[0].threshold=30.5;
 input.legs[1].comparator='UNDER';input.legs[1].threshold=29.5;
 const receipt=O.freezeWorlds(input),quote=marketInput(receipt);
 assert.throws(()=>C.bindMirror(receipt,quote,'synthetic-over','synthetic-under'),/BIND_NOT_EXHAUSTIVE_NO_PUSH/);
});
