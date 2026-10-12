'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { researchFixtures, evaluationFixtures, baseResearch, baseEvaluation } = require('./opportunity-shadow.fixtures.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
const api = () => require('./opportunity-shadow.cjs');
const researchFixture = name => researchFixtures.find(f => f.name === name).build();
const evaluationFixture = name => evaluationFixtures.find(f => f.name === name).build();
const inspect = input => api().inspectResearch(api().freezeResearch(input));
const evaluate = input => api().evaluateFrozen(api().freezeEvaluation(input.manifest, input.forecasts), input.outcomes);
const warning = (result, code) => assert.ok(result.warnings.includes(code), `Expected ${code}`);
const excluded = (result, id, code) => {
  const row = result.excluded.find(o => o.observation_id === id);
  assert.ok(row, `Expected exclusion for ${id}`);
  assert.ok(row.reasons.includes(code), `Expected ${code} for ${id}`);
  assert.ok(!result.accepted_observation_ids.includes(id));
};
const approximate = (value, expected) => assert.ok(Math.abs(value - expected) < 1e-12, `${value} != ${expected}`);

test('adversarial categorical price data is rejected before research interpretation', () => {
  const r = researchFixture('tactical-interaction-remains-hypothesis');
  r.observations.at(-1).feature.value = 'Bookmaker odds -110';
  assert.throws(() => api().freezeResearch(r), /PHASE1/);
});

test('adversarial shared-game outcomes cannot precede another player forecast cutoff', () => {
  const e = baseEvaluation();
  e.manifest.population[0].forecast_cutoff = '2026-10-11T11:00:00Z';
  for (const f of e.forecasts.filter(f => f.case_id === 'synthetic-case-1')) f.frozen_at = '2026-10-11T11:00:00Z';
  e.outcomes[0].observed_at = '2026-10-11T11:15:00Z';
  assert.throws(() => evaluate(e), /group|chronology/i);
});

test('adversarial unrepresentable squared loss cannot masquerade as perfect performance', () => {
  const e = baseEvaluation();
  e.forecasts[0].prediction = Number.MIN_VALUE;
  e.outcomes[0].value = 0;
  assert.throws(() => evaluate(e), /numeric|precision/i);
});

test('adversarial sparse JSON cannot collide with an empty array digest', () => {
  assert.throws(() => api().canonicalJSON(Array(1)), /JSON|sparse/i);
});

test('adversarial older return status cannot override a newer admissible reassessment', () => {
  const r = researchFixture('starter-return-invalidates-expanded-role');
  const older = r.observations.at(-1);
  const newer = copy(older);
  newer.observation_id = 'synthetic-observation-current-status';
  newer.sample_event_id = 'synthetic-current-status';
  newer.report_group = 'synthetic-report-current-status';
  newer.observed_at = newer.published_at = '2026-10-11T11:00:00Z';
  newer.feature.value = false;
  newer.role_context = 'expanded';
  r.observations.push(newer);
  const result = inspect(r);
  assert.equal(result.target.role_status, 'PERSISTENCE_HYPOTHESIS');
  assert.ok(!result.warnings.includes('ROLE_REVERSION'));
  newer.published_at = newer.observed_at = older.observed_at;
  const ambiguous = inspect(r);
  assert.equal(ambiguous.target.role_status, 'UNRESOLVED');
  warning(ambiguous, 'ROLE_STATUS_UNRESOLVED');
});

test('adversarial game-wide overtime evidence protects all players in the same game', () => {
  const r = researchFixture('negative-team-opportunity-transfer');
  const overtime = copy(r.observations[0]);
  const teammate = r.population.find(p => p.case_id === 'synthetic-case-teammate');
  Object.assign(overtime, { observation_id: 'synthetic-observation-team-overtime',
    case_id: teammate.case_id, event_id: teammate.event_id, player_id: teammate.player_id,
    sample_event_id: 'synthetic-game-expanded-1', report_group: 'synthetic-report-team-overtime',
    feature: { name: 'overtime_minutes', family: 'game_sense', definition: 'overtime-minutes-v1', unit: 'minutes', value: 5 } });
  r.observations.push(overtime);
  const result = inspect(r);
  assert.equal(result.target.expanded_games, 2);
  excluded(result, 'synthetic-observation-expanded-1', 'OVERTIME_CONFOUNDER');
});

