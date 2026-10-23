import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const SCHEDULE='https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json';
const SCOREBOARD='https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json';
const PBP='https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_0022600007.json';
const TARGET=Object.freeze({game_id:'0022600007',game_code:'20261022/DENOKC',away:'DEN',home:'OKC'});
const sha=b=>createHash('sha256').update(b).digest('hex');
const demand=(b,m)=>{if(!b)throw Error(m)};
export function gameFromSchedule(s){
 const g=(s.leagueSchedule?.gameDates??[]).flatMap(x=>x.games??[])
   .filter(x=>x.gameCode===TARGET.game_code);
 demand(g.length===1,'TARGET_SCHEDULE_IDENTITY_NOT_UNIQUE');
 demand(String(g[0].gameId)===TARGET.game_id&&g[0].homeTeam?.teamTricode===TARGET.home&&
  g[0].awayTeam?.teamTricode===TARGET.away,'SOURCE_IDENTITY_CONFLICT');
 return TARGET;
}
export function earlyBoundary(board){
 const g=(board.scoreboard?.games??[]).filter(x=>String(x.gameId)===TARGET.game_id);
 demand(g.length===1,'GAME_NOT_IN_LIVE_SCOREBOARD');
 demand(g[0].homeTeam?.teamTricode===TARGET.home&&
        g[0].awayTeam?.teamTricode===TARGET.away,'SCOREBOARD_IDENTITY_CONFLICT');
 demand(g[0].gameStatus===2&&[2,3].includes(g[0].period),'NOT_LIVE_BEFORE_Q4');
 const m=String(g[0].gameClock??'').match(/^PT(\d+)M(\d+(?:\.\d+)?)S$/);
 demand(m&&Number(m[2])<60,'LIVE_CLOCK_UNKNOWN');
 return {period:g[0].period,clock:g[0].gameClock};
}
export function freezeQ1AgainstFutureQ4(boardBefore,pbp,boardAfter){
 const before=earlyBoundary(boardBefore),game=pbp?.game;
 demand(game?.gameId===TARGET.game_id&&Array.isArray(game.actions),'PBP_IDENTITY_CONFLICT');
 demand(game.actions.every(a=>Number.isInteger(a.period)&&a.period>=1&&a.period<=3),
  'PBP_CONTAINS_Q4_OR_INVALID_PERIOD');
 const first=game.actions.filter(a=>a.period===1);
 demand(first.length>70,'INCOMPLETE_Q1_EVENT_LOG');
 const ending=first.filter(a=>a.actionType==='period'&&a.subType==='end'&&
   a.clock==='PT00M00.00S');
 demand(ending.length===1,'Q1_END_MARKER_MISSING_OR_DUPLICATED');
 const selected=[];const seen=new Set();
 for(const a of first){
  const id=String(a.actionNumber??'');
  demand(/^\d+$/.test(id)&&!seen.has(id),'Q1_ACTION_ID_UNKNOWN_OR_DUPLICATED');
  seen.add(id);
 }
 for(const team of [TARGET.away,TARGET.home]){
  const counts=new Map();
  for(const a of first){
   if(a.isFieldGoal!==1&&a.isFieldGoal!==true)continue;
   demand(a.teamTricode===TARGET.away||a.teamTricode===TARGET.home,'Q1_SHOOTER_BAD_TEAM');
   demand(/^\d+$/.test(String(a.personId??'')),'Q1_SHOOTER_ID_UNKNOWN');
   if(a.teamTricode!==team)continue;
   const id=String(a.personId);counts.set(id,(counts.get(id)||0)+1);
  }
  demand(counts.size>=2,'INSUFFICIENT_Q1_SHOOTERS_'+team);
  selected.push(...[...counts].map(([player_id,q1_fga])=>({player_id,team,q1_fga}))
   .sort((a,b)=>b.q1_fga-a.q1_fga||Number(a.player_id)-Number(b.player_id)).slice(0,2));
 }
 const after=earlyBoundary(boardAfter);
 const raw={schema:'atlas.nba.live_q1_to_q4.priceblind.untrained.v1',
  game_id:TARGET.game_id,game_code:TARGET.game_code,
  selected_by:'TOP_TWO_Q1_FGA_PER_TEAM_NUMERIC_PLAYER_ID_TIEBREAK',
  selected_players:selected,
  q1_total_selected_fga:selected.reduce((a,x)=>a+x.q1_fga,0),
  q4_fga_point_reference:selected.reduce((a,x)=>a+x.q1_fga,0),
  intended_target:'SUM_Q4_FGA_OF_SAME_FOUR_Q1_SELECTED_PLAYERS_EXCLUDE_OVERTIME',
  input_observed_during:{before,after},
  no_q4_events_seen:true,source_q1_period_end_confirmed:true,
  current_game_roster_independently_verified:false,
  external_timestamp_signature:false,probability_or_ev_established:false,
  model_validated:false,production_authority:false,calibrator_eligible:false,
  betting_authority:false};
 return {...raw,feature_sha256:sha(Buffer.from(JSON.stringify(raw)))};
}
async function read(url,limit){
 demand([SCHEDULE,SCOREBOARD,PBP].includes(url),'UNKNOWN_UPSTREAM_URL');
 const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(14000),headers:{
  Accept:'application/json',Referer:'https://www.nba.com/','User-Agent':'ATLAS-Q1-Q4-PROSPECTIVE-SHADOW/1'}});
 demand(r.status===200&&r.url===url,'UPSTREAM_HTTP_'+r.status);
 const b=Buffer.from(await r.arrayBuffer());
 demand(b.length>0&&b.length<=limit,'UPSTREAM_BYTES');
 return {json:JSON.parse(b.toString('utf8')),sha256:sha(b),observed_at_utc:new Date().toISOString()};
}
async function main(){
 const start=new Date().toISOString();
 const schedule=await read(SCHEDULE,8_000_000);gameFromSchedule(schedule.json);
 const before=await read(SCOREBOARD,1_500_000);earlyBoundary(before.json);
 const pbp=await read(PBP,5_000_000);
 const after=await read(SCOREBOARD,1_500_000);
 const feature=freezeQ1AgainstFutureQ4(before.json,pbp.json,after.json);
 const packet={...feature,created_at_utc:new Date().toISOString(),
  observation_started_at_utc:start,
  github_run_id:process.env.GITHUB_RUN_ID||null,
  github_source_sha:process.env.GITHUB_SHA||null,
  observed_source_hashes:{schedule:schedule.sha256,before:before.sha256,
   pbp:pbp.sha256,after:after.sha256},
  source_read_time:{schedule:schedule.observed_at_utc,before:before.observed_at_utc,
   pbp:pbp.observed_at_utc,after:after.observed_at_utc},
  q4_outcomes_recorded_in_packet:false,official_settlement_done:false,
  frozen_from_only_Q1_shots:true,strict_q3_complete_forecast:false,odds_calls:0};
 writeFileSync('atlas-nba-q1-q4-preoutcome-shadow.json',JSON.stringify(packet,null,2)+'\n');
 console.log('ATLAS_NBA_Q1_Q4_PROSPECTIVE '+JSON.stringify({created_at_utc:packet.created_at_utc,
  game_id:packet.game_id,
  selected_players:packet.selected_players,
  q1_total_selected_fga:packet.q1_total_selected_fga,
  q4_reference:packet.q4_fga_point_reference,
  observed_period_after:feature.input_observed_during.after.period,
  feature_sha256:packet.feature_sha256,source_hashes:packet.observed_source_hashes,
  q4_outcomes_observed:false,real_Q3_completion_freeze:false,betting_authority:false}));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))
 main().catch(e=>{console.error('ATLAS_NBA_Q1_Q4_BLOCKED '+e.message);process.exitCode=1});
