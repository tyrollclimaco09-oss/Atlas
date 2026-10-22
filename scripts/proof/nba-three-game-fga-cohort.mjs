import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

// Predeclared on 2026-10-22, including known anomalous anchor.
// Exactly three completed Oct 21 games, not chosen by outcomes.
export const COHORT=Object.freeze([
 {code:'20261021/ATLORL',home:'ORL',away:'ATL'},
 {code:'20261021/CHABKN',home:'BKN',away:'CHA'},
 {code:'20261021/GSWLAL',home:'LAL',away:'GSW'},
]);
const SCHEDULE='https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json';
const ROOT='https://cdn.nba.com/static/json/liveData/';
const hash=b=>createHash('sha256').update(b).digest('hex');
const demand=(v,s)=>{if(!v)throw Error(s)};
export function resolveCohort(schedule){
 const days=schedule?.leagueSchedule?.gameDates;
 demand(Array.isArray(days),'SCHEDULE_DATES_MISSING');
 const games=days.flatMap(d=>d.games??[]);
 return COHORT.map(c=>{
  const found=games.filter(g=>g.gameCode===c.code&&
    g.homeTeam?.teamTricode===c.home&&g.awayTeam?.teamTricode===c.away);
  demand(found.length===1,'COHORT_GAME_NOT_UNIQUE:'+c.code);
  const gameId=String(found[0].gameId);
  demand(/^00\d{8}$/.test(gameId),'COHORT_GAME_ID_INVALID:'+c.code);
  return {...c,gameId};
 });
}
export function auditGame(pbp,box,game){
 demand(pbp?.game?.gameId===game.gameId&&box?.game?.gameId===game.gameId,'SOURCE_GAME_ID_MISMATCH');
 const g=box.game;
 demand(g.homeTeam?.teamTricode===game.home&&g.awayTeam?.teamTricode===game.away,'SOURCE_TEAMS_MISMATCH');
 demand(Array.isArray(pbp.game.actions)&&pbp.game.actions.length>100,'MISSING_ACTIONS');
 const players=[...g.homeTeam.players.map(p=>({...p,side:game.home})),
                ...g.awayTeam.players.map(p=>({...p,side:game.away}))];
 const playerIdMap=new Map(),duplicates=[];
 for(const p of players){
  const id=String(p.personId);
  demand(/^\d+$/.test(id),'PLAYER_ID_MISSING');
  if(playerIdMap.has(id))duplicates.push(id);
  else playerIdMap.set(id,p);
 }
 const actions=pbp.game.actions;
 const seenActions=new Set(),duplicateActions=[];
 const candidate=actions.filter(a=>a.isFieldGoal===1||a.isFieldGoal===true);
 const actualByPlayer=new Map(),actualByTeam=new Map(),unmatchedActor=[],misattributedTeam=[];
 for(const a of actions){
  const k=String(a.actionNumber??'');
  if(!k||seenActions.has(k))duplicateActions.push(k);
  seenActions.add(k);
 }
 for(const a of candidate){
  const id=String(a.personId??''),p=playerIdMap.get(id);
  if(!p){unmatchedActor.push({id,action:a.actionNumber});continue}
  actualByPlayer.set(id,(actualByPlayer.get(id)||0)+1);
  actualByTeam.set(p.side,(actualByTeam.get(p.side)||0)+1);
  if(a.teamTricode&&a.teamTricode!==p.side)
   misattributedTeam.push({id,action:a.actionNumber,sourceTeam:a.teamTricode,rosterTeam:p.side});
 }
 const playerDeltas=players.map(p=>{
  const official=p.statistics?.fieldGoalsAttempted;
  return {id:String(p.personId),team:p.side,official_fga:Number.isSafeInteger(official)?official:null,
   pbp_fga:actualByPlayer.get(String(p.personId))||0,
   played:typeof p.played==='string'?p.played:null};
 }).filter(p=>p.official_fga!==null&&p.official_fga!==p.pbp_fga);
 const missingOfficial=players.filter(p=>!Number.isSafeInteger(p.statistics?.fieldGoalsAttempted)).length;
 const teamCounts=[g.homeTeam,g.awayTeam].map(t=>{
  const side=t.teamTricode,playersHere=players.filter(p=>p.side===side);
  const officialPlayerFga=playersHere.reduce((s,p)=>s+(Number.isSafeInteger(p.statistics?.fieldGoalsAttempted)?p.statistics.fieldGoalsAttempted:0),0);
  const pbpFga=actualByTeam.get(side)||0;
  return {team:side,official_player_fga_sum:officialPlayerFga,pbp_fga:pbpFga,delta:pbpFga-officialPlayerFga};
 });
 const readiness=duplicates.length===0&&duplicateActions.length===0&&
  unmatchedActor.length===0&&misattributedTeam.length===0&&missingOfficial===0&&
  playerDeltas.length===0&&teamCounts.every(t=>t.delta===0);
 return {game_code:game.code,nba_game_id:game.gameId,
  actions:actions.length,marked_fga_actions:candidate.length,
  players:players.length,players_missing_official_fga:missingOfficial,
  players_with_fga_discrepancy:playerDeltas.length,player_deltas:playerDeltas.slice(0,12),
  team_counts:teamCounts,
  unknown_shooters:unmatchedActor.slice(0,12),unknown_shooter_count:unmatchedActor.length,
  duplicate_action_ids:duplicateActions.length,duplicate_player_ids:duplicates.length,
  action_roster_team_conflicts:misattributedTeam.slice(0,12),
  eligible_source_integrity_for_this_game:readiness,
  model_proven:false,complete_q4_feature_eligibility_verified:false};
}
async function get(url,limit){
 demand(url===SCHEDULE||url.startsWith(ROOT),'URL_NOT_ALLOWLISTED');
 const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(20000),
  headers:{Accept:'application/json','User-Agent':'ATLAS-NBA-PREREGISTERED-INTEGRITY/1',Referer:'https://www.nba.com/'}});
 demand(response.status===200&&response.url===url,'SOURCE_HTTP_'+response.status);
 const bytes=Buffer.from(await response.arrayBuffer());
 demand(bytes.length>0&&bytes.length<=limit,'SOURCE_LIMIT');
 return {data:JSON.parse(bytes.toString('utf8')),source_sha256:hash(bytes),
   observed_at_utc:new Date().toISOString()};
}
export async function main(){
 const schedule=await get(SCHEDULE,8_000_000);
 const selected=resolveCohort(schedule.data);
 const results=[];
 for(const game of selected){
  // Deliberately sequential. Bounded to 6 game calls + 1 free schedule call.
  const pbp=await get(ROOT+'playbyplay/playbyplay_'+game.gameId+'.json',5_000_000);
  const box=await get(ROOT+'boxscore/boxscore_'+game.gameId+'.json',2_500_000);
  results.push({...auditGame(pbp.data,box.data,game),
   pbp_source_sha256:pbp.source_sha256,box_source_sha256:box.source_sha256,
   observed_at_utc:pbp.observed_at_utc});
 }
 const packet={schema:'atlas.nba.official-fga-cohort-20261021.v1',
  selection_frozen_before_fetch:COHORT,game_count:results.length,results,
  source_schedule_sha256:schedule.source_sha256,
  games_source_integrity_passed:results.filter(r=>r.eligible_source_integrity_for_this_game).length,
  claim_scope:'THREE_POSTGAME_SOURCE_EXTRACTS_NOT_MODEL_VALIDATION',
  rights_reviewed:false,original_v3_57_game_replayed:false,
  calibrator_eligible:false,production_authority:false,execution_authority:false,
  odds_credits:0,supabase_writes:0};
 writeFileSync('atlas-nba-three-game-fga-cohort.json',JSON.stringify(packet,null,2)+'\n');
 console.log('ATLAS_NBA_COHORT '+JSON.stringify({
   cohort:results.map(({game_code,nba_game_id,actions,marked_fga_actions,players,
     players_with_fga_discrepancy,players_missing_official_fga,unknown_shooter_count,
     duplicate_action_ids,team_counts,eligible_source_integrity_for_this_game})=>({
     game_code,nba_game_id,actions,marked_fga_actions,players,players_with_fga_discrepancy,
     players_missing_official_fga,unknown_shooter_count,duplicate_action_ids,team_counts,
     eligible_source_integrity_for_this_game})),
   source_integrity_passed:packet.games_source_integrity_passed,rights_reviewed:false,
   original_v3_replayed:false,paid_odds_calls:0
 }));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))
 main().catch(e=>{console.error('ATLAS_NBA_COHORT_BLOCKED '+e.message);process.exitCode=1});
