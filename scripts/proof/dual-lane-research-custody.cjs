'use strict';
// ATLAS dual-lane SHADOW custody; reuse existing sport extractors, no new canon schema.
const fs=require('node:fs'),crypto=require('node:crypto');
const assert=require('node:assert/strict');
const NBA='atlas.nba.q3_to_q4_opportunity.retro_shadow.v1';
const NFL='atlas.nfl.week6.actor-source-crosscheck.shadow.v1';
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const shaOk=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-9;
function accept(nba,nfl){
 assert.equal(nba?.schema,NBA);
 assert.equal(nfl?.schema,NFL);
 assert.deepEqual(nba.cohort_codes,['20261021/ATLORL','20261021/CHABKN','20261021/GSWLAL']);
 assert.equal(nba.retrospective_sample_n,3);
 assert.equal(nba.games.length,3);
 assert.equal(nba.external_timestamp_at_q3_proven,false);
 assert.equal(nba.original_v3_57_game_replayed,false);
 assert.equal(nba.chronological_training_replayed,false);
 assert.equal(nba.calibrator_eligible,false);
 assert.equal(nba.production_authority,false);
 assert.equal(nba.execution_authority,false);
 assert.equal(nba.paid_odds_calls,0);
 const seen=new Set(),errors=[];
 for(let i=0;i<nba.games.length;i++){
  const g=nba.games[i];
  assert.equal(g.game_code,nba.cohort_codes[i]);
  assert.equal(g.actual_real_time_freeze,false);
  assert.equal(g.baseline_model_validated,false);
  assert.equal(g.calibrator_eligible,false);
  assert.equal(g.execution_authority,false);
  assert.equal(g.selected_players.length,4);
  assert(!seen.has(g.game_id));seen.add(g.game_id);
  assert(shaOk(g.pbp_sha256)&&shaOk(g.box_sha256));
  assert(g.selected_players.every(x=>Number.isSafeInteger(x.pre_q4_fga)&&x.pre_q4_fga>0
    &&Number.isSafeInteger(x.q4_fga_label)&&x.q4_fga_label>=0));
  assert.equal(new Set(g.selected_players.map(x=>x.player_id)).size,4);
  assert.equal(new Set(g.selected_players.map(x=>x.team)).size,2);
  assert([...new Set(g.selected_players.map(x=>x.team))].every(t=>
     g.selected_players.filter(x=>x.team===t).length===2));
  const pre=g.selected_players.reduce((s,x)=>s+x.pre_q4_fga,0);
  const target=g.selected_players.reduce((s,x)=>s+x.q4_fga_label,0);
  assert.equal(pre,g.pre_q4_selected_fga);
  assert.equal(target,g.observed_q4_selected_fga);
  assert(close(pre/3,g.historical_rate_baseline));
  assert(close(Math.abs(pre/3-target),g.absolute_error));
  errors.push(g.absolute_error);
 }
 assert(close(errors.reduce((a,b)=>a+b,0)/3,nba.naive_q1_q3_rate_baseline_mae));
 assert.equal(nfl.game_id,'2026_06_HOU_JAX');
 assert.equal(nfl.schema,NFL);
 assert(shaOk(nfl.nflverse_sha256)&&shaOk(nfl.espn_sha256));
 assert.equal(nfl.espn_reference.stroud_espn_pass_attempts,34);
 assert.equal(nfl.espn_reference.marks_espn_carries,15);
 assert.equal(nfl.nflverse_hou_stroud?.team,'HOU');
 assert.equal(nfl.nflverse_hou_stroud?.attempts,34);
 assert.equal(nfl.nflverse_hou_marks?.team,'HOU');
 assert.equal(nfl.nflverse_hou_marks?.attempts,15);
 assert.equal(nfl.stroud_total_agreement,true);
 assert.equal(nfl.marks_total_agreement,true);
 assert.equal(nfl.cross_provider_person_id_mapping_verified,false);
 assert.equal(nfl.complete_play_actor_coverage_verified,false);
 assert.equal(nfl.real_time_pregame_forecast,false);
 assert.equal(nfl.calibrator_eligible,false);
 assert.equal(nfl.production_authority,false);
 assert.equal(nfl.execution_authority,false);
 assert.equal(nfl.odds_credits,0);
 return Object.freeze({schema:'atlas.dual-lane.retrospective-evidence-custody.v1',
  evidence_status:'TWO_SPORT_SHADOW_SOURCE_RESEARCH_ONLY',
  nba:{games:3,player_slots:12,q3_target_count:3,rate_baseline_mae:nba.naive_q1_q3_rate_baseline_mae,
   source_reconciled:true,model_validated:false,q3_external_freeze_verified:false},
  nfl:{event:'2026_06_HOU_JAX',stroud_attempts:34,marks_carries:15,
   cross_provider_player_id_verified:false,forecast_validated:false},
  potential_ev_established:false,
  prospective_freeze_eligible:false,calibrator_eligible:false,
  autonomous_execution:false,production_authority:false});
}
function main(){
 const p=fs.readFileSync('atlas-nba-q3-opportunity-three-game.json');
 const q=fs.readFileSync('atlas-nfl-week6-actor-volume.json');
 const report=accept(JSON.parse(p),JSON.parse(q));
 const receipt={...report,observed_at_utc:new Date().toISOString(),
  inputs:{nba_artifact_sha256:hash(p),nfl_artifact_sha256:hash(q)},
  github_source_provenance:'RESEARCH_BRANCH_CI_UNATTESTED_AT_ORIGIN',
  actual_external_pre_cutoff_signature_verified:false};
 fs.writeFileSync('atlas-dual-lane-custody.json',JSON.stringify(receipt,null,2)+'\n');
 console.log('ATLAS_DUAL_LANE_CUSTODY '+JSON.stringify(receipt));
}
if(require.main===module)main();
module.exports=Object.freeze({accept});
