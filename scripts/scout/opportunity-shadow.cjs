'use strict';

// Offline research only. No browser state, canonical database, provider or betting APIs.
const { createHash } = require('node:crypto');

const RESEARCH_VERSION = 'atlas.scout.opportunity-shadow.v1';
const EVALUATION_VERSION = 'atlas.scout.opportunity-evaluation.v1';
const PHASE = 'PHASE1_PRICE_INDEPENDENT';
const FEATURES = deepFreeze({
  workload: { family: 'opportunity', definition: 'workload-count-v1', unit: 'opportunities', type: 'number' },
  starter_returned: { family: 'availability', definition: 'starter-returned-v1', unit: 'boolean', type: 'boolean' },
  foul_trouble: { family: 'game_sense', definition: 'foul-trouble-v1', unit: 'boolean', type: 'boolean' },
  overtime_minutes: { family: 'game_sense', definition: 'overtime-minutes-v1', unit: 'minutes', type: 'number' },
  unavailable_teammates: { family: 'availability', definition: 'unavailable-teammates-v1', unit: 'players', type: 'integer' },
  tactical_regime: { family: 'game_sense', definition: 'tactical-regime-v1', unit: 'category', type: 'string' },
  role_status: { family: 'role', definition: 'role-status-v1', unit: 'category', type: 'string' },
});

function requireTrue(condition, message) {
  if (!condition) throw new Error(message);
}
function record(value, keys, label) {
  requireTrue(value !== null && typeof value === 'object' && !Array.isArray(value) &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value)), `${label}: object required`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  requireTrue(actual.length === keys.length && actual.every((key, i) => key === expected[i]),
    `${label}: exact fields required (no pricing, credentials or authority fields)`);
}
function text(value, label) {
  requireTrue(typeof value === 'string' && value.length > 0 && value.length <= 2000 &&
    value === value.trim(), `${label}: exact nonempty string required`);
}
function finite(value, label) {
  requireTrue(typeof value === 'number' && Number.isFinite(value) &&
    (!Number.isInteger(value) || Number.isSafeInteger(value)), `${label}: finite exact number required`);
}
function timestamp(value) {
  requireTrue(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value),
    'Timestamp: explicit UTC ISO seconds required');
  const millis = Date.parse(value);
  requireTrue(Number.isFinite(millis) && new Date(millis).toISOString() ===
    (value.includes('.') ? value : value.replace('Z', '.000Z')), 'Timestamp: invalid calendar');
  return millis;
}
function unique(values, label) {
  requireTrue(new Set(values).size === values.length, `${label}: duplicate identity`);
}
function noPrice(value) {
  requireTrue(!/(odds|price|pricing|sportsbook|moneyline|bookmaker)/i.test(value),
    'PHASE1: sportsbook price features forbidden');
}
function deepFreeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
function canonicalJSON(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') { finite(value, 'JSON number'); return JSON.stringify(value); }
  if (Array.isArray(value)) return '[' + Array.from(value, canonicalJSON).join(',') + ']';
  requireTrue(value && typeof value === 'object' &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value)), 'Plain JSON data required');
  return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonicalJSON(value[key])).join(',') + '}';
}
function digest(value) { return createHash('sha256').update(canonicalJSON(value)).digest('hex'); }
function copy(value) { return JSON.parse(canonicalJSON(value)); }
function sorted(values, key) { return [...values].sort((a, b) => key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0); }
function seal(input) { return deepFreeze({ sha256: digest(input), input }); }
function verify(envelope) {
  record(envelope, ['sha256', 'input'], 'Frozen envelope');
  requireTrue(typeof envelope.sha256 === 'string' && /^[a-f0-9]{64}$/.test(envelope.sha256) &&
    digest(envelope.input) === envelope.sha256, 'Frozen snapshot integrity mismatch');
  return envelope.input;
}

