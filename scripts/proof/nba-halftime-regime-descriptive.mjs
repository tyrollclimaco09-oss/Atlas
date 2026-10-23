import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {auditGame} from './nba-three-game-fga-cohort.mjs';

// Retrospectively selected named cases, NOT a probability-learning cohort.
export const CASES=Object.freeze([
 {code:'20261022/CLEPHI',away:'CLE',home:'PHI',reason:'KNOWN_HALFTIME_COMEBACK'},
 {code:'20261022/DENOKC',away:'DEN',home:'OKC',reason:'KNOWN_SECOND_HALF_OPPORTUNITY_LOSS'},
]);
const ROOT='https://cdn.nba.com/static/json/liveData/';
const SCHEDULE='https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json';
const hash=b=>createHash('sha256').update(b).digest('hex');
const guard=(v,s)=>{if(!v)throw Error(s)};
const half=p=>p<=2?'H1':'H2';

export function resolveCases(schedule){
 const days=schedule?.leagueSchedule?.gameDates;
 guard(Array.isArray(days),'SCHEDULE_NOT_VERIFIED');
 const games=days.flatMap(d=>d.games||[]);
 return CASES.map(c=>{
  const found=games.filter(g=>g.gameCode===c.code&&g.awayTeam?.teamTricode===c.away&&g.homeTeam?.teamTricode===c.home);
  guard(found.length===1,'GAME_NOT_UNIQUE:'+c.code);
  const gameId=String(found[0].gameId);
  guard(/^00\d{8}$/.test(gameId),'BAD_GAME_ID');
  return {...c,gameId};
 });
}
function scorePeriods(t){
 guard(Array.isArray(t.periods),'PERIODS_MISSING');
 const q=t.periods.filter(x=>[1,2,3,4].includes(x.period));
 guard(q.length===4&&new Set(q.map(x=>x.period)).size===4,'PERIODS_NOT_EXACT');
 q.sort((a,b)=>a.period-b.period);
 guard(q.every(x=>Number.isSafeInteger(x.score)&&x.score>=0),'BAD_PERIOD_SCORE');
 const total=q.reduce((n,x)=>n+x.score,0);
 guard(total===t.score,'POINTS_SCORE_MISMATCH:'+t.teamTricode);
 return {quarters:q.map(x=>x.score),H1:q[0].score+q[1].score,H2:q[2].score+q[3].score,total};
}
export function halftimeArithmetic(away,home){
 guard([away,home].every(t=>t&&Number.isSafeInteger(t.H1)&&Number.isSafeInteger(t.H2)&&t.H1>=0&&t.H2>=0),'INVALID_HALVES');
 const initialLead=home.H1-away.H1;
 const h2Swing=(home.H2-away.H2);
 const finalLead=initialLead+h2Swing;
 const halftimeLeader=initialLead===0?'TIED':initialLead>0?'HOME':'AWAY';
 const necessarySwingToOverturn=Math.abs(initialLead)+1;
 const actualSwingForTrailer=initialLead>0?-h2Swing:initialLead<0?h2Swing:null;
 return {halftime_leader:halftimeLeader,halftime_margin:Math.abs(initialLead),
  halftime_total:away.H1+home.H1,second_half_total:away.H2+home.H2,
  remaining_trailer_net_points_to_win_regulation:initialLead===0?1:necessarySwingToOverturn,
  realized_second_half_net_points_for_trailer:actualSwingForTrailer,
  halftime_leader_lost:initialLead!==0&&Math.sign(finalLead)!==Math.sign(initialLead),
  final_home_margin:finalLead,
  comeback_does_not_imply_higher_second_half_total:true};
}
export function summarizeCase(c,pbp,box){
 guard(pbp?.game?.gameId===c.gameId&&box?.game?.gameId===c.gameId,'GAME_CONFLICT');
 guard(box.game.gameStatus===3,'NOT_FINAL');
 guard(box.game.awayTeam?.teamTricode===c.away&&box.game.homeTeam?.teamTricode===c.home,'TEAM_CONFLICT');
 const audit=auditGame(pbp,box,c);
 guard(audit.eligible_source_integrity_for_this_game,'FGA_PBP_BOX_CONFLICT');
 const halves={[c.away]:scorePeriods(box.game.awayTeam),[c.home]:scorePeriods(box.game.homeTeam)};
 const actionCounts={};
 for(const t of [c.away,c.home]){
  actionCounts[t]={H1:{fga:0,turnover_events:0},H2:{fga:0,turnover_events:0}};
 }
 let missingTurnoverTeam=0;
 for(const a of pbp.game.actions){
  if(!Number.isSafeInteger(a.period)||a.period<1||a.period>4)continue;
  const t=a.teamTricode,slot=actionCounts[t]?.[half(a.period)];
  if(a.isFieldGoal===1||a.isFieldGoal===true){
   guard(slot,'SHOT_TEAM_MISSING');
   slot.fga++;
  }
  if(a.actionType==='turnover'){
   if(slot)slot.turnover_events++;
   else missingTurnoverTeam++;
  }
 }
 // Summed attempts are independently crosschecked against box by auditGame.
 for(const t of [c.away,c.home]){
  const actual=actionCounts[t].H1.fga+actionCounts[t].H2.fga;
  const fromAudit=audit.team_counts.find(x=>x.team===t);
  guard(fromAudit&&actual===fromAudit.pbp_fga,'HALF_FGA_RECONCILIATION:'+t);
 }
 return {game_id:c.gameId,game_code:c.code,case_reason:c.reason,
  retrospective_selected_case:true,
  halftime:halftimeArithmetic(halves[c.away],halves[c.home]),
  teams:halves,action_counts:actionCounts,unknown_turnover_team_events:missingTurnoverTeam,
  final_pbp_box_fga_integrity:true,
  pregame_or_live_model_forecast:false,
  defensive_matchup_assignments_verified:false,
  lineup_minutes_verified:false,
  possession_counts_verified:false,
  defensive_adjustment_causes_known:false,
  bookmaker_total_lines_observed:false,
  betting_edge_established:false,
  production_authority:false};
}
async function get(url,max){
 guard(url===SCHEDULE||/^https:\/\/cdn\.nba\.com\/static\/json\/liveData\/(playbyplay|boxscore)\/(playbyplay|boxscore)_00\d{8}\.json$/.test(url),'SOURCE_DISALLOWED');
 const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(18000),
  headers:{Accept:'application/json',Referer:'https://www.nba.com/','User-Agent':'ATLAS-HALFTIME-REGIME-RESEARCH/1'}});
 guard(r.status===200&&r.url===url,'HTTP_'+r.status);
 const b=Buffer.from(await r.arrayBuffer());
 guard(b.length>0&&b.length<=max,'BAD_BYTES');
 return {value:JSON.parse(b.toString('utf8')),sha256:hash(b),observed_utc:new Date().toISOString()};
}
async function main(){
 const schedule=await get(SCHEDULE,8_000_000);
 const cases=resolveCases(schedule.value),results=[],rejections=[];
 for(const c of cases){
  try {
   const [pbp,box]=await Promise.all([
    get(ROOT+'playbyplay/playbyplay_'+c.gameId+'.json',5_000_000),
    get(ROOT+'boxscore/boxscore_'+c.gameId+'.json',2_500_000)]);
   results.push({...summarizeCase(c,pbp.value,box.value),
    pbp_sha256:pbp.sha256,box_sha256:box.sha256,source_observed_at_utc:pbp.observed_utc});
  }catch(e){rejections.push({game:c.code,reason:String(e.message)});}
 }
 const out={schema:'atlas.nba.gamesense.halftime_regime_descriptive.v1',analysis_type:'RETROSPECTIVE_SELECTED_CASES',
  cases_predeclared:CASES,requested_cases:cases.length,scored_cases:results.length,rejections,
  schedule_sha256:schedule.sha256,results,model_trained:false,
  claims_scope:'SCORE_HALVES_FGA_AND_TURNOVER_EVENT_COUNTS_ONLY',
  matchup_and_defender_causal_attribution_proven:false,game_totals_ev_established:false};
 writeFileSync('atlas-nba-halftime-regime-descriptive.json',JSON.stringify(out,null,2)+'\n');
 console.log('ATLAS_NBA_GAMESENSE_HALFTIME_REGIME '+JSON.stringify(out));
 if(rejections.length)throw Error('CASE_INTEGRITY_DENIAL:'+rejections.length);
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))main().catch(e=>{console.error('ATLAS_NBA_HALFTIME_REGIME_BLOCKED '+e.message);process.exitCode=1});
