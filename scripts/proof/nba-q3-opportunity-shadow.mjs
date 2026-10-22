import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {COHORT, resolveCohort, auditGame} from './nba-three-game-fga-cohort.mjs';

const SCHEDULE='https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json';
const ROOT='https://cdn.nba.com/static/json/liveData/';
const sha=b=>createHash('sha256').update(b).digest('hex');
function requireTrue(ok,msg){if(!ok)throw Error(msg)}
function validFG(a){return (a.isFieldGoal===1||a.isFieldGoal===true)&&Number.isInteger(a.period)}
function exactlyRostered(roster,id){
 const p=roster.get(String(id));
 requireTrue(!!p,'UNKNOWN_SHOOTER:'+id);
 return p;
}
export function deriveQ3Opportunity(pbp,box,game){
 const audit=auditGame(pbp,box,game);
 requireTrue(audit.eligible_source_integrity_for_this_game,'GAME_FGA_INTEGRITY_NOT_VERIFIED');
 const players=[...box.game.homeTeam.players.map(p=>({...p,team:game.home})),
                ...box.game.awayTeam.players.map(p=>({...p,team:game.away}))];
 const roster=new Map(players.map(p=>[String(p.personId),p]));
 requireTrue(players.length===roster.size,'DUPLICATE_PLAYER_ID');
 const pre=new Map(),q4=new Map(),overtime=new Map();
 let unknownPeriod=0,preActions=0,q4Actions=0;
 for(const a of pbp.game.actions){
  if(!validFG(a))continue;
  const id=String(a.personId);
  exactlyRostered(roster,id);
  if(a.period<=0){unknownPeriod++;continue}
  if(a.period<=3){pre.set(id,(pre.get(id)||0)+1);preActions++}
  else if(a.period===4){q4.set(id,(q4.get(id)||0)+1);q4Actions++}
  else{overtime.set(id,(overtime.get(id)||0)+1)}
 }
 requireTrue(unknownPeriod===0,'UNKNOWN_PERIOD_FGA');
 const selected=[];
 for(const team of [game.home,game.away]){
  const candidates=players.filter(p=>p.team===team)
    .map(p=>({player_id:String(p.personId),team,pre_q4_fga:pre.get(String(p.personId))||0}))
    .filter(p=>p.pre_q4_fga>0)
    .sort((a,b)=>b.pre_q4_fga-a.pre_q4_fga||a.player_id.localeCompare(b.player_id,undefined,{numeric:true}));
  requireTrue(candidates.length>=2,'INSUFFICIENT_PRE_Q4_ACTIVE_SHOOTERS:'+team);
  selected.push(...candidates.slice(0,2));
 }
 const y=selected.reduce((s,p)=>s+(q4.get(p.player_id)||0),0);
 const x=selected.reduce((s,p)=>s+p.pre_q4_fga,0);
 const est=x/3; // Historical simple rate baseline; not a forecast frozen at Q3 in real time.
 return {game_id:game.gameId,game_code:game.code,
  selection_protocol:'TOP_2_PER_TEAM_Q1_Q3_FGA_DESC_TIE_BY_NUMERIC_PLAYER_ID',
  cutoff:'END_OF_Q3_RETROSPECTIVELY_CONSTRUCTED',
  selected_players: selected.map(p=>({...p,q4_fga_label:q4.get(p.player_id)||0})),
  pre_q4_selected_fga:x,observed_q4_selected_fga:y,
  historical_rate_baseline:x/3,absolute_error:Math.abs(est-y),
  all_pre_q4_fga:preActions,all_q4_fga:q4Actions,
  overtime_fga_excluded:[...overtime.values()].reduce((x,y)=>x+y,0),
  statistical_target:'Q4_FGA_OF_FOUR_Q1_TO_Q3_SELECTED_PLAYERS',
  actual_real_time_freeze:false,
  baseline_model_validated:false,
  license_checked:false,calibrator_eligible:false,production_authority:false,execution_authority:false};
}
async function get(url,limit){
 requireTrue(url===SCHEDULE||/^https:\/\/cdn\.nba\.com\/static\/json\/liveData\/(playbyplay|boxscore)\/(playbyplay|boxscore)_00\d{8}\.json$/.test(url),'SOURCE_NOT_ALLOWLISTED');
 const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(20000),headers:{Accept:'application/json',Referer:'https://www.nba.com/','User-Agent':'ATLAS-Q3-OPPORTUNITY-STRICT/1'}});
 requireTrue(r.status===200&&r.url===url,'SOURCE_HTTP_'+r.status);
 const b=Buffer.from(await r.arrayBuffer());requireTrue(b.length>0&&b.length<=limit,'SOURCE_BYTES');
 return {data:JSON.parse(b.toString('utf8')),sha256:sha(b),observed_at_utc:new Date().toISOString()};
}
async function main(){
 const sched=await get(SCHEDULE,8_000_000);
 const games=resolveCohort(sched.data),results=[];
 requireTrue(games.length===COHORT.length&&games.length===3,'COHORT_CHANGED');
 for(const g of games){
  const p=await get(ROOT+'playbyplay/playbyplay_'+g.gameId+'.json',5_000_000);
  const b=await get(ROOT+'boxscore/boxscore_'+g.gameId+'.json',2_500_000);
  const features=deriveQ3Opportunity(p.data,b.data,g);
  results.push({...features,source_observed_at_utc:p.observed_at_utc,pbp_sha256:p.sha256,box_sha256:b.sha256});
 }
 const errors=results.map(r=>r.absolute_error);
 const out={schema:'atlas.nba.q3_to_q4_opportunity.retro_shadow.v1',
  checkpoint_date:'2026-10-22',source_schedule_sha256:sched.sha256,
  cohort_codes:COHORT.map(g=>g.code),games:results,
  retrospective_sample_n:results.length,
  naive_q1_q3_rate_baseline_mae:errors.reduce((a,b)=>a+b,0)/errors.length,
  external_timestamp_at_q3_proven:false,chronological_training_replayed:false,
  original_v3_57_game_replayed:false,rights_reviewed:false,
  claim_scope:'THREE_GAME_RETROSPECTIVE_FEATURE_EXTRACTION_NO_PROSPECTIVE_MODEL',
  paid_odds_calls:0,execution_authority:false,calibrator_eligible:false,production_authority:false};
 writeFileSync('atlas-nba-q3-opportunity-three-game.json',JSON.stringify(out,null,2)+'\n');
 console.log('ATLAS_NBA_Q3_Q4 '+JSON.stringify({n:results.length,games:results.map(r=>({
  code:r.game_code,selected:r.selected_players,pre_q4_fga:r.pre_q4_selected_fga,
  q4_actual:r.observed_q4_selected_fga,historical_baseline:r.historical_rate_baseline,
  absolute_error:r.absolute_error,all_q4_fga:r.all_q4_fga})),
  naive_baseline_mae:out.naive_q1_q3_rate_baseline_mae,
  real_time_freeze:false,v3_reproduced:false}));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))
 main().catch(e=>{console.error('ATLAS_NBA_Q3_GATE_BLOCKED '+e.message);process.exitCode=1});
