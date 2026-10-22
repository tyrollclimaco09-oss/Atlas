import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {isFieldGoalType,assessCoverage} from './nba-v3-shot-coverage.mjs';
const URL='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=401909834';
const sha=x=>createHash('sha256').update(x).digest('hex');
const guard=(x,e)=>{if(!x)throw Error(e)};
function fga(s){const m=String(s??'').match(/^(\d+)-(\d+)$/);return m?+m[2]:null;}
export function auditPlayerFga(summary){
 const base=assessCoverage(summary);
 const roster=new Map();const duplicateIds=new Set();
 for(const team of summary?.boxscore?.players||[]){
  const tid=String(team.team?.id??'');
  for(const group of team.statistics||[]){
   const labels=group.labels||[],idx=labels.indexOf('FG');
   for(const a of group.athletes||[]){
    const id=String(a.athlete?.id??'');
    if(!/^\d+$/.test(id))continue;
    const val=Array.isArray(a.stats)&&idx!==-1?fga(a.stats[idx]):null;
    if(roster.has(id)&&roster.get(id).team_id!==tid)duplicateIds.add(id);
    if(!roster.has(id)||val!==null)roster.set(id,{player_id:id,team_id:tid,box_fga:val,counts:0});
   }
  }
 }
 const unknownIds=new Set(),missed=[];
 for(const p of summary?.plays||[]){
  if(!isFieldGoalType(p.type?.text))continue;
  const id=String(p.participants?.[0]?.athlete?.id??'');
  if(roster.has(id))roster.get(id).counts++;
  else unknownIds.add(id);
 }
 const missingBox=[...roster.values()].filter(x=>x.counts>0&&x.box_fga===null);
 const deltas=[...roster.values()].filter(x=>x.box_fga!==null&&x.box_fga!==x.counts)
   .map(x=>({player_id:x.player_id,team_id:x.team_id,box_fga:x.box_fga,pbp_fga:x.counts,delta:x.counts-x.box_fga}));
 const teamSummaries=[...new Set([...roster.values()].map(x=>x.team_id))].map(tid=>({
  team_id:tid,players_with_official_fga:[...roster.values()].filter(x=>x.team_id===tid&&x.box_fga!==null).length,
  sum_official_player_fga:[...roster.values()].filter(x=>x.team_id===tid).reduce((a,x)=>a+(x.box_fga||0),0),
  sum_pbp_rostered_fga:[...roster.values()].filter(x=>x.team_id===tid).reduce((a,x)=>a+x.counts,0)
 }));
 return {game_id:'401909834',shot_attempts_total:base.candidate_shot_types,
  team_counts:base.team_comparisons,player_roster_count:roster.size,
  duplicate_roster_ids:[...duplicateIds],unknown_shooter_ids:[...unknownIds],
  roster_shot_without_official_fga:missingBox.map(x=>({player_id:x.player_id,team_id:x.team_id,pbp_fga:x.counts})),
  player_differences:deltas,teams:teamSummaries,
  q4_model_feature_admissible:false,
  individually_reconciled:deltas.length===0&&unknownIds.size===0&&missingBox.length===0&&duplicateIds.size===0,
  team_fga_reconciled:base.fga_reconciliation_verified};
}
export async function main(){
 const r=await fetch(URL,{signal:AbortSignal.timeout(16000),redirect:'error',headers:{Accept:'application/json','User-Agent':'ATLAS-NBA-PER-PLAYER-INTEGRITY/1'}});
 guard(r.status===200&&r.url===URL,'SOURCE_UNAVAILABLE');
 const bytes=Buffer.from(await r.arrayBuffer());guard(bytes.length>0&&bytes.length<4_000_000,'SOURCE_SIZE');
 const report=auditPlayerFga(JSON.parse(bytes.toString('utf8')));
 const receipt={schema:'atlas.nba.player-fga-difference.v1',classification:'RETROSPECTIVE_DIAGNOSTIC_ONLY',
  source_url:URL,observed_at_utc:new Date().toISOString(),upstream_sha256:sha(bytes),
  ...report,production_authority:false,calibrator_eligible:false,odds_credits:0,execution_authority:false};
 writeFileSync('atlas-nba-per-player-fga-differences.json',JSON.stringify(receipt,null,2)+'\n');
 console.log('ATLAS_NBA_PLAYER_FGA_DIFF '+JSON.stringify({
  player_differences:report.player_differences,
  team_summaries:report.teams,
  missing_box:report.roster_shot_without_official_fga,
  unknown_ids:report.unknown_shooter_ids,
  total:report.shot_attempts_total,
  team_fga_reconciled:report.team_fga_reconciled,
  individually_reconciled:report.individually_reconciled,
  q4_model_feature_admissible:false,
  upstream_sha256:receipt.upstream_sha256
 }));
 // Diagnostic succeeds even with a valid conflict; a conflict is NOT release success.
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))main().catch(e=>{console.error('ATLAS_NBA_PLAYER_DIFF_BLOCKED '+e.message);process.exitCode=1});