test('adversarial fixture CLI reports expected denials separately from successful examples', () => {
  const { spawnSync } = require('node:child_process');
  const { join } = require('node:path');
  const run = spawnSync(process.execPath, [join(__dirname, 'opportunity-shadow.cjs'), 'fixtures'], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const result = JSON.parse(run.stdout);
  assert.equal(result.label, 'SYNTHETIC SHADOW');
  assert.equal(result.research.length, researchFixtures.length);
  assert.equal(result.evaluation.length, evaluationFixtures.length);
  assert.equal(result.research.filter(f => f.rejected).length, 2);
  for (const f of result.research.filter(f => f.rejected)) assert.equal(f.expected_rejection, true);
});

test('SHADOW research API exposes isolated research and evaluation entry points', () => {
  const shadow = require('./opportunity-shadow.cjs');
  assert.equal(shadow.RESEARCH_VERSION, 'atlas.scout.opportunity-shadow.v1');
  assert.equal(shadow.EVALUATION_VERSION, 'atlas.scout.opportunity-evaluation.v1');
  for (const name of ['freezeResearch', 'inspectResearch', 'freezeEvaluation', 'evaluateFrozen']) {
    assert.equal(typeof shadow[name], 'function');
  }
});

test('fixture inventory includes all twelve required synthetic safety scenarios', () => {
  const names = [...researchFixtures, ...evaluationFixtures].map(f => f.name);
  assert.equal(new Set(names).size, names.length);
  assert.ok(names.length >= 12);
  for (const f of researchFixtures) {
    const r = f.build();
    assert.equal(r.synthetic, true);
    assert.equal(r.research_only, true);
    assert.notEqual(f.build(), r);
  }
  for (const f of evaluationFixtures) assert.equal(f.build().manifest.synthetic, true);
});

test('registry and research outputs preserve research-only human authority', () => {
  const shadow = api();
  assert.ok(Object.isFrozen(shadow.FEATURES));
  for (const entry of Object.values(shadow.FEATURES)) assert.ok(Object.isFrozen(entry));
  const result = inspect(baseResearch());
  assert.equal(result.label, 'SYNTHETIC SHADOW');
  assert.equal(result.execution_authority, false);
  assert.equal(result.human_final_gate_required, true);
  assert.equal(result.predictive_value, 'NOT_ESTABLISHED');
  assert.equal(result.target.case_id, 'synthetic-case-target');
  assert.equal(result.target.baseline_workload, 10);
  assert.equal(result.target.expanded_workload, 18);
  assert.equal(result.target.delta, 8);
  assert.equal(result.target.expanded_games, 3);
  assert.equal(result.target.role_status, 'PERSISTENCE_HYPOTHESIS');
  warning(result, 'UNCERTAINTY_UNESTIMATED');
  warning(result, 'CAUSAL_ATTRIBUTION_UNVERIFIED');
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.target));
});

test('late injury cannot contaminate earlier role hypothesis', () => {
  const result = inspect(researchFixture('late-injury-does-not-leak'));
  excluded(result, 'synthetic-observation-late-injury', 'POST_CUTOFF_EVIDENCE');
  assert.equal(result.target.role_status, 'PERSISTENCE_HYPOTHESIS');
  assert.equal(result.target.expanded_workload, 18);
  assert.ok(!result.warnings.includes('ROLE_REVERSION'));
});

test('post-freeze evidence is excluded even before forecast cutoff', () => {
  const r = baseResearch();
  r.frozen_at = '2026-10-11T11:00:00Z';
  r.observations[3].observed_at = '2026-10-11T11:30:00Z';
  r.observations[3].published_at = '2026-10-11T11:30:00Z';
  const result = inspect(r);
  excluded(result, r.observations[3].observation_id, 'POST_FREEZE_EVIDENCE');
  assert.equal(result.target.expanded_games, 2);
});

test('publication after observation cannot establish point-in-time availability', () => {
  const r = baseResearch();
  r.observations[3].published_at = '2026-10-10T09:00:00Z';
  const result = inspect(r);
  excluded(result, r.observations[3].observation_id, 'PUBLICATION_AFTER_OBSERVATION');
  assert.equal(result.target.expanded_games, 2);
});

