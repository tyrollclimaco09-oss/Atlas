'use strict';
/** ATLAS research-only finite-world correlation diagnostic.
 * An original clean-room implementation of a general probability mixture.
 * Inputs must be independent, timestamped research hypotheses. This module
 * does not estimate, calibrate, price, approve or execute bets.
 */
const own = (o, k) => Object.prototype.hasOwnProperty.call(o,k);
const finite01 = x => Number.isFinite(x) && x >= 0 && x <= 1;
const isId = x => typeof x === 'string' && x.trim().length > 0;
function freezeCheck(input) {
  if (!input || !Array.isArray(input.legs) || !Array.isArray(input.worlds) || !input.legs.length || !input.worlds.length) throw Error('INVALID_WORLD_PACKET');
  const ids = input.legs.map(x=>x?.id);
  if (!ids.every(isId) || new Set(ids).size !== ids.length) throw Error('DUPLICATE_OR_MISSING_LEG_ID');
  if (!input.worlds.every(x=>isId(x?.id) && finite01(x?.weight))) throw Error('INVALID_WORLD_WEIGHT');
  const wnames = input.worlds.map(x=>x.id);
  if (new Set(wnames).size !== wnames.length) throw Error('DUPLICATE_WORLD_ID');
  const total = input.worlds.reduce((s,x)=>s+x.weight,0);
  if(Math.abs(total-1)>1e-9) throw Error('WORLD_WEIGHTS_NOT_ONE');
  for (const world of input.worlds) {
    for (const id of ids) {
      if (!world.conditionalHit || !own(world.conditionalHit,id) || !finite01(world.conditionalHit[id])) throw Error('MISSING_OR_INVALID_CONDITIONAL_HIT');
    }
  }
  // Missing real provenance is permitted for synthetic examples only.
  if (input.type !== 'SYNTHETIC_DEMO') {
    if (!isId(input.forecastId) || !isId(input.modelVersion) || !isId(input.sourceRef) ||
      typeof input.frozenAtUtc !== 'string' || !Number.isFinite(Date.parse(input.frozenAtUtc)) || !input.frozenAtUtc.endsWith('Z')) throw Error('MISSING_POINT_IN_TIME_PROVENANCE');
    if (input.calibrated === true && !isId(input.calibrationEvidenceId)) throw Error('CALIBRATION_EVIDENCE_REQUIRED');
  }
  return true;
}
const product = a => a.reduce((v,x)=>v*x,1);
function evaluateWorlds(input) {
  freezeCheck(input);
  const ids = input.legs.map(x=>x.id);
  const marginal={};
  for(const id of ids) marginal[id]=input.worlds.reduce((s,w)=>s+w.weight*w.conditionalHit[id],0);
  const independentJoint=product(ids.map(id=>marginal[id]));
  // Conditional-independence assumption applies within a world ONLY.
  const mixtureJoint=input.worlds.reduce((s,w)=>s+w.weight*product(ids.map(id=>w.conditionalHit[id])),0);
  const pairs=[];
  for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
    const a=ids[i],b=ids[j],pair=input.worlds.reduce((s,w)=>s+w.weight*w.conditionalHit[a]*w.conditionalHit[b],0);
    const covariance=pair-marginal[a]*marginal[b];
    const denom=Math.sqrt(marginal[a]*(1-marginal[a])*marginal[b]*(1-marginal[b]));
    pairs.push({a,b,joint:pair,independentJoint:marginal[a]*marginal[b],covariance,correlation:denom?covariance/denom:null});
  }
  return {packetType:input.type||'UNVALIDATED_RESEARCH',assumptions:'Conditional independence within each world, NOT guaranteed true',
    modelVersion:input.modelVersion||null,calibrated:input.calibrated===true&&!!input.calibrationEvidenceId,
    marketPriceStatus:'NOT_CHECKED',executable:false,modelProvenProfitable:false,
    marginal,mixtureJoint,independentJoint,difference:mixtureJoint-independentJoint,pairs,
    perWorld:input.worlds.map(w=>({id:w.id,weight:w.weight,conditionalJoint:product(ids.map(id=>w.conditionalHit[id]))}))};
}
function freezeComparison(base,alternative) {
  const a=evaluateWorlds(base),b=evaluateWorlds(alternative);
  const idsA=base.legs.map(x=>x.id).sort().join('|'),idsB=alternative.legs.map(x=>x.id).sort().join('|');
  if(idsA!==idsB)throw Error('MISMATCHED_SELECTION_SET');
  return {baselineJoint:a.mixtureJoint,alternateJoint:b.mixtureJoint,change:b.mixtureJoint-a.mixtureJoint,
    verdict:'SENSITIVITY_ONLY_NOT_CALIBRATED_OR_EXECUTABLE'};
}
module.exports={freezeCheck,evaluateWorlds,freezeComparison};