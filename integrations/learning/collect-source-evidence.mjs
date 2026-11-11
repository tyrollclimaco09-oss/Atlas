#!/usr/bin/env node
/**
 * Research-only append-output collector for registered frozen cohorts.
 * Direct TLS fetch to exact allowed domains; store raw response bytes,
 * verifiable SHA256 manifests, and fail-closed per-case evaluations.
 * No Supabase calls, no credentials, no model writes, no execution authority.
 * Output directory is job-local and uploaded as a GitHub artifact by workflow.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchAllowedSource} from './direct-source-capture.mjs';
import {readSourceWithBlob} from './prospective-source-freeze.mjs';
import {evaluateCapturedNBACohort} from './direct-outcome-join.mjs';

const fixtureRoot=fileURLToPath(new URL('./fixtures/',import.meta.url));
const REGISTRY_CONTRACT='ATLAS_SHADOW_NBA_CAPTURE_COHORT_REGISTRY_V1';
const file=(name)=> {
 if(!/^nba-(?:connected-prestart|prospective-forecast-freeze|record-challenger-freeze)-\d{8}\.json$/.test(name))
  throw Error('COLLECTOR_REGISTRY_PATH_INVALID');
 return join(fixtureRoot,name);
};
const registry=JSON.parse(readFileSync(join(fixtureRoot,'prospective-nba-cohort-registry.json'),'utf8'));
if(registry.contract!==REGISTRY_CONTRACT||!Array.isArray(registry.cohorts))throw Error('COLLECTOR_REGISTRY_INVALID');
const args=process.argv.slice(2);
const dateArg=args.find(x=>x.startsWith('--date='));
const outArg=args.find(x=>x.startsWith('--out='));
const all=args.includes('--all-recent');
const allRegistered=args.includes('--all-registered');
if(Number(Boolean(dateArg))+Number(all)+Number(allRegistered)!==1)throw Error('COLLECTOR_REQUIRES_EXACTLY_ONE_DATE_SCOPE');
const nowCT=()=>{
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',
  year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const d=Object.fromEntries(parts.map(x=>[x.type,x.value]));
 return d.year+'-'+d.month+'-'+d.day;
};
const today=nowCT();
const dates=allRegistered?registry.cohorts.map(c=>c.date):all?
 registry.cohorts.filter(c=>c.date<today&&(Date.parse(today+'T12:00:00Z')-Date.parse(c.date+'T12:00:00Z'))/(24*3600000)<=7).map(c=>c.date):
 [dateArg.split('=')[1]];
if(dates.some(d=>!/^\d{4}-\d{2}-\d{2}$/.test(d)))throw Error('COLLECTOR_DATE_INVALID');
const outputDir=resolve(outArg?outArg.slice(6):'/tmp/atlas-nba-source-evidence');
mkdirSync(outputDir,{recursive:true});
const summaries=[];
for(const date of dates){
 const cohortRows=registry.cohorts.filter(c=>c.date===date);
 if(cohortRows.length!==1)throw Error('COLLECTOR_COHORT_NOT_UNIQUE');
 const cfg=cohortRows[0];
 const {snapshot:source,source_git_blob_sha:sourceSha}=readSourceWithBlob(file(cfg.source_file));
 const forecast=JSON.parse(readFileSync(file(cfg.forecast_file),'utf8'));
 const challenger=JSON.parse(readFileSync(file(cfg.challenger_file),'utf8'));
 if(sourceSha!==cfg.source_git_blob_sha||forecast.count!==cfg.expected_cases||
   forecast.slate_date_ct!==date||forecast.source_git_blob_sha!==sourceSha)
  throw Error('COLLECTOR_REGISTERED_FREEZE_DRIFT');
 const dayDir=join(outputDir,date);mkdirSync(dayDir,{recursive:true});
 const captures={};const errors=[];
 for(const provider of ['NBA_OFFICIAL_CDN','NBA_OFFICIAL_WEB','ESPN_SCOREBOARD']){
  try{
   const capture=await fetchAllowedSource(provider,date);
   captures[provider]=capture;
   const name=provider==='NBA_OFFICIAL_CDN'?'nba-official':provider==='NBA_OFFICIAL_WEB'?'nba-official-web':'espn-scoreboard';
   writeFileSync(join(dayDir,name+(provider==='NBA_OFFICIAL_WEB'?'.raw.html':'.raw.json')),capture.raw,{flag:'wx'});
   writeFileSync(join(dayDir,name+'.capture.json'),JSON.stringify(capture.metadata,null,2)+'\n',{flag:'wx'});
  }catch(e){
   const msg=(e instanceof Error?e.message:'UNKNOWN_FETCH_ERROR');
   errors.push({provider,error_code:/^[A-Z0-9_]+$/.test(msg)?msg:
     /abort|timeout/i.test(msg)?'SOURCE_NETWORK_TIMEOUT':'SOURCE_FETCH_OR_SCHEMA_UNAVAILABLE'});
  }
 }
 let evalResult=null;
 try{
  evalResult=evaluateCapturedNBACohort({source,sourceSha,cohort:forecast,
    challenger,requestedDate:date,nbaCapture:captures.NBA_OFFICIAL_CDN??null,
    nbaWebCapture:captures.NBA_OFFICIAL_WEB??null,
    espnCapture:captures.ESPN_SCOREBOARD??null});
 }catch(e){
  errors.push({provider:'ATLAS_EVALUATOR',error_code:/^[A-Z0-9_]+$/.test(e.message)?e.message:'EVALUATION_SCHEMA_OR_SOURCE_ERROR'});
 }
 const report={
  contract:'ATLAS_NBA_DUAL_SOURCE_CAPTURE_RUN_V1',
  date,run_observed_at:new Date().toISOString(),
  prestart_source_sha:sourceSha,
  forecast_prepared_at:forecast.prepared_at_utc,
  detected_http_origins:Object.values(captures).map(c=>c.metadata.origin_host),
  result_evidence_state:evalResult?.status??'HOLD_EVALUATOR_ERROR',
  errors,evaluation:evalResult,
  no_database_writes:true,training_authority:false,bookmaker_execution:false,
  note:'Raw source evidence and SHA256 manifests are preserved in the same job artifact; HTTP origin is not a provider digital signature.'
 };
 writeFileSync(join(dayDir,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});

 const pregame=evalResult?.results?.filter(r=>r.prestart_three_provider_ids_corroborated)??[];
 const identityReport={
   contract:'ATLAS_NBA_PRESTART_PROVIDER_IDENTITY_PROVENANCE_V1',date,
   recorded_at:new Date().toISOString(),snapshot_model_frozen_at:forecast.prepared_at_utc,
   original_connected_provider_request_id:source.provider_request_id,
   original_connected_source_git_blob_sha:sourceSha,
   nba_raw_capture_sha256:captures.NBA_OFFICIAL_WEB?.metadata.sha256??captures.NBA_OFFICIAL_CDN?.metadata.sha256??null,
   espn_raw_capture_sha256:captures.ESPN_SCOREBOARD?.metadata.sha256??null,
   confirmed_id_count:pregame.length,entire_cohort_checked:pregame.length===forecast.count,
   records:pregame.map(x=>({
     event_key:x.case_key,
     connected_dk_competition_id:x.dk_original_competition_id,
     nba_official_game_id:x.nba_game_id,espn_event_id:x.espn_event_id,
     observed_identity_timing:x.prestart_three_provider_event_identity_status,
     observed_at:x.source_identity_corroboration_observed_at,
     original_forecast_prepared_at:x.original_forecast_prepared_at
   })),
   vendor_signed:false,original_market_identity_and_settlement_rule_attested:false,
   model_calibration_authority:false,bookmaker_execution_authority:false,
   warning:'This checks actual independently named event IDs before tipoff but after the original freeze when so timestamped; cannot backdate identity to that freeze or prove betting-period settlement.'
 };
 writeFileSync(join(dayDir,'pregame-identity-report.json'),JSON.stringify(identityReport,null,2)+'\n',{flag:'wx'});

 summaries.push({date,status:report.result_evidence_state,provisional:evalResult?.provisional_scored_count??0,
  held:evalResult?.held_count??forecast.count,
  identity_before_tip_count:identityReport.confirmed_id_count,
  identity_before_original_forecast_count:evalResult?.preforecast_source_identity_verified_count??0,
  origins:report.detected_http_origins,errors});
}
writeFileSync(join(outputDir,'index.json'),JSON.stringify({contract:'ATLAS_NBA_CAPTURE_RUN_INDEX_V1',
  run_observed_at:new Date().toISOString(),slates:summaries,
  results_authenticated_for_training:false,automated_provider_signatures_verified:false,
  writes_to_supabase:0,bet_execution_count:0},null,2)+'\n',{flag:'wx'});
process.stdout.write(JSON.stringify({slates:summaries,output_directory:outputDir,
  no_database_writes:true,production_authority:false})+'\n');
