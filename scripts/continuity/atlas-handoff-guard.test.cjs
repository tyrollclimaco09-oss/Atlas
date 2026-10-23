'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {validate,load,sha256,FILE}=require('./atlas-handoff-guard.cjs');
const fs=require('node:fs');
const clone=o=>structuredClone(o);
test('canonical handoff current schema and every linked repo file exists',()=>{const r=validate(load());assert.ok(r.verified_required_paths>=6);});
test('handoff byte digest is stable and non-empty',()=>{assert.match(sha256(fs.readFileSync(FILE)),/^[0-9a-f]{64}$/);});
test('cannot silently enable betting, production, or Supabase writes',()=>{for(const k of ['autonomous_betting','production_release','paid_odds_automatic_calls','merge_to_main_authorized','supabase_canonical_mutations_authorized']){const h=clone(load());h.authority[k]=true;assert.throws(()=>validate(h),/AUTHORITY_ESCALATION/)}});
test('cannot silently turn V3 reported scores into replay-verified',()=>{const h=clone(load());h.lanes[0].reported_october_metrics.replayed_verified=true;assert.throws(()=>validate(h),/UNVERIFIED_NBA_MODEL_ADVANCEMENT/);});
test('cannot change NBA 57-game checkpoint into earlier 54-game revision',()=>{const h=clone(load());h.lanes[0].sample_reported=54;assert.throws(()=>validate(h),/UNVERIFIED_NBA_REPLAY/);});
test('cannot conflate NFL Week 6 with Week 7',()=>{const h=clone(load());h.lanes[1].true_week=7;assert.throws(()=>validate(h),/NFL_WEEK_REGRESSION/);});
test('cannot swap sequence or merge sports into one lineage',()=>{const h=clone(load());h.lanes.reverse();assert.throws(()=>validate(h),/SPORT_ORDER/);});
test('cannot declare retired R3 active or RC9 production-ready',()=>{const h=clone(load());h.backend.readiness='PRODUCTION_READY';assert.throws(()=>validate(h),/RELEASE_PROMOTION/);});
test('cannot erase the calibration proof gap',()=>{const h=clone(load());h.backend.forecast_outcome_admissible='VERIFIED';assert.throws(()=>validate(h),/CALIBRATION_INFLATION/);});
test('historical Arc III sign-offs are not rewritten',()=>{const h=clone(load());h.arc3.formally_signed_off=15;assert.throws(()=>validate(h),/HISTORICAL_ARCIII_REWRITE/);});
test('missing repo files become explicit hard failures',()=>{const h=clone(load());h.evidence.source_repo_files.push('docs/missing_forced_artifact.md');assert.throws(()=>validate(h),/MISSING_HANDOFF_ARTIFACT/);});

test('audit ZIP byte fingerprint is pinned while primary replay archive is not fabricated',()=>{const h=clone(load());assert.equal(validate(h).checkpoint_id,h.checkpoint_id);h.lanes[0].recovered_audit.audit_zip_sha256='0'.repeat(64);assert.throws(()=>validate(h),/RECOVERY_REGISTRY_NOT_LINKED/);});

test('unexplained NBA shot-team mismatch cannot be labeled reconciled',()=>{const h=clone(load());h.lanes[0].source_quality_gate.reconciled_per_team=true;assert.throws(()=>validate(h),/NBA_FGA_FALSE_RECONCILIATION/);});
test('NFL drive IDs do not imply player/team attribution',()=>{const h=clone(load());h.lanes[1].drive_quality_gate.event_team_attribution_ready=true;assert.throws(()=>validate(h),/NFL_TEAM_MAPPING_FALSE_APPROVAL/);});

test('NBA shooter-level discordance stays tied to the original player IDs',()=>{const h=clone(load());h.lanes[0].source_quality_gate.mismatch_players[1].pbp_fga=8;assert.throws(()=>validate(h),/NBA_FGA_FALSE_RECONCILIATION/);});

test('a zero-second NBA heave remains only a hypothesis, not official reconciliation',()=>{
 const h=clone(load());h.lanes[0].source_quality_gate.shot_trace.identified_heave.confirmed_official_exclusion=true;
 assert.throws(()=>validate(h),/NBA_HEAVE_UNEARNED_PROMOTION/);
});
test('source-consistent NFL team candidates are not verified player actors',()=>{
 const h=clone(load());h.lanes[1].drive_quality_gate.source_schema.independent_play_actor_coverage_verified=true;
 assert.throws(()=>validate(h),/NFL_TEAM_CANDIDATE_UNEARNED_PROMOTION/);
});

test('one-game official NBA player FGA agreement never licenses an unreplayed V3 model',()=>{
 const h=clone(load());h.lanes[0].source_quality_gate.independent_official_one_game.all_57_game_v3_replay_verified=true;
 assert.throws(()=>validate(h),/NBA_CROSSSOURCE_UNEARNED_PROMOTION/);
});
test('NBA absent heave in official FGA cannot be sold as proven rules adjudication',()=>{
 const h=clone(load());h.lanes[0].source_quality_gate.independent_official_one_game.official_rule_exclusion_cause_verified=true;
 assert.throws(()=>validate(h),/NBA_CROSSSOURCE_UNEARNED_PROMOTION/);
});
test('NFL Houston at Jacksonville cannot regress to New England',()=>{
 const h=clone(load());h.lanes[1].verified_matchup.home_team='NE';
 assert.throws(()=>validate(h),/NFL_OPPONENT_IDENTITY_REGRESSION/);
});
test('different play row totals cannot be reported as independently verified missing snaps',()=>{
 const h=clone(load());h.lanes[1].independent_pbp_census.unmatched_8_rows_confirmed_missing_snaps=true;
 assert.throws(()=>validate(h),/NFL_PBP_UNEARNED_PROMOTION/);
});

