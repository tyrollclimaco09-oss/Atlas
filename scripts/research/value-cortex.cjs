'use strict';
// ATLAS LAB — non-executable quantitative diagnostics. No network or sportsbook access.
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const validUTC=x=>typeof x==='string'&&/Z$/.test(x)&&Number.isFinite(Date.parse(x));
const clamp=(v,a,b)=>Math.max(a,Math.min(v,b));
function decimalOdds(american){
  if(!Number.isInteger(american)||Math.abs(american)<100)return null;
  return american>0?1+american/100:1+100/(-american);
}
function edgeBand({american,p,lower,upper}){
  const decimal=decimalOdds(american);
  if(!decimal||![p,lower,upper].every(finite)||lower<0||upper>1||lower>p||p>upper){
    return {status:'INVALID_INPUT',approved:false};
  }
  const ev=z=>z*decimal-1;
  const central=ev(p),lo=ev(lower),hi=ev(upper);
  const status=lo>0?'POSITIVE_WITHIN_ASSUMED_BOUNDS':central>0?'SENSITIVE_TO_MODEL_ERROR':'NOT_POSITIVE_AT_POINT_ESTIMATE';
  return {status,approved:false,breakEven:1/decimal,expectedReturn:central,
    lowerReturn:lo,upperReturn:hi,decimalOdds:decimal,modelValidated:false};
}
function distributionOverLine(bins,line){
  if(!Array.isArray(bins)||bins.length<1||!finite(line))return null;
  let total=0,pass=0,prev=-Infinity;
  for(const b of bins){
    if(!b||!finite(b.value)||!finite(b.weight)||b.weight<0||b.value<=prev)return null;
    prev=b.value;total+=b.weight;
    if(b.value>line)pass+=b.weight;
  }
  return total>0?pass/total:null;
}
function valueSurface({bins,lines,odds,uncertaintyPP}){
  if(!Array.isArray(lines)||!Array.isArray(odds)||!finite(uncertaintyPP)||uncertaintyPP<0||uncertaintyPP>100)return null;
  const data=[];
  for(const line of lines){
    const p=distributionOverLine(bins,line);
    if(p===null)return null;
    for(const american of odds){
      const band=edgeBand({american,p,lower:clamp(p-uncertaintyPP/100,0,1),upper:clamp(p+uncertaintyPP/100,0,1)});
      if(band.status==='INVALID_INPUT')return null;
      data.push({line,american,p,...band});
    }
  }
  return {rows:data,synthetic:true,executionAuthority:false};
}
function median(xs){const a=[...xs].sort((x,y)=>x-y);const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
function consensusStress(quotes,{cutoffUTC,maxAgeMinutes=15}={}){
  if(!Array.isArray(quotes)||!validUTC(cutoffUTC)||!finite(maxAgeMinutes)||maxAgeMinutes<0)return {status:'INVALID_INPUT'};
  const accepted=[],rejected=[];let identity=null;const books=new Set();
  for(const q of quotes){
    const k=q&&[q.eventId,q.market,q.selection,q.line].join('|');
    const age=q&&validUTC(q.observedAtUTC)?(Date.parse(cutoffUTC)-Date.parse(q.observedAtUTC))/60000:null;
    const a=decimalOdds(q?.selectedAmerican),b=decimalOdds(q?.opposingAmerican);
    let reason=null;
    if(!q?.book||!q?.eventId||!q?.market||!q?.selection||q?.line===undefined)reason='MISSING_IDENTITY';
    else if(identity!==null&&identity!==k)reason='MARKET_MISMATCH';
    else if(books.has(q.book))reason='DUPLICATE_BOOK';
    else if(!a||!b)reason='INVALID_TWO_SIDED_PRICE';
    else if(age===null||age<0||age>maxAgeMinutes)reason='STALE_OR_POSTCUTOFF';
    if(reason){rejected.push({book:q?.book||null,reason});continue;}
    identity=k;books.add(q.book);
    const rawSelected=1/a,rawOpposing=1/b;
    const noVig=rawSelected/(rawSelected+rawOpposing);
    accepted.push({book:q.book,probability:noVig,hold:rawSelected+rawOpposing-1,observedAtUTC:q.observedAtUTC});
  }
  if(accepted.length<2)return {status:'INSUFFICIENT_INDEPENDENT_QUOTES',accepted,rejected,modelProbability:null};
  const probs=accepted.map(q=>q.probability);
  const center=median(probs);
  const jackknife=probs.map((_,i)=>median(probs.filter((_,j)=>i!==j)));
  const range=[Math.min(...probs),Math.max(...probs)];
  const looRange=[Math.min(...jackknife),Math.max(...jackknife)];
  return {status:'REFERENCE_ONLY',accepted,rejected,medianNoVig:center,bookRange:range,
    leaveOneOutRange:looRange,disagreementPP:100*(range[1]-range[0]),
    sourceSensitivityPP:100*(looRange[1]-looRange[0]),
    marketIdentity:identity,modelProbability:null,executionAuthority:false};
}
function quoteTape(events,{cutoffUTC}={}){
  if(!Array.isArray(events)||!validUTC(cutoffUTC))return {status:'INVALID_INPUT'};
  const cleaned=[];let identity=null;
  for(const e of events){
    if(!e||!['OFFERED','CHANGED','WITHDRAWN'].includes(e.action)||!validUTC(e.observedAtUTC)||
       Date.parse(e.observedAtUTC)>Date.parse(cutoffUTC)||!e.book||!e.eventId||!e.market||
       !e.selection||e.line===undefined)return {status:'INVALID_EVENT'};
    const key=[e.book,e.eventId,e.market,e.selection,e.line].join('|');
    if(identity!==null&&key!==identity)return {status:'MISMATCHED_SERIES'};
    identity=key;cleaned.push(e);
  }
  cleaned.sort((a,b)=>Date.parse(a.observedAtUTC)-Date.parse(b.observedAtUTC));
  let available=false,openedAt=null,withdrawnAt=null;
  const transitions=[];
  for(const e of cleaned){
    if(e.action==='CHANGED'&&!available)return {status:'CHANGED_WHILE_UNAVAILABLE'};
    if(e.action==='WITHDRAWN'&&!available)return {status:'WITHDRAWN_WHILE_UNAVAILABLE'};
    if(e.action==='OFFERED'&&available)return {status:'DUPLICATE_OPEN'};
    if(e.action==='OFFERED'){available=true;openedAt=e.observedAtUTC;withdrawnAt=null;}
    if(e.action==='WITHDRAWN'){available=false;withdrawnAt=e.observedAtUTC;}
    transitions.push({action:e.action,time:e.observedAtUTC,available});
  }
  // A duration is observable only if both boundary timestamps exist. No interpolation between snapshots.
  const observedWindowMinutes=withdrawnAt&&openedAt?(Date.parse(withdrawnAt)-Date.parse(openedAt))/60000:null;
  return {status:'RECORDED_OBSERVATIONS_ONLY',transitions,availableAtCutoff:available,
    observedWindowMinutes,windowCensored:available||!openedAt||!withdrawnAt,
    cannotProveActualBookFillability:true};
}
function riskCoverage(forecasts, thresholds){
  if(!Array.isArray(forecasts)||!Array.isArray(thresholds)||!forecasts.length)return null;
  for(const f of forecasts){
    if(!f||!finite(f.score)||f.score<0||f.score>1||typeof f.correct!=='boolean'||
    !validUTC(f.frozenAtUTC)||!validUTC(f.eventStartUTC)||Date.parse(f.frozenAtUTC)>=Date.parse(f.eventStartUTC))return null;
  }
  return thresholds.map(t=>{
    if(!finite(t)||t<0||t>1)return null;
    const accepted=forecasts.filter(f=>f.score>=t);
    return {threshold:t,n:accepted.length,total:forecasts.length,coverage:accepted.length/forecasts.length,
      errorRate:accepted.length?accepted.filter(f=>!f.correct).length/accepted.length:null,
      profitability:null,selectionRuleIsProspectivelyValidated:false};
  });
}
module.exports={decimalOdds,edgeBand,distributionOverLine,valueSurface,consensusStress,quoteTape,riskCoverage};