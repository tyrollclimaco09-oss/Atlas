import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const BASE='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/';
const DATE='20261021';
const sha256=x=>createHash('sha256').update(x).digest('hex');
const fail=(ok,reason)=>{if(!ok)throw Error(reason);};
const num=x=>typeof x==='number'&&Number.isFinite(x)?x:Number.isFinite(Number(x))&&String(x).trim()!==''?Number(x):null;
const measured=(key,val)=>{
 if(val===null||val===undefined||val===''||val==='--')return null;
 if(key==='minutes'){
  if(typeof val!=='string'&&typeof val!=='number')return null;
  const m=String(val).match(/^(\d{1,3}):(\d\d)$/);
  if(m)return Number(m[1])+Number(m[2])/60;
  return num(val);
 }
 if(key==='threes'){
  const m=String(val).match(/^(\d+)-(\d+)$/);
  return m&&Number(m[1])<=Number(m[2])?{made:Number(m[1]),attempted:Number(m[2])}:null;
 }
 return Number.isInteger(num(val))&&num(val)>=0?num(val):null;
};
export function normalizeNbaGame(summary,event){
 fail(event&&/^\d{6,15}$/.test(String(event.id))&&event.status?.type?.completed===true,'NBA_EVENT_NOT_FINAL');
 const id=String(event.id);
 const comp=event.competitions?.[0];
 const members=comp?.competitors;
 fail(Array.isArray(members)&&members.length===2&&members.some(x=>x.homeAway==='home')&&members.some(x=>x.homeAway==='away'),'NBA_EVENT_IDENTITY');
 const summaryId=summary?.header?.id??summary?.header?.competitions?.[0]?.id;
 fail(String(summaryId)===id,'NBA_SUMMARY_IDENTITY_MISMATCH');
 const teamRows=summary?.boxscore?.players;
 fail(Array.isArray(teamRows)&&teamRows.length===2,'NBA_BOXSCORE_MISSING');
 const players=[];const seen=new Set();let uncertain=0;
 for(const team of teamRows){
  const teamId=String(team.team?.id??'');
  fail(members.some(x=>String(x.team?.id)===teamId),'NBA_TEAM_MAPPING_FAILED');
  const groups=team.statistics;
  fail(Array.isArray(groups)&&groups.length>=1,'NBA_STAT_GROUP_MISSING');
  for(const group of groups){
   const labels=group.labels;
   fail(Array.isArray(labels)&&Array.isArray(group.athletes),'NBA_STATS_SCHEMA');
   const indices=Object.fromEntries(['MIN','PTS','REB','AST','3PT'].map(x=>[x,labels.indexOf(x)]));
   for(const rec of group.athletes){
    const athlete=rec.athlete,idPlayer=String(athlete?.id??'');
    if(!/^\d{1,20}$/.test(idPlayer)||seen.has(idPlayer))continue;
    seen.add(idPlayer);
    const values=rec.stats;
    if(!Array.isArray(values)||values.length!==labels.length){uncertain++;continue}
    const get=(key,type)=>indices[key]===-1?null:measured(type,values[indices[key]]);
    const minutes=get('MIN','minutes'),points=get('PTS','points'),
      rebounds=get('REB','rebounds'),assists=get('AST','assists'),threes=get('3PT','threes');
    const valid=[minutes,points,rebounds,assists].every(v=>v===null||v>=0)&&
      (points===null||points<=200)&&(minutes===null||minutes<=70);
    if(!valid){uncertain++;continue}
    players.push({player_id:idPlayer,team_id:teamId,
      name:typeof athlete.displayName==='string'?athlete.displayName:null,
      minutes,points,rebounds,assists,three_point_made:threes?.made??null,
      three_point_attempts:threes?.attempted??null});
   }
  }
 }
 const pbp=summary.plays;
 const pbpSupported=Array.isArray(pbp);
 const ids=new Set(),quarters=new Set();let distinctPlays=0,dupePlays=0;
 if(pbpSupported)for(const play of pbp){
  const pid=String(play.id??'');
  if(!/^\d{1,25}$/.test(pid))continue;
  if(ids.has(pid)){dupePlays++;continue}
  ids.add(pid);distinctPlays++;
  const quarter=play.period?.number;
  if(Number.isInteger(quarter)&&quarter>=1&&quarter<=10)quarters.add(quarter);
 }
 fail(players.length>=10,'NBA_PLAYER_COVERAGE_LOW');
 return {game_id:id,home_team_id:String(members.find(x=>x.homeAway==='home').team.id),
 away_team_id:String(members.find(x=>x.homeAway==='away').team.id),
 player_rows:players.length,invalid_player_rows:uncertain,
 minutes_populated:players.filter(p=>p.minutes!==null).length,
 points_populated:players.filter(p=>p.points!==null).length,
 rebounds_populated:players.filter(p=>p.rebounds!==null).length,
 assists_populated:players.filter(p=>p.assists!==null).length,
 three_attempts_populated:players.filter(p=>p.three_point_attempts!==null).length,
 pbp_present:pbpSupported,pbp_distinct_plays:distinctPlays,
 pbp_duplicate_ids:dupePlays,pbp_periods:[...quarters].sort((a,b)=>a-b),
 sample_players:players.slice(0,5),
 zero_imputation:false,bookmaker_quotes:null,live_betting_ev:null,
 baseline_model_validated:false,calibrator_eligible:false,
 execution_authority:false};
}
async function fetchPublic(url){
 fail(url.startsWith(BASE),'NBA_SOURCE_NOT_ALLOWED');
 const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(16000),headers:{
  Accept:'application/json','User-Agent':'ATLAS-NBA-RESEARCH-SOURCE-PROOF/1'}});
 fail(r.status===200&&r.url===url,'NBA_HTTP_UNAVAILABLE');
 const bytes=Buffer.from(await r.arrayBuffer());
 fail(bytes.length>0&&bytes.length<=4_000_000,'NBA_RESPONSE_SIZE');
 return {json:JSON.parse(bytes.toString('utf8')),observed_at_utc:new Date().toISOString(),
  source_url:url,body_sha256:sha256(bytes)};
}
export async function main(){
 const board=await fetchPublic(BASE+'scoreboard?dates='+DATE);
 const candidates=board.json.events;
 fail(Array.isArray(candidates),'NBA_BOARD_SCHEMA');
 const event=candidates.find(x=>x?.status?.type?.completed===true);
 fail(event,'NBA_COMPLETED_GAME_UNAVAILABLE');
 const game=await fetchPublic(BASE+'summary?event='+encodeURIComponent(event.id));
 const normalized=normalizeNbaGame(game.json,event);
 const report={protocol:'ATLAS_NBA_REAL_PLAYER_PBP_SOURCE_PROOF_V1',
  classification:'RETROSPECTIVE_POSTGAME_SOURCE_ONLY',
  source_status:'UNOFFICIAL_API_RIGHTS_AND_STABILITY_UNVERIFIED',
  schedule_at_utc:board.observed_at_utc,summary_at_utc:game.observed_at_utc,
  date:DATE,game_id:normalized.game_id,
  sources:[{url:board.source_url,sha256:board.body_sha256},
           {url:game.source_url,sha256:game.body_sha256}],
  normalized,prospective_forecast:false,model_validation:false,
  odds_api_credits:0,database_written:false,production_authority:false,
  execution_authority:false};
 writeFileSync('atlas-nba-real-stats-pbp-proof.json',JSON.stringify(report,null,2)+'\n');
 console.log('ATLAS_NBA_REAL_STATS_PBP_PROOF '+JSON.stringify({
  game_id:report.game_id,player_rows:normalized.player_rows,minutes:normalized.minutes_populated,
  points:normalized.points_populated,rebounds:normalized.rebounds_populated,
  assists:normalized.assists_populated,threes:normalized.three_attempts_populated,
  pbp_plays:normalized.pbp_distinct_plays,pbp_present:normalized.pbp_present,
  source_hash:game.body_sha256,execution_authority:false}));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))main().catch(e=>{console.error('ATLAS_NBA_SOURCE_FAIL '+e.message);process.exitCode=1});
