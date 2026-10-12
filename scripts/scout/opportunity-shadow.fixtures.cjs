'use strict';

// Entirely invented safety examples. No real player records or model results.
const RESEARCH_VERSION = 'atlas.scout.opportunity-shadow.v1';
const EVALUATION_VERSION = 'atlas.scout.opportunity-evaluation.v1';
const copy = value => JSON.parse(JSON.stringify(value));
const featureShapes = {
  workload: { family: 'opportunity', definition: 'workload-count-v1', unit: 'opportunities' },
  starter_returned: { family: 'availability', definition: 'starter-returned-v1', unit: 'boolean' },
  foul_trouble: { family: 'game_sense', definition: 'foul-trouble-v1', unit: 'boolean' },
  overtime_minutes: { family: 'game_sense', definition: 'overtime-minutes-v1', unit: 'minutes' },
  unavailable_teammates: { family: 'availability', definition: 'unavailable-teammates-v1', unit: 'players' },
  tactical_regime: { family: 'game_sense', definition: 'tactical-regime-v1', unit: 'category' },
  role_status: { family: 'role', definition: 'role-status-v1', unit: 'category' }
};

function observation(id, name, value, options = {}) {
  return {
    observation_id: 'synthetic-observation-' + id,
    case_id: 'synthetic-case-target', event_id: 'synthetic-event-current',
    player_id: 'synthetic-player-target', team_id: 'synthetic-team-home',
    sample_event_id: 'synthetic-game-' + id,
    source_id: 'synthetic-source-alpha', source_origin: 'fixture://source-alpha/' + id,
    report_group: 'synthetic-report-' + id,
    observed_at: '2026-10-10T08:00:00Z', published_at: '2026-10-10T08:00:00Z',
    role_context: 'expanded', feature: { name, ...featureShapes[name], value },
    ...options
  };
}

function samples(prefix, values, role_context, options = {}) {
  return values.map((value, index) => observation(prefix + '-' + (index + 1), 'workload', value, { role_context, ...options }));
}

function baseResearch() {
  return {
    schema_version: RESEARCH_VERSION, synthetic: true, research_only: true,
    study_id: 'synthetic-study-role-transfer', phase: 'PHASE1_PRICE_INDEPENDENT',
    forecast_cutoff: '2026-10-11T12:00:00Z', frozen_at: '2026-10-11T12:00:00Z',
    population: [{ case_id: 'synthetic-case-target', event_id: 'synthetic-event-current', player_id: 'synthetic-player-target', team_id: 'synthetic-team-home', game_group: 'synthetic-event-current' }],
    target_case_id: 'synthetic-case-target',
    policy: { max_age_minutes: 4320, min_role_games: 3, min_regime_games: 3, regime_delta: 12 },
    uncertainty: { source: 'unverified', predictive: 'unestimated' },
    challenges: [{ hypothesis: 'Opportunity increased after a role change.', alternative: 'Sample composition or game context changed.', counterfactual: 'Compare the same player before the role change and unaffected teammates.' }],
    observations: [...samples('baseline', [10, 10, 10], 'baseline'), ...samples('expanded', [18, 18, 18], 'expanded')]
  };
}

const researchFixtures = [
  { name: 'late-injury-does-not-leak', build() { const r = baseResearch(); r.observations.push(observation('late-injury', 'starter_returned', true, { observed_at: '2026-10-11T13:00:00Z', published_at: '2026-10-11T13:00:00Z', role_context: 'returned' })); return r; } },
  { name: 'starter-return-invalidates-expanded-role', build() { const r = baseResearch(); r.observations.push(observation('starter-return', 'starter_returned', true, { role_context: 'returned' })); return r; } },
  { name: 'backup-does-not-inherit-workload', build() { const r = baseResearch(); r.observations = [...samples('baseline', [10, 10, 10], 'baseline'), ...samples('expanded', [10, 10, 10], 'expanded')]; return r; } },
  { name: 'foul-trouble-confounds-workload', build() { const r = baseResearch(); r.observations.find(o => o.observation_id === 'synthetic-observation-expanded-1').feature.value = 2; r.observations.push(observation('foul', 'foul_trouble', true, { sample_event_id: 'synthetic-game-expanded-1' })); return r; } },
  { name: 'overtime-confounds-workload', build() { const r = baseResearch(); r.observations.find(o => o.observation_id === 'synthetic-observation-expanded-1').feature.value = 50; r.observations.push(observation('overtime', 'overtime_minutes', 5, { sample_event_id: 'synthetic-game-expanded-1' })); return r; } },
  { name: 'multiple-injuries-confound-causality', build() { const r = baseResearch(); r.observations.push(observation('multiple-injuries', 'unavailable_teammates', 3)); return r; } },
  { name: 'repeated-reports-not-independent', build() { const r = baseResearch(); const repeated = copy(r.observations[3]); repeated.observation_id = 'synthetic-observation-repeat'; repeated.source_id = 'synthetic-source-republisher'; repeated.source_origin = 'fixture://republisher/shared-report'; r.observations.push(repeated); return r; } },
  { name: 'provider-unit-definition-drift', build() { const r = baseResearch(); r.observations[3].feature.unit = 'seconds'; r.observations[3].feature.definition = 'changed-workload-definition'; return r; } },
  { name: 'stale-missing-evidence-unresolved', build() { const r = baseResearch(); r.observations = [observation('stale', 'workload', 999, { observed_at: '2026-09-01T08:00:00Z', published_at: '2026-09-01T08:00:00Z' }), observation('unknown-time', 'workload', 888, { published_at: null }), observation('unknown-value', 'workload', null)]; return r; } },
  { name: 'one-extreme-game-not-regime-change', build() { const r = baseResearch(); r.observations = [...samples('baseline', [10, 10, 10], 'baseline'), ...samples('expanded', [10, 10, 90], 'expanded')]; return r; } },
  { name: 'frozen-research-content-change', expected_rejection: true, mutate_after_freeze: true, build() { return baseResearch(); } },
  { name: 'price-independent-phase-violation', expected_rejection: true, build() { const r = baseResearch(); r.observations[0].feature = { name: 'bookmaker_odds', family: 'pricing', definition: 'american-odds-v1', unit: 'odds', value: -110 }; return r; } },
  { name: 'negative-team-opportunity-transfer', build() { const r = baseResearch(); const person = { case_id: 'synthetic-case-teammate', event_id: 'synthetic-event-current', player_id: 'synthetic-player-teammate', team_id: 'synthetic-team-home', game_group: 'synthetic-event-current' }; r.population.push(person); const { game_group, ...identity } = person; r.observations.push(...samples('teammate-baseline', [12, 12, 12], 'baseline', identity), ...samples('teammate-expanded', [6, 6, 6], 'expanded', identity)); return r; } },
  { name: 'multi-game-regime-warning-research-only', build() { const r = baseResearch(); r.observations = [...samples('baseline', [10, 10, 10], 'baseline'), ...samples('expanded', [30, 30, 30], 'expanded')]; return r; } },
  { name: 'conflicting-reports-not-averaged', build() { const r = baseResearch(); const conflicting = copy(r.observations[3]); conflicting.observation_id = 'synthetic-observation-conflict'; conflicting.feature.value = 70; r.observations.push(conflicting); return r; } },
  { name: 'tactical-interaction-remains-hypothesis', build() { const r = baseResearch(); r.observations.push(observation('tactical', 'tactical_regime', 'synthetic-small-lineup')); return r; } }
];

