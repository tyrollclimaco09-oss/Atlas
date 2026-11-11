/**
 * Shadow-only NBA prospective postgame reconciliation.
 * It never fetches data, trusts a self-declared "verified" boolean, rewrites
 * a freeze, or grants calibration / betting / ROI authority.
 *
 * Observations are explicit append-only source claims provided via stdin.
 * Two agreeing source claims are useful research evidence, NOT authenticated
 * original vendor bytes or proof that syndication is independent.
 */
import {validateProspectiveFreeze} from './prospective-source-freeze.mjs';
import {verifyRecordControl} from './record-control-challenger.mjs';
export const EVIDENCE_CONTRACT='ATLAS_NBA_POSTGAME_RESULT_OBSERVATION_V1';
export const EVAL_CONTRACT='ATLAS_NBA_PROSPECTIVE_POSTGAME_EVALUATION_V1';
const date=x=>typeof x==='string'&&Number.isFinite(Date.parse(x));
const text=x=>typeof x==='string'&&x.trim().length>0;
const uniq=x=>[...new Set(x)];
const finiteProbability=x=>typeof x==='number'&&Number.isFinite(x)&&x>0&&x<1;
const isScore=x=>Number.isSafeInteger(x)&&x>=0&&x<300;
const validSha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
function metric(p,y){return {brier:Number(((p-y)**2).toFixed(12)),
  log_loss:Number((-(y*Math.log(p)+(1-y)*Math.log(1-p))).toFixed(12))};}
