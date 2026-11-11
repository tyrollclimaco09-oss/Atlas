'use strict';
// ATLAS LAB — read-only price comparison and probability diagnostics.
// ZERO network, sportsbook, account, provider, or wager operations.

function americanToDecimal(odds) {
  if (!Number.isInteger(odds) || (odds > -100 && odds < 100)) return null;
  return odds > 0 ? 1 + odds/100 : 1 + 100/Math.abs(odds);
}
function implied(odds) {
  const decimal = americanToDecimal(odds);
  return decimal === null ? null : 1/decimal;
}
function devigTwoWay(oddsFor, oddsAgainst) {
  const a=implied(oddsFor), b=implied(oddsAgainst);
  if (a===null || b===null) return null;
  const sum=a+b;
  return { for: a/sum, against: b/sum, overround:sum-1, method:'proportional_two_way_only' };
}
function valueAt(p, odds) {
  const decimal=americanToDecimal(odds);
  if(decimal===null || !Number.isFinite(p) || p<0 || p>1) return null;
  return p*decimal-1; // expected NET return per 1 unit staked
}
function sensitivity({probability, lowerProbability, upperProbability, americanOdds}) {
  if([probability,lowerProbability,upperProbability].some(v=>!Number.isFinite(v)||v<0||v>1) ||
     lowerProbability>probability || upperProbability<probability) return null;
  const center=valueAt(probability,americanOdds), low=valueAt(lowerProbability,americanOdds), high=valueAt(upperProbability,americanOdds);
  if(center===null) return null;
  return {breakEven:implied(americanOdds), evCenter:center, evLower:low, evUpper:high,
    fragile:low<=0, status:'HYPOTHETICAL_UNLESS_INDEPENDENT_MODEL_VALIDATED'};
}
function isoEpoch(x) {
  if(typeof x!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(x))return null;
  const ms=Date.parse(x); return Number.isFinite(ms)?ms:null;
}
const identityFields=['product','sport','eventId','eventStartUtc','participantId','market','period','overtimeRule','settlementRuleId','side'];
const hasExactMarketIdentity=q=>q&&identityFields.every(k=>typeof q[k]==='string'&&q[k].trim())&&
 (q.line===null||Number.isFinite(q.line));
const quoteKey=q=>hasExactMarketIdentity(q)?JSON.stringify([...identityFields.map(k=>q[k]),q.line]):null;
/** Only exact same outcome/line, fresh, account-confirmed sportsbook quotes may appear as account-checkable candidates. */
function screenQuotes(quotes,{nowUtc,maximumAgeMinutes=5}={}) {
  const now=isoEpoch(nowUtc);
  if(now===null || !(maximumAgeMinutes>0)) throw Error('Invalid cutoff');
  const groups=new Map(), excluded=[];
  for(const q of quotes||[]) {
    let reason=null;
    const stamp=isoEpoch(q?.observedAtUtc);
    if (!hasExactMarketIdentity(q) || !q?.book) reason='MISSING_EXACT_MARKET';
    else if(implied(q.americanOdds)===null) reason='INVALID_ODDS';
    else if(stamp===null || stamp>now) reason='BAD_POINT_IN_TIME';
    else if((now-stamp)/60000>maximumAgeMinutes)reason='STALE_PRICE';
    else if(q.availability!=='OFFERED')reason='UNAVAILABLE';
    else if(q.accountConfirmed!==true)reason='PUBLIC_ONLY';
    if(reason){excluded.push({quoteId:q?.quoteId??null,reason});continue;}
    const key=quoteKey(q); if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push({...Object.fromEntries(identityFields.map(k=>[k,q[k]])),quoteId:q.quoteId??null,eventId:q.eventId,market:q.market,side:q.side,line:q.line,
      book:q.book,americanOdds:q.americanOdds,observedAtUtc:q.observedAtUtc,decimalOdds:americanToDecimal(q.americanOdds)});
  }
  const ranked=[];
  for(const [key,rs] of groups) ranked.push({key,quotes:rs.sort((a,b)=>b.decimalOdds-a.decimalOdds),best:rs[0]});
  return {status:'RESEARCH_PRICE_SCREEN_ONLY',ranked,excluded,humanFinalGateRequired:true,betPlaced:false};
}
function diagnostics({modelProbability,modelProbabilityLower,modelValidated,forecastFrozenAtUtc,quote}) {
  const reasons=[];
  if(!quote || quote.accountConfirmed!==true) reasons.push('ACCOUNT_OFFER_NOT_PROVEN');
  if(!modelValidated || !Number.isFinite(modelProbabilityLower)) reasons.push('INDEPENDENT_MODEL_NOT_VALIDATED');
  const p=sensitivity({probability:modelProbability,lowerProbability:modelProbabilityLower,upperProbability:1,americanOdds:quote?.americanOdds});
  if(!p) reasons.push('INVALID_PROBABILITY_OR_PRICE');
  else if(p.fragile) reasons.push('EDGE_NOT_ROBUST_TO_PROBABILITY_ERROR');
  const f=isoEpoch(forecastFrozenAtUtc), o=isoEpoch(quote?.observedAtUtc);
  if(f===null || o===null || f>o) reasons.push('PRICE_BEFORE_FROZEN_FORECAST_UNPROVEN');
  return {status:reasons.length?'RESEARCH_OR_WATCH':'REQUIRES_HUMAN_FINAL_GATE',reasons,returnOnStakeEstimate:p?.evCenter??null,
    worstCaseReturnOnStake:p?.evLower??null,approved:false,betPlaced:false};
}
function comparableCLV({bet,closing}) {
  if(!hasExactMarketIdentity(bet) || !hasExactMarketIdentity(closing) || quoteKey(bet)!==quoteKey(closing)) return {status:'INCOMPARABLE_LINE_OR_EVENT'};
  const a=implied(bet.americanOdds),b=implied(closing.americanOdds);
  if(a===null||b===null)return {status:'MISSING_PRICE'};
  const bt=isoEpoch(bet.observedAtUtc),ct=isoEpoch(closing.observedAtUtc);
  if(bt===null||ct===null||ct<=bt)return {status:'INVALID_TIMESTAMP'};
  return {status:'DIAGNOSTIC_ONLY',impliedCloseMinusEntryPercentagePoints:100*(b-a),notProofOfEV:true};
}
module.exports={americanToDecimal,implied,devigTwoWay,valueAt,sensitivity,screenQuotes,diagnostics,comparableCLV,quoteKey,hasExactMarketIdentity};
