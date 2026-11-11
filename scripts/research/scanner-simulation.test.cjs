'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {rng,oddsFromImplied,quantile,summarizePaths,evaluateScenario,runFaultSweep}=require('./scanner-simulation.cjs');
test('synthetic generator is reproducible and conversions have independent worked values',()=>{
 const a=rng(123),b=rng(123);assert.deepEqual(Array.from({length:20},a),Array.from({length:20},b));
 assert.equal(oddsFromImplied(.5),-100);assert.equal(oddsFromImplied(.4),150);assert.equal(oddsFromImplied(.6),-150);
 assert.throws(()=>oddsFromImplied(1));assert.equal(quantile([0,10,20],.5),10);
});
test('path settlement shares one event outcome across opposite selections and measures net profit',()=>{
 const truth=[{eventId:'e',trueA:1}],selected=[{event_id:'e',participant_id:'TEAM:A',offered_american_odds:100}];
 const win=summarizePaths(selected,truth,{worlds:10});assert.equal(win.roi_median,1);assert.equal(win.losing_path_fraction,0);
 truth[0].trueA=0;const lose=summarizePaths(selected,truth,{worlds:10});assert.equal(lose.roi_median,-1);assert.equal(lose.drawdown_units_median,1);
 selected.push({event_id:'e',participant_id:'TEAM:B',offered_american_odds:100});
 assert.equal(summarizePaths(selected,truth,{worlds:10}).roi_median,0);
});
test('no selections produces no invented ROI or return',()=>{
 const r=summarizePaths([],[{eventId:'e',trueA:.5}],{worlds:5});
 assert.equal(r.roi_median,null);assert.equal(r.losing_path_fraction,null);assert.equal(r.drawdown_units_median,0);
});
test('shared reference error is visible to the synthetic oracle rather than silently treated as truth',()=>{
 const good=evaluateScenario({id:'good',sharedBias:0,outlierBias:0},{events:100,worlds:20});
 const bad=evaluateScenario({id:'biased',sharedBias:.06,outlierBias:0},{events:100,worlds:20});
 assert(good.oracle_expected_roi>0);assert(bad.nonpositive_oracle_ev_count>0);
 assert(bad.mean_estimated_ev>bad.oracle_expected_roi);
 assert(bad.oracle_expected_brier>good.oracle_expected_brier);
 assert.equal(bad.empirical_performance_eligible,false);
});
test('a shared biased reference can manufacture signals when all offered edges are negative',()=>{
 const options={events:100,worlds:20};
 const none=evaluateScenario({id:'none',sharedBias:0,targetEdge:-.02},options);
 const falseEdges=evaluateScenario({id:'false_edges',sharedBias:.06,targetEdge:-.02},options);
 assert.equal(none.signals,0);assert.equal(none.oracle_expected_roi,null);
 assert(falseEdges.signals>0);assert.equal(falseEdges.nonpositive_oracle_ev_fraction,1);
 assert(falseEdges.mean_estimated_ev>0);assert(falseEdges.oracle_expected_roi<0);
});
test('fault sweep covers invalid data and order invariants through the real scanner',()=>{
 const r=runFaultSweep(3);assert.equal(r.checks,45);assert.equal(r.failures,0);
});
test('scenario replay is deterministic apart from measured runtime and invalid sizes are refused',()=>{
 const spec={id:'replay',sharedBias:0,outlierBias:0};
 const a=evaluateScenario(spec,{events:30,worlds:20}),b=evaluateScenario(spec,{events:30,worlds:20});
 delete a.scan_ms;delete b.scan_ms;assert.deepEqual(a,b);
 assert.throws(()=>evaluateScenario(spec,{events:0}));assert.throws(()=>runFaultSweep(-1));
});
