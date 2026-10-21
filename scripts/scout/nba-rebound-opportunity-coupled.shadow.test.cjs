'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {simulateSlate}=require('./nba-100-worlds-hybrid.shadow.cjs');
const {simulateCoupledRebounds}=require('./nba-rebound-opportunity-coupled.shadow.cjs');
const root=path.resolve(__dirname,'../..'),load=n=>JSON.parse(fs.readFileSync(path.join(root,'docs/evidence',n),'utf8'));
const src={
 gamelog:load('luka-2025-26-game-log-reference.json'),
 teams:load('nba-2025-26-team-ratings-reference.json'),
 market:load('nba-20261021-reference-market-snapshot.json')
};
const game=simulateSlate(src,{samples:1200,seed:20261021,focusGame:'CHA-BKN'}).results.find(x=>x.away==='CHA'&&x.home==='BKN');
const input={fullWorlds:game.full_worlds,
 teamHistory:load('nba-2025-26-bkn-cha-shot-rebound-reference.json'),
 playerLog:load('nba-2025-26-dayron-sharpe-gamelog.json')};
const run=(scenario='MIXED',options={})=>simulateCoupledRebounds(input,{scenario,seed:20261021,...options});
test('full game world exports require an explicit valid game',()=>{
 assert.equal(input.fullWorlds.length,1200);
 assert.throws(()=>simulateSlate(src,{samples:1200,focusGame:'CHA-NYK'}),/FOCUS_GAME_INVALID/);
 const no=simulateSlate(src,{samples:1200,seed:20261021});
 assert.ok(no.results.every(g=>!Object.hasOwn(g,'full_worlds')));
});
test('team scores conserve points and FG decomposition in all inspected worlds',()=>{
 const a=run();
 assert.equal(a.total_worlds,1200);
 assert.equal(a.readable_worlds,100);
 for(const w of a.worlds100){
  assert.equal(w.bkn.score+w.cha.score,w.total);
  assert.equal(w.bkn.score+w.cha.score-w.total,0);
  assert.equal(w.bkn.fgm*2+w.bkn.three_made+w.bkn.ftm,w.bkn.score);
  assert.ok(w.bkn.fgm<=w.bkn.fga);
  assert.ok(w.cha.fgm<=w.cha.fga);
  assert.ok(w.sharpe.points>=0 && w.sharpe.points<=w.bkn.score);
  assert.equal(w.sharpe.points+w.teammates.points,w.bkn.score);
  assert.equal(w.sharpe.minutes+w.teammates.minutes,w.overtime?265:240);
  assert.equal(w.sharpe.reb+w.teammates.rebounds,w.bkn.total_reb);
  assert.ok(w.sharpe.orb<=w.bkn.orb);
  assert.ok(w.sharpe.drb<=w.bkn.drb);
  assert.equal(w.sharpe.assists+w.teammates.assists,w.bkn.assists);
  assert.ok(w.bkn.assists<=w.bkn.fgm);
  assert.equal(w.sharpe.points,w.sharpe.points);
  assert.equal(w.bkn.total_reb,w.bkn.orb+w.bkn.drb);
  assert.equal(w.cha.total_reb,w.cha.orb+w.cha.drb);
  assert.equal(w.rebound_pool.bkn_missed,w.rebound_pool.dead_bkn+w.bkn.orb+w.cha.drb);
  assert.equal(w.rebound_pool.cha_missed,w.rebound_pool.dead_cha+w.cha.orb+w.bkn.drb);
 }
});
test('prior-season ORB/DRB player and team evidence identifies physically possible shares',()=>{
 const p=run().inputs;
 assert.ok(p.priorOnCourtDRB>0 && p.priorOnCourtDRB<1);
 assert.ok(p.priorOnCourtORB>0 && p.priorOnCourtORB<1);
 assert.equal(input.teamHistory.player.orb+input.teamHistory.player.drb,413);
});
test('one hundred worlds approximately reflect all 1200 results',()=>{
 const a=run();
 const hundred=a.worlds100.filter(w=>w.sharpe.reb>=9).length/100;
 assert.ok(Math.abs(a.result.reb_over8_5-hundred)<.10);
 assert.equal(Object.values(a.result.fourTruth).reduce((s,n)=>s+n,0),1200);
 assert.equal(Object.values(a.result.by_script).reduce((s,r)=>s+r.n,0),1200);
});
test('more starter minutes improve chances but are not authority',()=>{
 const low=run('RESTRICTED'),high=run('STARTER');
 assert.ok(high.result.reb_over8_5>low.result.reb_over8_5+.13);
 assert.equal(high.provenance.bet_qualified,false);
 assert.equal(high.provenance.authority,false);
 assert.equal(low.provenance.forecast_calibration,'NOT_PROVEN');
});
test('shared rebound competition reduces opportunities despite equivalent minutes',()=>{
 const a=run('STARTER'),b=run('COMPETITION');
 assert.ok(a.result.reb_over8_5>b.result.reb_over8_5+.05);
 assert.equal(a.result.means.minutes,b.result.means.minutes);
});
test('repeated run with same seed and role assumptions is reproducible',()=>{
 assert.deepEqual(run(),run());
});
test('invalid model inputs and role scenarios fail closed',()=>{
 const x=structuredClone(input);x.teamHistory.player.drb=999;
 assert.throws(()=>simulateCoupledRebounds(x),/PLAYER_TOTALS_UNVERIFIED/);
 const y=structuredClone(input);y.fullWorlds[0].score_home=900;
 assert.throws(()=>simulateCoupledRebounds(y),/GAME_WORLD_INVALID/);
 assert.throws(()=>run('MADE_UP'),/SCENARIO_UNSUPPORTED/);
 assert.throws(()=>run('MIXED',{override:{weights:[.5,.5,.5]}}),/SCENARIO_INVALID/);
});
