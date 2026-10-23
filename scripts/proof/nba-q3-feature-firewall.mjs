import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {COHORT,resolveCohort,auditGame} from './nba-three-game-fga-cohort.mjs';

const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const requireTrue=(a,b)=>{if(!a)throw Error(b)};
export function preQ4Feature(game,period1to3){
 requireTrue(game&&/^(00\d{8})$/.test(game.gameId)&&game.home!==game.away,'EVENT_IDENTITY_INVALID');
 requireTrue(Array.isArray(period1to3)&&period1to3.length>100,'Q1_Q3_EVENT_COVERAGE_LOW');
 const byTeam=new Map([[game.home,new Map()],[game.away,new Map()]]);
 const seen=new Set();const quarters=[0,0,0],participantPeriods=new Map();
 for(const a of period1to3){
  requireTrue(Number.isInteger(a.period)&&a.period>=1&&a.period<=3,'FUTURE_PERIOD_IN_PRE_Q4_FEATURE');
  const id=String(a.actionNumber??'');
  requireTrue(/^\d+$/.test(id)&&!seen.has(id),'PRE_Q4_ACTION_ID_DUPLICATE');seen.add(id);
  quarters[a.period-1]++;
  if(a.isFieldGoal!==1&&a.isFieldGoal!==true)continue;
  requireTrue(/^\d+$/.test(String(a.personId??'')),'SHOOTER_ID_INVALID');
  const team=a.teamTricode;
  requireTrue(byTeam.has(team),'UNKNOWN_SOURCE_SHOT_TEAM');
  const p=String(a.personId),t=byTeam.get(team);
  if(!t.has(p))t.set(p,[0,0,0]);
  t.get(p)[a.period-1]++;
  if(participantPeriods.has(p)&&participantPeriods.get(p)!==team)
   throw Error('SHOOTER_SWITCHED_TEAMS');
  participantPeriods.set(p,team);
 }
 requireTrue(quarters.every(n=>n>0),'Q1_Q3_PERIOD_MISSING');
 const selected=[];
 for(const team of [game.home,game.away]){
  const options=[...byTeam.get(team)].map(([player_id,attempts])=>({
   player_id,team,q1_fga:attempts[0],q2_fga:attempts[1],q3_fga:attempts[2],
   pre_q4_fga:attempts.reduce((a,b)=>a+b,0)
  })).sort((a,b)=>b.pre_q4_fga-a.pre_q4_fga||
   (Number(a.player_id)-Number(b.player_id)));
  requireTrue(options.length>=2,'TEAM_TWO_SHOOTERS_REQUIRED');
  selected.push(...options.slice(0,2));
 }
 const publicPart={schema:'atlas.nba.q3_features.strict_v1',event_id:game.gameId,
  game_code:game.code,home:game.home,away:game.away,
  accepted_periods:[1,2,3],period_event_counts:quarters,
  selection:'TWO_PER_TEAM_Q1_Q3_FGA_TIE_NUMERIC_ID',
  selected_players:selected,
  selected_pre_q4_fga:selected.reduce((a,b)=>a+b.pre_q4_fga,0),
  selected_q3_fga:selected.reduce((a,b)=>a+b.q3_fga,0),
  naive_q4_rate_estimate:selected.reduce((a,b)=>a+b.pre_q4_fga,0)/3,
  actual_q3_external_freeze_attested:false,
  production_authority:false,
  model_validated:false};
 return {...publicPart,feature_sha256:hash(publicPart)};
}
export function q4Settlement(feature,period4plus){
 requireTrue(feature?.schema==='atlas.nba.q3_features.strict_v1'&&
  feature.actual_q3_external_freeze_attested===false,'UNAUTHORIZED_FEATURE_PACKET');
 requireTrue(Array.isArray(period4plus),'MISSING_Q4_LABEL_DATA');
 const counted=new Map();let ot=0;
 for(const a of period4plus){
  requireTrue(Number.isInteger(a.period)&&a.period>=4,'PRE_Q4_DATA_IN_SETTLEMENT');
  if(a.isFieldGoal!==1&&a.isFieldGoal!==true)continue;
  if(a.period>4){ot++;continue}
  const id=String(a.personId);
  counted.set(id,(counted.get(id)||0)+1);
 }
 const selected=feature.selected_players.map(p=>({
  player_id:p.player_id,team:p.team,q4_fga:counted.get(p.player_id)||0
 }));
 const actual=selected.reduce((n,p)=>n+p.q4_fga,0);
 return {schema:'atlas.nba.q4_label.strict_v1',event_id:feature.event_id,
  feature_sha256:feature.feature_sha256,selected_q4_fga:actual,
  individual_labels:selected,q5plus_fga_excluded:ot,
  absolute_error:Math.abs(actual-feature.naive_q4_rate_estimate),
  predictive_proof:false,settlement_calibrator_eligible:false};
}
export function splitSource(actions){
 requireTrue(Array.isArray(actions),'SOURCE_ACTIONS_REQUIRED');
 return {pre:actions.filter(a=>a.period<=3),
  after:actions.filter(a=>a.period>=4)};
}
async function get(url,limit){
 requireTrue(url==='https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json'||
 /^https:\/\/cdn\.nba\.com\/static\/json\/liveData\/(playbyplay|boxscore)\/(playbyplay|boxscore)_00\d{8}\.json$/.test(url),'SOURCE_NOT_ALLOWLISTED');
 const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(18000),headers:{
  Accept:'application/json',Referer:'https://www.nba.com/', 'User-Agent':'ATLAS-NBA-TEMPORAL-FIREWALL/1'}});
 requireTrue(r.status===200&&r.url===url,'SOURCE_HTTP_'+r.status);
 const raw=Buffer.from(await r.arrayBuffer());requireTrue(raw.length>0&&raw.length<=limit,'SOURCE_TOO_LARGE');
 return {json:JSON.parse(raw.toString('utf8')),sha256:createHash('sha256').update(raw).digest('hex')};
}
async function main(){
 const schedule=await get('https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json',8_000_000);
 const games=resolveCohort(schedule.json),results=[];
 requireTrue(games.length===COHORT.length,'COHORT_MISMATCH');
 for(const game of games){
  const p=await get('https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_'+game.gameId+'.json',5_000_000);
  const b=await get('https://cdn.nba.com/static/json/liveData/boxscore/boxscore_'+game.gameId+'.json',2_500_000);
  requireTrue(auditGame(p.json,b.json,game).eligible_source_integrity_for_this_game,'OFFICIAL_FGA_PARITY_FAILED');
  const {pre,after}=splitSource(p.json.game.actions);
  const frozen=preQ4Feature(game,pre),label=q4Settlement(frozen,after);
  results.push({game_code:game.code,game_id:game.gameId,
   feature_sha256:frozen.feature_sha256,selected_players:frozen.selected_players,
   selected_q3_fga:frozen.selected_q3_fga,selected_pre_q4_fga:frozen.selected_pre_q4_fga,
   naive_rate:frozen.naive_q4_rate_estimate,actual_q4:label.selected_q4_fga,
   absolute_error:label.absolute_error,source_pbp_sha256:p.sha256,source_box_sha256:b.sha256,
   timestamped_q3_freeze:false});
 }
 const out={schema:'atlas.nba.q3_feature_firewall.retro_v1',
  games:results,passes_temporal_input_exclusion:true,
  external_q3_freeze:false,
  original_v3_57_game_replayed:false,license_reviewed:false,
  calibrator_eligible:false,production_authority:false,odds_calls:0,
  observed_at_utc:new Date().toISOString()};
 writeFileSync('atlas-nba-q3-feature-firewall.json',JSON.stringify(out,null,2)+'\n');
 console.log('ATLAS_NBA_Q3_FIREWALL '+JSON.stringify({
  results:results.map(r=>({game:r.game_code,pre:r.selected_pre_q4_fga,q3:r.selected_q3_fga,
    q4:r.actual_q4,estimate:r.naive_rate,error:r.absolute_error,feature_hash:r.feature_sha256})),
  external_freeze:false,model_promotion:false}));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))
 main().catch(e=>{console.error('ATLAS_NBA_FIREWALL_BLOCKED '+e.message);process.exitCode=1});
