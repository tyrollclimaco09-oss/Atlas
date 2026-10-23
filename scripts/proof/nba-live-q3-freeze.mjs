import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {preQ4Feature} from './nba-q3-feature-firewall.mjs';

const SCHEDULE='https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json';
const SCOREBOARD='https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json';
const ROOT='https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_';
export const TARGET=Object.freeze({code:'20261022/DENOKC',away:'DEN',home:'OKC',gameId:'0022600007'});
const fail=(ok,code)=>{if(!ok)throw Error(code)};
const sha=b=>createHash('sha256').update(b).digest('hex');

export function resolveGame(schedule){
 const dates=schedule?.leagueSchedule?.gameDates;
 fail(Array.isArray(dates),'SCHEDULE_SCHEMA_UNKNOWN');
 const matches=dates.flatMap(d=>d.games||[]).filter(g=>g.gameCode===TARGET.code);
 fail(matches.length===1,'TARGET_GAME_NOT_UNIQUE');
 const g=matches[0];
 fail(String(g.gameId)===TARGET.gameId&&g.awayTeam?.teamTricode==='DEN'&&
   g.homeTeam?.teamTricode==='OKC','SCHEDULE_GAME_IDENTITY_CONFLICT');
 return TARGET;
}
export function seconds(clock){
 const m=String(clock??'').match(/^PT(\d+)M(\d+(?:\.\d+)?)S$/);
 if(!m)return null;
 const min=Number(m[1]),sec=Number(m[2]);
 return Number.isFinite(sec)&&sec<60?min*60+sec:null;
}
export function q3Boundary(scoreboard,game){
 const games=scoreboard?.scoreboard?.games;
 fail(Array.isArray(games),'SCOREBOARD_SCHEMA_UNKNOWN');
 const matches=games.filter(g=>String(g.gameId)===game.gameId);
 fail(matches.length===1,'GAME_NOT_IN_TODAY_SCOREBOARD');
 const g=matches[0];
 fail(g.homeTeam?.teamTricode===game.home&&
      g.awayTeam?.teamTricode===game.away,'LIVE_SCOREBOARD_IDENTITY_CONFLICT');
 fail(g.gameStatus===2&&g.period===3,'NOT_LIVE_Q3');
 const remaining=seconds(g.gameClock);
 fail(remaining!==null&&remaining===0,'Q3_CLOCK_NOT_AT_ZERO');
 return {clock_seconds_remaining:remaining,game_status:2,period:3,
    game_code:game.code,source_state:'THIRD_QUARTER_COMPLETE_NO_Q4_STARTED'};
}
export function snapshotLive(game,boardBefore,playbyplay,boardAfter){
 q3Boundary(boardBefore,game);
 const pbp=playbyplay?.game;
 fail(pbp?.gameId===game.gameId,'PBP_GAME_ID_CONFLICT');
 fail(Array.isArray(pbp.actions),'PBP_ACTIONS_UNKNOWN');
 fail(pbp.actions.every(a=>Number.isInteger(a.period)&&a.period>=1&&a.period<=3),
   'PBP_CONTAINS_FUTURE_OR_INVALID_PERIOD');
 const feature=preQ4Feature(game,pbp.actions);
 q3Boundary(boardAfter,game);
 const canonical={...feature,
  snapshot_state:'LIVE_Q3_ZERO_SECOND_SOURCE_DOUBLE_CHECK',
  observed_before_q4:true,
  independent_time_attestation:false,
  current_roster_identities_externally_verified:false,
  risk_tier:'SHADOW_NOT_BETTABLE',
  calibrated:false,
  q4_outcomes_absent:true};
 return canonical;
}
async function fetchJson(url,max){
 fail(url===SCHEDULE||url===SCOREBOARD||url===ROOT+TARGET.gameId+'.json','SOURCE_URL_NOT_ALLOWLISTED');
 const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(12000),headers:{
   Accept:'application/json',Referer:'https://www.nba.com/', 'User-Agent':'ATLAS-LIVE-Q3-EVIDENCE-GATE/1'}});
 fail(r.status===200&&r.url===url,'SOURCE_HTTP_'+r.status);
 const bytes=Buffer.from(await r.arrayBuffer());
 fail(bytes.length>0&&bytes.length<=max,'SOURCE_PAYLOAD_TOO_LARGE');
 return {json:JSON.parse(bytes.toString('utf8')),sha256:sha(bytes),
  observed_at_utc:new Date().toISOString()};
}
async function main(){
 const begin=new Date().toISOString();
 const schedule=await fetchJson(SCHEDULE,8_000_000);
 const game=resolveGame(schedule.json);
 // First reject pregame, first half, uncompleted Q3, Q4 or finished states.
 const before=await fetchJson(SCOREBOARD,1_500_000);
 q3Boundary(before.json,game);
 const pbp=await fetchJson(ROOT+game.gameId+'.json',5_000_000);
 const after=await fetchJson(SCOREBOARD,1_500_000);
 const result=snapshotLive(game,before.json,pbp.json,after.json);
 const packet={schema:'atlas.nba.q3.live_shadow_snapshot_attempt.v1',
  game,created_at_utc:new Date().toISOString(),
  evidence_observed_started_utc:begin,
  github_actions_run_id:process.env.GITHUB_RUN_ID||null,
  github_head_sha:process.env.GITHUB_SHA||null,
  source_hashes:{schedule:schedule.sha256,scoreboard_before:before.sha256,
    live_pbp:pbp.sha256,scoreboard_after:after.sha256},
  source_receipt_times:{schedule:schedule.observed_at_utc,
    before:before.observed_at_utc,pbp:pbp.observed_at_utc,after:after.observed_at_utc},
  selected_players:result.selected_players,
  selected_pre_q4_fga:result.selected_pre_q4_fga,
  q4_naive_rate_estimate:result.naive_q4_rate_estimate,
  feature_sha256:result.feature_sha256,
  game_state_at_both_checks:'Q3_CLOCK_ZERO_NO_Q4',
  model_class:'FIXED_UNTRAINED_Q1_Q3_RATE_BASELINE',
  player_minutes_verified:false,
  source_license_reviewed:false,
  externally_signed_freeze:false,
  official_q4_settlement_completed:false,
  positive_ev_established:false,
  production_authority:false,
  calibrator_eligible:false,
  manual_wager_authorized:false,
  paid_odds_calls:0};
 writeFileSync('atlas-nba-live-q3-freeze.json',JSON.stringify(packet,null,2)+'\n');
 console.log('ATLAS_NBA_LIVE_Q3_FROZEN '+JSON.stringify({
  game_id:game.gameId,created_at_utc:packet.created_at_utc,
  player_ids:result.selected_players.map(p=>p.player_id),
  q3_fga:result.selected_pre_q4_fga,
  q4_baseline:result.naive_q4_rate_estimate,
  feature_sha256:result.feature_sha256,
  source_hashes:packet.source_hashes,
  q4_settlement_completed:false,production_authority:false
 }));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))
 main().catch(e=>{console.error('ATLAS_NBA_LIVE_Q3_GATE_BLOCKED '+e.message);process.exitCode=1});
