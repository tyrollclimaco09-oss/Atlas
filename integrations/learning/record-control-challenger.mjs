/**
 * Separately preregistered NBA opponent win/loss control.
 * Built only from pre-event team records in the ORIGINAL connected snapshot,
 * independent of PPG model arithmetic but NOT independent source provenance.
 * Never replace/mutate the original PPG freeze.
 */
import {validateProspectiveFreeze} from './prospective-source-freeze.mjs';
export const RECORD_CONTROL_CONTRACT='ATLAS_NBA_RECORD_ODDS_CHALLENGER_V1';
export const RECORD_CONTROL_MODEL='NBA_LAPLACE_RECORD_LOGODDS_HALF_V0';
const finiteTime=s=>typeof s==='string'&&Number.isFinite(Date.parse(s));
const pairs=s=>{const m=/^(\d{1,2})-(\d{1,2})$/.exec(s||'');if(!m)throw Error('RECORD_INPUT_INVALID');return [Number(m[1]),Number(m[2])];};
export function recordProbability(homeRecord,awayRecord){
 const [hw,hl]=pairs(homeRecord),[aw,al]=pairs(awayRecord);
 // Neutral shrink: half the difference in Laplace-smoothed log odds.
 // No home-court adjustment, bookmaker price, fitted or holdout parameters.
 return Number((1/(1+Math.exp(-0.5*(Math.log((hw+1)/(hl+1))-Math.log((aw+1)/(al+1)))))).toFixed(9));
}
function canonical(x){
 if(Array.isArray(x))return x.map(canonical);
 if(x&&typeof x==='object')return Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])]));
 return x;
}
export function createRecordControl(source,original,sha,{frozenAt}={}){
 validateProspectiveFreeze(source,original,sha);
 if(!finiteTime(frozenAt)||Date.parse(frozenAt)<Date.parse(original.prepared_at_utc)||
    Date.parse(frozenAt)>=Math.min(...original.predictions.map(x=>Date.parse(x.event_start_utc))))
    throw Error('RECORD_CONTROL_NOT_PRESTART');
 const cases=original.predictions.map(p=>{
  const g=source.games.find(g=>g.provider_competition_id===p.source_provider_competition_id);
  if(!g)throw Error('RECORD_SOURCE_GAME_MISSING');
  const home=g.teams.find(x=>x.home===true),away=g.teams.find(x=>x.home===false);
  if(!home||!away||home.abbreviation!==p.home_team||away.abbreviation!==p.away_team||
     home.provider_team_id!==p.source_home_team_id||away.provider_team_id!==p.source_away_team_id)
     throw Error('RECORD_CONTROL_TEAM_MISMATCH');
  return {canonical_source_event_key:p.canonical_source_event_key,
    source_provider_competition_id:g.provider_competition_id,
    source_home_record:home.record,source_away_record:away.record,
    probability_home:recordProbability(home.record,away.record)};
 });
 return {contract:RECORD_CONTROL_CONTRACT,status:'FROZEN_EXPLORATORY_RIVAL_RESEARCH_ONLY',
   original_forecast_prepared_at:original.prepared_at_utc,
   challenger_frozen_at:frozenAt,source_git_blob_sha:sha,
   source_provider_request_id:source.provider_request_id,
   model:{key:RECORD_CONTROL_MODEL,
     formula:'sigmoid(0.5*(ln((homeW+1)/(homeL+1))-ln((awayW+1)/(awayL+1))))',
     weight:0.5,pseudocount:1,calibrated:false,trained_on_holdout:false,
     odds_or_market_prices_used:false},
   cases,results:null,forecast_skill_eligible:false,
   paper_stakes:0,production_authority:false,real_betting_authority:false};
}
export function verifyRecordControl(source,original,sha,challenger){
 if(!challenger||challenger.contract!==RECORD_CONTROL_CONTRACT||
    challenger.source_git_blob_sha!==sha)throw Error('RECORD_CONTROL_CONTRACT_INVALID');
 const expected=createRecordControl(source,original,sha,{frozenAt:challenger.challenger_frozen_at});
 if(JSON.stringify(canonical(expected))!==JSON.stringify(canonical(challenger)))
   throw Error('RECORD_CONTROL_DRIFT_OR_FORGERY');
 return {status:'RECORD_CONTROL_FROZEN_MATCH',cases:challenger.cases.length};
}
