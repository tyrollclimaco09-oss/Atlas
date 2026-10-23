import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {getCensus} from './nba-oct-date-census.mjs';
import {preQ4Feature,q4Settlement,splitSource} from './nba-q3-feature-firewall.mjs';
import {auditGame} from './nba-three-game-fga-cohort.mjs';
const SCHEDULE='https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_1.json';
const base='https://cdn.nba.com/static/json/liveData/';
function demand(v,s){if(!v)throw Error(s)}
export function participationDiagnostic(feature,q4){
 demand(feature?.schema==='atlas.nba.q3_features.strict_v1','FEATURE_PACKET_REQUIRED');
 const labels=q4Settlement(feature,q4).individual_labels;
 const zero=labels.filter(x=>x.q4_fga===0);
 const classified=zero.map(x=>{
  const events=q4.filter(a=>a.period===4&&String(a.personId??'')===x.player_id);
  const nonShot=events.filter(a=>a.isFieldGoal!==1&&a.isFieldGoal!==true);
  const types=[...new Set(nonShot.map(a=>String(a.actionType??'UNKNOWN')))].sort();
  return {player_id:x.player_id,team:x.team,selected_pre_q4_fga:
   feature.selected_players.find(z=>z.player_id===x.player_id).pre_q4_fga,
   q4_shots:0,q4_all_direct_actor_events:events.length,
   q4_nonshot_direct_actor_events:nonShot.length,
   q4_nonshot_event_types:types,
   ever_directly_referenced_in_q4:events.length>0,
   absence_proves_benching:false,
   presence_proves_full_minutes:false};
 });
 return {zero_q4_shooter_count:zero.length,
  any_q4_actor_events:classified.filter(x=>x.ever_directly_referenced_in_q4).length,
  no_q4_direct_actor_event_observed:classified.filter(x=>!x.ever_directly_referenced_in_q4).length,
  zero_shot_players:classified,
  benching_causally_verified:false,
  q4_participation_minutes_verified:false,
  denominator_players:feature.selected_players.length};
}
async function get(url,max){
 demand(url===SCHEDULE||/^https:\/\/cdn\.nba\.com\/static\/json\/liveData\/(boxscore|playbyplay)\/(boxscore|playbyplay)_00\d{8}\.json$/.test(url),'URL_DISALLOWED');
 const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(18000),
  headers:{Accept:'application/json',Referer:'https://www.nba.com/', 'User-Agent':'ATLAS-NBA-ZEROSHOT-BOUNDARY/1'}});
 demand(r.status===200&&r.url===url,'UPSTREAM_BAD_'+r.status);
 const raw=Buffer.from(await r.arrayBuffer());demand(raw.length>0&&raw.length<=max,'SIZE_LIMIT');
 return {json:JSON.parse(raw.toString('utf8')),sha256:createHash('sha256').update(raw).digest('hex')};
}
async function main(){
 const schedule=await get(SCHEDULE,8_000_000);const census=getCensus(schedule.json);
 const cases=[],errors=[];
 for(const game of census){
  try{
   const p=await get(base+'playbyplay/playbyplay_'+game.gameId+'.json',5_000_000);
   const b=await get(base+'boxscore/boxscore_'+game.gameId+'.json',2_500_000);
   demand(auditGame(p.json,b.json,game).eligible_source_integrity_for_this_game,'FGA_PARITY_FAILED');
   const split=splitSource(p.json.game.actions),f=preQ4Feature(game,split.pre);
   const result=participationDiagnostic(f,split.after);
   cases.push({code:game.code,game_id:game.gameId,feature_sha256:f.feature_sha256,
    pbp_sha256:p.sha256,...result});
  }catch(e){errors.push({code:game.code,error:String(e.message).slice(0,150)})}
 }
 const zeros=cases.flatMap(x=>x.zero_shot_players);
 const out={schema:'atlas.nba.oct2026.zero_q4_shot_participation_diagnostic.v1',
  games_in_census:census.length,games_analyzed:cases.length,errors,
  selected_slots:cases.length*4,
  zero_q4_fga_players:zeros.length,
  zero_fga_but_q4_actor_event:zeros.filter(x=>x.ever_directly_referenced_in_q4).length,
  zero_fga_without_direct_q4_event:zeros.filter(x=>!x.ever_directly_referenced_in_q4).length,
  cases,source_schedule_sha256:schedule.sha256,
  no_q4_actor_event_does_not_prove_benched:true,
  q4_actor_event_does_not_prove_full_minutes:true,
  original_57_game_replay_proven:false,external_q3_freeze:false,
  production_authority:false,calibrator_eligible:false,odds_credits:0};
 writeFileSync('atlas-nba-q4-zero-participation.json',JSON.stringify(out,null,2)+'\n');
 console.log('ATLAS_NBA_Q4_ZERO_PARTICIPATION '+JSON.stringify({
  games:census.length,analyzed:cases.length,selected:out.selected_slots,
  zero_fga:out.zero_q4_fga_players,
  referenced_other_q4_event:out.zero_fga_but_q4_actor_event,
  no_direct_q4_event:out.zero_fga_without_direct_q4_event,
  by_game:cases.map(x=>({code:x.code,zero_fga:x.zero_q4_shooter_count,
    visible_q4_actor_refs:x.any_q4_actor_events})),
  errors,benching_verified:false}));
 if(errors.length)throw Error('INCOMPLETE_SOURCE_CENSUS:'+errors.length);
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))
 main().catch(e=>{console.error('ATLAS_NBA_Q4_PARTICIPATION_BLOCKED '+e.message);process.exitCode=1});