function mean(rows,key){return rows.length?Number((rows.reduce((n,x)=>n+x[key],0)/rows.length).toFixed(12)):null;}
function validObservation(o,p){
 const errors=[];
 if(o?.contract!==EVIDENCE_CONTRACT)errors.push('OBSERVATION_CONTRACT_INVALID');
 if(o?.canonical_source_event_key!==p.canonical_source_event_key||
    o?.home_team!==p.home_team||o?.away_team!==p.away_team)
    errors.push('EVENT_OR_TEAM_IDENTITY_MISMATCH');
 if(o?.origin==='CONNECTED_DK_SCORES'){
   if(o?.provider_competition_id!==p.source_provider_competition_id||
      o?.home_team_id!==p.source_home_team_id||
      o?.away_team_id!==p.source_away_team_id||
      o?.source_uri!=='connected-draftkings:competition/'+String(p.source_provider_competition_id))
     errors.push('NATIVE_PROVIDER_IDENTITY_MISMATCH');
 } else if(o?.origin==='NBA_OFFICIAL_PUBLIC_PAGE'){
   if(typeof o?.source_uri!=='string'||!/^https:\/\/(?:www\.)?nba\.com\/game\/[^\s?#]+/.test(o.source_uri))
     errors.push('OFFICIAL_PAGE_REFERENCE_INVALID');
   // A syntactically official URL cannot authenticate the asserted score.
 } else errors.push('SOURCE_ORIGIN_INVALID');
 if(o?.game_status!=='Final')errors.push('GAME_NOT_FINAL');
 if(!isScore(o?.home_score)||!isScore(o?.away_score)||o.home_score===o.away_score)
   errors.push('FINAL_SCORE_INVALID');
 if(!date(o?.observed_at)||Date.parse(o?.observed_at)<Date.parse(p.event_start_utc)+45*60*1000)
   errors.push('NOT_POST_START_FINAL_OBSERVATION');
 if(!text(o?.receipt_id)||!text(o?.evidence_excerpt)||!validSha(o?.capture_sha256))
   errors.push('SOURCE_CAPTURE_EVIDENCE_MISSING');
 return uniq(errors);
}
export function evaluateProspectivePostgame({source,cohort,sourceBlobSha,challenger,observations}={}){
 const frozen=validateProspectiveFreeze(source,cohort,sourceBlobSha);
 verifyRecordControl(source,cohort,sourceBlobSha,challenger);
 if(!Array.isArray(observations)||observations.length>200)
   throw Error('POSTGAME_OBSERVATIONS_INVALID');
 const IDs=new Set(cohort.predictions.map(p=>p.canonical_source_event_key));
 const unknown=observations.filter(o=>!IDs.has(o?.canonical_source_event_key))
  .map(o=>({receipt_id:o?.receipt_id??null,event_key:o?.canonical_source_event_key??null}));
 if(unknown.length)throw Error('POSTGAME_UNKNOWN_EVENT_REJECTED');
 const receiptIDs=new Set();
 for(const o of observations){
   if(text(o?.receipt_id)&&receiptIDs.has(o.receipt_id))throw Error('POSTGAME_DUPLICATE_RECEIPT_ID');
   if(text(o?.receipt_id))receiptIDs.add(o.receipt_id);
 }
 const rows=cohort.predictions.map(p=>{
   const obs=observations.filter(o=>o?.canonical_source_event_key===p.canonical_source_event_key);
   const dk=obs.filter(o=>o.origin==='CONNECTED_DK_SCORES');
   const nba=obs.filter(o=>o.origin==='NBA_OFFICIAL_PUBLIC_PAGE');
   const blockers=[];
   if(obs.some(o=>!['CONNECTED_DK_SCORES','NBA_OFFICIAL_PUBLIC_PAGE'].includes(o.origin)))
     blockers.push('UNKNOWN_SOURCE_ORIGIN');
   if(dk.length!==1)blockers.push('MISSING_OR_DUPLICATE_DK_FINAL');
   if(nba.length!==1)blockers.push('MISSING_OR_DUPLICATE_NBA_FINAL');
   const dr=dk.length===1?dk[0]:null, nr=nba.length===1?nba[0]:null;
   if(dr)blockers.push(...validObservation(dr,p));
   if(nr)blockers.push(...validObservation(nr,p));
   if(dr&&nr&&dr.receipt_id===nr.receipt_id)blockers.push('REUSED_EVIDENCE_RECEIPT');
   if(dr&&nr&&dr.capture_sha256===nr.capture_sha256)blockers.push('REUSED_CAPTURE_BETWEEN_SOURCES');
   if(dr&&nr&&dr.upstream_chain_id&&nr.upstream_chain_id&&
      dr.upstream_chain_id===nr.upstream_chain_id)blockers.push('SHARED_UPSTREAM_CHAIN_DECLARED');
   if(dr&&nr&&(dr.home_score!==nr.home_score||dr.away_score!==nr.away_score))
     blockers.push('SOURCES_DISAGREE_ON_FINAL');
   const r=challenger.cases.filter(c=>c.canonical_source_event_key===p.canonical_source_event_key);
   if(r.length!==1||r[0].source_provider_competition_id!==p.source_provider_competition_id)
     blockers.push('CHALLENGER_NOT_UNIQUELY_BOUND');
   if(!finiteProbability(p.model_probability_home)||!finiteProbability(r[0]?.probability_home)||
      p.frozen_baseline_probability_home!==0.5)blockers.push('FROZEN_PROBABILITY_INVALID');
   const reasons=uniq(blockers), admissible=reasons.length===0;
   const y=admissible?Number(dr.home_score>dr.away_score):null;
   const brier=admissible?{
     ppg18:metric(p.model_probability_home,y),
     record_control:metric(r[0].probability_home,y),
     neutral:metric(p.frozen_baseline_probability_home,y)
   }:null;
   return {canonical_source_event_key:p.canonical_source_event_key,
    provider_competition_id:p.source_provider_competition_id,
    source_receipt_ids:obs.map(x=>x.receipt_id||null),
    status:admissible?'TWO_SOURCE_AGREEMENT_PROVISIONAL_RESEARCH':'HOLD_INCOMPLETE_OR_CONFLICTED_RESULT',
    blockers:reasons,
    home_won_recorded:admissible?y:null,
    final_score:admissible?{home:dr.home_score,away:dr.away_score}:null,
    metrics:brier,
    verified_official_source:false,authenticated_canonical_market:false,
    model_calibration_eligible:false,pricing_roi_eligible:false,
    result_observations_authenticated:false};
 });
 const good=rows.filter(x=>x.status==='TWO_SOURCE_AGREEMENT_PROVISIONAL_RESEARCH');
 const scores=good.map(x=>({case_key:x.canonical_source_event_key,
   ppg_brier:x.metrics.ppg18.brier,record_brier:x.metrics.record_control.brier,
   neutral_brier:x.metrics.neutral.brier,
   ppg_logloss:x.metrics.ppg18.log_loss,record_logloss:x.metrics.record_control.log_loss,
   neutral_logloss:x.metrics.neutral.log_loss}));
 const summary=good.length?{
   cases:good.length,hold_cases:rows.length-good.length,
   ppg18_mean_brier:mean(scores,'ppg_brier'),
   record_control_mean_brier:mean(scores,'record_brier'),
   neutral_mean_brier:mean(scores,'neutral_brier'),
   ppg18_mean_log_loss:mean(scores,'ppg_logloss'),
   record_control_mean_log_loss:mean(scores,'record_logloss'),
   neutral_mean_log_loss:mean(scores,'neutral_logloss'),
   ppg18_minus_neutral_brier:Number((mean(scores,'ppg_brier')-mean(scores,'neutral_brier')).toFixed(12)),
   ppg18_minus_record_brier:Number((mean(scores,'ppg_brier')-mean(scores,'record_brier')).toFixed(12)),
   warning:good.length!==rows.length?'PARTIAL_SELECTIVE_SAMPLE_NOT_COMPLETE_COHORT':'SINGLE_DAY_SAMPLE_NOT_CALIBRATION'
 }:null;
 return {contract:EVAL_CONTRACT,
  state:good.length?'PROVISIONAL_RESEARCH_DIAGNOSTIC':'NO_ADMISSIBLE_RESULTS',
  frozen_case_count:frozen.cases,provisional_scored_count:good.length,
  held_count:rows.length-good.length,all_cases_accounted_for:rows.length===cohort.count,
  full_cohort_crosschecked:good.length===cohort.count,
  source_credential_authentication:'NOT_ESTABLISHED',
  independence_of_upstream_source_origins:'NOT_ESTABLISHED',
  official_calibration_sample_count:0,
  paired_metrics:summary,
  per_case:rows,
  original_forecasts_unchanged:true,
  no_bets:true,no_paper_debits:true,
  production_authority:false,pricing_roi_authority:false,real_betting_authority:false,
  limitations:['Claims must be separately retrieved and saved with actual source evidence after the games; no URL or SHA declaration proves provider authentication.',
    'Two agreement sources are not guaranteed upstream-independent.',
    'Unmatched, duplicate, postponed, void and disputed games HOLD rather than being assumed losses.',
    'Single-day samples are too small and dependent for calibration or profitable-model inference.']};
}
