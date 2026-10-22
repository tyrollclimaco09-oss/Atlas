import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const BASE='https://site.api.espn.com/apis/site/v2/sports/football/nfl/';
const DATE='20261018'; // 2026 regular season Week 6; ESPN and nflverse week-6 IDs confirmed
const sha256=x=>createHash('sha256').update(x).digest('hex');
const must=(ok,msg)=>{if(!ok)throw Error(msg)};
const nat=x=>/^\d+$/.test(String(x))?Number(x):null;
const pair=x=>{const m=String(x).match(/^(\d+)\/(\d+)$/);return m&&Number(m[1])<=Number(m[2])?
 {made:Number(m[1]),attempts:Number(m[2])}:null;};
const nullableLabel=(labels,stats,name)=>{
 const i=labels.indexOf(name);return i===-1||i>=stats.length?null:stats[i];
};
export function normalizeNflGame(summary,event){
 must(event&&/^\d{6,15}$/.test(String(event.id))&&event.status?.type?.completed===true,'NFL_GAME_NOT_FINAL');
 const members=event.competitions?.[0]?.competitors;
 must(Array.isArray(members)&&members.length===2&&members.some(x=>x.homeAway==='home')&&members.some(x=>x.homeAway==='away'),'NFL_EVENT_IDENTITY');
 const id=String(event.id),sid=summary?.header?.id??summary?.header?.competitions?.[0]?.id;
 must(String(sid)===id,'NFL_SUMMARY_GAME_IDENTITY');
 const boxscore=summary?.boxscore?.players;
 must(Array.isArray(boxscore)&&boxscore.length===2,'NFL_BOXSCORE_MISSING');
 const players=new Map(),missing={passing:0,rushing:0,receiving:0},categories={passing:0,rushing:0,receiving:0};
 for(const team of boxscore){
  const teamId=String(team.team?.id??'');
  must(members.some(x=>String(x.team?.id)===teamId),'NFL_TEAM_MAPPING');
  must(Array.isArray(team.statistics),'NFL_STATS_SCHEMA');
  for(const group of team.statistics){
   const kind=String(group.name??group.label??'').toLowerCase();
   if(!['passing','rushing','receiving'].includes(kind))continue;
   const labels=group.labels,athletes=group.athletes;
   must(Array.isArray(labels)&&Array.isArray(athletes),'NFL_STAT_GROUP_SCHEMA');
   categories[kind]+=athletes.length;
   for(const x of athletes){
    const idPlayer=String(x.athlete?.id??'');
    if(!/^\d{1,20}$/.test(idPlayer))continue;
    const stats=x.stats;
    if(!Array.isArray(stats)||stats.length!==labels.length){missing[kind]++;continue}
    const k=teamId+':'+idPlayer;
    const r=players.get(k)||{id:idPlayer,team_id:teamId,name:x.athlete?.displayName??null,
      passing_attempts:null,passing_completions:null,passing_yards:null,
      rushing_attempts:null,rushing_yards:null,
      receptions:null,targets:null,receiving_yards:null};
    if(kind==='passing'){
     const c=pair(nullableLabel(labels,stats,'C/ATT'));
     r.passing_completions=c?.made??null;r.passing_attempts=c?.attempts??null;
     r.passing_yards=nat(nullableLabel(labels,stats,'YDS'));
    } else if(kind==='rushing'){
     r.rushing_attempts=nat(nullableLabel(labels,stats,'CAR'));
     r.rushing_yards=nat(nullableLabel(labels,stats,'YDS'));
    } else if(kind==='receiving'){
     r.receptions=nat(nullableLabel(labels,stats,'REC'));
     // ESPN does not always publish receiver target counts; missing is null, NEVER reconstructed from receptions.
     r.targets=nat(nullableLabel(labels,stats,'TGTS'));
     r.receiving_yards=nat(nullableLabel(labels,stats,'YDS'));
    }
    players.set(k,r);
   }
  }
 }
 const rows=[...players.values()];
 must(rows.length>=15,'NFL_PLAYER_COVERAGE_LOW');
 // NFL summary differs from NBA: plays commonly live inside drives.previous[].plays.
 // A field being absent is not evidence of zero actual football plays.
 const drives=summary?.drives?.previous;
 const perDrive=Array.isArray(drives)?drives.flatMap(d=>Array.isArray(d.plays)?d.plays:[]):[];
 const root=summary?.plays;
 const plays=Array.isArray(root)&&root.length>0?root:perDrive;
 const playSource=Array.isArray(root)&&root.length>0?'SUMMARY_ROOT':
   perDrive.length>0?'DRIVES_PREVIOUS':'NOT_AVAILABLE';
 const pbpAvailable=playSource!=='NOT_AVAILABLE';
 const ids=new Set(),quarters=new Set();
 let duplicates=0;
 if(pbpAvailable)for(const p of plays){
  const pid=String(p.id??'');
  if(!/^\d{1,25}$/.test(pid))continue;
  if(ids.has(pid)){duplicates++;continue}
  ids.add(pid);
  if(Number.isInteger(p.period?.number))quarters.add(p.period.number);
 }
 return {game_id:id,home_team_id:String(members.find(x=>x.homeAway==='home').team.id),
 away_team_id:String(members.find(x=>x.homeAway==='away').team.id),
 player_rows:rows.length,
 observed_passing_groups:categories.passing,
 observed_rushing_groups:categories.rushing,
 observed_receiving_groups:categories.receiving,
 invalid_group_rows:missing,
 passing_attempts_populated:rows.filter(x=>x.passing_attempts!==null).length,
 rushing_attempts_populated:rows.filter(x=>x.rushing_attempts!==null).length,
 receptions_populated:rows.filter(x=>x.receptions!==null).length,
 targets_populated:rows.filter(x=>x.targets!==null).length,
 play_by_play_present:pbpAvailable,play_by_play_origin:playSource,
 observed_completed_drives:Array.isArray(drives)?drives.length:null,
 play_by_play_unique_ids:ids.size,
 play_by_play_duplicate_ids:duplicates,play_by_play_periods:[...quarters].sort((a,b)=>a-b),
 // This single-source proof does not establish that every snap or target was recorded.
 complete_play_coverage_verified:false,
 sample_players:rows.slice(0,6),
 synthetic_projections:null,market_prices:null,
 calibrated_probability:null,calibrator_eligible:false,
 execution_authority:false};
}
async function read(url){
 must(url.startsWith(BASE),'NFL_SOURCE_NOT_ALLOWED');
 const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(20000),
  headers:{Accept:'application/json','User-Agent':'ATLAS-NFL-WEEK7-POSTGAME-PROOF/1'}});
 must(r.status===200&&r.url===url,'NFL_SOURCE_HTTP_UNAVAILABLE');
 const bytes=Buffer.from(await r.arrayBuffer());
 must(bytes.length>0&&bytes.length<=4_000_000,'NFL_RESPONSE_SIZE');
 return {data:JSON.parse(bytes.toString('utf8')),sha256:sha256(bytes),
   url,observed_at_utc:new Date().toISOString()};
}
export async function main(){
 const scoreboard=await read(BASE+'scoreboard?dates='+DATE);
 const events=scoreboard.data.events;
 must(Array.isArray(events),'NFL_SCOREBOARD_SCHEMA');
 const event=events.find(x=>x?.status?.type?.completed===true);
 must(event,'NFL_COMPLETED_EVENT_MISSING');
 const summary=await read(BASE+'summary?event='+encodeURIComponent(event.id));
 const norm=normalizeNflGame(summary.data,event);
 const receipt={protocol:'ATLAS_NFL_WEEK6_REAL_PLAYER_PBP_SOURCE_PROOF_V2',
  status:'RETROSPECTIVE_SHADOW_NOT_A_FORECAST',
  provider:'ESPN_UNOFFICIAL',provider_rights:'NOT_REVIEWED_FOR_PRODUCTION',
  schedule_at_utc:scoreboard.observed_at_utc,summary_at_utc:summary.observed_at_utc,
  sources:[{url:scoreboard.url,sha256:scoreboard.sha256},
    {url:summary.url,sha256:summary.sha256}],
  date:DATE,game_id:norm.game_id,normalized:norm,
  pregame_model_trained:false,prospective_predictions:0,
  sportsbook_odds:null,odds_api_credits:0,database_written:false,
  execution_authority:false,production_authority:false};
 writeFileSync('atlas-nfl-week6-pbp-proof.json',JSON.stringify(receipt,null,2)+'\n');
 console.log('ATLAS_NFL_WEEK6_REAL_STATS_PBP_PROOF '+JSON.stringify({
  game_id:norm.game_id,player_rows:norm.player_rows,
  passing_attempts:norm.passing_attempts_populated,
  rushing_attempts:norm.rushing_attempts_populated,receptions:norm.receptions_populated,
  receiving_targets:norm.targets_populated,
  plays:norm.play_by_play_unique_ids,pbp_present:norm.play_by_play_present,
  pbp_origin:norm.play_by_play_origin,drives:norm.observed_completed_drives,
  source_sha256:summary.sha256,credits:0,execution_authority:false}));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))main().catch(e=>{console.error('ATLAS_NFL_SOURCE_FAIL '+e.message);process.exitCode=1});
