'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {accept}=require('./dual-lane-research-custody.cjs');
const sha='a'.repeat(64);
function fixture(){
 const games=['20261021/ATLORL','20261021/CHABKN','20261021/GSWLAL'].map((game_code,i)=>{
  const selected_players=['1','2','3','4'].map((player_id,k)=>({player_id,team:k<2?'A':'B',pre_q4_fga:3,q4_fga_label:1}));
  return {game_code,game_id:'g'+i,selected_players,
   pre_q4_selected_fga:12,observed_q4_selected_fga:4,
   historical_rate_baseline:4,absolute_error:0,pbp_sha256:sha,box_sha256:sha,
   actual_real_time_freeze:false,baseline_model_validated:false,
   calibrator_eligible:false,execution_authority:false};
 });
 const nba={schema:'atlas.nba.q3_to_q4_opportunity.retro_shadow.v1',
  cohort_codes:games.map(g=>g.game_code),retrospective_sample_n:3,games,
  naive_q1_q3_rate_baseline_mae:0,external_timestamp_at_q3_proven:false,
  original_v3_57_game_replayed:false,chronological_training_replayed:false,
  calibrator_eligible:false,production_authority:false,execution_authority:false,paid_odds_calls:0};
 const nfl={schema:'atlas.nfl.week6.actor-source-crosscheck.shadow.v1',
  game_id:'2026_06_HOU_JAX',nflverse_sha256:sha,espn_sha256:sha,
  espn_reference:{stroud_espn_pass_attempts:34,marks_espn_carries:15},
  nflverse_hou_stroud:{team:'HOU',attempts:34},nflverse_hou_marks:{team:'HOU',attempts:15},
  stroud_total_agreement:true,marks_total_agreement:true,
  cross_provider_person_id_mapping_verified:false,complete_play_actor_coverage_verified:false,
  real_time_pregame_forecast:false,calibrator_eligible:false,production_authority:false,
  execution_authority:false,odds_credits:0};
 return {nba,nfl};
}
test('both separate research sources are accepted without promotion',()=>{
 const {nba,nfl}=fixture();const r=accept(nba,nfl);
 assert.equal(r.nba.player_slots,12);assert.equal(r.nfl.stroud_attempts,34);
 assert.equal(r.autonomous_execution,false);
});
test('NBA retrospective Q3 features cannot claim external freeze',()=>{
 const {nba,nfl}=fixture();nba.external_timestamp_at_q3_proven=true;
 assert.throws(()=>accept(nba,nfl));});
test('NBA totals cannot be silently adjusted after source evaluation',()=>{
 const {nba,nfl}=fixture();nba.games[0].selected_players[0].q4_fga_label=2;
 assert.throws(()=>accept(nba,nfl));});
test('NFL actor name matching cannot promote ID to cross-provider fact',()=>{
 const {nba,nfl}=fixture();nfl.cross_provider_person_id_mapping_verified=true;
 assert.throws(()=>accept(nba,nfl));});
test('league separation and NFL opponent identity are required',()=>{
 const {nba,nfl}=fixture();nfl.game_id='2026_06_HOU_NE';
 assert.throws(()=>accept(nba,nfl));});
