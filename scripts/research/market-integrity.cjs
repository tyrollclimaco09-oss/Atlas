'use strict';
// ATLAS LAB / SHADOW only. Cross-market heuristics are QA alerts, never proof of odds or edge.
function timestampMs(t) { if(typeof t !== 'string' || !/Z$/.test(t)) return null; const n=Date.parse(t);return Number.isFinite(n)?n:null; }
function validAmerican(x) { return Number.isInteger(x) && (x>=100 || x<=-100); }
function canonicalMarketKey(q) {return [q?.eventId,q?.book,q?.market,q?.side,q?.line==null?'':q.line].join('|');}
function quoteLife(history, decisionAtUtc) {
  const end=timestampMs(decisionAtUtc);
  if(end===null)return {state:'UNVERIFIED',quote:null,reasons:['BAD_DECISION_TIME']};
  if(!Array.isArray(history) || !history.length)return {state:'UNVERIFIED',quote:null,reasons:['NO_HISTORY']};
  let identity=null,last=null;const reasons=[];
  for(const q of history){
    const time=timestampMs(q?.observedAtUtc);
    if(time===null){reasons.push('BAD_QUOTE_TIMESTAMP');continue;}
    if(time>end)continue;
    const id=canonicalMarketKey(q);
    if(identity===null)identity=id;
    else if(identity!==id){reasons.push('MIXED_MARKET_IDENTITY');continue;}
    if(!['opened','changed','withdrawn'].includes(q.kind)){reasons.push('BAD_LIFECYCLE_KIND');continue;}
    if((q.kind!=='withdrawn') && !validAmerican(q.american)){reasons.push('INVALID_PRICE');continue;}
    if(!last || time>timestampMs(last.observedAtUtc) || (time===timestampMs(last.observedAtUtc) && q.kind==='withdrawn'))last=q;
  }
  if(reasons.includes('MIXED_MARKET_IDENTITY'))return {state:'QUARANTINE',quote:null,reasons};
  if(!last)return {state:'UNVERIFIED',quote:null,reasons:reasons.length?reasons:['NO_ASOF_QUOTE']};
  if(last.kind==='withdrawn')return {state:'WITHDRAWN',quote:null,reasons};
  return {state:'OBSERVED_NOT_ACCOUNT_EXECUTABLE',quote:last,reasons};
}
function compareMoneylineSpread(ml, spread, {maxLagMinutes=5,heavyFavoritePoints=6.5}={}) {
  const reasons=[];
  if(!ml || !spread || ml.market!=='moneyline'||spread.market!=='spread')return {state:'UNVERIFIED',reasons:['MISSING_COMPARABLE_MARKETS']};
  if(!ml.eventId || !spread.eventId || ml.eventId!==spread.eventId || ml.side!==spread.side)return {state:'UNVERIFIED',reasons:['EVENT_OR_SIDE_MISMATCH']};
  const heavy=Number.isFinite(spread.line) && spread.line<=-heavyFavoritePoints;
  const underdog=Number.isInteger(ml.american) && ml.american>=100;
  if(!heavy || !underdog)return {state:'NO_OBVIOUS_CONTRADICTION',reasons:[]};
  if(!ml.book || !spread.book || ml.book!==spread.book)reasons.push('SOURCE_IDENTITY_UNRESOLVED');
  const a=timestampMs(ml.observedAtUtc),b=timestampMs(spread.observedAtUtc);
  if(a===null||b===null)reasons.push('QUOTE_TIMES_UNVERIFIED');
  else if(Math.abs(a-b)>maxLagMinutes*60000)reasons.push('ASYNCHRONOUS_QUOTES');
  if(reasons.length)return {state:'SUSPECTED_SIGN_CONFLICT_REQUIRES_RECHECK',reasons};
  return {state:'CROSS_MARKET_ANOMALY',reasons:['HEAVY_SPREAD_FAVORITE_WITH_PLUS_MONEYLINE']};
}
module.exports={validAmerican,canonicalMarketKey,quoteLife,compareMoneylineSpread};