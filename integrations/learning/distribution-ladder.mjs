/**
 * ATLAS sports outcome distribution compiler — SHADOW research only.
 *
 * Convert source-dated, price-independent binary or integer-valued
 * game/player outcome distributions into a common line probability ladder.
 *
 * This is mathematical machinery, NOT a trained or verified sports model.
 * Do not infer parameter estimates from bookmaker odds. A baseline and
 * forecast must be separately frozen before kickoff. This module never
 * creates 95% model confidence bounds, opens a sportsbook, or places bets.
 */
export const DISTRIBUTION_CONTRACT='ATLAS_DISTRIBUTION_LADDER_V1';
const scalarMarkets=new Set([
 'moneyline','spread','total','team_total','period','points','rebounds',
 'assists','three_pointers','steals','blocks','passing_yards',
 'passing_attempts','rushing_yards','rushing_attempts','receiving_yards',
 'receptions','alternates','quarter_rushing','special_teams'
]);
const jointOnly=new Set(['sgp','sgpx','round_robin','pra','double_double',
 'each_quarter_rushing','first_score','touchdowns_joint','first_touchdown']);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const timestamp=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))?Date.parse(x):NaN;
const ident=x=>typeof x==='string'&&x.trim().length>0&&x.length<=240;
const round=(x,n=8)=>Number(x.toFixed(n));
const clamp=x=>Math.min(1,Math.max(0,x));
function cdfNormal(z){
 const a=Math.abs(z),t=1/(1+.2316419*a);
 const tpoly=t*(.319381530+t*(-.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));
 const tail=Math.exp(-a*a/2)/Math.sqrt(2*Math.PI)*tpoly;
 return clamp(z>=0?1-tail:tail);
}
function distValue(family,params,line){
 if(family==='binary'){
  if(!finite(params.p)||params.p<=0||params.p>=1)throw Error('INVALID_BINARY_PROBABILITY');
  if(line.side!=='yes'&&line.side!=='no')throw Error('BINARY_SIDE_UNSUPPORTED');
  if(line.threshold!==null&&line.threshold!==undefined)throw Error('BINARY_THRESHOLD_UNEXPECTED');
  if(line.tie_or_void_possible===true)throw Error('BINARY_TIE_VOID_NEEDS_TERNARY_RULES');
  return {win:line.side==='yes'?params.p:1-params.p,push:0};
 }
 if(line.side!=='over'&&line.side!=='under')throw Error('NUMERIC_SIDE_UNSUPPORTED');
 const h=line.threshold;
 if(!finite(h)||Math.abs(h)>2000||!Number.isInteger(h*2)||
    (family==='negative_binomial'&&h<0))throw Error('LINE_OUTSIDE_FAMILY_DOMAIN_OR_NOT_INTEGER_HALF');
 const isWhole=Number.isInteger(h);
 let lessThan=NaN,equal=0,greaterThan=NaN;
 if(family==='normal_integer'){
  const mean=params.mean, sd=params.sd;
  if(!finite(mean)||!finite(sd)||sd<=0||sd>1000||Math.abs(mean)>2000)
    throw Error('INVALID_NORMAL_DISTRIBUTION');
  const cdf=v=>cdfNormal((v-mean)/sd);
  lessThan=cdf(Math.ceil(h)-.5);
  greaterThan=1-cdf(Math.floor(h)+.5);
  equal=isWhole?cdf(h+.5)-cdf(h-.5):0;
 }else if(family==='negative_binomial'){
  const mean=params.mean,dispersion=params.dispersion;
  if(!finite(mean)||!finite(dispersion)||mean<0||mean>150||dispersion<=0||dispersion>500)
    throw Error('INVALID_NEGATIVE_BINOMIAL_DISTRIBUTION');
  const cdf=n=>{
   if(n<0)return 0;
   if(mean===0)return 1;
   const p=dispersion/(dispersion+mean), q=1-p;
   let mass=Math.exp(dispersion*Math.log(p)),sum=mass;
   for(let k=1;k<=n;k++){mass*=q*(k-1+dispersion)/k;sum+=mass;}
   return clamp(sum);
  };
  lessThan=cdf(Math.ceil(h)-1);
  greaterThan=1-cdf(Math.floor(h));
  equal=isWhole?cdf(h)-cdf(h-1):0;
 }else throw Error('UNSUPPORTED_DISTRIBUTION_FAMILY');
 const sum=lessThan+equal+greaterThan;
 if(!finite(sum)||Math.abs(sum-1)>1e-6)throw Error('PROBABILITY_MASS_NOT_NORMALIZED');
 return {win:clamp(line.side==='over'?greaterThan:lessThan),push:clamp(equal)};
}
function mixture(input,line){
 if(!input||!Array.isArray(input.scenarios)||input.scenarios.length<1||
    input.scenarios.length>12)throw Error('SCENARIOS_REQUIRED');
 const seen=new Set();let weights=0,win=0,push=0,low=1,high=0;
 for(const sc of input.scenarios){
  if(!ident(sc?.id)||seen.has(sc.id))throw Error('SCENARIO_IDS_MISSING_OR_DUPLICATE');
  seen.add(sc.id);
  if(!finite(sc.weight)||sc.weight<=0||sc.weight>1)throw Error('INVALID_SCENARIO_WEIGHT');
  weights+=sc.weight;
  const p=distValue(input.family,sc.params??{},line);
  win+=sc.weight*p.win;push+=sc.weight*p.push;
  low=Math.min(low,p.win);high=Math.max(high,p.win);
 }
 if(Math.abs(weights-1)>1e-9)throw Error('SCENARIO_WEIGHTS_NOT_NORMALIZED');
 return {probability:clamp(win),push:clamp(push),sensitivity_min:low,sensitivity_max:high};
}
export function compileDistributionLadder(packet){
 if(!packet||packet.contract!==DISTRIBUTION_CONTRACT||
   !['NBA','NFL'].includes(packet.sport)||
   !ident(packet.event_id)||!ident(packet.selection_id)||
   !ident(packet.market_family)||!ident(packet.market_period)||
   !ident(packet.settlement_rule)||
   !Array.isArray(packet.lines)||packet.lines.length<1||packet.lines.length>40)
   throw Error('DISTRIBUTION_PACKET_INVALID');
 const issues=[];
 if(!scalarMarkets.has(packet.market_family)){
  issues.push(jointOnly.has(packet.market_family)?
    'JOINT_MARKET_REQUIRES_CORRELATED_MODEL':'MARKET_FAMILY_UNSUPPORTED');
 }
 const frozen=timestamp(packet.frozen_at),cutoff=timestamp(packet.features_observed_at),start=timestamp(packet.event_start_at);
 if(!Number.isFinite(frozen)||!Number.isFinite(cutoff)||!Number.isFinite(start)||
    cutoff>frozen||frozen>=start)
   issues.push('POINT_IN_TIME_FORECAST_NOT_ESTABLISHED');
 if(!Array.isArray(packet.source_receipts)||!packet.source_receipts.length||
   packet.source_receipts.some(r=>!ident(r?.receipt_id)||!Number.isFinite(timestamp(r?.observed_at))||
     timestamp(r.observed_at)>cutoff)||new Set(packet.source_receipts.map(r=>r?.receipt_id)).size!==packet.source_receipts.length)
   issues.push('PRE_FORECAST_SOURCE_RECEIPTS_MISSING_OR_LATE');
 if(packet.model?.uses_bookmaker_odds!==false||packet.baseline?.uses_bookmaker_odds!==false)
   issues.push('PREMARKET_INDEPENDENCE_UNPROVEN');
 if(!ident(packet.model?.model_key)||!ident(packet.model?.version)||
    !ident(packet.baseline?.model_key)||!ident(packet.baseline?.version)||
    !['binary','normal_integer','negative_binomial'].includes(packet.model?.family)||
    packet.model?.family!==packet.baseline?.family)
   issues.push('PAIRED_MODEL_AND_BASELINE_FAMILY_MISMATCH');
 if(issues.length)return {contract:DISTRIBUTION_CONTRACT,
  case_key:packet.case_key??null,stage:'HOLD_NO_SCIENTIFIC_FORECAST',
  blockers:issues,lines:[],real_money_authority:false,production_authority:false};
 const results=[];const seen=new Set();
 for(const line of packet.lines){
  const blockers=[];
  if(!ident(line?.line_id)||seen.has(line.line_id))blockers.push('DUPLICATE_OR_MISSING_LINE_KEY');
  seen.add(line?.line_id);
  if(line?.market_period!==packet.market_period||
    line?.settlement_rule!==packet.settlement_rule)
   blockers.push('LINE_PERIOD_OR_RULE_MISMATCH');
  let model=null,baseline=null;
  if(!blockers.length)try{
   model=mixture(packet.model,line);baseline=mixture(packet.baseline,line);
  }catch(e){blockers.push(String(e.message||e));}
  results.push({line_id:line?.line_id??null,
   threshold:line?.threshold??null,side:line?.side??null,
   model_probability:model?round(model.probability):null,
   baseline_probability:baseline?round(baseline.probability):null,
   model_push_probability:model?round(model.push):null,
   baseline_push_probability:baseline?round(baseline.push):null,
   model_scenario_sensitivity_range:model?
    [round(model.sensitivity_min),round(model.sensitivity_max)]:null,
   difference_from_baseline:model&&baseline?round(model.probability-baseline.probability):null,
   blockers,stage:blockers.length?'HOLD_INVALID_LINE':'UNVALIDATED_RESEARCH_PROBABILITY'});
 }
 return {contract:DISTRIBUTION_CONTRACT,
  case_key:packet.case_key??null,event_id:packet.event_id,
  source_cutoff:packet.features_observed_at,frozen_at:packet.frozen_at,
  baseline_key:packet.baseline.model_key,model_key:packet.model.model_key,
  distribution_family:packet.model.family,
  outcome_unit:packet.outcome_unit||null,
  lines:results,stage:results.some(x=>x.blockers.length)?'PARTIAL_LINE_HOLD':'SHADOW_UNVALIDATED_RESEARCH',
  blockers:[],training_outcomes_observed:0,
  confidence_interval_estimated:false,probability_calibrated:false,
  exact_bookmaker_price_used:false,expected_profit_calculated:false,
  real_money_authority:false,production_authority:false,
  caveat:'Scenario min/max are sensitivity ranges, NOT statistical 95% bounds. These numbers are conditional mathematics from supplied parameters; authenticity, parameter fitting and calibration remain unproven.'};
}
