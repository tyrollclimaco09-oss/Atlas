'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {simulatePlayerProps}=require('./nba-causal-props.shadow.cjs');
const root=path.resolve(__dirname,'../..');
const slugs=['dayron-sharpe','bam-adebayo','jalen-johnson','scottie-barnes'];
const load=()=>({logs:Object.fromEntries(slugs.map(s=>[s,JSON.parse(fs.readFileSync(path.join(root,'docs/evidence/nba-2025-26-'+s+'-gamelog.json'),'utf8'))]))});
const input=load();
const run=(overrides,n=1200)=>simulatePlayerProps(input,{n,seed:20261021,overrides});
test('four real regular-season logs have exact independent reconciled totals',()=>{
 assert.deepEqual(slugs.map(s=>input.logs[s].games.length),[62,73,72,80]);
 assert.deepEqual(slugs.map(s=>input.logs[s].games.reduce((a,x)=>a+x.rebounds,0)),[413,732,740,600]);
 assert.deepEqual(slugs.map(s=>input.logs[s].games.reduce((a,x)=>a+x.assists,0)),[145,232,566,474]);
});
test('no forecast can become verified executable price from third-party quote',()=>{
 for(const r of run().reports){
 assert.equal(r.reference_price_verified_executable,false);
 assert.equal(r.verdict,'RESEARCH_ONLY_NO_VALIDATED_EDGE');
 assert.equal(r.bet_authority,false);
 assert.equal(r.calibrated_probability,false);
 assert.ok(r.model.frequency>=0&&r.model.frequency<=1);
 assert.equal(r.worlds100.sampled_count,100);
 assert.ok(Math.abs(r.worlds100.hits/100-r.model.frequency)<.13);
 }
});
test('all candidate market identities, thresholds, and prices remain explicit',()=>{
 const rs=run().reports;
 assert.deepEqual(rs.map(r=>r.metric),['rebounds','rebounds','pra','assists']);
 assert.deepEqual(rs.map(r=>r.reference_american_odds),[113,-156,-108,-139]);
 assert.equal(rs[0].historical.hits,14);
 assert.equal(rs[2].historical.hits,43);
 assert.equal(rs[3].historical.hits,40);
});
test('2x2 joint table conserves all cases without marginal multiplication',()=>{
 const row=run().reports.find(r=>r.player==='dayron-sharpe');
 assert.equal(Object.values(row.model.joint_truth).reduce((a,b)=>a+b,0),1200);
 assert.equal(row.model.joint_truth.BOTH+row.model.joint_truth.REB_ONLY,Math.round(row.model.frequency*1200));
});
test('sampler is deterministic for fixed seed and data',()=>assert.deepEqual(run(),run()));
test('starter minutes sensitivity raises rebound opportunities relative to conservative',()=>{
 const conservative=run({'dayron-sharpe':{minutes:[20,24,28],minuteWeights:[.25,.55,.2],roleMultiplier:.88}},2000);
 const starter=run({'dayron-sharpe':{minutes:[27,30,33],minuteWeights:[.2,.55,.25],roleMultiplier:.95}},2000);
 assert.ok(starter.reports[0].model.frequency>conservative.reports[0].model.frequency+.12);
 assert.equal(starter.reports[0].bet_authority,false);
});
test('rebound share factor matters even with identical 30-minute rotations',()=>{
 const lo=run({'dayron-sharpe':{minutes:[27,30,33],minuteWeights:[.2,.55,.25],roleMultiplier:.84}},2000);
 const hi=run({'dayron-sharpe':{minutes:[27,30,33],minuteWeights:[.2,.55,.25],roleMultiplier:1.05}},2000);
 assert.ok(hi.reports[0].model.frequency>lo.reports[0].model.frequency+.08);
});
test('reject altered historical point-in-time data',()=>{
 const bad=load();bad.logs['dayron-sharpe'].games[0].rebounds+=1;
 assert.throws(()=>simulatePlayerProps(bad,{n:1000}),/HISTORICAL_TOTAL_dayron-sharpe_rebounds/);
});
test('reject impossible weights or roles',()=>{
 assert.throws(()=>run({'dayron-sharpe':{minuteWeights:[.5,.5,.5]}}),/MINUTES_MIX_INVALID/);
 assert.throws(()=>run({'dayron-sharpe':{roleMultiplier:3}}),/SCENARIO_INPUT_INVALID/);
});
test('reject simulation volume or invalid game data',()=>{
 assert.throws(()=>simulatePlayerProps(input,{n:20}),/SIMULATION_SCOPE/);
 const bad=load();bad.logs['scottie-barnes'].games[0].minutes=-1;
 assert.throws(()=>simulatePlayerProps(bad,{n:1000}),/INVALID_GAME_LOG/);
});
