'use strict';
// ATLAS LAB: original distribution/receipt UX primitives. Research-only; no IO or wagering.
const finite = x => typeof x === 'number' && Number.isFinite(x);
const round=(x,n=5)=>Number(x.toFixed(n));
function distribution(rows) {
  if (!Array.isArray(rows) || rows.length === 0 || rows.length>100000) throw new Error('INVALID_DISTRIBUTION');
  const values=[];let sum=0;
  for(const r of rows){if(!r||!finite(r.value)||r.value<0||!finite(r.weight)||r.weight<0)throw new Error('INVALID_DISTRIBUTION_ROW');
    values.push({value:r.value,weight:r.weight});sum+=r.weight;
  }
  if(!finite(sum)||sum<=0)throw new Error('ZERO_WEIGHT');
  return values.map(r=>({value:r.value,weight:r.weight/sum})).sort((a,b)=>a.value-b.value);
}
function percentile(v,p){let acc=0;for(const r of v){acc+=r.weight;if(acc+1e-12>=p)return r.value;}return v.at(-1).value;}
function priceFromP(p){if(!finite(p)||p<=0||p>=1)return null;
  const american=p>=0.5 ? -(100*p)/(1-p):100*(1-p)/p;
  return Math.round(american);
}
/** The exact values above and below a sports line, not a smooth normal approximation. */
function exploreLine(rows,line,{kind='over',modelStatus='EXPERIMENTAL'}={}) {
  const d=distribution(rows);if(!finite(line))throw new Error('INVALID_LINE');
  if(!['over','under','at_least'].includes(kind))throw new Error('INVALID_SIDE');
  const p=d.reduce((s,r)=>s+((kind==='over'?r.value>line:kind==='under'?r.value<line:r.value>=line)?r.weight:0),0);
  return {side:kind,line,probability:round(p),fairAmerican:priceFromP(p),
    p10:percentile(d,0.1),p50:percentile(d,0.5),p90:percentile(d,0.9),
    modelStatus,marketPriceVerified:false,realMoneyAuthorized:false};
}
/** A what-if comparison is conditional research; it never overwrites the baseline. */
function compareWorlds({baseline,scenario,line,kind='over',baselineFreezeUtc,scenarioObservedUtc}) {
  const base=exploreLine(baseline,line,{kind}),shifted=exploreLine(scenario,line,{kind});
  const chronology=typeof baselineFreezeUtc==='string' && typeof scenarioObservedUtc==='string' &&
    Number.isFinite(Date.parse(baselineFreezeUtc)) && Number.isFinite(Date.parse(scenarioObservedUtc)) &&
    Date.parse(scenarioObservedUtc)>=Date.parse(baselineFreezeUtc);
  return {baseline:base,whatIf:shifted,deltaProbabilityPoints:round((shifted.probability-base.probability)*100,3),
    chronology:chronology?'POSSIBLE':'UNVERIFIED',provenInjuryImpact:false,authority:'PAPER_ONLY'};
}
/** Wilson interval for a retrospective frequency. NOT a player forecast. */
function hitRateInterval(hits,total,z=1.96){if(!Number.isSafeInteger(hits)||!Number.isSafeInteger(total)||hits<0||total<=0||hits>total||!finite(z)||z<=0)throw new Error('INVALID_HIT_RATE');
  const p=hits/total, den=1+z*z/total,c=(p+z*z/(2*total))/den,d=z*Math.sqrt(p*(1-p)/total+z*z/(4*total*total))/den;
  return {observedRate:round(p),lower:round(Math.max(0,c-d)),upper:round(Math.min(1,c+d)),sampleSize:total,type:'DESCRIPTIVE_ONLY_NOT_FUTURE_PREDICTION'};
}
/** Consume parsed fields from a screenshot or import. Never accept or place a bet. */
function reviewSlipDraft({book,stake,legs,acceptedCombinedOdds,sourceReceiptId}={}){
  const errors=[],warnings=[];const present=typeof sourceReceiptId==='string'&&sourceReceiptId.trim().length>0;
  if(!present)errors.push('MISSING_SOURCE_RECEIPT');
  if(typeof book!=='string'||!book.trim())errors.push('MISSING_BOOK');
  if(!finite(stake)||stake<=0)errors.push('INVALID_STAKE');
  if(!Array.isArray(legs)||legs.length===0)errors.push('NO_LEGS');
  const seen=new Set();
  for(const l of Array.isArray(legs)?legs:[]){
    if(!l||!l.eventId||!l.market||!l.selection)errors.push('INCOMPLETE_LEG');
    if(l?.market==='total'&&!['OVER','UNDER'].includes(l?.selection))errors.push('TOTAL_SIDE_MISSING');
    const id=[l?.eventId,l?.market,l?.selection,l?.line??''].join('|');
    if(seen.has(id))warnings.push('REPEATED_SAME_SELECTION');seen.add(id);
    if(l?.playerStatus==='DNP'||l?.playerStatus==='OUT')warnings.push('AVAILABILITY_REVIEW');
  }
  if(!finite(acceptedCombinedOdds))warnings.push('COMBINED_PRICE_UNVERIFIED');
  return {status:errors.length?'NEEDS_CORRECTION':'REVIEW_REQUIRED',errors:[...new Set(errors)],warnings:[...new Set(warnings)],
    sourceReceiptId:sourceReceiptId||null,stakedFromScreenshotOnly:finite(stake)?stake:null,
    saved:false,executed:false,humanReviewRequired:true};
}
/** Answer only simple verifiable aggregations over supplied settled entries, not predictive questions. */
function ledgerSlice(bets,criteria={}){
  if(!Array.isArray(bets))throw new Error('INVALID_LEDGER');
  const rows=bets.filter(b=>(!criteria.book||b.book===criteria.book)&&(!criteria.market||b.market===criteria.market));
  for(const b of rows)if(!['WIN','LOSS','PUSH'].includes(b.result)||!finite(b.stake)||b.stake<0||!finite(b.returned)||b.returned<0)throw new Error('UNVERIFIED_SETTLEMENT');
  return {bets:rows.length,wins:rows.filter(b=>b.result==='WIN').length,losses:rows.filter(b=>b.result==='LOSS').length,
    totalStaked:round(rows.reduce((s,b)=>s+b.stake,0),2),totalReturned:round(rows.reduce((s,b)=>s+b.returned,0),2),
    net:round(rows.reduce((s,b)=>s+b.returned-b.stake,0),2),dataScope:'PROVIDED_SETTLED_ROWS_ONLY',
    inferredWalletBalance:false};
}
module.exports={distribution,exploreLine,compareWorlds,hitRateInterval,reviewSlipDraft,ledgerSlice};