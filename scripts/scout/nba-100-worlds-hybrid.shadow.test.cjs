'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const {simulateSlate}=require('./nba-100-worlds-hybrid.shadow.cjs');
const root=join(__dirname,'../..');
const open=name=>JSON.parse(readFileSync(join(root,'docs/evidence',name),'utf8'));
const input={
  gamelog:open('luka-2025-26-game-log-reference.json'),
  teams:open('nba-2025-26-team-ratings-reference.json'),
  market:open('nba-20261021-reference-market-snapshot.json')
};
const run=()=>simulateSlate(input,{samples:1200,seed:20261021});
test('input coverage is 64 verified player games, 30 teams and 11 pregame markets',()=>{
 assert.equal(input.gamelog.games.length,64);
 assert.equal(input.market.games.length,11);
 assert.equal(Object.keys(input.teams.teams).length,30);
 assert.equal(input.gamelog.games.filter(g=>g.points+g.rebounds+g.assists>=50).length,35);
 assert.equal(input.gamelog.games.filter(g=>g.threes_made>=4).length,36);
 const starts=input.market.games.map(g=>Date.parse(g.time_utc));
 assert.ok(starts.every(t=>t>Date.parse(input.market.observed_as_of)));
});
test('every game has exactly 100 readable full-game worlds and 1200 simulated paths',()=>{
 const r=run();
 assert.equal(r.games,11);
 assert.equal(r.worlds_representative,1100);
 for(const g of r.results){
  assert.equal(g.simulated.n,1200);
  assert.equal(g.worlds100.count,100);
  assert.equal(g.worlds100.worlds.length,100);
  assert.equal(Object.values(g.worlds100.script_counts).reduce((a,b)=>a+b,0),100);
  assert.ok(g.simulated.total.p10<=g.simulated.total.p50);
  assert.ok(g.simulated.total.p50<=g.simulated.total.p90);
  assert.equal(g.reliability.bet_status,'RESEARCH_ONLY');
  assert.equal(g.reliability.forecast_edge,'NOT_ESTABLISHED');
  assert.equal(g.reliability.prices_executable,false);
 }
});
test('world settlements conserve scoreboard and never retain a tied final',()=>{
 const r=run();
 for(const g of r.results)for(const w of g.worlds100.worlds){
  assert.equal(w.score_home+w.score_away,w.total);
  assert.equal(w.score_home-w.score_away,w.home_margin);
  assert.notEqual(w.score_home,w.score_away);
  assert.ok(w.half_home<w.score_home && w.half_away<w.score_away);
  assert.ok(w.half_home>0 && w.half_away>0);
 }
});
test('Luka joined stats are sampled as one game vector and remain physically bounded',()=>{
 const game=run().results.find(g=>g.home==='LAL' && g.away==='GSW');
 assert.equal(game.luka.historical_games,64);
 assert.equal(game.luka.historical_pra50_hits,35);
 assert.equal(game.luka.historical_threes4_hits,36);
 const sums=Object.values(game.luka.by_role).reduce((a,b)=>a+b.n,0);
 assert.equal(sums,1200);
 for(const w of game.worlds100.worlds){
   const l=w.luka;
   assert.ok(l);
   assert.equal(l.pra,l.points+l.rebounds+l.assists);
   assert.ok(l.minutes>=0 && l.minutes<=48);
   assert.ok(l.threes_made<=l.threes_attempted && l.threes_made>=0);
   assert.ok(l.points<=w.score_home);
   assert.ok(l.rebounds<=28 && l.assists<=25);
 }
});
test('seeded runs reproduce identical market and game script distributions',()=>{
 const x=run(),y=run();
 assert.deepEqual(x,y);
});
test('new seed generates different Monte Carlo realization without authority escalation',()=>{
 const a=run(),b=simulateSlate(input,{samples:1200,seed:20261022});
 assert.notDeepEqual(a.results[0].simulated,b.results[0].simulated);
 assert.equal(b.status,'SHADOW_ONLY');
});
test('reject missing game and incomplete team inputs',()=>{
 const bad=structuredClone(input);
 bad.market.games.pop();
 assert.throws(()=>simulateSlate(bad,{samples:1200}),/DATA_COVERAGE_INCOMPLETE/);
 const bad2=structuredClone(input);
 delete bad2.teams.teams.MIL;
 assert.throws(()=>simulateSlate(bad2,{samples:1200}),/DATA_COVERAGE_INCOMPLETE/);
});
test('reject tampered historical data',()=>{
 const bad=structuredClone(input);
 bad.gamelog.games[0].points=1;
 assert.throws(()=>simulateSlate(bad,{samples:1200}),/GAMELOG_AGGREGATE_MISMATCH/);
});
test('reject unverifiable current-market provenance and already-started market',()=>{
 const bad=structuredClone(input);bad.market.market_observation_truth='EXECUTABLE';
 assert.throws(()=>simulateSlate(bad,{samples:1200}),/MARKET_PROVENANCE_INVALID/);
 const late=structuredClone(input);late.market.observed_as_of='2026-10-22T03:00:00Z';
 assert.throws(()=>simulateSlate(late,{samples:1200}),/MARKET_IDENTITY_INVALID/);
});
test('reject fake certainty from unsupported simulation volume',()=>{
 assert.throws(()=>simulateSlate(input,{samples:99}),/INVALID_SIMULATION_SCOPE/);
 assert.throws(()=>simulateSlate(input,{samples:1000000}),/INVALID_SIMULATION_SCOPE/);
});