test('starter return triggers role reversion without creating a forecast', () => {
  const result = inspect(researchFixture('starter-return-invalidates-expanded-role'));
  warning(result, 'ROLE_REVERSION');
  assert.equal(result.target.role_status, 'REVERSION_TRIGGER');
  assert.equal(result.reassessment_required, true);
  assert.equal(result.predictive_value, 'NOT_ESTABLISHED');
});

test('backup does not automatically inherit absent starter workload', () => {
  const result = inspect(researchFixture('backup-does-not-inherit-workload'));
  warning(result, 'WORKLOAD_NOT_INHERITED');
  assert.equal(result.target.delta, 0);
  assert.equal(result.target.role_status, 'UNRESOLVED');
});

test('foul trouble retains raw evidence but excludes affected workload from arithmetic', () => {
  const input = researchFixture('foul-trouble-confounds-workload');
  const before = copy(input);
  const envelope = api().freezeResearch(input);
  const result = api().inspectResearch(envelope);
  warning(result, 'FOUL_TROUBLE_CONFOUNDER');
  assert.equal(result.target.expanded_games, 2);
  assert.equal(result.target.expanded_workload, 18);
  assert.equal(result.target.role_status, 'UNRESOLVED');
  assert.deepEqual(input, before);
  assert.equal(envelope.input.observations.find(o => o.observation_id === 'synthetic-observation-expanded-1').feature.value, 2);
});

test('overtime does not inflate normal role workload', () => {
  const result = inspect(researchFixture('overtime-confounds-workload'));
  warning(result, 'OVERTIME_CONFOUNDER');
  assert.equal(result.target.expanded_games, 2);
  assert.equal(result.target.expanded_workload, 18);
});

test('multiple injuries prevent simple causal attribution', () => {
  const result = inspect(researchFixture('multiple-injuries-confound-causality'));
  warning(result, 'MULTIPLE_ABSENCES_CONFOUNDER');
  warning(result, 'CAUSAL_ATTRIBUTION_UNVERIFIED');
  assert.equal(result.predictive_value, 'NOT_ESTABLISHED');
});

test('repeated reports count once rather than independently confirming opportunity', () => {
  const result = inspect(researchFixture('repeated-reports-not-independent'));
  warning(result, 'SOURCE_REDUNDANCY');
  assert.equal(result.target.expanded_games, 3);
  assert.equal(result.target.expanded_workload, 18);
  const original = 'synthetic-observation-expanded-1';
  const repeated = 'synthetic-observation-repeat';
  assert.equal(result.accepted_observation_ids.filter(id => id === original || id === repeated).length, 1);
});

test('conflicting duplicate reports are excluded rather than averaged', () => {
  const result = inspect(researchFixture('conflicting-reports-not-averaged'));
  warning(result, 'SOURCE_CONFLICT');
  excluded(result, 'synthetic-observation-expanded-1', 'SOURCE_CONFLICT');
  excluded(result, 'synthetic-observation-conflict', 'SOURCE_CONFLICT');
  assert.equal(result.target.expanded_workload, 18);
  assert.equal(result.target.expanded_games, 2);
});

test('provider unit or definition change stays excluded and unresolved', () => {
  const result = inspect(researchFixture('provider-unit-definition-drift'));
  excluded(result, 'synthetic-observation-expanded-1', 'SOURCE_SCHEMA_CHANGED');
  assert.equal(result.target.expanded_games, 2);
  assert.equal(result.target.expanded_workload, 18);
});

test('stale evidence, missing publication time and unknown values never become zero', () => {
  const result = inspect(researchFixture('stale-missing-evidence-unresolved'));
  excluded(result, 'synthetic-observation-stale', 'STALE_EVIDENCE');
  excluded(result, 'synthetic-observation-unknown-time', 'PUBLICATION_TIME_UNKNOWN');
  excluded(result, 'synthetic-observation-unknown-value', 'UNKNOWN_VALUE');
  assert.equal(result.target.baseline_workload, null);
  assert.equal(result.target.expanded_workload, null);
  assert.equal(result.target.delta, null);
  assert.equal(result.target.role_status, 'UNRESOLVED');
  assert.equal(result.target.regime_status, 'UNRESOLVED');
});

test('one extreme game is an isolated warning rather than confirmed regime drift', () => {
  const result = inspect(researchFixture('one-extreme-game-not-regime-change'));
  assert.equal(result.target.regime_status, 'ISOLATED_EXTREME');
  warning(result, 'REGIME_ISOLATED_EXTREME');
  assert.ok(!result.warnings.includes('REGIME_WARNING_RESEARCH_ONLY'));
});

