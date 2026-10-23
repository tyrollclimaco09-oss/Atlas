import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {auditGame} from './nba-three-game-fga-cohort.mjs';
const FROZEN='docs/prospective/ATLAS_NBA_DENOKC_Q1_Q4_SHADOW_FREEZE_20261022_V1.json';
const EXPECTED_SHA='17b0e41790953c386669316b13956681c2c64cac3d8da747541a0114bab4702c';
const ROOT='https://cdn.nba.com/static/json/liveData/';
const SHA=b=>createHash('sha256').update(b).digest('hex');
const guard=(x,m)=>{if(!x)throw Error(m)};
export function loadFreeze(){
 const b=fs.readFileSync(FROZEN);
 guard(SHA(b)===EXPECTED_SHA,'ORIGINAL_FROZEN_PACKET_CHANGED');
 return JSON.parse(b);
}
export function settle(f,sourcePbp,sourceBox){
 guard(f?.schema==='atlas.nba.live_q1_to_q4.priceblind.untrained.v1'&&
  f.game_id==='0022600007'&&f.github_run_id==='39891028392','INVALID_FROZEN_FORECAST_ID');
 guard(f.official_settlement_done===false&&f.q4_outcomes_recorded_in_packet===false,
  'FREEZE_ALREADY_CONTAINS_OUTCOMES');
 const g={gameId:f.game_id,code:'20261022/DENOKC',home:'OKC',away:'DEN'};
 guard(sourceBox?.game?.gameId===g.gameId&&sourcePbp?.game?.gameId===g.gameId,
  'FINAL_SOURCE_GAME_CONFLICT');
 guard(sourceBox.game.gameStatus===3,'GAME_NOT_FINAL_DO_NOT_SETTLE');
 guard(auditGame(sourcePbp,sourceBox,g).eligible_source_integrity_for_this_game,
  'FINAL_OFFICIAL_PBP_BOX_FGA_INTEGRITY_FAILED');
 const actions=sourcePbp.game.actions;
 guard(actions.some(a=>a.period===4&&a.actionType==='period'&&
  a.subType==='end'&&a.clock==='PT00M00.00S'),'Q4_OFFICIAL_END_MARKER_MISSING');
 guard(f.selected_players.length===4&&new Set(f.selected_players.map(x=>x.player_id)).size===4,
  'FROZEN_SELECTION_INVALID');
 const details=[];
 for(const p of f.selected_players){
  const q1=actions.filter(a=>a.period===1&&(a.isFieldGoal===1||a.isFieldGoal===true)&&
    String(a.personId)===p.player_id&&a.teamTricode===p.team).length;
  const q4=actions.filter(a=>a.period===4&&(a.isFieldGoal===1||a.isFieldGoal===true)&&
    String(a.personId)===p.player_id&&a.teamTricode===p.team).length;
  guard(q1===p.q1_fga,'Q1_FROZEN_FEATURE_SOURCE_REVISION:'+p.player_id);
  details.push({player_id:p.player_id,team:p.team,frozen_q1_fga:p.q1_fga,official_q4_fga:q4});
 }
 const actual=details.reduce((s,x)=>s+x.official_q4_fga,0);
 guard(f.q4_fga_point_reference===details.reduce((s,x)=>s+x.frozen_q1_fga,0),
  'FORECAST_MATH_CHANGED');
 return {schema:'atlas.nba.q1_to_q4.outcome_shadow_receipt.v1',
  freeze_sha256:EXPECTED_SHA,freeze_github_run_id:f.github_run_id,
  freeze_created_utc:f.created_at_utc,game_id:f.game_id,
  frozen_point_reference:f.q4_fga_point_reference,actual_q4_selected_fga:actual,
  absolute_error:Math.abs(actual-f.q4_fga_point_reference),
  per_player:details,comparability:'SAME_Q1_SELECTED_PLAYERS_AND_POSTGAME_OFFICIAL_Q4_ONLY',
  no_price_or_market_ev_evaluated:true,model_validated:false,
  calibration_eligible:false,betting_authority:false,
  original_live_freeze_unchanged:true};
}
async function get(url,max){
 guard([ROOT+'playbyplay/playbyplay_0022600007.json',ROOT+'boxscore/boxscore_0022600007.json'].includes(url),
  'UNTRUSTED_SOURCE_URL');
 const r=await fetch(url,{signal:AbortSignal.timeout(14000),redirect:'error',
  headers:{Accept:'application/json',Referer:'https://www.nba.com/', 'User-Agent':'ATLAS-NBA-Q1-Q4-FINAL-RESEARCH/1'}});
 guard(r.status===200&&r.url===url,'FINAL_SOURCE_HTTP_'+r.status);
 const b=Buffer.from(await r.arrayBuffer());
 guard(b.length>0&&b.length<=max,'FINAL_SOURCE_BYTES_LIMIT');
 return {data:JSON.parse(b.toString('utf8')),observed_utc:new Date().toISOString(),sha256:SHA(b)};
}
async function main(){
 const f=loadFreeze(),[pbp,box]=await Promise.all([
  get(ROOT+'playbyplay/playbyplay_0022600007.json',5_000_000),
  get(ROOT+'boxscore/boxscore_0022600007.json',2_500_000)]);
 const result=settle(f,pbp.data,box.data);
 const receipt={...result,settlement_observed_utc:new Date().toISOString(),
  source_pbp_sha256:pbp.sha256,source_box_sha256:box.sha256,
  separate_from_original_packet:true,production_authority:false};
 guard(new Date(receipt.settlement_observed_utc).getTime()>new Date(f.created_at_utc).getTime(),
  'SETTLEMENT_TIMESTAMP_BEFORE_FREEZE');
 fs.writeFileSync('atlas-nba-q1-q4-final-settlement.json',JSON.stringify(receipt,null,2)+'\n');
 console.log('ATLAS_NBA_Q1_Q4_OFFICIAL_SETTLEMENT '+JSON.stringify(receipt));
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1]))
 main().catch(e=>{console.error('ATLAS_NBA_Q1_Q4_SETTLEMENT_BLOCKED '+e.message);process.exitCode=1});