test('NFL aggregate parity never implies specific actor attribution',()=>{
 const h=clone(load());h.lanes[1].independent_pbp_census.game_level_attempt_parity.player_actor_verified=true;
 assert.throws(()=>validate(h),/NFL_GAME_COUNTS_UNEARNED_PROMOTION/);
});

test('three source-consistent NBA games cannot certify the missing V3 57-game replay',()=>{
 const h=clone(load());h.lanes[0].preregistered_official_source_cohort.original_57_game_v3_replay_verified=true;
 assert.throws(()=>validate(h),/NBA_THREE_GAME_UNEARNED_PROMOTION/);
});
test('NBA source consistency alone cannot certify prospective cutoff integrity',()=>{
 const h=clone(load());h.lanes[0].preregistered_official_source_cohort.pre_q4_feature_freeze_verified=true;
 assert.throws(()=>validate(h),/NBA_THREE_GAME_UNEARNED_PROMOTION/);
});
test('116 strict NFL cross-source clocks never imply athlete identity',()=>{
 const h=clone(load());h.lanes[1].strict_event_correspondence.actor_ids_independently_verified=true;
 assert.throws(()=>validate(h),/NFL_STRICT_CLOCK_MATCH_FALSE_PROMOTION/);
});
test('eleven unmatched NFL source candidates cannot be called verified missing snaps',()=>{
 const h=clone(load());h.lanes[1].strict_event_correspondence.extra_11_verified_missing_snaps=true;
 assert.throws(()=>validate(h),/NFL_STRICT_CLOCK_MATCH_FALSE_PROMOTION/);
});

test('NFL clock-neighbor categories cannot be promoted into verified missing plays',()=>{
 const h=clone(load());h.lanes[1].strict_event_correspondence.unmatched_clock_diagnostic.cause_confirmed=true;
 assert.throws(()=>validate(h),/NFL_UNMATCHED_CAUSALITY_FALSE_PROMOTION/);
});

test('retrospective NBA Q3 feature is not an externally frozen Q3 forecast',()=>{
 const h=clone(load());h.lanes[0].q3_to_q4_retro_shadow.external_q3_freeze=true;
 assert.throws(()=>validate(h),/NBA_Q3_RETRO_FALSE_PROMOTION/);
});
test('NFL player matching by name and volume is not cross-provider player ID proof',()=>{
 const h=clone(load());h.lanes[1].player_volume_actor_shadow.nflverse_to_espn_player_id_verified=true;
 assert.throws(()=>validate(h),/NFL_PLAYER_ACTORS_UNEARNED/);
});
test('zero causal outcomes and shadow artifacts prevent automatic model promotion',()=>{
 const h=clone(load());h.backend.latest_read_only_proof.model_validation_count=1;
 assert.throws(()=>validate(h),/BACKEND_RUNTIME_FALSE_CERTIFICATION/);
 const x=clone(load());x.evidence.dual_source_custody.real_time_freeze_verified=true;
 assert.throws(()=>validate(x),/SHADOW_CUSTODY_UNEARNED_PROMOTION/);
});

test('a pure Q3 feature firewall never implies a real external Q3 freeze',()=>{
 const h=clone(load());h.lanes[0].q3_feature_firewall.external_live_q3_timestamp_verified=true;
 assert.throws(()=>validate(h),/Q3_FIREWALL_FALSE_RELEASE/);
});
test('NBA rate MAE is not permitted to be labeled a win over historical trained V3 baseline',()=>{
 const h=clone(load());h.lanes[0].october_date_census.original_v3_comparator_equivalent=true;
 assert.throws(()=>validate(h),/NBA_V3_FALSE_COMPARABILITY/);
});
test('NBA zero Q4 field-goal attempts do not prove benching',()=>{
 const h=clone(load());h.lanes[0].q4_zero_shot_diagnostic.benching_cause_verified=true;
 assert.throws(()=>validate(h),/NBA_BENCHING_INVENTION/);
});
test('QB future-week appearance survivorship cannot become pregame eligible candidate census',()=>{
 const h=clone(load());h.lanes[1].qb_prior_week_retrospective.all_pregame_candidate_qbs_included=true;
 assert.throws(()=>validate(h),/QB_BASELINE_FALSE_PROMOTION/);
});
test('last-three historical QB rule has not earned a model upgrade',()=>{
 const h=clone(load());h.lanes[1].qb_prior_week_retrospective.model_promoted=true;
 assert.throws(()=>validate(h),/QB_BASELINE_FALSE_PROMOTION/);
});
test('new shadow research does not repair absent Supabase calibration',()=>{
 const h=clone(load());h.backend.massive_pass_refresh.admissible_outcomes=1;
 assert.throws(()=>validate(h),/BACKEND_RELEASE_NOT_EARNED/);
});

test('real future-game shadow packet cannot become settled before official Week7 outcomes',()=>{
 const h=clone(load());h.lanes[1].week7_pregame_shadow_freeze.all_week7_official_outcomes_settled=true;
 assert.throws(()=>validate(h),/W7_PREGAME_PACKET_FALSE_PROMOTION/);
});
test('source QB history proxy cannot be promoted as a confirmed starter',()=>{
 const h=clone(load());h.lanes[1].week7_pregame_shadow_freeze.any_starting_qb_verified=true;
 assert.throws(()=>validate(h),/W7_PREGAME_PACKET_FALSE_PROMOTION/);
});
test('one explicit abstention and historical LAR source normalization are checkpoint invariants',()=>{
 const h=clone(load());h.lanes[1].week7_pregame_shadow_freeze.explicit_null_abstentions=0;
 assert.throws(()=>validate(h),/W7_PREGAME_PACKET_FALSE_PROMOTION/);
});
