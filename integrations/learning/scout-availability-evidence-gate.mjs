/**
 * ATLAS SCOUT -> FILTER: official-publication participation research gate V0.
 * SHADOW / READ ONLY. This classifies a claimed source receipt, not source
 * authentication. URLs, hashes, excerpts, and status fields can be forged by
 * callers. A separately trusted capture and player/event identity attestor is
 * mandatory before forecast admission. Never converts "not listed" to "available".
 */
import {createHash} from 'node:crypto';
export const AVAILABILITY_GATE_CONTRACT='ATLAS_SCOUT_AVAILABILITY_RESEARCH_GATE_V0';
const nonempty=x=>typeof x==='string'&&x.length>0&&x.length<=300;
const iso=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))?Date.parse(x):NaN;
const unique=a=>[...new Set(a)];
const FINDINGS=new Set(['OUT','DOUBTFUL','QUESTIONABLE','PROBABLE','AVAILABLE',
  'NOT_LISTED','TEAM_SECTION_MISSING','TEAM_NOT_SUBMITTED','INJURY_REEVALUATION']);
const STRONG_OUT=new Set(['OUT','INJURY_REEVALUATION']);
const UNCERTAIN=new Set(['DOUBTFUL','QUESTIONABLE','PROBABLE']);
function originalUrlAllowed(url,family){
  try{
    const u=new URL(url);
    if(u.protocol!=='https:'||u.username||u.password||u.port||u.search||u.hash)return false;
    if(family==='NBA_INJURY_PDF')
      return u.hostname==='ak-static.cms.nba.com'&&
        /^\/referee\/injury\/Injury-Report_\d{4}-\d{2}-\d{2}_\d{2}_\d{2}(AM|PM)\.pdf$/.test(u.pathname);
    if(family==='NBA_TEAM_BULLETIN')
      return u.hostname==='www.nba.com'&&/^\/[a-z0-9-]+\/news\/[a-z0-9-]+$/.test(u.pathname);
    return false;
  }catch{return false;}
}
const digest=s=>createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const result=(p,blockers,summary,records)=>({
 contract:AVAILABILITY_GATE_CONTRACT,case_key:p?.case_key??null,
 stage:blockers.includes('PLAYER_OFFICIALLY_OUT_OR_REEVALUATION')?'HOLD_PLAYER_OUT':
       blockers.includes('CONFLICTING_OFFICIAL_PUBLICATIONS')?'HOLD_CONFLICT':
       'HOLD_EVIDENCE_OR_PARTICIPATION_UNQUALIFIED',
 blockers:unique(blockers),research_observations:records,
 findings_observed:summary,source_authenticated:false,
 canonical_nba_event_identity_attested:false,
 player_roster_identity_attested:false,
 player_confirmed_available:false,
 expected_minutes_attested:false,
 forecast_probability_eligible:false,
 direct_wager_authority:false,production_authority:false,
 caveat:'STRUCTURAL REVIEW ONLY: a URL or a self-matching hash is not vendor/source authentication; no complete NBA injury list guarantees an unlisted player will play.'
});
export function auditPlayerAvailability(packet){
 const issues=[],notes=[],records=[];
 if(!packet||packet.contract!==AVAILABILITY_GATE_CONTRACT)
   return result(packet,['INVALID_AVAILABILITY_PACKET'],notes,records);
 const add=x=>issues.push(x);
 const asof=iso(packet.as_of),tip=iso(packet.event_start_at),frozen=iso(packet.original_forecast_frozen_at);
 if(!nonempty(packet.case_key)||!nonempty(packet.canonical_event_key)||
    !nonempty(packet.player_id)||!nonempty(packet.team_id)||
    !nonempty(packet.player_name))add('MISSING_CASE_PLAYER_OR_EVENT_IDENTITY');
 if(!Number.isFinite(asof)||!Number.isFinite(tip)||asof>=tip)
   add('INVALID_PREGAME_EVALUATION_TIME');
 if(!Number.isFinite(frozen)||frozen>=tip)add('INVALID_ORIGINAL_FORECAST_FREEZE');
 if(!Array.isArray(packet.receipts)||packet.receipts.length===0||packet.receipts.length>12)
   add('NO_USABLE_AVAILABILITY_SOURCE_LIST');
 const seen=new Set(),timely=[];
 for(const rec of Array.isArray(packet.receipts)?packet.receipts:[]){
   const r=[];
   if(!nonempty(rec?.receipt_id)||seen.has(rec.receipt_id))r.push('DUPLICATE_OR_MISSING_RECEIPT_ID');
   if(nonempty(rec?.receipt_id))seen.add(rec.receipt_id);
   if(rec?.case_key!==packet.case_key||rec?.player_id!==packet.player_id||
      rec?.team_id!==packet.team_id||rec?.event_key!==packet.canonical_event_key)
      r.push('SOURCE_PLAYER_TEAM_EVENT_SCOPE_MISMATCH');
   if(!FINDINGS.has(rec?.finding))r.push('SOURCE_FINDING_UNRECOGNIZED');
   if(!originalUrlAllowed(rec?.source_url,rec?.source_family))
      r.push('SOURCE_ORIGIN_NOT_ALLOWLIST_MATCHED');
   if(typeof rec?.excerpt!=='string'||rec.excerpt.length<3||rec.excerpt.length>2000||
      !/^[a-f0-9]{64}$/.test(rec?.excerpt_sha256??'')||
      rec.excerpt_sha256!==digest(rec.excerpt))r.push('NORMALIZED_EXCERPT_SHA256_MISMATCH');
   const observed=iso(rec?.observed_at),published=iso(rec?.published_at);
   if(!Number.isFinite(observed)||!Number.isFinite(published)||published>observed)
      r.push('SOURCE_TIMESTAMPS_INCOHERENT');
   if(Number.isFinite(asof)&&(!Number.isFinite(observed)||observed>asof||
       !Number.isFinite(published)||published>asof))
      r.push('SOURCE_NOT_OBSERVED_AS_OF_EVALUATION');
   const originalPreexisting=Number.isFinite(frozen)&&Number.isFinite(published)&&published<=frozen;
   const capturedAfterOriginal=Number.isFinite(frozen)&&Number.isFinite(observed)&&observed>frozen;
   if(originalPreexisting&&capturedAfterOriginal)
      notes.push('PUBLISHED_PRE_FREEZE_BUT_SCOUT_CAPTURED_AFTER_FREEZE');
   if(Number.isFinite(frozen)&&Number.isFinite(observed)&&observed>frozen)
      notes.push('RECEIPT_NOT_ADMISSIBLE_TO_REWRITE_ORIGINAL_FORECAST');
   // A PDF's missing player entry is NOT a player-available designation.
   if(rec?.finding==='NOT_LISTED'||rec?.finding==='TEAM_SECTION_MISSING'||
      rec?.finding==='TEAM_NOT_SUBMITTED')
      notes.push('NO_POSITIVE_PLAY_AUTHORIZATION_FROM_ABSENCE');
   if(r.length)issues.push(...r);
   else timely.push(rec);
   records.push({receipt_id:rec?.receipt_id??null,finding:rec?.finding??null,
     published_at:rec?.published_at??null,observed_at:rec?.observed_at??null,
     source_url:rec?.source_url??null,structural_check:r.length?'FAIL':'PASS_STRUCTURAL_ONLY',
     errors:unique(r),published_before_original_freeze:originalPreexisting,
     captured_after_original_freeze:capturedAfterOriginal,
     trusted_original_bytes:false,source_authenticated:false});
 }
 if(!timely.length)add('NO_TIMELY_UNCONFLICTED_SOURCE_RECEIPT');
 const findings=timely.map(x=>x.finding),types=new Set(findings);
 if(findings.some(x=>STRONG_OUT.has(x)))add('PLAYER_OFFICIALLY_OUT_OR_REEVALUATION');
 if(findings.some(x=>UNCERTAIN.has(x)))add('PARTICIPATION_UNCERTAIN_NOT_AVAILABLE');
 if(types.has('OUT')&&types.has('AVAILABLE'))add('CONFLICTING_OFFICIAL_PUBLICATIONS');
 if(types.has('INJURY_REEVALUATION')&&types.has('AVAILABLE'))add('CONFLICTING_OFFICIAL_PUBLICATIONS');
 if(findings.length&&!findings.some(x=>x==='AVAILABLE')&&!findings.some(x=>STRONG_OUT.has(x)||UNCERTAIN.has(x)))
   add('NOT_LISTED_IS_NOT_CONFIRMED_AVAILABLE');
 if(!findings.length)add('AVAILABILITY_NOT_ESTABLISHED');
 // Deliberately no path to trusted source or production readiness in this parser.
 add('SOURCE_AUTHENTICATION_AND_OFFICIAL_PLAYER_BINDING_UNPROVEN');
 add('MINUTES_DISTRIBUTION_NOT_VERIFIED');
 return result(packet,issues,unique(notes),records);
}
/** Diagnostic wrapper: preserves conditional math but never endorses p as eligible. */
export function assessAssistForecastEligibility(forecast,sourcePacket){
 const gate=auditPlayerAvailability(sourcePacket);
 const model=typeof forecast?.model_probability==='number'&&
   Number.isFinite(forecast.model_probability)&&
   forecast.model_probability>=0&&forecast.model_probability<=1?
   forecast.model_probability:null;
 const baseline=typeof forecast?.baseline_probability==='number'&&
   Number.isFinite(forecast.baseline_probability)&&
   forecast.baseline_probability>=0&&forecast.baseline_probability<=1?
   forecast.baseline_probability:null;
 return {...gate,conditional_research_model_probability:model,
   conditional_research_baseline_probability:baseline,
   eligible_prediction_probability:null,original_research_stage:forecast?.stage??null,
   original_forecast_mutated:false,execution_authority:false};
}
