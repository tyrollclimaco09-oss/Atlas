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
