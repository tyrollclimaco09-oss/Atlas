'use strict';
// ATLAS original research-only integrity diagnostics; zero sportsbook operations.
// No forecasts, trading authority, inferred true probabilities or production writes.
function isUtc(x){return typeof x==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(x) && !Number.isNaN(Date.parse(x));}
function earlier(a,b){return isUtc(a)&&isUtc(b)&&Date.parse(a)<Date.parse(b);}
function atMost(a,b){return isUtc(a)&&isUtc(b)&&Date.parse(a)<=Date.parse(b);}
function americanDecimal(odds){if(!Number.isFinite(odds)||odds===0||Math.abs(odds)<100) return null;return odds>0?1+odds/100:1+100/(-odds);}

/** Model selection must happen before the held-out test period. Strict/point-in-time checks. */
function auditTemporalFreeze(exp){
 const reasons=[];
 if(!exp||!exp.id||!exp.modelVersion||!exp.eventId||!exp.marketFingerprint) reasons.push('MISSING_CANONICAL_EXPERIMENT_IDENTITY');
 const times=['trainThroughUtc','featuresObservedThroughUtc','forecastFrozenUtc','testStartUtc','outcomeObservedUtc'];
 if(times.some(k=>!isUtc(exp?.[k]))) reasons.push('INCOMPLETE_TIMESTAMP_EVIDENCE');
 else {
  if(!earlier(exp.trainThroughUtc,exp.testStartUtc)) reasons.push('TRAIN_OVERLAPS_TEST_PERIOD');
  if(!atMost(exp.featuresObservedThroughUtc,exp.forecastFrozenUtc)) reasons.push('FUTURE_FEATURE_LEAKAGE');
  if(!earlier(exp.forecastFrozenUtc,exp.testStartUtc)) reasons.push('FORECAST_NOT_PRE_EVENT');
  if(!earlier(exp.testStartUtc,exp.outcomeObservedUtc)) reasons.push('OUTCOME_NOT_AFTER_EVENT');
  if(exp.lastTunedUtc && !atMost(exp.lastTunedUtc,exp.forecastFrozenUtc)) reasons.push('MODEL_TUNED_AFTER_FREEZE');
 }
 if(exp?.marketObservedUtc != null && !isUtc(exp.marketObservedUtc)) reasons.push('INVALID_MARKET_OBSERVED_TIMESTAMP');
 if(isUtc(exp?.marketObservedUtc) && isUtc(exp?.forecastFrozenUtc) && !earlier(exp.forecastFrozenUtc,exp.marketObservedUtc)) reasons.push('MARKET_PRECEDED_INDEPENDENT_FREEZE');
 return {state:reasons.length?'HOLD':'TEMPORAL_CHECKS_PASSED_ONLY',reasons,productionApproved:false};
}

/** Benjamini-Hochberg *diagnostic* for a declared independent/positive-dependence family. */
function bhAdjust(hypotheses){
 if(!Array.isArray(hypotheses)||hypotheses.length===0) throw Error('NONEMPTY_FAMILY_REQUIRED');
 const names=new Set();
 const sorted=hypotheses.map((h,i)=>{
  if(!h||typeof h.id!=='string'||!h.id||names.has(h.id)) throw Error('DUPLICATE_OR_MISSING_ID');
  names.add(h.id);
  if(!Number.isFinite(h.pValue)||h.pValue<0||h.pValue>1) throw Error('INVALID_P_VALUE');
  return {id:h.id,pValue:h.pValue,i};
 }).sort((a,b)=>a.pValue-b.pValue||a.i-b.i);
 const n=sorted.length;let running=1;
 for(let i=n-1;i>=0;i--){running=Math.min(running,sorted[i].pValue*n/(i+1));sorted[i].adjustedP=Math.min(1,Math.max(0,running));}
 return sorted.sort((a,b)=>a.i-b.i).map(({id,pValue,adjustedP})=>({id,pValue,adjustedP,diagnosticOnly:true}));
}

/** Counts repeated event/market definitions across experiments; not independent evidence. */
function overlapAudit(experiments){
 if(!Array.isArray(experiments)) throw Error('INVALID_EXPERIMENTS');
 const seen=new Map();const repetitions=[];const ids=new Set();
 for(const e of experiments){
  if(!e||!e.id||!e.marketFingerprint) throw Error('MISSING_EXPERIMENT_IDENTITY');
  if(ids.has(e.id)) throw Error('DUPLICATE_EXPERIMENT_ID');ids.add(e.id);
  const key=String(e.marketFingerprint);const previous=seen.get(key);
  if(previous)repetitions.push({fingerprint:key,earlierExperimentId:previous,experimentId:e.id});
  else seen.set(key,e.id);
 }
 return {totalExperiments:experiments.length,uniqueMarketFingerprints:seen.size,repetitions,independentSampleCount:null};
}

/** Lower probability bound stress test. Lower bound must come from separate valid calibration. */
function evBounds({americanOdds,modelP,lowerP,upperP,validatedBounds=false}={}){
 const d=americanDecimal(americanOdds);
 if(d===null||![modelP,lowerP,upperP].every(Number.isFinite)||lowerP<0||upperP>1||lowerP>modelP||modelP>upperP) return {state:'INVALID_INPUT',productionApproved:false};
 const payoff=p=>p*(d-1)-(1-p);
 const nom=payoff(modelP),lo=payoff(lowerP),hi=payoff(upperP);
 return {state:validatedBounds?'UNCERTAINTY_DIAGNOSTIC_ONLY':'UNVALIDATED_BOUNDS',breakEven:1/d,nominalEv:nom,lowerEv:lo,upperEv:hi,
  nominalPositive:nom>0,robustPositiveIfBoundsValid:lo>0&&validatedBounds,productionApproved:false};
}
module.exports={auditTemporalFreeze,bhAdjust,overlapAudit,evBounds,americanDecimal};