test('one extreme game also cannot establish repeated role opportunity persistence', () => {
  const result = inspect(researchFixture('one-extreme-game-not-regime-change'));
  assert.equal(result.target.role_status, 'UNRESOLVED');
  warning(result, 'ROLE_NOT_PERSISTENT');
});

test('pure research and evaluation never call network, wall clock or randomness', () => {
  const Module = require('node:module');
  const originals = { load: Module._load, fetch: globalThis.fetch, now: Date.now, random: Math.random };
  let attempts = 0;
  const deny = () => { attempts += 1; throw Error('Offline boundary violated'); };
  try {
    Module._load = function (name, ...args) {
      if (/^(node:)?(http|https|http2|tls|net|dns|dgram|child_process)$|undici/.test(name)) return deny();
      return originals.load.call(this, name, ...args);
    };
    globalThis.fetch = Date.now = Math.random = deny;
    const input = baseResearch(), evaluation = baseEvaluation();
    assert.equal(inspect(input).execution_authority, false);
    assert.equal(evaluate(evaluation).execution_authority, false);
    assert.equal(attempts, 0);
  } finally {
    Module._load = originals.load;
    globalThis.fetch = originals.fetch;
    Date.now = originals.now;
    Math.random = originals.random;
  }
});

test('repeated multi-game shift can warn only within SHADOW research', () => {
  const result = inspect(researchFixture('multi-game-regime-warning-research-only'));
  assert.equal(result.target.regime_status, 'MULTI_GAME_WARNING');
  warning(result, 'REGIME_WARNING_RESEARCH_ONLY');
  assert.equal(result.execution_authority, false);
  assert.equal(result.predictive_value, 'NOT_ESTABLISHED');
});

test('negative team transfer is retained rather than showing only beneficiaries', () => {
  const result = inspect(researchFixture('negative-team-opportunity-transfer'));
  const teammate = result.team_transfer.find(t => t.case_id === 'synthetic-case-teammate');
  assert.equal(teammate.baseline_workload, 12);
  assert.equal(teammate.expanded_workload, 6);
  assert.equal(teammate.delta, -6);
  warning(result, 'NEGATIVE_TEAM_TRANSFER');
  assert.equal(result.team_transfer.length, 2);
});

test('tactical game-script interaction remains unresolved research', () => {
  const result = inspect(researchFixture('tactical-interaction-remains-hypothesis'));
  warning(result, 'TACTICAL_INTERACTION_UNRESOLVED');
  assert.equal(result.predictive_value, 'NOT_ESTABLISHED');
});

test('empty counterfactual challenge list is reported rather than invented', () => {
  const r = baseResearch(); r.challenges = [];
  const result = inspect(r);
  warning(result, 'COUNTERFACTUAL_MISSING');
  assert.deepEqual(result.challenges, []);
});

test('same-game observation repetition cannot create role persistence', () => {
  const r = baseResearch();
  for (const o of r.observations.filter(o => o.role_context === 'expanded')) o.sample_event_id = 'synthetic-game-single-expanded';
  const result = inspect(r);
  assert.equal(result.target.expanded_games, 1);
  assert.equal(result.target.role_status, 'UNRESOLVED');
  warning(result, 'ROLE_NOT_PERSISTENT');
});

test('workload means weight unique games rather than report volume', () => {
  const r = baseResearch();
  const first = r.observations.find(o => o.observation_id === 'synthetic-observation-expanded-1');
  first.feature.value = 10;
  const extra = copy(first); extra.observation_id = 'synthetic-observation-same-game-extra';
  extra.report_group = 'synthetic-distinct-report'; extra.feature.value = 10;
  r.observations.push(extra);
  const result = inspect(r);
  assert.equal(result.target.expanded_games, 3);
  approximate(result.target.expanded_workload, (10 + 18 + 18) / 3);
});

test('two extreme games cannot pass a three-game regime threshold', () => {
  const r = baseResearch();
  r.observations.filter(o => o.role_context === 'expanded').forEach((o, index) => { o.feature.value = index < 2 ? 30 : 10; });
  const result = inspect(r);
  assert.equal(result.target.regime_status, 'INSUFFICIENT_GROUPS');
  assert.ok(!result.warnings.includes('REGIME_WARNING_RESEARCH_ONLY'));
});

