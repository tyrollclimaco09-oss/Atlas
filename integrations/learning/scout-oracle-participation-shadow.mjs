/**
 * SCOUT -> ORACLE experimental participation/rate adapter (SHADOW ONLY).
 * Uses the original ATLAS distribution-ladder.mjs to score an assists count.
 * Model: minutes scenarios + Gamma-Poisson rate posterior -> NegBin count.
 * This is conditional mathematical research, NOT source authentication or
 * proved sporting forecasting performance. No bookmakers, network or writes.
 */
import {createHash} from 'node:crypto';
import {compileDistributionLadder,DISTRIBUTION_CONTRACT} from './distribution-ladder.mjs';
export const PARTICIPATION_CONTRACT='ATLAS_SCOUT_ORACLE_ASSISTS_RESEARCH_V1';
const TEXT=v=>typeof v==='string'&&v.trim().length>0&&v.length<=240;
const NUM=v=>typeof v==='number'&&Number.isFinite(v);
const TIME=v=>typeof v==='string'?Date.parse(v):NaN;
const UNIQ=a=>[...new Set(a)];
const HOLD=(p,errors,detail={})=>({contract:PARTICIPATION_CONTRACT,case_key:p?.case_key??null,
 stage:'HOLD_UNQUALIFIED_PARTICIPATION',blockers:UNIQ(errors),model_probability:null,
 baseline_probability:null,source_authenticated:false,confidence_calibrated:false,
 real_money_authority:false,production_authority:false,execution_authority:false,...detail});
function validateCapture(c,p,cutoff){
 const errors=[];const add=s=>errors.push(s);
 if(!TEXT(c?.receipt_id)||!TEXT(c?.source_reference)||!TEXT(c?.source_name))add('SOURCE_RECEIPT_IDENTITY_MISSING');
 if(!NUM(TIME(c?.observed_at))||TIME(c.observed_at)>cutoff)add('SOURCE_RECEIPT_OBSERVED_AFTER_CUTOFF');
 if(typeof c?.raw_json!=='string'||Buffer.byteLength(c.raw_json,'utf8')>500_000)add('SOURCE_RAW_BYTES_MISSING_OR_LARGE');
 const digest=typeof c?.raw_json==='string'?createHash('sha256').update(Buffer.from(c.raw_json,'utf8')).digest('hex'):null;
 if(!/^[a-f0-9]{64}$/.test(c?.raw_sha256??'')||c.raw_sha256!==digest)add('SOURCE_SHA256_MISMATCH');
 if(errors.length)return {errors,rows:[]};
 let obj;try{obj=JSON.parse(c.raw_json)}catch{return {errors:['SOURCE_NORMALIZATION_JSON_INVALID'],rows:[]};}
 if(obj?.contract!=='ATLAS_NORMALIZED_NBA_ASSIST_BOX_OBSERVATIONS_V1'||
    obj?.player_id!==p.player_id||obj?.game_scope!=='NBA_REGULATION_PLUS_OVERTIME'||
    !Array.isArray(obj?.rows)||obj.rows.length<1||obj.rows.length>100)
  return {errors:['SOURCE_NORMALIZATION_IDENTITY_OR_SCOPE_MISMATCH'],rows:[]};
 return {errors:[],rows:obj.rows.map(x=>({...x,source_receipt_id:c.receipt_id,
  source_observed_at:c.observed_at}))};
}
/**
 * Input normalized boxes are NOT original NBA raw bytes or attested provider records.
 * Hash verifies supplied bytes against supplied digest only. Source attestation
 * and historical period-accurate NBA identity are separate upstream gates.
 */