function baseEvaluation() {
  const population = [1, 2, 3, 4].map(index => ({
    case_id: 'synthetic-case-' + index,
    event_id: 'synthetic-event-' + (index <= 2 ? 1 : index),
    player_id: 'synthetic-player-' + index, team_id: 'synthetic-team-home',
    game_group: 'synthetic-event-' + (index <= 2 ? 1 : index),
    forecast_cutoff: '2026-10-11T12:00:00Z'
  }));
  const manifest = {
    schema_version: EVALUATION_VERSION, synthetic: true, research_only: true,
    phase: 'PHASE1_PRICE_INDEPENDENT', study_id: 'synthetic-evaluation-study',
    frozen_at: '2026-10-11T10:00:00Z',
    holdout: { start: '2026-10-11T11:00:00Z', end: '2026-10-11T13:00:00Z' },
    evaluation_as_of: '2026-10-12T12:00:00Z',
    target: { name: 'synthetic-workload', kind: 'continuous', unit: 'opportunities' },
    models: ['synthetic-model-A', 'synthetic-model-B'], population
  };
  const forecasts = manifest.models.flatMap((model_id, modelIndex) => population.map((p, index) => ({
    model_id, case_id: p.case_id, event_id: p.event_id, player_id: p.player_id,
    target: manifest.target.name, unit: manifest.target.unit,
    frozen_at: '2026-10-11T11:30:00Z', inputs_sha256: 'a'.repeat(64),
    prediction: 10 + index + modelIndex, abstention_reason: null
  })));
  const outcomes = population.map((p, index) => ({
    case_id: p.case_id, event_id: p.event_id, player_id: p.player_id,
    target: manifest.target.name, unit: manifest.target.unit,
    value: 10 + index, observed_at: '2026-10-11T16:00:00Z'
  }));
  return { manifest, forecasts, outcomes };
}

const evaluationFixtures = [
  { name: 'selective-abstention-is-not-model-skill', build() { const e = baseEvaluation(); for (const f of e.forecasts) if (f.model_id === 'synthetic-model-B' && f.case_id !== 'synthetic-case-1') { f.prediction = null; f.abstention_reason = 'Synthetic declared uncertainty before cutoff.'; } e.forecasts.find(f => f.model_id === 'synthetic-model-B' && f.case_id === 'synthetic-case-1').prediction = 10; return e; } },
  { name: 'missing-outcomes-never-become-zero', build() { const e = baseEvaluation(); e.outcomes[0].value = null; e.outcomes.pop(); return e; } },
  { name: 'missing-prediction-differs-from-abstention', build() { const e = baseEvaluation(); e.forecasts = e.forecasts.filter(f => !(f.model_id === 'synthetic-model-B' && f.case_id === 'synthetic-case-4')); const f = e.forecasts.find(f => f.model_id === 'synthetic-model-B' && f.case_id === 'synthetic-case-3'); f.prediction = null; f.abstention_reason = 'Synthetic unknown role.'; return e; } },
  { name: 'matched-case-comparison-only', build() { const e = baseEvaluation(); const difficult = e.outcomes.find(o => o.case_id === 'synthetic-case-4'); difficult.value = 100; const f = e.forecasts.find(f => f.model_id === 'synthetic-model-B' && f.case_id === difficult.case_id); f.prediction = null; f.abstention_reason = 'Synthetic declared uncertainty.'; return e; } },
  { name: 'binary-probability-score', build() { const e = baseEvaluation(); e.manifest.target = { name: 'synthetic-binary-outcome', kind: 'binary', unit: 'boolean-outcome' }; for (const f of e.forecasts) { f.target = e.manifest.target.name; f.unit = e.manifest.target.unit; f.prediction = f.model_id === 'synthetic-model-A' ? 0.25 : 0.75; } for (const [index, o] of e.outcomes.entries()) { o.target = e.manifest.target.name; o.unit = e.manifest.target.unit; o.value = index % 2; } return e; } }
];

module.exports = { researchFixtures, evaluationFixtures, baseResearch, baseEvaluation };