test('explicit sportsbook pricing is rejected in price-independent research', () => {
  assert.throws(() => inspect(researchFixture('price-independent-phase-violation')));
  const r = baseResearch(); r.odds = -110;
  assert.throws(() => api().freezeResearch(r));
  const p = baseResearch(); p.phase = 'PRICING';
  assert.throws(() => api().freezeResearch(p));
});

test('research envelope hashes detect content changes and preserve snapshots', () => {
  const input = researchFixture('frozen-research-content-change');
  const envelope = api().freezeResearch(input);
  assert.match(envelope.sha256, /^[0-9a-f]{64}$/);
  assert.ok(Object.isFrozen(envelope));
  assert.ok(Object.isFrozen(envelope.input));
  assert.ok(Object.isFrozen(envelope.input.observations));
  assert.ok(Object.isFrozen(envelope.input.observations[0].feature));
  input.observations[0].feature.value = 999;
  assert.equal(envelope.input.observations[0].feature.value, 10);
  const tampered = copy(envelope);
  tampered.input.observations[0].feature.value = 999;
  assert.throws(() => api().inspectResearch(tampered));
  const replacedHash = copy(envelope); replacedHash.sha256 = '0'.repeat(64);
  assert.throws(() => api().inspectResearch(replacedHash));
});

test('research permutation replays with the identical digest and result', () => {
  const a = researchFixture('negative-team-opportunity-transfer');
  const b = copy(a); b.population.reverse(); b.observations.reverse();
  const ea = api().freezeResearch(a), eb = api().freezeResearch(b);
  assert.deepEqual(ea, eb);
  assert.deepEqual(api().inspectResearch(ea), api().inspectResearch(eb));
});

test('research rejects ambiguous identities, duplicate observations and non-synthetic IDs', () => {
  const changes = [
    r => { r.target_case_id = 'synthetic-missing-case'; },
    r => { r.population.push(copy(r.population[0])); },
    r => { r.population[0].game_group = 'synthetic-unrelated-group'; },
    r => { r.observations[0].player_id = 'synthetic-wrong-player'; },
    r => { r.observations.push(copy(r.observations[0])); },
    r => { r.population[0].player_id = 'real-player'; },
    r => { r.observations[0].source_origin = 'https://unverified-provider.invalid'; }
  ];
  for (const change of changes) { const r = baseResearch(); change(r); assert.throws(() => api().freezeResearch(r)); }
});

test('research timestamps reject normalized calendars, missing zones and freeze after cutoff', () => {
  for (const timestamp of ['2026-02-30T12:00:00Z', '2026-10-11T12:00:00', '2026-10-11T24:00:00Z', '2026-10-11T12:00:00+00:00']) {
    const r = baseResearch(); r.forecast_cutoff = timestamp;
    assert.throws(() => api().freezeResearch(r));
  }
  const r = baseResearch(); r.frozen_at = '2026-10-11T12:00:01Z';
  assert.throws(() => api().freezeResearch(r));
});

test('strict research policy and unknown semantics prevent numeric coercion', () => {
  for (const value of [-1, '0', '', false]) {
    const r = baseResearch(); r.observations[0].feature.value = value;
    const envelope = api().freezeResearch(r);
    const result = api().inspectResearch(envelope);
    excluded(result, r.observations[0].observation_id, 'SOURCE_SCHEMA_CHANGED');
    assert.equal(result.target.baseline_workload, 10);
    assert.equal(envelope.input.observations.find(o => o.observation_id === r.observations[0].observation_id).feature.value, value);
  }
  for (const value of [NaN, Infinity]) {
    const r = baseResearch(); r.observations[0].feature.value = value;
    assert.throws(() => api().freezeResearch(r));
  }
  const r = baseResearch(); r.policy.min_role_games = 1;
  assert.throws(() => api().freezeResearch(r));
  const unknown = baseResearch(); unknown.observations[0].feature.value = null;
  excluded(inspect(unknown), unknown.observations[0].observation_id, 'UNKNOWN_VALUE');
});

