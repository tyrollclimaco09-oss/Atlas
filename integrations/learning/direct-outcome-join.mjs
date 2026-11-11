/**
 * Evidence evaluation from the *actual archived* NBA and ESPN HTTPS bytes.
 * No user-supplied "verified" flag, URL-as-proof or fabricated native DK ID.
 * Missing provider source means explicit HOLD. Same scores are correlation,
 * not a guarantee that the two upstream editorial feeds are independent.
 */
import {verifySourceCapture} from './direct-source-capture.mjs';
import {validateProspectiveFreeze} from './prospective-source-freeze.mjs';
import {verifyRecordControl} from './record-control-challenger.mjs';
export const DIRECT_OUTCOME_CONTRACT='ATLAS_NBA_DUAL_HTTPS_OUTCOME_EVALUATION_V1';
const alias={GS:'GSW',NO:'NOP',NY:'NYK',SA:'SAS',WSH:'WAS',UTAH:'UTA'};
const team=s=>typeof s==='string'?(alias[s.toUpperCase()]||s.toUpperCase()):null;
const nat=x=>Number.isSafeInteger(x)&&x>=0&&x<300;
const score=v=>{
 if(typeof v==='number')return nat(v)?v:null;
 if(typeof v==='string'&&/^\d{1,3}$/.test(v)){const n=Number(v);return nat(n)?n:null;}
 if(v&&typeof v==='object')return score(v.value??v.displayValue);
 return null;
};
const validTime=s=>typeof s==='string'&&Number.isFinite(Date.parse(s));
function nbaScheduleGames(json,date) {
 const dates=json?.leagueSchedule?.gameDates;
 if(!Array.isArray(dates))throw Error('NBA_SOURCE_SCHEMA_INVALID');
 const searchDate=date.replace(/-/g,'');
 const out=[];
 for(const day of dates){
  if(!Array.isArray(day?.games))continue;
  for(const g of day.games){
   if(typeof g?.gameCode!=='string'||g.gameCode.slice(0,8)!==searchDate)continue;
   const home=team(g.homeTeam?.teamTricode),away=team(g.awayTeam?.teamTricode);
   if(!home||!away||!/^\d{10}$/.test(String(g.gameId||'')))throw Error('NBA_GAME_SCHEMA_INVALID');
   out.push({id:String(g.gameId),home,away,
    event_start:g.gameDateTimeUTC||g.gameDateUTC||null,
    status:Number(g.gameStatus),home_score:score(g.homeTeam?.score),
    away_score:score(g.awayTeam?.score),status_text:g.gameStatusText||null});
  }
 }
 return out;
}
function espnScoreboardGames(json,date){
 if(!Array.isArray(json?.events))throw Error('ESPN_SOURCE_SCHEMA_INVALID');
 const out=[];
 for(const e of json.events){
  const comps=e?.competitions;
  if(!Array.isArray(comps)||comps.length!==1)throw Error('ESPN_COMPETITION_SCHEMA_INVALID');
  const c=comps[0];
  const t=c.competitors;
  if(!Array.isArray(t)||t.length!==2)throw Error('ESPN_GAME_SCHEMA_INVALID');
  const home=t.filter(x=>x.homeAway==='home'),away=t.filter(x=>x.homeAway==='away');
  if(home.length!==1||away.length!==1||!home[0]?.team?.abbreviation||!away[0]?.team?.abbreviation)
   throw Error('ESPN_GAME_IDENTITY_INVALID');
  if(!/^\d+$/.test(String(e.id||''))||!validTime(e.date))throw Error('ESPN_GAME_SCHEMA_INVALID');
  out.push({id:String(e.id),home:team(home[0].team.abbreviation),
    away:team(away[0].team.abbreviation),event_start:e.date,
    completed:e.status?.type?.completed===true&&
       (e.status?.type?.state==='post'||c.status?.type?.state==='post'),
    home_score:score(home[0].score),away_score:score(away[0].score)});
 }
 return out;
}
function calc(p,y){return {brier:(p-y)**2,logloss:-(y*Math.log(p)+(1-y)*Math.log(1-p))};}
function avg(a,k){return a.length?a.reduce((s,x)=>s+x[k],0)/a.length:null;}
export function evaluateCapturedNBACohort({source,sourceSha,cohort,challenger,
 nbaCapture=null,espnCapture=null,requestedDate}={}){
 validateProspectiveFreeze(source,cohort,sourceSha);
 verifyRecordControl(source,cohort,sourceSha,challenger);
 if(requestedDate!==cohort.slate_date_ct)throw Error('CAPTURE_DATE_NOT_COHORT');
 const sourceStatus=[];
 let nba=[],espn=[];
 for(const [label,c] of [['NBA_OFFICIAL_CDN',nbaCapture],['ESPN_SCOREBOARD',espnCapture]]){
   if(c===null){sourceStatus.push({provider:label,status:'MISSING_FETCH_NOT_AUTHENTICATED'});continue;}
   if(c.metadata?.provider!==label||c.metadata?.requested_date!==requestedDate)
    throw Error('CAPTURE_PROVIDER_DATE_MISMATCH');
   const parsed=verifySourceCapture(c.metadata,c.raw);
   if(label==='NBA_OFFICIAL_CDN')nba=nbaScheduleGames(parsed,requestedDate);
   else espn=espnScoreboardGames(parsed,requestedDate);
   sourceStatus.push({provider:label,status:'TRANSPORT_OBSERVED_BYTES_VERIFIED',
     sha256:c.metadata.sha256,raw_byte_length:c.metadata.raw_byte_length,
     observed_at:c.metadata.observed_at,url:c.metadata.request_url,
     provider_signature_verified:false,parsed_events:label==='NBA_OFFICIAL_CDN'?nba.length:espn.length});
 }
 const results=cohort.predictions.map(p=>{
   const issues=[];
   const key=p.away_team+'@'+p.home_team;
   const nm=nba.filter(g=>g.away+'@'+g.home===key);
   const em=espn.filter(g=>g.away+'@'+g.home===key);
   if(nm.length!==1)issues.push('NBA_OFFICIAL_EVENT_MISSING_OR_DUPLICATE');
   if(em.length!==1)issues.push('ESPN_EVENT_MISSING_OR_DUPLICATE');
   const n=nm.length===1?nm[0]:null,e=em.length===1?em[0]:null;
   if(n&&n.status!==3)issues.push('NBA_FINAL_STATUS_NOT_CONFIRMED');
   if(e&&!e.completed)issues.push('ESPN_FINAL_STATUS_NOT_CONFIRMED');
   if(n&&(!nat(n.home_score)||!nat(n.away_score)||n.home_score===n.away_score))
    issues.push('NBA_FINAL_SCORE_INVALID');
   if(e&&(!nat(e.home_score)||!nat(e.away_score)||e.home_score===e.away_score))
    issues.push('ESPN_FINAL_SCORE_INVALID');
   if(n&&e&&(n.home_score!==e.home_score||n.away_score!==e.away_score))
    issues.push('INDEPENDENT_DOMAIN_FINAL_SCORE_DISAGREEMENT');
   // Provider IDs are distinct namespaces; do not infer DK ID from NBA or ESPN.
   if(n&&(!validTime(n.event_start)||Math.abs(Date.parse(n.event_start)-Date.parse(p.event_start_utc))>3*3600000))
    issues.push('NBA_EVENT_START_CONFLICT');
   if(e&&(!validTime(e.event_start)||Math.abs(Date.parse(e.event_start)-Date.parse(p.event_start_utc))>3*3600000))
    issues.push('ESPN_EVENT_START_CONFLICT');
   const match=challenger.cases.filter(c=>c.canonical_source_event_key===p.canonical_source_event_key);
   if(match.length!==1)issues.push('RIVAL_IDENTITY_MISMATCH');
   // Require feed captures to be clearly after original tipoff and long enough after for a final.
   if(nbaCapture&&Date.parse(nbaCapture.metadata.observed_at)<=Date.parse(p.event_start_utc)+45*60000)
    issues.push('NBA_FETCH_TOO_EARLY_FOR_FINAL');
   if(espnCapture&&Date.parse(espnCapture.metadata.observed_at)<=Date.parse(p.event_start_utc)+45*60000)
    issues.push('ESPN_FETCH_TOO_EARLY_FOR_FINAL');
   const eligible=issues.length===0;
   const y=eligible?Number(n.home_score>n.away_score):null;
   return {
     case_key:p.canonical_source_event_key,dk_original_competition_id:p.source_provider_competition_id,
     nba_game_id:n?.id??null,espn_event_id:e?.id??null,
     status:eligible?'TWO_HTTPS_ORIGINS_AGREE_PROVISIONAL':'HOLD_SOURCE_OR_IDENTITY',
     reasons:issues,final:eligible?{home_score:n.home_score,away_score:n.away_score,home_won:y}:null,
     metrics:eligible?{
      ppg18:calc(p.model_probability_home,y),
      record:calc(match[0].probability_home,y),
      neutral:calc(p.frozen_baseline_probability_home,y)
     }:null,
     provider_signed_outcome:false,canonical_event_attested:false,
     production_training_authority:false,roi_authority:false
   };
 });
 const scored=results.filter(x=>x.status==='TWO_HTTPS_ORIGINS_AGREE_PROVISIONAL');
 const m=key=>({
  brier:avg(scored.map(x=>x.metrics[key]),'brier'),
  logloss:avg(scored.map(x=>x.metrics[key]),'logloss')
 });
 const metrics=scored.length?{ppg18:m('ppg18'),record:m('record'),neutral:m('neutral'),
    pp18_minus_neutral_brier:m('ppg18').brier-m('neutral').brier,
    pp18_minus_record_brier:m('ppg18').brier-m('record').brier,
    selection_warning:scored.length===cohort.count?
      'SINGLE_DAY_UNCALIBRATED_COHORT':'PARTIAL_CASE_SELECTION_BIAS'}:null;
 return {contract:DIRECT_OUTCOME_CONTRACT,status:scored.length?'PROVISIONAL_TWO_DOMAIN_RESEARCH':'HOLD_NO_CONFIRMED_RESULTS',
   requested_date:requestedDate,source_captures:sourceStatus,
   frozen_case_count:cohort.count,provisional_scored_count:scored.length,
   held_count:results.length-scored.length,full_cohort:scored.length===cohort.count,
   results,metrics,official_authenticated_production_cases:0,
   provider_digital_signatures_present:false,
   original_feed_dependency_independent:false,
   training_promoted:false,executed_bets:0,real_betting_authority:false,
   no_database_mutation:true,
   warning:'Transport-observed NBA+ESPN domains and preserved bytes permit audit; not cryptographically vendor-signed, and source editorial independence is unverified. No book price/ROI inference.'};
}