const CASE_FIELDS = ['case_id', 'event_id', 'player_id', 'team_id', 'game_group'];
function population(input, evaluation = false) {
  requireTrue(Array.isArray(input.population) && input.population.length > 0, 'Eligible population required');
  for (const item of input.population) {
    record(item, evaluation ? [...CASE_FIELDS, 'forecast_cutoff'] : CASE_FIELDS, 'Eligible case');
    CASE_FIELDS.forEach(field => text(item[field], field));
    if (input.synthetic) {
      CASE_FIELDS.forEach(field => requireTrue(item[field].startsWith('synthetic-'), 'Synthetic identities required'));
    }
    requireTrue(item.game_group === item.event_id, 'Game grouping must equal exact event identity');
    if (evaluation) timestamp(item.forecast_cutoff);
  }
  unique(input.population.map(item => item.case_id), 'Eligible cases');
  unique(input.population.map(item => canonicalJSON([item.event_id, item.player_id])), 'Event/player population');
  return new Map(input.population.map(item => [item.case_id, item]));
}
function identity(item, cases) {
  const owner = cases.get(item.case_id);
  requireTrue(owner && ['event_id', 'player_id'].every(field => item[field] === owner[field]),
    'Exact eligible case/event/player identity required');
  return owner;
}

function validateResearch(raw) {
  record(raw, ['schema_version', 'synthetic', 'research_only', 'study_id', 'phase', 'forecast_cutoff',
    'frozen_at', 'population', 'target_case_id', 'policy', 'uncertainty', 'challenges', 'observations'], 'Research input');
  requireTrue(raw.schema_version === RESEARCH_VERSION && raw.synthetic === true && raw.research_only === true &&
    raw.phase === PHASE, 'Versioned synthetic research-only PHASE1 contract required');
  text(raw.study_id, 'Study');
  const cutoff = timestamp(raw.forecast_cutoff), frozen = timestamp(raw.frozen_at);
  requireTrue(frozen <= cutoff, 'Research frozen after forecast cutoff');
  const cases = population(raw);
  requireTrue(cases.has(raw.target_case_id), 'Target must belong to eligible population');
  record(raw.policy, ['max_age_minutes', 'min_role_games', 'min_regime_games', 'regime_delta'], 'Preregistered policy');
  for (const key of ['max_age_minutes', 'regime_delta']) {
    finite(raw.policy[key], key); requireTrue(raw.policy[key] > 0, 'Positive policy thresholds required');
  }
  for (const key of ['min_role_games', 'min_regime_games']) {
    requireTrue(Number.isSafeInteger(raw.policy[key]) && raw.policy[key] >= 3, 'At least three distinct games required');
  }
  record(raw.uncertainty, ['source', 'predictive'], 'Uncertainty');
  requireTrue(['unverified', 'conflicting', 'reported'].includes(raw.uncertainty.source) &&
    raw.uncertainty.predictive === 'unestimated', 'Source and predictive uncertainty required');
  requireTrue(Array.isArray(raw.challenges), 'Counterfactual challenges required');
  for (const challenge of raw.challenges) {
    record(challenge, ['hypothesis', 'alternative', 'counterfactual'], 'Challenge');
    Object.values(challenge).forEach(value => text(value, 'Challenge text'));
  }
  requireTrue(Array.isArray(raw.observations), 'Raw observation array required');
  for (const observation of raw.observations) {
    record(observation, ['observation_id', 'case_id', 'event_id', 'player_id', 'team_id', 'sample_event_id',
      'source_id', 'source_origin', 'report_group', 'observed_at', 'published_at', 'role_context', 'feature'], 'Observation');
    for (const field of ['observation_id', 'source_id', 'source_origin', 'report_group', 'sample_event_id']) text(observation[field], field);
    const owner = identity(observation, cases);
    requireTrue(observation.team_id === owner.team_id, 'Exact eligible team identity required');
    requireTrue(observation.sample_event_id.startsWith('synthetic-') && /^fixture:\/\/[^\s]+$/.test(observation.source_origin),
      'Only synthetic fixture source origins permitted');
    timestamp(observation.observed_at);
    if (observation.published_at !== null) timestamp(observation.published_at);
    requireTrue(['baseline', 'expanded', 'returned', 'unknown'].includes(observation.role_context), 'Role context required');
    const feature = observation.feature;
    record(feature, ['name', 'family', 'definition', 'unit', 'value'], 'Feature');
    ['name', 'family', 'definition', 'unit'].forEach(field => text(feature[field], 'Feature ' + field));
    noPrice(feature.name); noPrice(feature.family); noPrice(feature.definition); noPrice(feature.unit);
    if (typeof feature.value === 'string') noPrice(feature.value);
    requireTrue(feature.value === null || ['number', 'boolean', 'string'].includes(typeof feature.value), 'Scalar or explicit null feature required');
    if (typeof feature.value === 'number') finite(feature.value, 'Feature value');
  }
  unique(raw.observations.map(observation => observation.observation_id), 'Raw observations');
  const input = copy(raw);
  input.population = sorted(input.population, item => item.case_id);
  input.observations = sorted(input.observations, item => item.observation_id);
  input.challenges = sorted(input.challenges, canonicalJSON);
  return input;
}
function freezeResearch(input) { return seal(validateResearch(input)); }
function featureMatches(feature) {
  const expected = Object.hasOwn(FEATURES, feature.name) ? FEATURES[feature.name] : null;
  if (!expected || ['family', 'definition', 'unit'].some(key => feature[key] !== expected[key])) return false;
  if (feature.value === null) return true;
  if (expected.type === 'integer') return Number.isSafeInteger(feature.value) && feature.value >= 0;
  if (expected.type === 'number') return typeof feature.value === 'number' && feature.value >= 0;
  if (expected.type === 'string') return typeof feature.value === 'string' && feature.value.trim().length > 0;
  return typeof feature.value === expected.type;
}
function mean(values) {
  if (!values.length) return null;
  const sum = values.reduce((total, value) => total + value, 0), result = sum / values.length;
  requireTrue(Number.isFinite(result) && (result !== 0 || sum === 0), 'Numeric precision range unavailable');
  return result;
}
function squaredError(prediction, outcome) {
  const residual = prediction - outcome, result = residual ** 2;
  requireTrue(Number.isFinite(result) && (residual === 0 || result !== 0), 'Numeric squared-loss precision unavailable');
  return result;
}
function groups(items, key) {
  const result = new Map();
  for (const item of items) {
    const group = key(item);
    if (!result.has(group)) result.set(group, []);
    result.get(group).push(item);
  }
  return result;
}
function sampleMeans(observations, role) {
  const samples = groups(observations.filter(item => item.feature.name === 'workload' && item.role_context === role),
    item => item.sample_event_id);
  return [...samples.values()].map(items => mean(items.map(item => item.feature.value)));
}

