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
 const nh=nbaQuality.shot_trace,ns=nflQuality.source_schema;
 assert(nh?.github_run===39851620052&&nh.identified_heave?.event_id==='401909834198'&&
   nh.identified_heave.player_id==='4432165'&&
   nh.identified_heave.confirmed_official_exclusion===false&&
   nh.independent_alternative_play_source_checked===true&&
   nh.identified_heave.nba_marked_fga_absent_in_observed_source===true&&
   nh.gate==='NO_V3_Q4_FGA_ADMISSION','NBA_HEAVE_UNEARNED_PROMOTION');
 assert(ns?.source_consistency_class==='SOURCE_CONSISTENT_NOT_INDEPENDENTLY_VERIFIED'&&
   ns.restricted_source_consistent_candidates===116&&
   ns.rejected_types+ns.rejected_penalty_or_turnover===70&&
   ns.play_team_id_present===0&&ns.start_vs_drive_team_mismatches===20&&
   ns.team_participants_contain_both_sides===true&&
   ns.independent_play_actor_coverage_verified===false,'NFL_TEAM_CANDIDATE_UNEARNED_PROMOTION');
 const nbaIndependent=nbaQuality.independent_official_one_game;
 assert(nbaIndependent?.state==='ONE_GAME_INDEPENDENT_NBA_SHOT_SOURCE_CORROBORATED'&&
  nbaIndependent.nba_game_id==='0022600085'&&nbaIndependent.espn_game_id==='401909834'&&
  nbaIndependent.official_nba_actions===629&&nbaIndependent.official_nba_fga_marked===175&&
  nbaIndependent.daniels.nba_only_action_id==='606'&&
  nbaIndependent.daniels.espn_fga===12&&nbaIndependent.daniels.nba_pbp_fga===13&&
  nbaIndependent.suggs.espn_only_event_id==='401909834198'&&
  nbaIndependent.suggs.espn_fga===9&&nbaIndependent.suggs.nba_pbp_fga===8&&
  nbaIndependent.one_game_player_fga_consistent_with_official_nba_box===true&&
  nbaIndependent.all_57_game_v3_replay_verified===false&&
  nbaIndependent.espn_q4_fga_model_feature_admitted===false&&
  nbaIndependent.official_rule_exclusion_cause_verified===false&&
  nbaIndependent.license_rights_verified===false,'NBA_CROSSSOURCE_UNEARNED_PROMOTION');
 const game=nfl.verified_matchup,census=nfl.independent_pbp_census;
 assert(game?.espn_event_id==='401872996'&&game.nflverse_game_id==='2026_06_HOU_JAX'&&
  game.season===2026&&game.week===6&&game.home_team==='JAX'&&
  game.home_espn_team_id==='30'&&game.away_team==='HOU'&&
  game.away_espn_team_id==='34'&&game.new_england_prior_label_invalid===true&&
  game.game_identity_verified===true,'NFL_OPPONENT_IDENTITY_REGRESSION');
 assert(census?.state==='TWO_SOURCE_GAME_ID_AND_ROW_CENSUS_VERIFIED_NOT_EVENT_ALIGNED'&&
  census.nflverse_rows===178&&census.espn_drive_event_rows===186&&
  census.nflverse_pass_attempt_flags===75&&census.nflverse_rush_attempt_flags===52&&
  census.nflverse_qb_scramble_flags===3&&census.nflverse_no_play_rows===18&&
  census.source_team_values_outside_game===0&&
  census.unmatched_8_rows_confirmed_missing_snaps===false&&
  census.event_id_one_to_one_verified===false&&
  census.player_actor_map_verified===false&&census.complete_snap_coverage_verified===false&&
  census.calibrator_eligible===false,'NFL_PBP_UNEARNED_PROMOTION');
 const parity=census.game_level_attempt_parity;
 assert(parity?.evidence_run===39856084383&&
  parity.espn_derived_pass_attempt_events===75&&parity.nflverse_pass_attempt_flags===75&&
  parity.espn_derived_rush_attempt_events===52&&parity.nflverse_rush_attempt_flags===52&&
  parity.pass_counts_match===true&&parity.rush_counts_match===true&&
  parity.scope==='GAME_LEVEL_EVENT_CATEGORY_TOTALS_ONLY_NOT_PLAYER_OR_PLAY_ID_PARITY'&&
  parity.player_actor_verified===false&&parity.play_id_one_to_one_verified===false&&
  parity.official_snap_completeness_verified===false,'NFL_GAME_COUNTS_UNEARNED_PROMOTION');
 const cohort=nba.preregistered_official_source_cohort;
 assert(cohort?.state==='THREE_GAME_OFFICIAL_SOURCE_INTEGRITY_PASS_NOT_MODEL_VALIDATION'&&
  JSON.stringify(cohort.game_codes)===JSON.stringify(['20261021/ATLORL','20261021/CHABKN','20261021/GSWLAL'])&&
  cohort.game_count===3&&cohort.passed_games===3&&cohort.actions_total===1839&&
  cohort.fga_total===521&&cohort.rostered_players_total===80&&
  cohort.player_fga_discrepancies===0&&cohort.unknown_shooter_ids===0&&
  cohort.duplicate_action_ids===0&&cohort.missing_official_fga_fields===0&&
  cohort.nba_cdn_box_and_pbp_same_ecosystem===true&&
  cohort.rights_reviewed===false&&cohort.pre_q4_feature_freeze_verified===false&&
  cohort.original_57_game_v3_replay_verified===false&&
  cohort.model_calibration_verified===false,'NBA_THREE_GAME_UNEARNED_PROMOTION');
 const strict=nfl.strict_event_correspondence;
 assert(strict?.state==='UNIQUE_CLOCK_TEAM_KIND_MATCH_FOR_116_RESTRICTED_PLAYS'&&
  strict.same_game_id==='2026_06_HOU_JAX'&&
  strict.eligible_espn_candidates===116&&strict.eligible_nflverse_candidates===127&&
  strict.unique_key_matched_pairs===116&&strict.espn_eligible_unmatched===0&&
  strict.nflverse_eligible_unmatched===11&&strict.ambiguous_shared_keys===0&&
  strict.espn_excluded_other_types===69&&strict.espn_excluded_penalty_or_turnover===1&&
  strict.actor_ids_independently_verified===false&&
  strict.complete_snap_coverage_verified===false&&
  strict.extra_11_verified_missing_snaps===false&&
  strict.official_native_play_id_equivalence_verified===false,
  'NFL_STRICT_CLOCK_MATCH_FALSE_PROMOTION');
 const nearby=strict.unmatched_clock_diagnostic;
 assert(nearby?.run_id===39863207585&&nearby.nflverse_only_count===11&&
  nearby.same_clock_espn_type_counts.NO_ESPN_EVENT_AT_EXACT_CLOCK===5&&
  nearby.same_clock_espn_type_counts.Timeout===2&&
  nearby.same_clock_espn_type_counts['Pass Interception Return']===2&&
  nearby.same_clock_espn_type_counts.Penalty===1&&
  nearby.same_clock_espn_type_counts.Rush===1&&
  nearby.cause_confirmed===false&&nearby.actor_identity_verified===false&&
  nearby.correction_applied===false&&
  nearby.interpretation==='CANDIDATE_SAME_CLOCK_NEIGHBORS_ONLY_NO_IDENTITY_ASSERTION',
  'NFL_UNMATCHED_CAUSALITY_FALSE_PROMOTION');
 const nbaQ3=nba.q3_to_q4_retro_shadow;
 assert(nbaQ3?.state==='THREE_GAME_Q1_Q3_FEATURE_SELECTION_WITH_Q4_LABEL_NOT_PROSPECTIVE'&&
  nbaQ3.source_run===39864872638&&nbaQ3.original_v3_replay===false&&
  nbaQ3.external_q3_freeze===false&&nbaQ3.roster_player_slots===12&&
  JSON.stringify(nbaQ3.q4_actual_by_game)===JSON.stringify([18,24,3])&&
  Math.abs(nbaQ3.retrospective_naive_mae-7.4444444444444455)<1e-10&&
  nbaQ3.pre_q4_mutation_invariance_test_passed===true&&
  nbaQ3.gsw_lal_q4_low_volume_cause_verified===false&&
  nbaQ3.model_validation===false,'NBA_Q3_RETRO_FALSE_PROMOTION');
 const nflActors=nfl.player_volume_actor_shadow;
 assert(nflActors?.state==='TWO_HOU_PLAYER_NAME_TEAM_AND_VOLUME_CORROBORATION_ONLY'&&
  nflActors.game_id==='2026_06_HOU_JAX'&&nflActors.source_run===39864788837&&
  nflActors.stroud.nflverse_gsis==='00-0039163'&&
  nflActors.stroud.passing_attempts===34&&nflActors.stroud.espn_attempts===34&&
  nflActors.marks.nflverse_gsis==='00-0040583'&&
  nflActors.marks.rushing_attempts===15&&nflActors.marks.espn_attempts===15&&
  nflActors.nflverse_to_espn_player_id_verified===false&&
  nflActors.full_play_coverage_verified===false&&
  nflActors.pregame_player_model_validated===false,'NFL_PLAYER_ACTORS_UNEARNED');
 const backendProof=b.latest_read_only_proof;
 assert(backendProof?.admissible_causal_outcomes===0&&backendProof.model_validation_count===0&&
  backendProof.supabase_calibration_stage==='WAIT_FIRST_CAUSAL_OUTCOME'&&
  backendProof.feed_state==='MANUAL_ONLY'&&backendProof.configured_feeds===0&&
  backendProof.query_read_only===true&&
  backendProof.authenticated_vercel_to_supabase_verified===false,
  'BACKEND_RUNTIME_FALSE_CERTIFICATION');
 const custody=h.evidence.dual_source_custody;
 assert(custody?.workflow_run===39865337273&&
  custody.nba_packet_sha256==='a8d2bd42936291105a3d5ec180387df9073bb94368cea1ec67569fb9199e275e'&&
  custody.nfl_packet_sha256==='8fcd084a77af61aa7d5ef8484c4086d4c76594010668ef5edb354f629e8f2250'&&
  custody.calibrator_eligible===false&&custody.production_authority===false&&
  custody.real_time_freeze_verified===false,'SHADOW_CUSTODY_UNEARNED_PROMOTION');
 const fw=nba.q3_feature_firewall,c14=nba.october_date_census,z=nba.q4_zero_shot_diagnostic;
 assert(fw?.status==='STRICT_PRE_Q4_INPUT_ISOLATION_VERIFIED_RETROSPECTIVELY'&&
   fw.offline_tests_passed===5&&fw.future_event_rejected===true&&
   fw.q4_label_in_separate_function===true&&
   fw.feature_hash_unchanged_when_q4_outcome_mutates===true&&
   fw.external_live_q3_timestamp_verified===false&&
   fw.original_v3_replay_verified===false,'Q3_FIREWALL_FALSE_RELEASE');
 assert(c14?.games_scheduled===14&&c14.games_accepted===14&&c14.rejections===0&&
   c14.selected_players===56&&c14.zero_q4_shooters===10&&
   Math.abs(c14.rate_baseline_mae-5.452380952380952)<1e-10&&
   c14.original_v3_comparator_equivalent===false&&c14.v3_57_row_level_replay_verified===false&&
   c14.pre_q4_external_freeze_verified===false&&c14.new_model_validated===false,
   'NBA_V3_FALSE_COMPARABILITY');
 assert(z?.zero_q4_fga===10&&z.zero_shooters_with_other_q4_direct_actor_event===6&&
   z.zero_shooters_without_q4_direct_actor_event===4&&
   z.phoenix_portland_selected_zero_q4_fga===4&&
   z.phoenix_portland_zero_fga_with_other_q4_actor_event===3&&
   z.q4_actual_minutes_verified===false&&z.benching_cause_verified===false,
   'NBA_BENCHING_INVENTION');
 const qb=nfl.qb_prior_week_retrospective;
 assert(qb?.weeks?.length===6&&qb.qb_game_rows===214&&qb.paired_predictions===85&&
   qb.game_clusters===45&&
   Math.abs(qb.last3_mae-8.672549019607843)<1e-10&&
   Math.abs(qb.league_reference_mae-7.516757103540519)<1e-10&&
   qb.exploratory_ci95[0]<0&&qb.exploratory_ci95[1]>0&&
   qb.uses_only_prior_weeks_for_prediction_features===true&&
   qb.selection_conditions_on_current_week_pass_attempt_rows===true&&
   qb.all_pregame_candidate_qbs_included===false&&
   qb.verified_pregame_timestamp_freeze===false&&
   qb.model_promoted===false&&qb.odds_and_positive_ev_verified===false,
   'QB_BASELINE_FALSE_PROMOTION');
 const live=b.massive_pass_refresh;
 assert(live?.read_only===true&&live.admissible_outcomes===0&&live.validated_models===0&&
   live.operational_mode==='MANUAL_ONLY'&&live.configured_feeds===0&&
   live.vercel_to_supabase_authenticated_parity_verified===false&&
   live.canonical_betting_execution_approved===false,'BACKEND_RELEASE_NOT_EARNED');
 const wk7=nfl.week7_pregame_shadow_freeze;
 assert(wk7?.status==='CI_RECORDED_PREGAME_UNSETTLED_RESEARCH_V2'&&
  wk7.official_schedule_game_count===14&&wk7.future_games_included===13&&
  wk7.already_started_or_insufficient_buffer_excluded===1&&
  wk7.forecast_player_slots===26&&wk7.numeric_forecast_slots===25&&
  wk7.explicit_null_abstentions===1&&
  wk7.source_alias==='ESPN_LAR_MAPS_TO_NFLVERSE_LA'&&
  wk7.one_prior_game_forecast_blocked===true&&
  JSON.stringify(wk7.source_past_weeks_only)===JSON.stringify([1,2,3,4,5,6])&&
  wk7.min_kickoff_buffer_seconds===1800&&
  wk7.ci_run===39879769087&&
  wk7.ledger==='docs/prospective/ATLAS_NFL_W7_PREGAME_SHADOW_20261022_V2.json'&&
  wk7.all_week7_official_outcomes_settled===false&&
  wk7.any_starting_qb_verified===false&&
  wk7.external_independent_timestamp_signature===false&&
  wk7.prospective_evaluation_completed===false&&
  wk7.production_authority===false&&wk7.bettor_executable_bet===false,
  'W7_PREGAME_PACKET_FALSE_PROMOTION');
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
