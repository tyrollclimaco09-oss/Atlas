'use strict';
// ATLAS review-only real module integration. All world player stat rows are
// deliberately SYNTHETIC stress vectors, not 2026-27 forecasts or provider data.
// NO odds, probabilities, wages or live execution authority are introduced.
const test=require('node:test');
const assert=require('node:assert/strict');
const O=require('./outcome-intelligence-shadow.cjs');
const cutoff='2026-10-20T04:45:00Z',frozen='2026-10-20T04:00:00Z';
const cases=[
{game:'bosdet',starts:'2026-10-20T19:00:00Z',
 legs:[['cade','assists',8],['duren','rebounds',10],['white','threes_made',3],['pritchard','assists',5],['duncan','threes_made',2]],
 worlds:[
 ['det-transition',[11,12,2,4,3]],
 ['bos-offensive-glass',[7,8,4,6,1]],
 ['cade-spacing',[12,9,3,3,4]],
 ['slow-foul-grind',[6,5,1,2,1]],
 ['bench-blowout',[5,6,2,7,2]]],
 pairs:[[0,1],[0,4],[1,2],[2,3]]},
{game:'phinyk',starts:'2026-10-20T23:00:00Z',
 legs:[['lebron','assists',8],['maxey','threes_made',3],['brunson','points',25],['towns','rebounds',10],['hart','rebounds',8]],
 worlds:[
 ['lebron-quarterback',[11,5,21,8,7]],
 ['brunson-takeover',[5,2,37,11,10]],
 ['embiid-foul-trouble',[9,3,26,15,11]],
 ['three-point-war',[8,6,32,7,5]],
 ['philly-turnover-collapse',[4,1,18,14,8]]],
 pairs:[[0,1],[2,3],[3,4],[1,2]]},
{game:'okcsas',starts:'2026-10-21T01:30:00Z',
 legs:[['harper','points',10],['vassell','threes_made',2],['sga','assists',8],['chet','rebounds',8],['castle','assists',6]],
 worlds:[
 ['spurs-three-guard-spacing',[18,4,5,6,9]],
 ['sga-facilitator',[7,1,12,10,4]],
 ['wemby-defensive-control',[14,3,9,7,7]],
 ['okc-turnover-pressure',[5,1,6,13,3]],
 ['blowout-foul-swing',[11,2,3,5,3]]],
 pairs:[[0,1],[2,3],[0,4],[1,2]]}
];
const units={points:'points',assists:'assists',rebounds:'rebounds',threes_made:'threes'};
function build(v){
 const event='synthetic-'+v.game;
 const legs=v.legs.map(([player,metric,threshold],i)=>({
  leg_id:'synthetic-'+v.game+'-leg-'+i,event_id:event,player_id:'synthetic-'+player,
  metric,unit:units[metric],selection:'Synthetic '+player+' '+metric+' '+threshold+'+',
  comparator:'AT_LEAST',threshold
 }));
 const worlds=v.worlds.map(([scenario,values],i)=>({
  world_id:'synthetic-'+v.game+'-world-'+i,
  scenario_id:'synthetic-'+scenario,weight:null,
  stats:legs.map((leg,j)=>({event_id:event,player_id:leg.player_id,metric:leg.metric,unit:leg.unit,value:values[j]}))
 }));
 return {schema_version:O.VERSION,synthetic:true,research_only:true,phase:'PHASE1_PRICE_INDEPENDENT',
  study_id:'synthetic-'+v.game+'-case-audit',frozen_at:frozen,forecast_cutoff:cutoff,
  weight_origin:'UNESTIMATED',events:[{event_id:event,starts_at:v.starts}],legs,worlds};
}
for (const v of cases) test('ATLAS shadow world/2x2 real-engine check '+v.game,()=>{
 const receipt=O.freezeWorlds(build(v)),readback=O.readReceipt(receipt);
 assert.equal(readback.worlds.length,5);
 assert.equal(readback.weight_origin,'UNESTIMATED');
 assert.equal(readback.legs.length,5);
 assert.ok(readback.worlds.every(w=>w.weight===null));
 const pairs=[];
 for(const [a,b] of v.pairs){
  const m=O.matrix(receipt,readback.legs.find(l=>l.leg_id.endsWith('-'+a)).leg_id,
   readback.legs.find(l=>l.leg_id.endsWith('-'+b)).leg_id);
  assert.equal(Object.values(m.counts).reduce((x,y)=>x+y,0),5);
  assert.equal(m.hypothetical_joint,null);
  assert.equal(m.hypothetical_independence_product,null);
  assert.equal(m.model_skill,'NOT_ESTABLISHED');
  assert.equal(m.execution_authority,false);
  pairs.push({legs:[v.legs[a][0]+' '+v.legs[a][1]+' '+v.legs[a][2]+'+',v.legs[b][0]+' '+v.legs[b][1]+' '+v.legs[b][2]+'+'],counts:m.counts});
 }
 const legIndices=[0,1,2];
 const combos=readback.worlds.map(w=>{const hit=legIndices.map(k=>w.stats.find(s=>s.player_id===readback.legs.find(l=>l.leg_id.endsWith('-'+k)).player_id&&s.metric===v.legs[k][1]).value>=v.legs[k][2]);return {world:w.scenario_id,truth:hit,all_hit:hit.every(Boolean)};});
 const n=combos.filter(c=>c.all_hit).length;
 console.log('ATLAS_OI_SHADOW_RUN '+JSON.stringify({game:v.game,scenario_worlds:5,pairs,three_leg_sensitivity:{legs:legIndices.map(k=>v.legs[k][0]),worlds_both_or_more:n,world_count:5,not_a_probability:true},weight_origin:'UNESTIMATED',model_skill:'NOT_ESTABLISHED',execution_authority:false}));
});
test('ATLAS non-supported NBA markets remain absent from OI-01 contract',()=>{
 const bad=build(cases[0]);bad.legs[0].metric='steals';bad.legs[0].unit='steals';
 assert.throws(()=>O.freezeWorlds(bad),/WORLD_LEG_IDENTITY/);
 const combo=build(cases[2]);combo.legs[0].metric='pra';combo.legs[0].unit='pra';
 assert.throws(()=>O.freezeWorlds(combo),/WORLD_LEG_IDENTITY/);
 const d=build(cases[1]);d.legs[0].metric='blocks';d.legs[0].unit='blocks';
 assert.throws(()=>O.freezeWorlds(d),/WORLD_LEG_IDENTITY/);
});
