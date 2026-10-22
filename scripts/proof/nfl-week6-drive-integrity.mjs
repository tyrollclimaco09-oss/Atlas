import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {normalizeNflGame} from './nfl-player-pbp-shadow.mjs';
const URL='https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=401872996';
const sha=x=>createHash('sha256').update(x).digest('hex');
function ok(x,m){if(!x)throw Error(m);}
function clockSeconds(x){
 const m=String(x??'').match(/^(\d{1,2}):(\d\d)$/);
 return m&&Number(m[2])<60?+m[1]*60+(+m[2]):null;
}
export function auditDriveEvents(summary){
 const d=summary?.drives?.previous;
 ok(Array.isArray(d)&&d.length>0,'COMPLETED_DRIVES_NOT_AVAILABLE');
 const unique=new Set();let duplicates=0,missingId=0,missingPeriod=0,
  clockGoesBackward=0,periodGoesBackward=0,clockMissing=0,missingTeam=0;
 let playCount=0,priorPeriod=0,priorClock=null;
 const quarters={};const types={};const drives=[];
 const sourceConsistentTypes=new Set(['Pass Reception','Pass Incompletion','Rush']);
 const candidateByType={},candidateByTeam={},rejectionReasons={};
 let offensiveTeamCandidates=0;
 const rejected=why=>{rejectionReasons[why]=(rejectionReasons[why]||0)+1;};
 for(const drive of d){
  const p=drive.plays;
  ok(Array.isArray(p),'DRIVE_PLAYS_SCHEMA');
  let counted=0;
  for(const play of p){
   playCount++;
   const id=String(play.id??'');
   if(!/^\d+$/.test(id))missingId++;
   else if(unique.has(id))duplicates++;
   else unique.add(id);
   const period=play.period?.number;
   if(!Number.isInteger(period)||period<1||period>5)missingPeriod++;
   else {
     quarters[period]=(quarters[period]||0)+1;
     const clock=clockSeconds(play.clock?.displayValue);
     if(clock===null)clockMissing++;
     if(priorPeriod&&period<priorPeriod)periodGoesBackward++;
     if(period===priorPeriod&&clock!==null&&priorClock!==null&&clock>priorClock+1)clockGoesBackward++;
     priorPeriod=period;
     priorClock=clock;
   }
   const typ=String(play.type?.text??'UNKNOWN');
   types[typ]=(types[typ]||0)+1;
   // Candidate team attribution only, NEVER independent actor validation.
   // Kickoffs/timeouts/turnovers/penalties cannot inherit possession safely.
   const driveTeam=String(drive.team?.id??''),startTeam=String(play.start?.team?.id??'');
   if(!sourceConsistentTypes.has(typ))rejected('TYPE_OUTSIDE_ALLOWLIST');
   else if(play.isPenalty===true||play.isTurnover===true)rejected('PENALTY_OR_TURNOVER');
   else if(!/^\d+$/.test(driveTeam)||startTeam!==driveTeam)rejected('TEAM_IDENTITY_NOT_CONSISTENT');
   else if(!/^\d+$/.test(id)||!Number.isInteger(period))rejected('PLAY_ID_OR_PERIOD_UNKNOWN');
   else{
    offensiveTeamCandidates++;
    candidateByType[typ]=(candidateByType[typ]||0)+1;
    candidateByTeam[driveTeam]=(candidateByTeam[driveTeam]||0)+1;
   }
   if(play.team?.id===null||play.team?.id===undefined)missingTeam++;
   counted++;
  }
  drives.push({drive_id:String(drive.id??''),plays:counted,
   result_category:String(drive.result??'UNKNOWN')});
 }
 const complete_claim=false; // Not independently cross-checked against nflverse PBP.
 return {drives:d.length,plays:playCount,unique_play_ids:unique.size,
  duplicate_ids:duplicates,missing_ids:missingId,missing_periods:missingPeriod,
  period_order_violations:periodGoesBackward,
  clock_order_violations:clockGoesBackward,clock_missing:clockMissing,
  missing_team_attribution:missingTeam,
  offensive_team_candidates_source_consistent:offensiveTeamCandidates,
  candidate_types:candidateByType,candidate_teams:candidateByTeam,
  candidate_rejections:rejectionReasons,
  candidate_authority:'SOURCE_CONSISTENT_NOT_INDEPENDENTLY_VERIFIED',
  quarters,play_type_counts:types,drive_summary:drives,
  internal_identity_gate:duplicates===0&&missingId===0&&missingPeriod===0&&periodGoesBackward===0,
  // Drive ordering is NOT usable team-level play attribution.
  event_team_attribution_ready:missingTeam===0&&duplicates===0&&missingId===0,
  usable_player_volume_from_drive_plays:false,
  complete_play_coverage_verified:complete_claim,
  nflverse_event_level_id_match:false,
  player_stat_coverage_independently_qualified:false};
}
export async function main(){
 const res=await fetch(URL,{redirect:'error',signal:AbortSignal.timeout(16000),
 headers:{Accept:'application/json','User-Agent':'ATLAS-NFL-WEEK6-DRIVE-QUALITY/1'}});
 ok(res.ok&&res.url===URL,'ESPN_SOURCE_UNAVAILABLE');
 const bytes=Buffer.from(await res.arrayBuffer());
 ok(bytes.length>0&&bytes.length<4_000_000,'PAYLOAD_TOO_LARGE');
 const observed=new Date().toISOString(),summary=JSON.parse(bytes.toString('utf8'));
 const event={id:'401872996',status:{type:{completed:true}},
  competitions:[{competitors:[{homeAway:'home',team:{id:'30'}},{homeAway:'away',team:{id:'34'}}]}]};
 // Reuse actual canonical shadow parser rather than building a competing NFL pipeline.
 const box=normalizeNflGame(summary,event);
 const drive=auditDriveEvents(summary);
 ok(box.play_by_play_unique_ids===drive.unique_play_ids,'EXISTING_NFL_NORMALIZER_DIVERGED');
 const packet={schema:'atlas.nfl.drive-quality.v1',classification:'POSTGAME_SOURCE_INTEGRITY_RESEARCH',
  sport:'NFL',season:2026,week:6,game_id:'401872996',
  source_url:URL,source_observed_at_utc:observed,upstream_sha256:sha(bytes),
  normalizer_observed_plays:box.play_by_play_unique_ids,
  paired_week6_stats_proven_separately:{cj_stroud_attempts:34,woody_marks_carries:15},
  ...drive,calibrator_eligible:false,
  official_completeness_verified:false,
  sports_odds_credits:0,db_writes:0,production_authority:false,execution_authority:false};
 writeFileSync('atlas-nfl-week6-drive-quality.json',JSON.stringify(packet,null,2)+'\n');
 console.log('ATLAS_NFL_WEEK6_DRIVE_QUALITY '+JSON.stringify({
  drives:drive.drives,plays:drive.plays,unique:drive.unique_play_ids,duplicates:drive.duplicate_ids,
  missing_ids:drive.missing_ids,missing_periods:drive.missing_periods,
  period_order_violations:drive.period_order_violations,
  clock_order_violations:drive.clock_order_violations,clock_missing:drive.clock_missing,
  missing_team_attribution:drive.missing_team_attribution,quarters:drive.quarters,
  internal_identity_gate:drive.internal_identity_gate,
  event_team_attribution_ready:drive.event_team_attribution_ready,
  offensive_team_candidates_source_consistent:drive.offensive_team_candidates_source_consistent,
  candidate_types:drive.candidate_types,candidate_rejections:drive.candidate_rejections,
  candidate_authority:drive.candidate_authority,
  full_completeness_verified:false,
  source_sha256:packet.upstream_sha256
 }));
 ok(drive.internal_identity_gate,'NFL_INTERNAL_PLAY_IDENTITY_FAILURE');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))main().catch(e=>{console.error('ATLAS_NFL_DRIVE_BLOCKED '+e.message);process.exitCode=1});