function inspectResearch(envelope) {
  const input = validateResearch(verify(envelope));
  const cutoff = timestamp(input.forecast_cutoff), frozen = timestamp(input.frozen_at);
  const warnings = new Set(['CAUSAL_ATTRIBUTION_UNVERIFIED', 'UNCERTAINTY_UNESTIMATED']);
  const excluded = new Map();
  const exclude = (observation, reasons) => {
    if (!excluded.has(observation.observation_id)) excluded.set(observation.observation_id, new Set());
    reasons.forEach(reason => { excluded.get(observation.observation_id).add(reason); warnings.add(reason); });
  };
  let usable = [];
  for (const observation of input.observations) {
    const reasons = [], observed = timestamp(observation.observed_at);
    const published = observation.published_at === null ? null : timestamp(observation.published_at);
    if (observed > cutoff || (published !== null && published > cutoff)) reasons.push('POST_CUTOFF_EVIDENCE');
    if (observed > frozen || (published !== null && published > frozen)) reasons.push('POST_FREEZE_EVIDENCE');
    if (published === null) reasons.push('PUBLICATION_TIME_UNKNOWN');
    if (published !== null && published > observed) reasons.push('PUBLICATION_AFTER_OBSERVATION');
    if (cutoff - observed > input.policy.max_age_minutes * 60000) reasons.push('STALE_EVIDENCE');
    if (!featureMatches(observation.feature)) reasons.push('SOURCE_SCHEMA_CHANGED');
    if (observation.feature.value === null) reasons.push('UNKNOWN_VALUE');
    if (reasons.length) exclude(observation, reasons); else usable.push(observation);
  }
  const sourceGroups = sorted([...groups(usable, item => item.report_group)], item => item[0]).map(([report_group, items]) => ({
    report_group, observation_ids: items.map(item => item.observation_id).sort(),
  }));
  // Common-origin reports are not confirmations. Conflicting versions are quarantined together.
  const repeatGroups = groups(usable, item => canonicalJSON([item.report_group, item.case_id, item.sample_event_id, item.feature.name]));
  for (const items of repeatGroups.values()) {
    if (items.length < 2) continue;
    warnings.add('SOURCE_REDUNDANCY');
    const values = new Set(items.map(item => canonicalJSON([item.feature.value, item.role_context])));
    if (values.size > 1) items.forEach(item => exclude(item, ['SOURCE_CONFLICT']));
    else items.slice(1).forEach(item => exclude(item, ['SOURCE_REDUNDANCY']));
  }
  usable = usable.filter(item => !excluded.has(item.observation_id));
  const factGroups = groups(usable, item => canonicalJSON([item.case_id, item.sample_event_id, item.feature.name]));
  for (const items of factGroups.values()) {
    if (new Set(items.map(item => canonicalJSON([item.feature.value, item.role_context]))).size > 1) {
      items.forEach(item => exclude(item, ['SOURCE_CONFLICT']));
    }
  }
  usable = usable.filter(item => !excluded.has(item.observation_id));
  const confounded = new Map(), overtimeGames = new Set();
  const sampleKey = item => canonicalJSON([item.case_id, item.sample_event_id]);
  for (const item of usable) {
    let reason;
    if (item.feature.name === 'foul_trouble' && item.feature.value === true) reason = 'FOUL_TROUBLE_CONFOUNDER';
    if (item.feature.name === 'overtime_minutes' && item.feature.value > 0) reason = 'OVERTIME_CONFOUNDER';
    if (reason) {
      warnings.add(reason);
      if (!confounded.has(sampleKey(item))) confounded.set(sampleKey(item), []);
      confounded.get(sampleKey(item)).push(reason);
      if (reason === 'OVERTIME_CONFOUNDER') overtimeGames.add(item.sample_event_id);
    }
    if (item.feature.name === 'unavailable_teammates' && item.feature.value > 1) warnings.add('MULTIPLE_ABSENCES_CONFOUNDER');
    if (item.feature.name === 'tactical_regime') warnings.add('TACTICAL_INTERACTION_UNRESOLVED');
  }
  for (const item of usable) {
    if (item.feature.name !== 'workload') continue;
    const reasons = [...(confounded.get(sampleKey(item)) || [])];
    if (overtimeGames.has(item.sample_event_id)) reasons.push('OVERTIME_CONFOUNDER');
    if (reasons.length) exclude(item, reasons);
  }
  usable = usable.filter(item => !excluded.has(item.observation_id));
  const families = groups(usable, item => item.feature.family);
  if ([...families.values()].some(items => items.length > 1)) warnings.add('SIGNAL_FAMILY_REDUNDANCY');
  const teamTransfer = input.population.map(item => {
    const observations = usable.filter(observation => observation.case_id === item.case_id);
    const baseline = sampleMeans(observations, 'baseline'), expanded = sampleMeans(observations, 'expanded');
    const baseline_workload = mean(baseline), expanded_workload = mean(expanded);
    return { case_id: item.case_id, player_id: item.player_id, baseline_workload, expanded_workload,
      delta: baseline_workload === null || expanded_workload === null ? null : expanded_workload - baseline_workload,
      expanded_games: expanded.length };
  });
  const target = { ...teamTransfer.find(item => item.case_id === input.target_case_id) };
  const targetObservations = usable.filter(item => item.case_id === target.case_id);
  target.supporting_games = target.baseline_workload === null ? null : sampleMeans(targetObservations, 'expanded')
    .filter(value => value > target.baseline_workload).length;
  // Availability is time-sensitive. Old return evidence must not override a
  // newer admissible status; tied incompatible statuses remain unresolved.
  const statuses = targetObservations.filter(item => ['starter_returned', 'role_status'].includes(item.feature.name));
  const latestTime = statuses.length ? Math.max(...statuses.map(item => timestamp(item.published_at))) : null;
  const latestStates = new Set(statuses.filter(item => timestamp(item.published_at) === latestTime).map(item =>
    item.feature.name === 'starter_returned' ? (item.feature.value ? 'returned' : 'not_returned') :
      item.feature.value === 'returned' ? 'returned' : ['baseline', 'expanded'].includes(item.feature.value) ? 'not_returned' : 'unknown'));
  const roleUnresolved = latestStates.size > 1 || latestStates.has('unknown');
  const returned = !roleUnresolved && latestStates.has('returned');
  target.role_status = roleUnresolved ? 'UNRESOLVED' : returned ? 'REVERSION_TRIGGER' : target.delta > 0 &&
    target.supporting_games >= input.policy.min_role_games ? 'PERSISTENCE_HYPOTHESIS' : 'UNRESOLVED';
  if (roleUnresolved) warnings.add('ROLE_STATUS_UNRESOLVED');
  if (returned) warnings.add('ROLE_REVERSION');
  if (target.delta !== null && target.delta > 0 && !returned) warnings.add('HIDDEN_OPPORTUNITY_HYPOTHESIS');
  if (target.expanded_games && (target.supporting_games === null ||
      target.supporting_games < input.policy.min_role_games || roleUnresolved)) warnings.add('ROLE_NOT_PERSISTENT');
  if (target.expanded_games && target.delta !== null && target.delta <= 0) warnings.add('WORKLOAD_NOT_INHERITED');
  const cases = new Map(input.population.map(item => [item.case_id, item]));
  const targetOwner = cases.get(target.case_id);
  if (teamTransfer.some(item => item.delta !== null && item.delta < 0 &&
      cases.get(item.case_id).event_id === targetOwner.event_id && cases.get(item.case_id).team_id === targetOwner.team_id)) {
    warnings.add('NEGATIVE_TEAM_TRANSFER');
  }
  const changedGames = target.baseline_workload === null ? null : sampleMeans(targetObservations, 'expanded')
    .filter(value => Math.abs(value - target.baseline_workload) >= input.policy.regime_delta).length;
  target.regime_status = changedGames === null ? 'UNRESOLVED' : changedGames === 0 ? 'NO_WARNING' :
    changedGames === 1 ? 'ISOLATED_EXTREME' : changedGames < input.policy.min_regime_games ? 'INSUFFICIENT_GROUPS' : 'MULTI_GAME_WARNING';
  if (target.regime_status === 'ISOLATED_EXTREME') warnings.add('REGIME_ISOLATED_EXTREME');
  if (target.regime_status === 'MULTI_GAME_WARNING') warnings.add('REGIME_WARNING_RESEARCH_ONLY');
  if (!input.challenges.length) warnings.add('COUNTERFACTUAL_MISSING');
  return deepFreeze({
    schema_version: RESEARCH_VERSION, label: 'SYNTHETIC SHADOW', research_only: true,
    execution_authority: false, human_final_gate_required: true, predictive_value: 'NOT_ESTABLISHED',
    snapshot_sha256: envelope.sha256, eligible_cases: input.population.length, target_case_id: input.target_case_id,
    accepted_observation_ids: usable.map(item => item.observation_id).sort(),
    excluded: sorted([...excluded], item => item[0]).map(([observation_id, reasons]) => ({ observation_id, reasons: [...reasons].sort() })),
    warnings: [...warnings].sort(), source_groups: sourceGroups, feature_families: [...families.keys()].sort(),
    uncertainty: input.uncertainty, challenges: input.challenges, team_transfer: teamTransfer, target,
    reassessment_required: [...warnings].some(code => ['ROLE_REVERSION', 'ROLE_STATUS_UNRESOLVED', 'SOURCE_SCHEMA_CHANGED', 'SOURCE_CONFLICT',
      'STALE_EVIDENCE', 'REGIME_WARNING_RESEARCH_ONLY'].includes(code)),
  });
}