test('continuous external forecasts produce descriptive metrics without establishing skill', () => {
  const result = evaluate(baseEvaluation());
  assert.equal(result.label, 'SYNTHETIC SHADOW');
  assert.equal(result.eligible_cases, 4);
  assert.equal(result.eligible_game_groups, 3);
  assert.equal(result.predictive_value, 'NOT_ESTABLISHED');
  assert.equal(result.execution_authority, false);
  assert.equal(result.human_final_gate_required, true);
  const a = result.models.find(m => m.model_id === 'synthetic-model-A');
  const b = result.models.find(m => m.model_id === 'synthetic-model-B');
  assert.equal(a.coverage, 1); assert.equal(a.mae, 0); assert.equal(a.mse, 0); assert.equal(a.brier, null);
  assert.equal(b.mae, 1); assert.equal(b.mse, 1); assert.equal(b.brier, null);
  assert.equal(a.scored_cases, 4); assert.equal(a.scored_game_groups, 3);
  const c = result.comparisons[0];
  assert.deepEqual(c.models, ['synthetic-model-A', 'synthetic-model-B']);
  assert.equal(c.matched_cases, 4); assert.equal(c.matched_game_groups, 3);
  assert.equal(c.left_error, 0); assert.equal(c.right_error, 1); assert.equal(c.difference, -1);
  assert.equal(c.interpretation, 'DESCRIPTIVE_MATCHED_CASES_ONLY');
  assert.ok(Object.isFrozen(result)); assert.ok(Object.isFrozen(result.models));
});

test('selective abstention cannot conceal coverage or imply general skill', () => {
  const result = evaluate(evaluationFixture('selective-abstention-is-not-model-skill'));
  warning(result, 'SELECTIVE_COVERAGE_NOT_MODEL_SKILL');
  const b = result.models.find(m => m.model_id === 'synthetic-model-B');
  assert.equal(b.coverage, 0.25); assert.equal(b.forecast_count, 1);
  assert.equal(b.abstentions, 3); assert.equal(b.missing_predictions, 0);
  assert.equal(b.scored_cases, 1); assert.equal(b.mae, 0);
  assert.equal(result.comparisons[0].matched_cases, 1);
  assert.equal(result.comparisons[0].left_error, 0);
  assert.equal(result.comparisons[0].right_error, 0);
  assert.equal(result.comparisons[0].interpretation, 'DESCRIPTIVE_MATCHED_CASES_ONLY');
});

test('null and absent outcomes remain missing rather than fabricated losses', () => {
  const result = evaluate(evaluationFixture('missing-outcomes-never-become-zero'));
  for (const m of result.models) {
    assert.equal(m.forecast_count, 4); assert.equal(m.coverage, 1);
    assert.equal(m.missing_outcomes, 2); assert.equal(m.scored_cases, 2);
  }
  assert.equal(result.models.find(m => m.model_id === 'synthetic-model-A').mae, 0);
  assert.equal(result.comparisons[0].matched_cases, 2);
});

test('unreported prediction and declared abstention remain distinct', () => {
  const result = evaluate(evaluationFixture('missing-prediction-differs-from-abstention'));
  const b = result.models.find(m => m.model_id === 'synthetic-model-B');
  assert.equal(b.forecast_count, 2); assert.equal(b.coverage, 0.5);
  assert.equal(b.abstentions, 1); assert.equal(b.missing_predictions, 1);
  assert.equal(b.scored_cases, 2);
});

test('model comparison uses common cases instead of each model own easier subset', () => {
  const result = evaluate(evaluationFixture('matched-case-comparison-only'));
  const a = result.models.find(m => m.model_id === 'synthetic-model-A');
  assert.ok(a.mae > 20);
  const c = result.comparisons[0];
  assert.equal(c.matched_cases, 3); assert.equal(c.matched_game_groups, 2);
  assert.equal(c.left_error, 0); assert.equal(c.right_error, 1); assert.equal(c.difference, -1);
});

test('Brier scoring requires binary probabilities and binary outcomes', () => {
  const result = evaluate(evaluationFixture('binary-probability-score'));
  for (const m of result.models) {
    assert.equal(m.mae, null); assert.equal(m.mse, null);
    approximate(m.brier, 0.3125);
  }
  assert.equal(result.comparisons[0].difference, 0);
});

