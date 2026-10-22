import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const SCHEDULE='https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json';
const ROOT='https://cdn.nba.com/static/json/liveData/';
const GAME_CODE='20261021/ATLORL';
const sha256=b=>createHash('sha256').update(b).digest('hex');
const assert=(b,e)=>{if(!b)throw Error(e)};
const normalize=x=>String(x??'').toLowerCase().replace(/[^a-z0-9]/g,'');
const names=['dysondaniels','jalensuggs'];
export function pickGame(schedule){
 const dates=schedule?.leagueSchedule?.gameDates;
 assert(Array.isArray(dates),'NBA_OFFICIAL_SCHEDULE_SCHEMA');
 const games=dates.flatMap(x=>Array.isArray(x.games)?x.games:[])
  .filter(x=>x.gameCode===GAME_CODE&&x.homeTeam?.teamTricode==='ORL'&&x.awayTeam?.teamTricode==='ATL');
 assert(games.length===1&&/^00\d{8}$/.test(String(games[0].gameId)),'NBA_OFFICIAL_GAME_ID_NOT_UNIQUE');
 return String(games[0].gameId);
}
export function auditIndependentNBA(pbp,boxscore,gameId){
 assert(pbp?.game?.gameId===gameId&&boxscore?.game?.gameId===gameId,'NBA_INDEPENDENT_GAME_ID_CONFLICT');
 const home=boxscore.game.homeTeam,away=boxscore.game.awayTeam;
 assert(home?.teamTricode==='ORL'&&away?.teamTricode==='ATL','NBA_OFFICIAL_TEAMS_CONFLICT');
 const roster=[...home.players.map(x=>({...x,teamTricode:'ORL'})),...away.players.map(x=>({...x,teamTricode:'ATL'}))];
 const subjects=names.map(name=>{
  const matches=roster.filter(x=>normalize([x.firstName,x.familyName].join(' '))===name);
  assert(matches.length===1,'NBA_PLAYER_NAME_IDENTITY_NOT_UNIQUE:'+name);
  const p=matches[0];
  assert(Number.isInteger(Number(p.personId)),'NBA_PLAYER_ID_INVALID');
  return {normalized_name:name,nba_person_id:String(p.personId),team:p.teamTricode,
   official_nba_fga:Number.isSafeInteger(p.statistics?.fieldGoalsAttempted)?p.statistics.fieldGoalsAttempted:null};
 });
 assert(Array.isArray(pbp.game.actions)&&pbp.game.actions.length>150,'NBA_INDEPENDENT_PBP_UNAVAILABLE');
 const fieldGoalActions=pbp.game.actions.filter(x=>x.isFieldGoal===1||x.isFieldGoal===true);
 const byPlayer=subjects.map(p=>{
  const events=fieldGoalActions.filter(x=>String(x.personId)===p.nba_person_id)
   .map(x=>({nba_action_number:x.actionNumber,period:x.period,clock:x.clock,
      action_type:x.actionType,sub_type:x.subType,description:String(x.description??'').slice(0,180),
      team:x.teamTricode,person_id:String(x.personId),is_field_goal:x.isFieldGoal}));
  return {...p,independent_pbp_fga:events.length,pbp_matches_box:p.official_nba_fga!==null&&events.length===p.official_nba_fga,
   events};
 });
 const heaves=fieldGoalActions.filter(x=>x.period===1&&/heave/i.test(String(x.subType??'')+' '+String(x.description??'')))
   .slice(0,12).map(x=>({nba_action_number:x.actionNumber,person_id:String(x.personId),
     clock:x.clock,description:String(x.description??'').slice(0,180)}));
 return {
  schema:'atlas.nba.crosssource.shot-identity.v1',
  espn_game_id:'401909834',nba_game_id:gameId,game_code:GAME_CODE,
  nba_official_actions:pbp.game.actions.length,
  nba_field_goal_marked_actions:fieldGoalActions.length,
  sampled_players:byPlayer,heaves,
  observation:'INDEPENDENT_NBA_CDN_RESEARCH_UNVERIFIED_RIGHTS',
  independent_stat_consistency:byPlayer.every(x=>x.pbp_matches_box),
  // Player IDs are deliberately mapped by exact name+team, not confused across providers.
  espn_player_id_link_independently_verified:false,
  espn_fga_anomaly_resolved:false,official_source_license_reviewed:false,
  calibrator_eligible:false,production_authority:false,execution_authority:false
 };
}
async function fetchLimited(url,maxBytes){
 assert(url===SCHEDULE||url.startsWith(ROOT),'NBA_HOST_NOT_ALLOWLISTED');
 const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(20000),
  headers:{Accept:'application/json','User-Agent':'ATLAS-INDEPENDENT-SHOT-RESEARCH/1','Referer':'https://www.nba.com/'}});
 assert(r.status===200&&r.url===url,'NBA_CDN_HTTP_'+r.status);
 const b=Buffer.from(await r.arrayBuffer());
 assert(b.length>0&&b.length<=maxBytes,'NBA_SOURCE_SIZE');
 return {data:JSON.parse(b.toString('utf8')),observed_at_utc:new Date().toISOString(),sha256:sha256(b),url};
}
export async function main(){
 const schedule=await fetchLimited(SCHEDULE,8_000_000);
 const gameId=pickGame(schedule.data);
 const [pbp,box]=await Promise.all([
  fetchLimited(ROOT+'playbyplay/playbyplay_'+gameId+'.json',5_000_000),
  fetchLimited(ROOT+'boxscore/boxscore_'+gameId+'.json',2_000_000)
 ]);
 const result=auditIndependentNBA(pbp.data,box.data,gameId);
 const packet={...result,sources:[schedule,pbp,box].map(x=>({url:x.url,sha256:x.sha256,observed_at_utc:x.observed_at_utc})),
  odds_api_credits:0,database_written:false};
 writeFileSync('atlas-nba-official-shot-crosscheck.json',JSON.stringify(packet,null,2)+'\n');
 console.log('ATLAS_NBA_INDEPENDENT_SHOT '+JSON.stringify({
  game_id:gameId,actions:result.nba_official_actions,field_goal_actions:result.nba_field_goal_marked_actions,
  subjects:result.sampled_players.map(x=>({name:x.normalized_name,team:x.team,
    nba_id:x.nba_person_id,official_fga:x.official_nba_fga,pbp_fga:x.independent_pbp_fga,
    matches_box:x.pbp_matches_box,ends:x.events.filter(y=>y.period===1&&/00M00|00:00/.test(y.clock)).slice(0,5)})),
  heaves:result.heaves,source_hash:pbp.sha256,
  espn_anomaly_resolved:false,production_authority:false
 }));
 // Source can be legitimately inconsistent; do not mark these as canonical training proof.
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))
 main().catch(e=>{console.error('ATLAS_NBA_OFFICIAL_CROSSCHECK_BLOCKED '+e.message);process.exitCode=1});