function validateEvaluation(manifest, forecasts) {
  record(manifest, ['schema_version', 'synthetic', 'research_only', 'phase', 'study_id', 'frozen_at',
    'holdout', 'evaluation_as_of', 'target', 'models', 'population'], 'Evaluation manifest');
  requireTrue(manifest.schema_version === EVALUATION_VERSION && typeof manifest.synthetic === 'boolean' &&
    manifest.research_only === true && manifest.phase === PHASE, 'Research-only evaluation PHASE1 contract required');
  text(manifest.study_id, 'Study');
  record(manifest.holdout, ['start', 'end'], 'Chronological holdout');
  const start = timestamp(manifest.holdout.start), end = timestamp(manifest.holdout.end);
  const frozen = timestamp(manifest.frozen_at), asOf = timestamp(manifest.evaluation_as_of);
  requireTrue(frozen <= start && start <= end && asOf >= end, 'Chronological frozen holdout required');
  record(manifest.target, ['name', 'kind', 'unit'], 'Target');
  text(manifest.target.name, 'Target name'); text(manifest.target.unit, 'Target unit');
  noPrice(manifest.target.name); noPrice(manifest.target.unit);
  requireTrue(['continuous', 'binary'].includes(manifest.target.kind), 'Defensible continuous/binary target required');
  requireTrue(Array.isArray(manifest.models) && manifest.models.length > 0, 'External model identifiers required');
  manifest.models.forEach(model => text(model, 'Model')); unique(manifest.models, 'Models');
  const cases = population(manifest, true);
  for (const item of cases.values()) {
    requireTrue(timestamp(item.forecast_cutoff) >= start && timestamp(item.forecast_cutoff) <= end,
      'Eligible cutoff outside frozen chronological holdout');
  }
  requireTrue(Array.isArray(forecasts), 'Externally supplied frozen forecast array required');
  for (const forecast of forecasts) {
    record(forecast, ['model_id', 'case_id', 'event_id', 'player_id', 'target', 'unit', 'frozen_at',
      'inputs_sha256', 'prediction', 'abstention_reason'], 'External forecast');
    const owner = identity(forecast, cases);
    requireTrue(manifest.models.includes(forecast.model_id), 'Unregistered model');
    requireTrue(forecast.target === manifest.target.name && forecast.unit === manifest.target.unit, 'Forecast target/unit mismatch');
    const at = timestamp(forecast.frozen_at);
    requireTrue(at >= frozen && at <= timestamp(owner.forecast_cutoff), 'Forecast frozen outside preregistered cutoff');
    requireTrue(typeof forecast.inputs_sha256 === 'string' && /^[a-f0-9]{64}$/.test(forecast.inputs_sha256), 'Input snapshot digest required');
    if (forecast.prediction === null) text(forecast.abstention_reason, 'Pre-cutoff abstention reason');
    else {
      finite(forecast.prediction, 'External prediction');
      requireTrue(forecast.abstention_reason === null, 'A forecast cannot also be an abstention');
      if (manifest.target.kind === 'binary') requireTrue(forecast.prediction >= 0 && forecast.prediction <= 1, 'Binary probability outside [0,1]');
    }
  }
  unique(forecasts.map(item => canonicalJSON([item.model_id, item.case_id])), 'Model/case forecasts');
  const input = copy({ manifest, forecasts });
  input.manifest.models.sort();
  input.manifest.population = sorted(input.manifest.population, item => item.case_id);
  input.forecasts = sorted(input.forecasts, item => canonicalJSON([item.model_id, item.case_id]));
  return input;
}
function freezeEvaluation(manifest, forecasts) { return seal(validateEvaluation(manifest, forecasts)); }
function evaluateFrozen(envelope, outcomes) {
  const raw = verify(envelope);
  record(raw, ['manifest', 'forecasts'], 'Frozen evaluation');
  const { manifest, forecasts } = validateEvaluation(raw.manifest, raw.forecasts);
  const cases = new Map(manifest.population.map(item => [item.case_id, item]));
  const groupCutoffs = new Map([...groups(manifest.population, item => item.game_group)]
    .map(([group, items]) => [group, Math.max(...items.map(item => timestamp(item.forecast_cutoff)))]));
  requireTrue(Array.isArray(outcomes), 'External outcome array required');
  for (const outcome of outcomes) {
    record(outcome, ['case_id', 'event_id', 'player_id', 'target', 'unit', 'value', 'observed_at'], 'Outcome');
    const owner = identity(outcome, cases);
    requireTrue(outcome.target === manifest.target.name && outcome.unit === manifest.target.unit, 'Outcome target/unit mismatch');
    requireTrue(timestamp(outcome.observed_at) > groupCutoffs.get(owner.game_group) &&
      timestamp(outcome.observed_at) <= timestamp(manifest.evaluation_as_of), 'Shared-game outcome chronology unavailable or invalid');
    if (outcome.value !== null) {
      finite(outcome.value, 'Outcome value');
      if (manifest.target.kind === 'binary') requireTrue([0, 1].includes(outcome.value), 'Binary outcome must be 0 or 1');
    }
  }
  unique(outcomes.map(item => item.case_id), 'Case outcomes');
  const observed = new Map(outcomes.map(item => [item.case_id, item]));
  const scored = new Map(), modelResults = [];
  const squared = manifest.target.kind === 'binary';
  const loss = (forecast, outcome) => squared ? squaredError(forecast, outcome) : Math.abs(forecast - outcome);
  const warnings = new Set(['CONTENT_HASH_NOT_HISTORICAL_AUTHENTICATION', 'NO_PREDICTIVE_VALUE_CLAIM']);
  for (const model_id of manifest.models) {
    const entries = forecasts.filter(item => item.model_id === model_id);
    const predicted = entries.filter(item => item.prediction !== null);
    const valid = predicted.filter(item => observed.has(item.case_id) && observed.get(item.case_id).value !== null);
    scored.set(model_id, new Map(valid.map(item => [item.case_id, item])));
    const errors = valid.map(item => loss(item.prediction, observed.get(item.case_id).value));
    const perGame = groups(valid, item => cases.get(item.case_id).game_group);
    if (predicted.length < cases.size) warnings.add('SELECTIVE_COVERAGE_NOT_MODEL_SKILL');
    modelResults.push({
      model_id, forecast_count: predicted.length, coverage: predicted.length / cases.size,
      abstentions: entries.filter(item => item.prediction === null).length, missing_predictions: cases.size - entries.length,
      missing_outcomes: predicted.length - valid.length, scored_cases: valid.length, scored_game_groups: perGame.size,
      mae: squared ? null : mean(errors),
      mse: squared ? null : mean(valid.map(item => squaredError(item.prediction, observed.get(item.case_id).value))),
      brier: squared ? mean(errors) : null,
      group_balanced_error: mean([...perGame.values()].map(items => mean(items.map(item => loss(item.prediction, observed.get(item.case_id).value))))),
    });
  }
  const comparisons = [];
  for (let i = 0; i < manifest.models.length; i++) {
    for (let j = i + 1; j < manifest.models.length; j++) {
      const left = manifest.models[i], right = manifest.models[j];
      const matched = [...cases.values()].filter(item => scored.get(left).has(item.case_id) && scored.get(right).has(item.case_id));
      const error = (model, item) => loss(scored.get(model).get(item.case_id).prediction, observed.get(item.case_id).value);
      const left_error = mean(matched.map(item => error(left, item))), right_error = mean(matched.map(item => error(right, item)));
      const perGame = groups(matched, item => item.game_group);
      comparisons.push({ models: [left, right], matched_cases: matched.length, matched_game_groups: perGame.size,
        left_error, right_error, difference: matched.length ? left_error - right_error : null,
        group_balanced_difference: mean([...perGame.values()].map(items => mean(items.map(item => error(left, item) - error(right, item))))),
        interpretation: 'DESCRIPTIVE_MATCHED_CASES_ONLY' });
    }
  }
  return deepFreeze({
    schema_version: EVALUATION_VERSION, label: manifest.synthetic ? 'SYNTHETIC SHADOW' : 'OFFLINE RESEARCH UNVERIFIED PROVENANCE',
    research_only: true, execution_authority: false, human_final_gate_required: true, predictive_value: 'NOT_ESTABLISHED',
    snapshot_sha256: envelope.sha256, eligible_cases: cases.size,
    eligible_game_groups: new Set([...cases.values()].map(item => item.game_group)).size,
    target: manifest.target, models: modelResults, comparisons, warnings: [...warnings].sort(),
  });
}