test('no forecasts or no observed outcomes yields null metrics rather than zero', () => {
  const noForecasts = baseEvaluation(); noForecasts.forecasts = [];
  const r1 = evaluate(noForecasts);
  for (const m of r1.models) {
    assert.equal(m.missing_predictions, 4); assert.equal(m.coverage, 0);
    assert.equal(m.scored_cases, 0); assert.equal(m.mae, null);
    assert.equal(m.mse, null); assert.equal(m.brier, null); assert.equal(m.group_balanced_error, null);
  }
  assert.equal(r1.comparisons[0].matched_cases, 0);
  assert.equal(r1.comparisons[0].left_error, null);
  assert.equal(r1.comparisons[0].right_error, null);
  assert.equal(r1.comparisons[0].difference, null);
  const noOutcomes = baseEvaluation(); noOutcomes.outcomes = [];
  const r2 = evaluate(noOutcomes);
  for (const m of r2.models) { assert.equal(m.missing_outcomes, 4); assert.equal(m.scored_cases, 0); assert.equal(m.mae, null); }
});

test('multiple players from a game remain one evaluation group', () => {
  const e = baseEvaluation();
  for (const p of e.manifest.population) { p.event_id = 'synthetic-single-event'; p.game_group = p.event_id; }
  for (const f of e.forecasts) f.event_id = 'synthetic-single-event';
  for (const o of e.outcomes) o.event_id = 'synthetic-single-event';
  const result = evaluate(e);
  assert.equal(result.eligible_cases, 4); assert.equal(result.eligible_game_groups, 1);
  for (const m of result.models) assert.equal(m.scored_game_groups, 1);
  assert.equal(result.comparisons[0].matched_game_groups, 1);
});

test('group-balanced metrics give each event equal weight despite different player counts', () => {
  const e = baseEvaluation();
  for (const f of e.forecasts) {
    if (f.model_id === 'synthetic-model-A') continue;
    const outcome = e.outcomes.find(o => o.case_id === f.case_id);
    f.prediction = outcome.value + (f.case_id === 'synthetic-case-3' ? 3 : f.case_id === 'synthetic-case-4' ? 6 : 0);
  }
  const result = evaluate(e);
  const b = result.models.find(m => m.model_id === 'synthetic-model-B');
  assert.equal(b.mae, 2.25);
  assert.equal(b.group_balanced_error, 3);
  assert.equal(result.comparisons[0].difference, -2.25);
  assert.equal(result.comparisons[0].group_balanced_difference, -3);
});

test('evaluation freeze preserves content and rejects edited envelopes', () => {
  const e = baseEvaluation();
  const envelope = api().freezeEvaluation(e.manifest, e.forecasts);
  assert.ok(Object.isFrozen(envelope)); assert.ok(Object.isFrozen(envelope.input.manifest.population));
  assert.ok(Object.isFrozen(envelope.input.forecasts[0]));
  e.forecasts[0].prediction = 1000;
  assert.equal(envelope.input.forecasts[0].prediction, 10);
  const tampered = copy(envelope); tampered.input.forecasts[0].prediction = 1000;
  assert.throws(() => api().evaluateFrozen(tampered, e.outcomes));
});

test('permuted models, population, forecasts and outcomes replay identically', () => {
  const a = baseEvaluation(), b = copy(a);
  b.manifest.models.reverse(); b.manifest.population.reverse(); b.forecasts.reverse(); b.outcomes.reverse();
  const ea = api().freezeEvaluation(a.manifest, a.forecasts), eb = api().freezeEvaluation(b.manifest, b.forecasts);
  assert.deepEqual(ea, eb);
  assert.deepEqual(api().evaluateFrozen(ea, a.outcomes), api().evaluateFrozen(eb, b.outcomes));
});

test('outcome ingestion and evaluation never mutate supplied records', () => {
  const e = baseEvaluation(), before = copy(e);
  evaluate(e);
  assert.deepEqual(e, before);
});

test('late forecasts, out-of-holdout cutoffs and invalid availability times fail', () => {
  const cases = [
    e => { e.forecasts[0].frozen_at = '2026-10-11T12:00:01Z'; },
    e => { e.forecasts[0].frozen_at = '2026-10-11T09:59:59Z'; },
    e => { e.manifest.frozen_at = '2026-10-11T11:00:01Z'; },
    e => { e.manifest.population[0].forecast_cutoff = '2026-10-11T10:59:59Z'; },
    e => { e.manifest.population[0].forecast_cutoff = '2026-10-11T13:00:01Z'; },
    e => { e.outcomes[0].observed_at = '2026-10-11T12:00:00Z'; },
    e => { e.outcomes[0].observed_at = '2026-10-12T12:00:01Z'; },
    e => { e.outcomes[0].observed_at = '2026-02-30T12:00:00Z'; }
  ];
  for (const change of cases) { const e = baseEvaluation(); change(e); assert.throws(() => evaluate(e)); }
});

