'use strict';
// ATLAS SCENARIO PRICE ENVELOPE — observational shadow comparator.
// No trained scenario likelihoods, no bookmaker routing, no betting authority.
// Distinguishes mathematical scenario robustness from demonstrated betting edge.
const VERSION='atlas.nba.scenario-price-envelope.shadow.v1';
const STAGES=Object.freeze(['REFERENCE_ONLY']); // No self-attested executable quotes in shadow research.
function implied(american){
 if(!Number.isSafeInteger(american)||Math.abs(american)<100||Math.abs(american)>10000)
  throw Error('QUOTE_ODDS_INVALID');
 return american>0?100/(100+american):-american/(100-american);
}
function fairAmerican(p){
 if(!Number.isFinite(p)||p<=0||p>=1)return null;
 return p<.5?Math.ceil(100*(1-p)/p):Math.ceil(-100*p/(1-p));
}
function iso(x){
 if(typeof x!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(x))
  throw Error('TIMESTAMP_REQUIRED');
 const t=Date.parse(x);
 if(!Number.isFinite(t)||new Date(t).toISOString()!==(x.includes('.')?x:x.replace('Z','.000Z')))
  throw Error('TIMESTAMP_INVALID');
 return t;
}
const round=(x,k=4)=>Number(x.toFixed(k));
function auditEnvelope(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('INPUT_INVALID');
 const {identity,market,scenarios,quote}=input;
 if(!identity||typeof identity.event_id!=='string'||!/^2026\d{4}-[A-Z]{3}-[A-Z]{3}$/.test(identity.event_id)||
    identity.event_id!=='20261021-CHA-BKN'||identity.player_key!=='dayron-sharpe')throw Error('IDENTITY_INVALID');
 if(!market||market.stat!=='rebounds'||market.operator!=='AT_LEAST'||market.threshold!==9||
   market.units!=='COUNT'||market.settlement!=='NO_PUSH')throw Error('EXACT_MARKET_REQUIRED');
 if(!Array.isArray(scenarios)||scenarios.length!==4)throw Error('SCENARIO_COVERAGE_INCOMPLETE');
 const allowed=['RESTRICTED','MIXED','STARTER','COMPETITION'];
 const seen=new Set();
 for(const sc of scenarios){
  if(!sc||!allowed.includes(sc.name)||seen.has(sc.name)||!Number.isInteger(sc.n)||sc.n<1000||
     typeof sc.hit_frequency!=='number'||!Number.isFinite(sc.hit_frequency)||
     sc.hit_frequency<0||sc.hit_frequency>1||sc.calibrated!==false||
     sc.probability_source!=='SCENARIO_ASSUMPTION')throw Error('SCENARIO_UNTRUSTED');
  seen.add(sc.name);
 }
 if(allowed.some(name=>!seen.has(name)))throw Error('SCENARIO_COVERAGE_INCOMPLETE');
 if(!quote||!STAGES.includes(quote.status)||quote.source!=='THIRD_PARTY_REFERENCE'||
    typeof quote.provider!=='string'||quote.provider.length<2||
    quote.event_id!==identity.event_id||quote.player_key!==identity.player_key||
    quote.stat!==market.stat||quote.operator!==market.operator||quote.threshold!==market.threshold||
    quote.settlement!==market.settlement)throw Error('QUOTE_IDENTITY_UNRESOLVED');
 const pQuote=implied(quote.american_odds);
 const capture=iso(quote.captured_at),start=iso(identity.starts_at),cutoff=iso(input.as_of);
 if(capture>cutoff||cutoff>=start||capture>=start||capture<cutoff-15*60*1000)
  throw Error('QUOTE_STALE_OR_CHRONOLOGY');
 const ordered=allowed.map(name=>scenarios.find(x=>x.name===name));
 const pmin=Math.min(...ordered.map(x=>x.hit_frequency));
 const pmax=Math.max(...ordered.map(x=>x.hit_frequency));
 const scenarioStates=ordered.map(x=>({
  name:x.name,n:x.n,hypothetical_hit_frequency:round(x.hit_frequency),
  margin_to_implied_percentage_points:round((x.hit_frequency-pQuote)*100,2),
  price_exceeds_scenario_threshold:x.hit_frequency>pQuote
 }));
 const zeroMargin= fairAmerican(pmin);
 const spread=(pmax-pmin)*100;
 const verdict=pmin>pQuote?'ALL_ASSUMED_SCENARIOS_CLEAR_REFERENCE_PRICE':
   pmax<=pQuote?'NONE_OF_ASSUMED_SCENARIOS_CLEAR_REFERENCE_PRICE':'DISAGREEMENT_ACROSS_SCENARIOS';
 return Object.freeze({
  schema:VERSION,identity,market,
  reference_quote:{provider:quote.provider,odds:quote.american_odds,implied:round(pQuote),
   status:quote.status,source:quote.source,captured_at:quote.captured_at,price_executable:false},
  epistemic_envelope:{min:round(pmin),max:round(pmax),spread_percentage_points:round(spread,2),
   zero_margin_american_odds_worst_assumed_scenario:zeroMargin,
   worst_scenario_delta_pp:round((pmin-pQuote)*100,2),
   best_scenario_delta_pp:round((pmax-pQuote)*100,2),
   scenarios:scenarioStates,
   interpretation:'ASSUMPTION_BOUND_ONLY_NOT_STATISTICAL_CONFIDENCE_INTERVAL'},
  shadow_outcome:verdict,
  approved_bet:null,independent_fair_probability:null,expected_value:null,
  unproven:['CURRENT_ROLE_MINUTES','REBOUND_SHARE_TRANSFER','SCENARIO_WEIGHTS','PROSPECTIVE_CALIBRATION',
            'EXECUTABLE_PRICE'],
  execution_authority:false,human_final_gate_required:true,production_influence:false
 });
}
module.exports=Object.freeze({VERSION,implied,fairAmerican,auditEnvelope});
