'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'../..');
const FILE=path.join(ROOT,'docs/continuity/ATLAS_CURRENT_HANDOFF.json');
const load=()=>JSON.parse(fs.readFileSync(FILE,'utf8'));
function assert(cond,code){if(!cond)throw Error(code)}
function validate(h,root=ROOT){
 assert(h.schema==='atlas.engineering.handoff.v1'&&h.repository==='tyrollclimaco09-oss/Atlas','ROOT_IDENTITY');
 assert(h.source_branch==='research/odds-api-probe-2026-10-22','BRANCH_IDENTITY');
 assert(/^([a-f0-9]{40})$/.test(h.checkpoint_parent_sha),'PINNED_PARENT_SHA');
 const a=h.authority;
 assert(a&&a.production_release===false&&a.autonomous_betting===false&&a.paid_odds_automatic_calls===false&&a.human_final_gate_required===true&&a.merge_to_main_authorized===false&&a.supabase_canonical_mutations_authorized===false,'AUTHORITY_ESCALATION');
 assert(a.historical_checkpoints_append_only===true&&a.source_of_truth==='GITHUB_VERSIONED_EVIDENCE','FRAGMENTED_AUTHORITY');
 assert(h.arc3?.planned_passes===15&&h.arc3?.formally_signed_off===0,'HISTORICAL_ARCIII_REWRITE');
 assert(Array.isArray(h.lanes)&&h.lanes.length===2&&h.lanes[0].id==='NBA_V3'&&h.lanes[0].order===1&&h.lanes[1].id==='NFL_WEEK6'&&h.lanes[1].order===2,'SPORT_ORDER');
 const nba=h.lanes[0],nfl=h.lanes[1];
 assert(nba.sample_reported===57&&nba.earlier_checkpoint_reported===54&&nba.status==='BLOCKED_PRIMARY_REPLAY_UNAVAILABLE'&&nba.archive?.raw_bytes_accessible===false,'UNVERIFIED_NBA_REPLAY');
 assert(nba.reported_october_metrics?.replayed_verified===false&&nba.reported_october_metrics?.confidence_interval_includes_zero===true&&nba.reported_october_metrics?.games===14,'UNVERIFIED_NBA_MODEL_ADVANCEMENT');
 assert(nba.recovered_audit?.verified_synthetic_tests===16&&nba.decision==='NO_PRODUCTION_PROMOTION','NBA_AUDIT_MISLABEL');
 assert(nfl.true_week===6&&nfl.game_id==='401872996'&&nfl.nflverse_week7_available_at_observation===false&&nfl.decision==='NO_PBP_COMPLETENESS_CLAIM','NFL_WEEK_REGRESSION');
 assert(nfl.corroborated?.cj_stroud_pass_attempts===34&&nfl.corroborated?.woody_marks_carries===15,'NFL_PAIR_DATA_REGRESSION');
 const b=h.backend;
 assert(b.active_release==='ATLAS_RC9_PRODUCTION_PROOF_2026_09_21'&&b.readiness==='HOLD_NO_ACTIVE_RUNTIME_CANDIDATE'&&b.historical_r3==='RETIRED_DO_NOT_REFREEZE','RELEASE_PROMOTION');
 assert(b.vercel_supabase_authenticated_parity==='UNKNOWN'&&b.sportsbook_ingest_legacy==='RETIRED_FAIL_CLOSED','BACKEND_UNEARNED_PROOF');
 assert(b.forecast_outcome_admissible==='NONE_CONFIRMED','CALIBRATION_INFLATION');
 const nbaQuality=nba.source_quality_gate,nflQuality=nfl.drive_quality_gate;
 assert(nbaQuality?.status==='BLOCKED_ONE_SHOT_ATTRIBUTION_MISMATCH'&&
  nbaQuality.shot_candidate_attempts===175&&nbaQuality.source_box_total_attempts===175&&
  nbaQuality.reconciled_per_team===false&&
  nbaQuality.source_team_counts[0].pbp_fga===89&&nbaQuality.source_team_counts[0].box_fga===90&&
  nbaQuality.source_team_counts[1].pbp_fga===86&&nbaQuality.source_team_counts[1].box_fga===85&&
  nbaQuality.gate==='NO_V3_Q4_FGA_ADMISSION'&&
  nbaQuality.mismatch_players?.length===2&&
  nbaQuality.mismatch_players[0].player_id==='4869342'&&
  nbaQuality.mismatch_players[0].official_fga===13&&
  nbaQuality.mismatch_players[0].pbp_fga===12&&
  nbaQuality.mismatch_players[1].player_id==='4432165'&&
  nbaQuality.mismatch_players[1].official_fga===8&&
  nbaQuality.mismatch_players[1].pbp_fga===9,'NBA_FGA_FALSE_RECONCILIATION');
 assert(nflQuality?.status==='INTERNAL_ORDER_MATCH_TEAM_ATTRIBUTION_BLOCKED'&&
  nflQuality.game_id==='401872996'&&nflQuality.week===6&&
  nflQuality.unique_play_ids===186&&nflQuality.play_records_missing_team_id===186&&
  nflQuality.event_team_attribution_ready===false&&
  nflQuality.complete_play_coverage_verified===false,'NFL_TEAM_MAPPING_FALSE_APPROVAL');
 const evidence=h.evidence;
 const registry=JSON.parse(fs.readFileSync(path.join(root,'docs/continuity/ATLAS_RECOVERED_ASSET_REGISTRY_2026-10-22.json'),'utf8'));
 assert(registry.schema==='atlas.recovered-artifact-registry.v1'&&
   registry.primary_v3.container_materialized===false&&registry.primary_v3.replay_complete===false&&
   registry.audit_v3.sha256==='911a3e25497869650ba0fcf0ef85f7bfd0a7017ea33aff2c26ba680218367236'&&
   registry.audit_v3.offline_tests_rerun.pass===16&&registry.audit_v3.offline_tests_rerun.fail===0&&
   registry.audit_v3.reconstructed_57_game_predictions===false&&
   registry.disposition==='AUDIT_RECOVERED_FULL_V3_REPLAY_BLOCKED','RECOVERED_ARCHIVE_FALSE_PROMOTION');
 assert(evidence.recovered_asset_registry==='docs/continuity/ATLAS_RECOVERED_ASSET_REGISTRY_2026-10-22.json'&&
   nba.recovered_audit.audit_zip_sha256===registry.audit_v3.sha256,'RECOVERY_REGISTRY_NOT_LINKED');
 assert(evidence.reported_only.includes('NBA_V3_57_GAMES_MAE')&&!evidence.verified_in_this_pass.includes('NBA_V3_57_GAMES_MAE'),'REPORTED_AS_VERIFIED');
 assert(h.known_gaps.includes('REPORTED_V3_METRICS_NOT_REPLAYED'),'GAP_ERASURE');
 const paths=[h.arc3.arc3_handoff,b.recovery_audit,...evidence.source_repo_files,'docs/continuity/ATLAS_CURRENT_HANDOFF.md','docs/continuity/ATLAS_CURRENT_HANDOFF.json'];
 for(const p of paths){assert(!path.isAbsolute(p)&&!p.includes('..')&&fs.existsSync(path.resolve(root,p)),'MISSING_HANDOFF_ARTIFACT:'+p)}
 assert(h.resume_protocol.includes('RUN_CONTINUITY_REGRESSIONS_NO_PAID_ODDS')&&h.resume_protocol.includes('WORK_NBA_BEFORE_NFL_AND_PRESERVE_SEPARATE_LABELS'),'BAD_RESUME_PROTOCOL');
 return Object.freeze({checkpoint_id:h.checkpoint_id,verified_required_paths:paths.length,source_branch:h.source_branch,release:b.readiness});
}
module.exports=Object.freeze({FILE,ROOT,load,validate,sha256:x=>crypto.createHash('sha256').update(x).digest('hex')});
