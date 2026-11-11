'use strict';
const {sensitivity}=require('./market-intelligence.cjs');
function probabilityStress(probability,americanOdds){
 const center=sensitivity({probability,lowerProbability:probability,upperProbability:probability,americanOdds});
 if(!center)throw Error('REFERENCE_STRESS_INPUT_INVALID');
 const checks=[.01,.03,.06].map(delta=>{
  const r=sensitivity({probability,lowerProbability:Math.max(0,probability-delta),upperProbability:Math.min(1,probability+delta),americanOdds});
  if(!r)throw Error('REFERENCE_STRESS_INPUT_INVALID');
  return {assumed_error_pp:delta*100,ev_lower:r.evLower,ev_upper:r.evUpper,positive_under_downward_error:r.evLower>0};
 });
 return {kind:'ASSUMPTION_SENSITIVITY_NOT_CONFIDENCE_INTERVAL',break_even_probability:center.breakEven,
  probability_buffer_pp:100*(probability-center.breakEven),checks,calibrated:false};
}
function groupedExposure(candidates){
 const groups=new Map(),seen=new Set();
 for(const c of candidates){
  if(!c||typeof c.event_id!=='string'||!c.event_id||typeof c.decision_id!=='string'||!c.decision_id)throw Error('EXPOSURE_IDENTITY_REQUIRED');
  if(seen.has(c.decision_id))continue;seen.add(c.decision_id);
  if(!groups.has(c.event_id))groups.set(c.event_id,[]);groups.get(c.event_id).push(c);
 }
 return {kind:'CANDIDATE_COUNTS_NOT_FUNDED_POSITIONS',candidate_count:seen.size,
  event_groups:[...groups].map(([event_id,rows])=>({event_id,candidate_count:rows.length,decision_ids:rows.map(x=>x.decision_id),
   participants:[...new Set(rows.map(x=>x.participant_id))],joint_probability:null,cash_exposure:null})),
  cross_event_dependence:'UNMEASURED',portfolio_variance:null,stake_sizing_supported:false};
}
module.exports={probabilityStress,groupedExposure};