test('2x2 joint prop outcomes partition the simulated games exactly',()=>{
 const game=run().results.find(g=>g.home==='LAL' && g.away==='GSW');
 const counts=game.luka.joint_truth_counts;
 assert.deepEqual(Object.keys(counts).sort(),['both','neither','pra_only','threes_only']);
 assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),1200);
 const a=counts.both+counts.pra_only;
 assert.ok(Math.abs(a/1200-game.luka.simulated_pra50_frequency)<0.00006);
 const b=counts.both+counts.threes_only;
 assert.ok(Math.abs(b/1200-game.luka.simulated_threes4_frequency)<0.00006);
 assert.equal(Object.values(game.luka.by_script).reduce((a,b)=>a+b.n,0),1200);
});
test('scenario assumptions change forecast but never create betting authority',()=>{
 const moreConstrained=simulateSlate(input,{samples:1200,seed:20261021,
  roleWeights:{CONSTRAINED:.50,BASE:.40,EXPANDED:.10}});
 const moreExpanded=simulateSlate(input,{samples:1200,seed:20261021,
  roleWeights:{CONSTRAINED:.10,BASE:.35,EXPANDED:.55}});
 const a=moreConstrained.results.find(g=>g.luka).luka.simulated_pra50_frequency;
 const b=moreExpanded.results.find(g=>g.luka).luka.simulated_pra50_frequency;
 assert.ok(a<b);
 assert.equal(moreExpanded.status,'SHADOW_ONLY');
 assert.ok(moreExpanded.results.every(g=>g.reliability.bet_status==='RESEARCH_ONLY'));
});
test('market-prior blend sensitivity is not a disguised fair-price guarantee',()=>{
 const historical=simulateSlate(input,{samples:1200,marketWeight:0,seed:20261021});
 const marketOnly=simulateSlate(input,{samples:1200,marketWeight:1,seed:20261021});
 const m=historical.results.find(g=>g.home==='LAL');
 const n=marketOnly.results.find(g=>g.home==='LAL');
 assert.notEqual(m.modeled_center.total,n.modeled_center.total);
 assert.equal(m.reliability.prices_executable,false);
 assert.equal(n.reliability.forecast_edge,'NOT_ESTABLISHED');
});
test('bad scenario weights are rejected, not silently normalized',()=>{
 assert.throws(()=>simulateSlate(input,{samples:1200,marketWeight:1.1}),/MARKET_WEIGHT_INVALID/);
 assert.throws(()=>simulateSlate(input,{samples:1200,
  roleWeights:{CONSTRAINED:.7,BASE:.6,EXPANDED:.2}}),/ROLE_WEIGHTS_INVALID/);
});

test('the 100 displayed worlds track Luka proposition frequencies, not just game totals',()=>{
 const r=simulateSlate(input,{samples:12000,seed:20261021});
 const g=r.results.find(x=>x.luka);
 const one=g.worlds100.worlds;
 const pra=one.filter(w=>w.luka.pra>=50).length/100;
 const threes=one.filter(w=>w.luka.threes_made>=4).length/100;
 assert.ok(Math.abs(pra-g.luka.simulated_pra50_frequency)<.04);
 assert.ok(Math.abs(threes-g.luka.simulated_threes4_frequency)<.04);
 assert.equal(g.luka.joint_truth_counts.both+g.luka.joint_truth_counts.pra_only+
   g.luka.joint_truth_counts.threes_only+g.luka.joint_truth_counts.neither,12000);
});
