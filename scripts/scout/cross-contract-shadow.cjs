'use strict';

// R-01: Cross-contract consistency only. Never generates probabilities, prices,
// recommendations, bets, ledger entries, or production authority.
const O=require('./outcome-intelligence-shadow.cjs');
const H=require('./house-mirror-shadow.cjs');
const G=require('./game-sense-workload-shadow.cjs');
const {hashJSON}=require('./source-contract-shadow.cjs');
const VERSION='atlas.cross-contract.shadow.v1';
const check=(condition,code)=>{if(!condition)throw Error(code);};
const immutable=value=>{if(value&&typeof value==='object'){Object.values(value).forEach(immutable);Object.freeze(value);}return value;};

// The no-push two-way market must cover EVERY nonnegative integer outcome,
// not merely avoid pushes in the four sampled hypothetical worlds.
function complements(a,b){
 const same=a.event_id===b.event_id&&a.player_id===b.player_id&&
   a.metric===b.metric&&a.unit===b.unit;
 if(!same)return false;
 // With integer-settled stats, OVER 30.5 is equivalent to AT_LEAST 31;
 // UNDER 30.5 is equivalent to AT_MOST 30. Whole-number OVER/UNDER
 // can PUSH at equality and are never certified no-push here.
 const lowerWinBound=leg=>leg.comparator==='AT_LEAST'&&Number.isSafeInteger(leg.threshold)
   ?leg.threshold:leg.comparator==='OVER'&&leg.threshold%1===0.5
   ?Math.ceil(leg.threshold):null;
 const upperWinBound=leg=>leg.comparator==='AT_MOST'&&Number.isSafeInteger(leg.threshold)
   ?leg.threshold:leg.comparator==='UNDER'&&leg.threshold%1===0.5
   ?Math.floor(leg.threshold):null;
 const pairs=[[lowerWinBound(a),upperWinBound(b)],
   [lowerWinBound(b),upperWinBound(a)]];
 return pairs.some(([minHigh,maxLow])=>minHigh!==null&&maxLow!==null&&
   minHigh>=1&&maxLow===minHigh-1);
}
function bindMirror(worldReceipt,marketInput,sideAId,sideBId){
 const world=O.readReceipt(worldReceipt);
 // Rehash the market input before dereferencing fields; mirror handles its own
 // exact schema, provider-group, time, quote and no-push assertions.
 hashJSON(marketInput);
 const report=H.mirror(marketInput);
 check(marketInput.research_receipt_sha256===worldReceipt.sha256,'BIND_RESEARCH_DIGEST');
 check(marketInput.study_id===world.study_id,'BIND_STUDY');
 check(marketInput.research_frozen_at===world.frozen_at,'BIND_FREEZE');
 const event=world.events.find(e=>e.event_id===marketInput.event_id);
 check(event&&event.starts_at===marketInput.starts_at,'BIND_EVENT');
 const a=world.legs.find(l=>l.leg_id===sideAId),b=world.legs.find(l=>l.leg_id===sideBId);
 check(a&&b&&a.leg_id!==b.leg_id,'BIND_SELECTION');
 check(a.event_id===event.event_id&&b.event_id===event.event_id&&
   marketInput.market.side_a===a.selection&&marketInput.market.side_b===b.selection,
   'BIND_SELECTION');
 check(complements(a,b),'BIND_NOT_EXHAUSTIVE_NO_PUSH');
 // A valid synthetic quotation pairing does NOT prove venue rules or fair values.
 return immutable({
   schema_version:VERSION,synthetic:true,research_only:true,
   status:'CONTRACT_MATCH_ONLY',world_receipt_sha256:worldReceipt.sha256,
   linked_legs:[sideAId,sideBId],event_id:event.event_id,
   no_push_complement_proven_for_integer_counts:true,
   quote_report:report,real_quote_provenance:'UNVERIFIED',
   forecast_independence:'NOT_ESTABLISHED',
   estimated_probability:null,edge:null,bet_approval:null,
   execution_authority:false,human_final_gate_required:true
 });
}

// Align declared NBA/WNBA minute allocations with hypothetical OI world rows.
// A GS receipt does not establish points/assists/rebounds distributions, pace
// distributions, game-path weights, or roster/team authority outside this fixture.
function inspectWorkloadAlignment(worldReceipt,gameSenseReceipt){
 const world=O.readReceipt(worldReceipt);
 const report=G.inspectScenario(gameSenseReceipt);
 check(report.eligible===true,'BIND_GS_INELIGIBLE');
 const gs=gameSenseReceipt.input;
 check(gs.synthetic===true&&gs.research_only===true,'BIND_GS_SCOPE');
 check(Date.parse(gs.frozen_at)<=Date.parse(world.frozen_at)&&
   Date.parse(gs.forecast_cutoff)<Date.parse(world.events.find(e=>e.event_id===gs.event_id)?.starts_at||''),
   'BIND_GS_CHRONOLOGY');
 check(world.events.some(e=>e.event_id===gs.event_id),'BIND_GS_EVENT');
 const matches=world.worlds.filter(w=>w.scenario_id===gs.scenario_id);
 check(matches.length>0,'BIND_GS_SCENARIO');
 const expected=new Map(gs.players.map(p=>[p.player_id,p.minutes_after]));
 for(const w of matches){
   const actual=new Map();
   for(const stat of w.stats)if(stat.event_id===gs.event_id&&stat.metric==='minutes'&&
     stat.unit==='minutes'&&expected.has(stat.player_id)){
     check(!actual.has(stat.player_id),'BIND_GS_DUPLICATE');
     actual.set(stat.player_id,stat.value);
   }
   check(actual.size===expected.size,'BIND_GS_MISSING_PLAYER_MINUTES');
   for(const [player_id,minutes] of expected)
     check(actual.get(player_id)===minutes,'BIND_GS_MINUTES_MISMATCH');
   const total=[...actual.values()].reduce((sum,n)=>sum+n,0);
   check(total===report.budget.team_minutes_after,'BIND_GS_TEAM_MINUTES');
 }
 return immutable({
   schema_version:VERSION,synthetic:true,research_only:true,
   status:matches.length===world.worlds.length?'MATCHED_SYNTHETIC_ALLOCATION':'PARTIAL_SCENARIO_COVERAGE',
   matched_world_count:matches.length,unexamined_world_count:world.worlds.length-matches.length,
   event_id:gs.event_id,scenario_id:gs.scenario_id,team_id:gs.team_id,
   world_receipt_sha256:worldReceipt.sha256,
   game_sense_receipt_sha256:gameSenseReceipt.sha256,
   player_minutes_checked:expected.size,
   possible_gamesense_coverage:'MINUTES_ONLY',
   player_team_binding:'NOT_EXTERNALLY_VERIFIED',
   scenario_probability:null,real_outcome_validation:false,
   execution_authority:false,human_final_gate_required:true
 });
}
module.exports=Object.freeze({VERSION,bindMirror,inspectWorkloadAlignment});
