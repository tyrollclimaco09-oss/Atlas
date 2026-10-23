import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
const HASH=b=>createHash('sha256').update(b).digest('hex');
const ROOT='https://cdn.nba.com/static/json/';
const URLS={
 schedule:ROOT+'staticData/scheduleLeagueV2_1.json',
 scoreboard:ROOT+'liveData/scoreboard/todaysScoreboard_00.json',
 pbp:ROOT+'liveData/playbyplay/playbyplay_0022600007.json'
};
async function pull(url,max){
 const r=await fetch(url,{signal:AbortSignal.timeout(12000),redirect:'error',
  headers:{'Accept':'application/json','Referer':'https://www.nba.com/','User-Agent':'ATLAS-Q3-SCHEMA-DIAGNOSTIC/1'}});
 if(r.status!==200||r.url!==url)throw Error('UPSTREAM_FAIL_'+r.status);
 const b=Buffer.from(await r.arrayBuffer());
 if(!b.length||b.length>max)throw Error('SOURCE_SIZE_LIMIT');
 return {json:JSON.parse(b.toString('utf8')),sha256:HASH(b),observed_at_utc:new Date().toISOString()};
}
async function main(){
 const start=new Date().toISOString();
 const [schedule,scoreboard,pbp]=await Promise.all([
 pull(URLS.schedule,8_000_000),
 pull(URLS.scoreboard,1_500_000),
 pull(URLS.pbp,5_000_000)
 ]);
 const games=(schedule.json.leagueSchedule?.gameDates??[]).flatMap(d=>d.games??[]);
 const today=games.filter(g=>String(g.gameCode??'').startsWith('20261022/'))
  .map(g=>({gameCode:g.gameCode,gameId:g.gameId,home:g.homeTeam?.teamTricode,away:g.awayTeam?.teamTricode}));
 const live=(scoreboard.json.scoreboard?.games??[]).map(g=>({
  gameId:g.gameId,period:g.period,gameStatus:g.gameStatus,
  gameClock:g.gameClock,home:g.homeTeam?.teamTricode,away:g.awayTeam?.teamTricode
 }));
 const actions=pbp.json.game?.actions??[];
 const summary={
  schema:'atlas.nba.live_source_diagnostic.unpromoted.v1',
  observed_started_utc:start,observed_completed_utc:new Date().toISOString(),
  urls:URLS,hashes:{schedule:schedule.sha256,scoreboard:scoreboard.sha256,pbp:pbp.sha256},
  expected_nba_game_id:'0022600007',today_schedule:today,
  live_scoreboard:live,
  pbp_game_id:pbp.json.game?.gameId,
  pbp_action_count:actions.length,
  last_action_summaries:actions.slice(-18).map(a=>({
   actionNumber:a.actionNumber,period:a.period,clock:a.clock,
   actionType:a.actionType,subType:a.subType,
   isFieldGoal:a.isFieldGoal,teamTricode:a.teamTricode
  })),
  period_boundary_candidates:actions.filter(a=>
   /period/i.test(String(a.actionType)+' '+String(a.subType))&&
   /end/i.test(String(a.actionType)+' '+String(a.subType)))
   .slice(-6).map(a=>({actionNumber:a.actionNumber,period:a.period,
    clock:a.clock,actionType:a.actionType,subType:a.subType})),
  q3_feature_packet_captured:false,model_validated:false,
  production_authority:false,odds_api_calls:0
 };
 writeFileSync('atlas-nba-live-diagnostic.json',JSON.stringify(summary,null,2)+'\n');
 console.log('ATLAS_NBA_LIVE_SOURCE_DIAGNOSTIC '+JSON.stringify(summary));
}
main().catch(e=>{console.error('ATLAS_NBA_LIVE_DIAGNOSTIC_BLOCKED '+e.message);process.exitCode=1});
