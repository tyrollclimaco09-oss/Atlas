'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {evaluateMechanisms}=require('./nba-retrospective-mechanism-audit.shadow.cjs');
const root=path.resolve(__dirname,'../..');
const load=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const original=()=>({
 pregameScout:load('docs/prospective/ATLAS_NBA_OPENING_SCOUT_WIDE_V2_2026-10-20.json'),
 pregameGameSense:load('docs/prospective/ATLAS_NBA_OPENING_20261020_FULL_GAMESENSE_RERUN_V3.json'),
 postgame:load('docs/evidence/nba-20261020-postgame-mechanism-observations.json')
});
test('Duncan 3+ archived before game differs from 2+ Game Sense script and both hit',()=>{
 const r=evaluateMechanisms(original());
 assert.equal(r.duncan.exact_pregame_scout_threshold,3);
 assert.equal(r.duncan.alternate_pregame_script_threshold,2);
 assert.equal(r.duncan.scout_market_hit,true);
 assert.equal(r.duncan.actual_three_made,5);
 assert.equal(r.duncan.actual_three_attempts,9);
 assert.equal(r.duncan.causal_role_verified,false);
});
test('opportunity expansion and shot conversion are graded separately',()=>{
 const a=evaluateMechanisms(original());
 assert.equal(a.duncan.observed_attempt_delta,2);
 assert.equal(a.duncan.additional_expected_makes_if_historical_rate_constant,.829);
 assert.equal(a.duncan.residual_makes_vs_fixed_prior_efficiency,1.271);
 assert.equal(a.brunson.observed_fga,19);
 assert.equal(a.brunson.observed_fgm,6);
 assert.equal(a.brunson.fg_pct,.3158);
 assert.equal(a.brunson.opportunity_volume_predicted_correctly,null);
});
test('Brunson 25+ is a missed frozen scenario; 20+ cannot be promoted postgame',()=>{
 const r=evaluateMechanisms(original());
 assert.equal(r.brunson.pregame_script_threshold,25);
 assert.equal(r.brunson.actual_points,21);
 assert.equal(r.brunson.script_hit,false);
 assert.equal(r.brunson.alternate_20points_was_not_original_offer,true);
});
test('independent quarter scores and two-point shooting distinguish Knicks defeat',()=>{
 const a=evaluateMechanisms(original());
 assert.equal(a.game_factors.philly_new_york.knicks_halftime_lead,4);
 assert.deepEqual(a.game_factors.philly_new_york.third_quarter_points,{PHI:29,NYK:18});
 assert.ok(a.game_factors.philly_new_york.philly_two_point_rate>.53);
 assert.ok(a.game_factors.philly_new_york.knicks_two_point_rate<.4);
 assert.equal(a.game_factors.detroit_unanswered_run,23);
});
test('retrospective result may not become implied win probability, profit, or betting authority',()=>{
 const r=evaluateMechanisms(original());
 assert.equal(r.run_mode,'POSTGAME_FORENSIC_ONLY');
 assert.equal(r.model_edge,null);
 assert.equal(r.realized_profit,null);
 assert.equal(r.verified_probability,null);
 assert.equal(r.production_authority,false);
 assert.equal(r.betting_authority,false);
});
test('tampered quarter scores and game identities are rejected',()=>{
 const a=original();a.postgame.games[1].quarter_home[2]=19;
 assert.throws(()=>evaluateMechanisms(a),/OFFICIAL_RESULT_TRANSCRIPTION_INCONSISTENT/);
 const b=original();b.postgame.games[0].id='OKC@SAS';
 assert.throws(()=>evaluateMechanisms(b),/EVENT_COVERAGE_INVALID/);
});
test('after-event evidence cannot masquerade as pregame analysis',()=>{
 const a=original();a.pregameScout.created_on_local_date='2026-10-21';
 assert.throws(()=>evaluateMechanisms(a),/TEMPORAL_FENCE_UNVERIFIED/);
 const b=original();b.pregameGameSense.observed_at_local='2026-10-20T22:43:35-05:00';
 assert.throws(()=>evaluateMechanisms(b),/TEMPORAL_FENCE_UNVERIFIED/);
 const c=original();c.postgame.retrospective_only=false;
 assert.throws(()=>evaluateMechanisms(c),/SOURCE_CONTRACT_INVALID/);
});