test('forecast and outcome identities, targets, units and registries match exactly', () => {
  const changes = [
    e => { e.forecasts[0].event_id = 'synthetic-other-event'; },
    e => { e.forecasts[0].player_id = 'synthetic-other-player'; },
    e => { e.forecasts[0].target = 'synthetic-other-target'; },
    e => { e.forecasts[0].unit = 'seconds'; },
    e => { e.forecasts[0].model_id = 'synthetic-unlisted-model'; },
    e => { e.forecasts[0].case_id = 'synthetic-unlisted-case'; },
    e => { e.outcomes[0].event_id = 'synthetic-other-event'; },
    e => { e.outcomes[0].player_id = 'synthetic-other-player'; },
    e => { e.outcomes[0].target = 'synthetic-other-target'; },
    e => { e.outcomes[0].unit = 'seconds'; },
    e => { e.outcomes[0].case_id = 'synthetic-unlisted-case'; },
    e => { e.manifest.population[0].game_group = 'synthetic-other-group'; }
  ];
  for (const change of changes) { const e = baseEvaluation(); change(e); assert.throws(() => evaluate(e)); }
});

test('disjoint model coverage has no comparable error or implied winner', () => {
  const e = baseEvaluation();
  for (const f of e.forecasts) {
    if ((f.model_id === 'synthetic-model-A' && ['synthetic-case-3', 'synthetic-case-4'].includes(f.case_id)) ||
        (f.model_id === 'synthetic-model-B' && ['synthetic-case-1', 'synthetic-case-2'].includes(f.case_id))) {
      f.prediction = null; f.abstention_reason = 'Synthetic disjoint coverage.';
    }
  }
  const result = evaluate(e), comparison = result.comparisons[0];
  assert.equal(comparison.matched_cases, 0); assert.equal(comparison.matched_game_groups, 0);
  assert.equal(comparison.left_error, null); assert.equal(comparison.right_error, null);
  assert.equal(comparison.difference, null); assert.equal(comparison.group_balanced_difference, null);
  assert.equal(comparison.interpretation, 'DESCRIPTIVE_MATCHED_CASES_ONLY');
  warning(result, 'SELECTIVE_COVERAGE_NOT_MODEL_SKILL');
});

test('duplicate cases, models, forecasts and outcomes fail rather than weighting results twice', () => {
  const changes = [
    e => { e.manifest.population.push(copy(e.manifest.population[0])); },
    e => { e.manifest.models.push(e.manifest.models[0]); },
    e => { e.forecasts.push(copy(e.forecasts[0])); },
    e => { e.outcomes.push(copy(e.outcomes[0])); }
  ];
  for (const change of changes) { const e = baseEvaluation(); change(e); assert.throws(() => evaluate(e)); }
});

test('probability limits, abstention rules and external snapshot digests are explicit', () => {
  for (const value of [-0.01, 1.01, '0.5', '', NaN, Infinity]) {
    const e = evaluationFixture('binary-probability-score'); e.forecasts[0].prediction = value;
    assert.throws(() => evaluate(e));
  }
  for (const value of [0, 1]) {
    const e = evaluationFixture('binary-probability-score'); e.forecasts[0].prediction = value;
    assert.equal(evaluate(e).models[0].scored_cases, 4);
  }
  const changes = [
    e => { e.forecasts[0].prediction = null; e.forecasts[0].abstention_reason = null; },
    e => { e.forecasts[0].abstention_reason = 'Cannot predict while also predicting.'; },
    e => { e.forecasts[0].inputs_sha256 = 'A'.repeat(64); },
    e => { e.forecasts[0].inputs_sha256 = 'not-a-digest'; },
    e => { e.manifest.phase = 'PRICING'; },
    e => { e.forecasts[0].bookmaker_odds = -110; },
    e => { e.outcomes[0].value = ''; }
  ];
  for (const change of changes) { const e = baseEvaluation(); change(e); assert.throws(() => evaluate(e)); }
  for (const value of [0.5, 2, '1']) {
    const e = evaluationFixture('binary-probability-score'); e.outcomes[0].value = value;
    assert.throws(() => evaluate(e));
  }
});
