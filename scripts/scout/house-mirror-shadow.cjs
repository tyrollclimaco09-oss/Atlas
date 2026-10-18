'use strict';

// HM-01: Market-only mirror. NOT a fair forecast, tip, price source, or executable quote.
// Every record is synthetic until an independently reviewed prospective source contract exists.
const { hashJSON }=require('./source-contract-shadow.cjs');
const { canonicalJSON }=require('./opportunity-shadow.cjs');
const VERSION='atlas.house-mirror.shadow.v1';
const ROOT=['schema_version','synthetic','research_only','phase','study_id','event_id','starts_at',
  'research_frozen_at','research_receipt_sha256','as_of','max_quote_age_minutes','market','quotes'];
const MARKET=['market_id','side_a','side_b','rules_id','settlement'];
const QUOTE=['book_id','provider_family','market_id','side_a','side_b','rules_id',
  'american_a','american_b','captured_at','origin'];
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&
  keys.every(k=>Object.hasOwn(x,k));
const ident=x=>typeof x==='string'&&/^synthetic-[A-Za-z0-9_-]{1,80}$/.test(x);
const stamp=s=>{
  if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(s))return null;
  const n=Date.parse(s);return Number.isFinite(n)&&new Date(n).toISOString()===(s.includes('.')?s:s.replace('Z','.000Z'))?n:null;
};
const validate=(ok,reason)=>{if(!ok)throw Error(reason);};
const odds=x=>{
  validate(Number.isSafeInteger(x)&&Math.abs(x)>=100&&Math.abs(x)<=1000000,'MIRROR_ODDS');
  return x>0?100/(100+x):-x/(-x+100);
};
const frozen=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(frozen);Object.freeze(x);}return x;};
const median=values=>{if(!values.length)return null;const a=[...values].sort((x,y)=>x-y);
  return a.length%2===1?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2;};
function mirror(input){
  hashJSON(input);
  validate(exact(input,ROOT)&&input.schema_version===VERSION&&input.synthetic===true&&
    input.research_only===true&&input.phase==='PHASE2_MARKET_DEMONSTRATION'&&
    ident(input.study_id)&&ident(input.event_id)&&
    typeof input.research_receipt_sha256==='string'&&/^[a-f0-9]{64}$/.test(input.research_receipt_sha256),
    'MIRROR_CONTRACT');
  const frozenAt=stamp(input.research_frozen_at),asOf=stamp(input.as_of),start=stamp(input.starts_at);
  validate(frozenAt!==null&&asOf!==null&&start!==null&&frozenAt<=asOf&&asOf<start,'MIRROR_TIME');
  validate(Number.isSafeInteger(input.max_quote_age_minutes)&&input.max_quote_age_minutes>=1&&
    input.max_quote_age_minutes<=360,'MIRROR_POLICY');
  const market=input.market;
  validate(exact(market,MARKET)&&ident(market.market_id)&&
    typeof market.side_a==='string'&&market.side_a.length>0&&market.side_a===market.side_a.trim()&&
    typeof market.side_b==='string'&&market.side_b.length>0&&market.side_b===market.side_b.trim()&&
    market.side_a!==market.side_b&&ident(market.rules_id)&&
    market.settlement==='TWO_OUTCOME_NO_PUSH','MIRROR_MARKET');
  validate(Array.isArray(input.quotes)&&input.quotes.length>0&&input.quotes.length<=64,'MIRROR_QUOTES');
  const bookIDs=new Set(),seen=[];
  for(const q of input.quotes){
    validate(exact(q,QUOTE)&&ident(q.book_id)&&ident(q.provider_family)&&
      q.origin==='SYNTHETIC_DEMO'&&!bookIDs.has(q.book_id),'MIRROR_QUOTE_CONTRACT');
    bookIDs.add(q.book_id);
    seen.push(q);
  }
  const accepted=[],excluded=[],diversity=new Map();
  for(const q of seen){
    const reasons=[];
    if(q.market_id!==market.market_id||q.side_a!==market.side_a||q.side_b!==market.side_b||
      q.rules_id!==market.rules_id)reasons.push('MIRROR_IDENTITY_MISMATCH');
    const observed=stamp(q.captured_at);
    if(observed===null)reasons.push('MIRROR_QUOTE_TIME');
    else if(observed<frozenAt||observed>asOf)reasons.push('MIRROR_QUOTE_CHRONOLOGY');
    else if((asOf-observed)/60000>input.max_quote_age_minutes)reasons.push('MIRROR_STALE');
    let pa=null,pb=null,hold=null;
    try{pa=odds(q.american_a);pb=odds(q.american_b);hold=pa+pb-1;}
    catch{reasons.push('MIRROR_ODDS');}
    if(hold!==null&&(hold<-1e-12||hold>0.35))reasons.push('MIRROR_HOLD_ANOMALY');
    if(reasons.length){excluded.push({book_id:q.book_id,provider_family:q.provider_family,reasons:[...new Set(reasons)]});continue;}
    const normalizedA=pa/(pa+pb),normalizedB=pb/(pa+pb);
    accepted.push({book_id:q.book_id,provider_family:q.provider_family,age_minutes:(asOf-observed)/60000,
      american_a:q.american_a,american_b:q.american_b,raw_implied_a:pa,raw_implied_b:pb,
      hold,proportional_no_vig_a:normalizedA,proportional_no_vig_b:normalizedB});
    diversity.set(q.provider_family,(diversity.get(q.provider_family)||0)+1);
  }
  accepted.sort((a,b)=>a.book_id.localeCompare(b.book_id,'en'));
  excluded.sort((a,b)=>a.book_id.localeCompare(b.book_id,'en'));
  const benchmark=accepted.length?median(accepted.map(x=>x.proportional_no_vig_a)):null;
  const bestA=accepted.length?[...accepted].sort((a,b)=>b.american_a-a.american_a||a.book_id.localeCompare(b.book_id,'en'))[0]:null;
  const bestB=accepted.length?[...accepted].sort((a,b)=>b.american_b-a.american_b||a.book_id.localeCompare(b.book_id,'en'))[0]:null;
  const correlated=[...diversity.entries()].filter(([,count])=>count>1).map(([family,count])=>({provider_family:family,book_count:count}));
  return frozen({
    schema_version:VERSION,synthetic:true,research_only:true,phase:'PHASE2_MARKET_DEMONSTRATION',
    price_independent_forecast:'NOT_PROVEN_BY_HASH',research_receipt_sha256:input.research_receipt_sha256,
    market_identity:JSON.parse(canonicalJSON(market)),as_of:input.as_of,raw_quote_count:input.quotes.length,
    accepted_quote_count:accepted.length,rejected_quote_count:excluded.length,
    quoted_provider_families:diversity.size,provider_overlap:correlated,
    accepted,excluded,descriptive_median_no_vig_a:benchmark,
    best_displayed_a:bestA?{book_id:bestA.book_id,american_odds:bestA.american_a}:null,
    best_displayed_b:bestB?{book_id:bestB.book_id,american_odds:bestB.american_b}:null,
    independent_fair_probability:null,edge:null,recommended_selection:null,
    warnings:['MARKET_DERIVED_IS_NOT_AN_INDEPENDENT_FORECAST',
      'CROSS_PROVIDER_CORRELATION_NOT_PROVEN_ABSENT',
      'SYNTHETIC_QUOTES_NOT_AVAILABLE_FOR_EXECUTION'],
    execution_authority:false,human_final_gate_required:true
  });
}
module.exports=Object.freeze({VERSION,mirror});
