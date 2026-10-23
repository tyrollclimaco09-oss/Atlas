import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {auditGame} from './nba-three-game-fga-cohort.mjs';
import {preQ4Feature,q4Settlement,splitSource} from './nba-q3-feature-firewall.mjs';
// PREDECLARED DATE CENSUS; do not filter by outcome, shots, odds, player, or model success.
export const DATES=Object.freeze(['20261020','20261021']);
const root='https://cdn.nba.com/static/json/liveData/';
const urlSchedule='https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json';
function demand(x,m){if(!x)throw Error(m)}
const sha=b=>createHash('sha256').update(b).digest('hex');
export function getCensus(schedule){
 const dates=schedule?.leagueSchedule?.gameDates;
 demand(Array.isArray(dates),'SCHEDULE_SCHEMA');
 const found=dates.flatMap(d=>d.games||[])
  .filter(g=>DATES.some(day=>typeof g.gameCode==='string'&&g.gameCode.startsWith(day+'/')))
  .map(g=>({code:g.gameCode,gameId:String(g.gameId),home:g.homeTeam?.teamTricode,
   away:g.awayTeam?.teamTricode,status:g.gameStatus}));
 found.sort((a,b)=>a.code.localeCompare(b.code));
 demand(found.length>=10&&found.length<=20,'EXPECTED_DATE_CENSUS_RANGE_NOT_MET:'+found.length);
 demand(found.every(g=>/^00\d{8}$/.test(g.gameId)&&g.home&&g.away&&g.home!==g.away),'BAD_GAME_IDENTITY');
 demand(new Set(found.map(g=>g.code)).size===found.length&&
  new Set(found.map(g=>g.gameId)).size===found.length,'DUPLICATED_GAMES');
 return found;
}
async function fetchJson(url,max){
 demand(url===urlSchedule||/^https:\/\/cdn\.nba\.com\/static\/json\/liveData\/(boxscore|playbyplay)\/(boxscore|playbyplay)_00\d{8}\.json$/.test(url),'DISALLOWED_SOURCE');
 const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(18000),
  headers:{Accept:'application/json',Referer:'https://www.nba.com/','User-Agent':'ATLAS-OCT-CENSUS-Q3-BLIND/1'}});
 demand(r.status===200&&r.url===url,'SOURCE_HTTP_'+r.status);
 const bytes=Buffer.from(await r.arrayBuffer());
 demand(bytes.length>0&&bytes.length<=max,'SOURCE_BYTES');
 return {data:JSON.parse(bytes.toString('utf8')),sha256:sha(bytes)};
}
export function evaluate(g,p,b){
 const quality=auditGame(p,b,g);
 demand(quality.eligible_source_integrity_for_this_game,'OFFICIAL_FGA_NOT_RECONCILED');
 const {pre,after}=splitSource(p.game.actions);
 const feature=preQ4Feature(g,pre),result=q4Settlement(feature,after);
 demand(result.feature_sha256===feature.feature_sha256,'SOURCE_FEATURE_REBIND');
 return {game_code:g.code,game_id:g.gameId,selected_player_ids:feature.selected_players.map(x=>x.player_id),
  q1_q3_shots:feature.selected_pre_q4_fga,q3_shots:feature.selected_q3_fga,
  naive_rate_pred:feature.naive_q4_rate_estimate,actual_q4_shots:result.selected_q4_fga,
  abs_error:result.absolute_error,q4_non_shooting_players:result.individual_labels.filter(x=>x.q4_fga===0).length,
  feature_sha256:feature.feature_sha256,
  actual_q3_external_freeze:false,
  sports_model_validated:false,betting_price_evaluated:false};
}
function mean(x){return x.reduce((a,b)=>a+b,0)/x.length}
function quantiles(xs){const a=[...xs].sort((a,b)=>a-b);
 return {median:a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2,
  worst:a[a.length-1],best:a[0]};}
async function main(){
 const sched=await fetchJson(urlSchedule,8_000_000);
 const census=getCensus(sched.data),results=[],rejections=[];
 for(const g of census){
  try{
   const p=await fetchJson(root+'playbyplay/playbyplay_'+g.gameId+'.json',5_000_000);
   const b=await fetchJson(root+'boxscore/boxscore_'+g.gameId+'.json',2_500_000);
   results.push({...evaluate(g,p.data,b.data),pbp_sha256:p.sha256,box_sha256:b.sha256});
  }catch(e){
   rejections.push({game_code:g.code,game_id:g.gameId,reason:String(e.message).slice(0,130)});
  }
 }
 const errors=results.map(x=>x.abs_error);
 const stats=results.length?{n:results.length,mae:mean(errors),
  ...quantiles(errors),q4_non_shooters:results.reduce((n,g)=>n+g.q4_non_shooting_players,0)}:null;
 const report={schema:'atlas.nba.oct20_21.q3q4.no_lookahead_retro_v1',
  predeclared_dates:DATES,census_games:census.length,
  accepted_games:results.length,rejected_games:rejections.length,
  denominator_retained:true,
  schedule_sha256:sched.sha256,
  stats,results,rejections,
  retrospective_experiment_new_version:true,
  pre_q4_prospective_timing_attested:false,original_57_game_v3_replayed:false,
  model_validated:false,calibrator_eligible:false,licensing_reviewed:false,
  production_authority:false,odds_credits:0,
  source_observed_at_utc:new Date().toISOString()};
 writeFileSync('atlas-nba-oct2026-q3q4-census.json',JSON.stringify(report,null,2)+'\n');
 console.log('ATLAS_NBA_OCT_CENSUS '+JSON.stringify({
  census:report.census_games,accepted:report.accepted_games,
  rejected:report.rejections,stats:report.stats,
  games:results.map(x=>({code:x.game_code,pred:x.naive_rate_pred,actual:x.actual_q4_shots,
   abs_error:x.abs_error,zero_shooters:x.q4_non_shooting_players})),
  source_hash:report.schedule_sha256,real_q3_freeze:false,model_validation:false}));
 if(rejections.length)throw Error('CENSUS_INCOMPLETE_FAIL_CLOSED:'+rejections.length);
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))
 main().catch(e=>{console.error('ATLAS_NBA_OCT_CENSUS_BLOCKED '+e.message);process.exitCode=1});
