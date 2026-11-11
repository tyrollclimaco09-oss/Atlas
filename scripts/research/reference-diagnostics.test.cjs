'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {probabilityStress,groupedExposure}=require('./reference-diagnostics.cjs');
test('probability stress uses declared perturbations and independently checkable returns',()=>{
 const r=probabilityStress(.52,105);assert.equal(r.calibrated,false);
 assert(Math.abs(r.checks[1].ev_lower-(.49*2.05-1))<1e-12);
 assert.equal(r.checks[1].positive_under_downward_error,true);assert.equal(r.checks[2].positive_under_downward_error,false);
 assert(Math.abs(r.break_even_probability-1/2.05)<1e-12);
});
test('invalid probabilities and prices cannot produce stress estimates',()=>{
 for(const p of [NaN,-.1,1.1,true])assert.throws(()=>probabilityStress(p,105));
 assert.throws(()=>probabilityStress(.5,0));
});
test('stress bounds remain probabilities at both endpoints',()=>{
 assert.equal(probabilityStress(0,100).checks[2].ev_lower,-1);
 assert.equal(probabilityStress(1,100).checks[2].ev_upper,1);
});
test('same-event selections group together without invented cash or independence',()=>{
 const r=groupedExposure([{event_id:'a',decision_id:'1',participant_id:'x'},{event_id:'a',decision_id:'2',participant_id:'y'},{event_id:'b',decision_id:'3',participant_id:'z'}]);
 assert.equal(r.event_groups.length,2);assert.equal(r.event_groups[0].candidate_count,2);
 assert.equal(r.event_groups[0].cash_exposure,null);assert.equal(r.portfolio_variance,null);
});
test('repeated decision does not double-count exposure',()=>{
 const c={event_id:'a',decision_id:'1',participant_id:'x'};assert.equal(groupedExposure([c,c]).candidate_count,1);
});
test('missing event identity cannot be silently grouped',()=>assert.throws(()=>groupedExposure([{decision_id:'x'}])));