module.exports = Object.freeze({ RESEARCH_VERSION, EVALUATION_VERSION, FEATURES, freezeResearch, inspectResearch,
  freezeEvaluation, evaluateFrozen, canonicalJSON });

if (require.main === module) {
  try {
    const [mode, ...paths] = process.argv.slice(2);
    let result;
    if (mode === 'fixtures' && paths.length === 0) {
      const { researchFixtures, evaluationFixtures } = require('./opportunity-shadow.fixtures.cjs');
      result = { label: 'SYNTHETIC SHADOW', execution_authority: false,
        research: researchFixtures.map(fixture => {
          let row;
          try {
            let envelope = freezeResearch(fixture.build());
            if (fixture.mutate_after_freeze) {
              envelope = copy(envelope);
              envelope.input.observations[0].feature.value += 1;
            }
            row = { name: fixture.name, rejected: false, result: inspectResearch(envelope) };
          } catch {
            row = { name: fixture.name, rejected: true, expected_rejection: fixture.expected_rejection === true };
          }
          requireTrue(row.rejected === (fixture.expected_rejection === true), 'Unexpected fixture result');
          return row;
        }),
        evaluation: evaluationFixtures.map(fixture => {
          const input = fixture.build();
          return { name: fixture.name, result: evaluateFrozen(freezeEvaluation(input.manifest, input.forecasts), input.outcomes) };
        }) };
    } else {
      const fs = require('node:fs');
      const read = path => JSON.parse(fs.readFileSync(path, 'utf8'));
      if (mode === 'inspect' && paths.length === 1) result = inspectResearch(read(paths[0]));
      else if (mode === 'evaluate' && paths.length === 2) result = evaluateFrozen(read(paths[0]), read(paths[1]));
      else throw new Error('Usage: node scripts/scout/opportunity-shadow.cjs fixtures | inspect frozen.json | evaluate frozen.json outcomes.json');
    }
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } catch (error) {
    // Do not print supplied records, credentials, paths or low-level transport/file errors.
    process.stderr.write('SHADOW input rejected; check the versioned offline contract.\n');
    process.exitCode = 1;
  }
}