export function forecastAssistDistribution(packet){
 if(!packet||packet.contract!==PARTICIPATION_CONTRACT)return HOLD(packet,['PARTICIPATION_PACKET_CONTRACT_INVALID']);
 const errors=[];const add=x=>errors.push(x);
 if(!TEXT(packet.case_key)||!TEXT(packet.event_id)||!TEXT(packet.player_id)||!TEXT(packet.team_id))
  add('EVENT_PLAYER_TEAM_OR_CASE_ID_MISSING');
 if(packet.sport!=='NBA'||packet.target_stat!=='assists'||packet.market_period!=='FULL'||
   packet.settlement_rule!=='REGULATION_AND_OT')add('ASSISTS_CONTRACT_SCOPE_MISMATCH');
 const start=TIME(packet.event_start_at),frozen=TIME(packet.frozen_at),cut=TIME(packet.feature_cutoff);
 if(!Number.isFinite(start)||!Number.isFinite(frozen)||!Number.isFinite(cut)||
  !(cut<=frozen&&frozen<start))add('POINT_IN_TIME_FORECAST_INVALID');
 if(packet.model_uses_bookmaker_odds!==false)add('PRICE_INDEPENDENCE_NOT_DECLARED');
 if(packet.availability_status!=='AVAILABLE')add('PARTICIPATION_UNAVAILABLE_OR_UNKNOWN');
 const prior=packet.prior??{};
 if(!NUM(prior.alpha)||prior.alpha<=0||prior.alpha>100||
    !NUM(prior.beta_minutes)||prior.beta_minutes<=0||prior.beta_minutes>1000)
    add('GAMMA_PRIOR_OUTSIDE_REGISTERED_DOMAIN');
 const cases=packet.scenarios;
 if(!Array.isArray(cases)||cases.length<1||cases.length>8)add('PARTICIPATION_SCENARIOS_INVALID');
 else {
  const ids=[];let sum=0;
  for(const sc of cases){
   ids.push(sc?.id);
   if(!TEXT(sc?.id)||!NUM(sc?.minutes)||sc.minutes<0||sc.minutes>60||
      !NUM(sc?.weight)||sc.weight<=0||sc.weight>1)add('PARTICIPATION_SCENARIO_INVALID');
   else sum+=sc.weight;
  }
  if(new Set(ids).size!==ids.length)add('PARTICIPATION_SCENARIO_DUPLICATE');
  if(Math.abs(sum-1)>1e-9)add('PARTICIPATION_WEIGHTS_UNRESOLVED');
 }
 if(!Array.isArray(packet.source_receipts)||packet.source_receipts.length<1||packet.source_receipts.length>8)
  add('SOURCE_RECEIPTS_MISSING');
 let rows=[];
 if(Array.isArray(packet.source_receipts)){
  const receipts=new Set();
  for(const c of packet.source_receipts){
   if(receipts.has(c?.receipt_id))add('DUPLICATE_SOURCE_RECEIPT');
   receipts.add(c?.receipt_id);
   const r=validateCapture(c,packet,cut);
   errors.push(...r.errors);rows.push(...r.rows);
  }
 }
 if(rows.length<6||rows.length>80)add('HISTORY_OUTSIDE_MINIMUM_OR_MAXIMUM_WINDOW');
 const eventIds=new Set();let assists=0,minutes=0;
 for(const row of rows){
  if(!TEXT(row?.event_id)||eventIds.has(row.event_id))add('DUPLICATE_OR_INVALID_HISTORY_GAME');
  eventIds.add(row?.event_id);
  if(row?.event_id===packet.event_id)add('FORECAST_TARGET_IN_TRAINING_DATA');
  if(row?.player_id!==packet.player_id||row?.team_id!==packet.team_id)
   add('HISTORY_PLAYER_OR_TEAM_MISMATCH');
  if(!NUM(row?.minutes)||row.minutes<=0||row.minutes>60||
    !Number.isSafeInteger(row?.assists)||row.assists<0||row.assists>40)
   add('HISTORY_BOX_STAT_INVALID');
  if(!Number.isFinite(TIME(row?.event_start_at))||
    !Number.isFinite(TIME(row?.final_at))||
    !(TIME(row.event_start_at)<TIME(row.final_at)&&TIME(row.final_at)<=TIME(row.source_observed_at)&&
      TIME(row.source_observed_at)<=cut&&TIME(row.event_start_at)<start))
    add('HISTORY_BOX_OBSERVED_AFTER_CUTOFF_OR_NOT_FINAL');
  if(NUM(row?.minutes)&&Number.isSafeInteger(row?.assists)){
   minutes+=row.minutes;assists+=row.assists;
  }
 }
 if(minutes<100||assists<0)add('NOT_ENOUGH_HISTORICAL_EXPOSURE');
 const alpha=prior.alpha+assists,beta=prior.beta_minutes+minutes;
 if(alpha>500||alpha<=0||beta<=0)add('GAMMA_POSTERIOR_OUTSIDE_DISTRIBUTION_DOMAIN');
 if(errors.length)return HOLD(packet,errors,{history_games:rows.length,history_assists:assists,
  history_minutes:minutes});
 const rate=alpha/beta,rawRate=assists/minutes;
 const histMeanMinutes=minutes/rows.length;
 const lines=Array.isArray(packet.lines)&&packet.lines.length?packet.lines:[4,6,8,10];
 if(lines.length>40||lines.some(x=>!Number.isInteger(x)||x<1||x>40)||new Set(lines).size!==lines.length)
  return HOLD(packet,['ASSISTS_LADDER_THRESHOLDS_INVALID']);
 const ladderInput={contract:DISTRIBUTION_CONTRACT,case_key:packet.case_key,
  sport:'NBA',event_id:packet.event_id,selection_id:packet.player_id,
  market_family:'assists',market_period:'FULL',settlement_rule:'REGULATION_AND_OT',
  event_start_at:packet.event_start_at,frozen_at:packet.frozen_at,
  features_observed_at:packet.feature_cutoff,
  source_receipts:packet.source_receipts.map(c=>({receipt_id:c.receipt_id,observed_at:c.observed_at})),
  outcome_unit:'assists',lines:lines.map(k=>({line_id:`AST_GE_${k}`,threshold:k-0.5,
   side:'over',market_period:'FULL',settlement_rule:'REGULATION_AND_OT'})),
  model:{model_key:'ORACLE_PARTICIPATION_GAMMA_POISSON_SHADOW',version:'V0',family:'negative_binomial',
   uses_bookmaker_odds:false,scenarios:cases.map(s=>({id:s.id,weight:s.weight,
    params:{mean:rate*s.minutes,dispersion:alpha}}))},
  baseline:{model_key:'HISTORY_FIXED_MINUTES_POISSON_APPROX',version:'V0',family:'negative_binomial',
   uses_bookmaker_odds:false,scenarios:[{id:'HISTORY_MEAN',weight:1,
    params:{mean:rawRate*histMeanMinutes,dispersion:500}}]}};
 const ladder=compileDistributionLadder(ladderInput);
 if(ladder.blockers.length||ladder.lines.some(x=>x.blockers.length))return HOLD(packet,[...ladder.blockers,
  ...ladder.lines.flatMap(x=>x.blockers)]);
 return {contract:PARTICIPATION_CONTRACT,case_key:packet.case_key,
  stage:'SHADOW_UNVALIDATED_RESEARCH_PROBABILITIES',source_authenticated:false,
  parameter_fit_status:'NUMERIC_GAMMA_POISSON_CONDITIONAL_ON_UNATTESTED_NORMALIZED_BOXES',
  historical_games:rows.length,history_assists:assists,history_minutes:minutes,
  posterior_rate_shape:alpha,posterior_rate_beta_minutes:beta,
  posterior_mean_assists_per_minute:rate,
  baseline_assists_per_minute:rawRate,
  scenario_minutes_and_weights:cases.map(s=>({id:s.id,minutes:s.minutes,weight:s.weight})),
  ladder,model_probability:ladder.lines.find(x=>x.line_id==='AST_GE_6')?.model_probability??null,
  baseline_probability:ladder.lines.find(x=>x.line_id==='AST_GE_6')?.baseline_probability??null,
  confidence_calibrated:false,probability_source_attested:false,
  independent_pregame_identity_verified:false,trust_warning:'Hash and time check do not authenticate raw NBA/provider origin, minutes scenarios or forecasts. All values remain experimental.',
  real_money_authority:false,production_authority:false,execution_authority:false};
}