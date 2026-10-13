'use strict';

// ATLAS research contracts, not provider schemas. No collectors or live modes.
const { createHash } = require('node:crypto');
const { types: { isProxy } } = require('node:util');
const { canonicalJSON, FEATURES } = require('./opportunity-shadow.cjs');
const VERSION = 'atlas.scout.source-contract-shadow.v1';
const PINS = Object.freeze({
  espn: '3796c6a7c0b0c496c1f62408b0792e23254cd930',
  sports_skills: '09eb7e8566f48c01d1ea7bf7b4ac62a477d37b19',
  nba: '8e36b0b72ecc5082aa8976dff742cdf910b3aa36'
});
const SOURCE_PINS = Object.freeze({
  'public-espn-api': ['ESPN', PINS.espn],
  'sports-skills': ['ESPN', PINS.sports_skills],
  'nba-machine-learning-sports-betting': ['NBA', PINS.nba]
});
const FEATURE_TYPES = Object.freeze({
  workload: [FEATURES.workload.definition, FEATURES.workload.unit],
  games_played: ['games-played-v1', 'games'],
  points_per_game: ['points-per-game-v1', 'points/game'],
  pace: ['pace-v1', 'possessions/game']
});
const ROOT_FIELDS = ['schema_version', 'synthetic', 'research_only', 'study_id', 'phase',
  'frozen_at', 'forecast_cutoff', 'policy', 'records', 'folds'];
const RECORD_FIELDS = ['record_id', 'report_group', 'source', 'context', 'identity',
  'time', 'http', 'body_sha256', 'features', 'espn', 'nba'];
const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(v));
const exact = (v, keys) => isObject(v) && Object.keys(v).length === keys.length &&
  keys.every(k => Object.hasOwn(v, k));
const id = v => typeof v === 'string' && /^synthetic-[A-Za-z0-9_-]{1,80}$/.test(v);
const ids = v => Array.isArray(v) && v.every(id) && new Set(v).size === v.length;
const hash = v => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const sorted = v => [...v].sort((a, b) => {
  const x = canonicalJSON(a), y = canonicalJSON(b);
  return x < y ? -1 : x > y ? 1 : 0;
});
const same = (a, b) => canonicalJSON(a) === canonicalJSON(b);
function immutable(v) {
  if (v && typeof v === 'object') { Object.values(v).forEach(immutable); Object.freeze(v); }
  return v;
}
// Refuse getters, symbols and non-JSON objects before touching their contents.
function jsonData(v, depth = 0) {
  if (depth > 50 || isProxy(v)) throw Error('CONTRACT_INVALID');
  if (v === null || ['string', 'boolean'].includes(typeof v)) return;
  if (typeof v === 'number' && Number.isFinite(v) &&
    (!Number.isInteger(v) || Number.isSafeInteger(v))) return;
  if (!Array.isArray(v) && !isObject(v)) throw Error('CONTRACT_INVALID');
  if (Array.isArray(v) && Object.getPrototypeOf(v) !== Array.prototype) throw Error('CONTRACT_INVALID');
  if (Object.getOwnPropertySymbols(v).length) throw Error('CONTRACT_INVALID');
  const descriptors = Object.getOwnPropertyDescriptors(v);
  if (Array.isArray(v) && Object.keys(v).length !== v.length) throw Error('CONTRACT_INVALID');
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (Array.isArray(v) && key === 'length') continue;
    if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value')) throw Error('CONTRACT_INVALID');
    jsonData(descriptor.value, depth + 1);
  }
}
function hashJSON(v) {
  try { jsonData(v); return createHash('sha256').update(canonicalJSON(v)).digest('hex'); }
  catch { throw Error('CONTRACT_INVALID'); }
}
function millis(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v)) return null;
  const n = Date.parse(v);
  return Number.isFinite(n) && new Date(n).toISOString() ===
    (v.includes('.') ? v : v.replace('Z', '.000Z')) ? n : null;
}
function rootValid(v) {
  return exact(v, ROOT_FIELDS) && v.schema_version === VERSION && v.synthetic === true &&
    v.research_only === true && ['ESPN-SH-01', 'NBA-LK-01'].includes(v.study_id) &&
    v.phase === 'PHASE1_PRICE_INDEPENDENT' && exact(v.policy, ['max_age_minutes']) &&
    Number.isSafeInteger(v.policy.max_age_minutes) && v.policy.max_age_minutes >= 0 &&
    v.policy.max_age_minutes <= 525600 && Array.isArray(v.records) && v.records.length <= 10000 &&
    Array.isArray(v.folds) && millis(v.frozen_at) !== null && millis(v.forecast_cutoff) !== null &&
    millis(v.frozen_at) <= millis(v.forecast_cutoff);
}
function freezeStudy(input) {
  try {
    jsonData(input);
    if (!rootValid(input)) throw Error();
    const copy = JSON.parse(canonicalJSON(input));
    // Record/fold order conveys no chronology or authority.
    copy.records = sorted(copy.records); copy.folds = sorted(copy.folds);
    return immutable({ sha256: hashJSON(copy), input: copy });
  } catch { throw Error('CONTRACT_INVALID'); }
}
function verify(receipt) {
  try {
    jsonData(receipt);
    if (!exact(receipt, ['sha256', 'input']) || !hash(receipt.sha256) ||
      hashJSON(receipt.input) !== receipt.sha256 || !rootValid(receipt.input)) throw Error();
    return receipt.input;
  } catch { throw Error('RECEIPT_INTEGRITY'); }
}
function foldReasons(folds) {
  if (!folds.length) return [];
  const reasons = new Set(), grouped = { train: [], calibration: [], test: [] }, seen = new Set();
  for (const f of folds) {
    if (!exact(f, ['split', 'game_id', 'start_at', 'end_at', 'precision']) ||
      typeof f.split !== 'string' || !Object.hasOwn(grouped, f.split) || !id(f.game_id) || f.precision !== 'second' ||
      millis(f.start_at) === null || millis(f.end_at) === null || millis(f.end_at) < millis(f.start_at)) {
      reasons.add('FOLD_INVALID'); continue;
    }
    if (seen.has(f.game_id)) reasons.add('FOLD_GAME_OVERLAP');
    seen.add(f.game_id); grouped[f.split].push(f);
  }
  const groups = Object.values(grouped).filter(g => g.length);
  for (let i = 1; i < groups.length; i++) {
    const before = Math.max(...groups[i - 1].map(f => millis(f.end_at)));
    const after = Math.min(...groups[i].map(f => millis(f.start_at)));
    if (after <= before) reasons.add('FOLD_ORDER');
    // Whole UTC-day embargo: row ordering cannot resolve shared-day ambiguity.
    if (Math.floor(after / 86400000) <= Math.floor(before / 86400000)) reasons.add('FOLD_DAY_AMBIGUOUS');
  }
  return [...reasons].sort();
}
function inspectRecord(r, input, index) {
  const reasons = new Set(), warnings = new Set();
  const reject = code => reasons.add(code);
  const result = { record_id: id(r?.record_id) ? r.record_id : 'synthetic-invalid-' + index,
    eligible: false, reasons: [], warnings: [], body_sha256: null };
  if (!exact(r, RECORD_FIELDS)) { result.reasons = ['SCHEMA_INVALID']; return result; }
  if (!id(r.record_id) || !id(r.report_group)) reject('IDENTITY_UNRESOLVED');
  const s = r.source, c = r.context, i = r.identity, t = r.time, h = r.http;
  if (!exact(s, ['family', 'repository', 'commit', 'origin', 'rights', 'revision'])) reject('SCHEMA_INVALID');
  else {
    const pin = typeof s.repository === 'string' && Object.hasOwn(SOURCE_PINS, s.repository) && SOURCE_PINS[s.repository];
    const wanted = input.study_id === 'ESPN-SH-01' ? 'ESPN' : 'NBA';
    if (!pin || pin[0] !== s.family || pin[1] !== s.commit || s.family !== wanted) reject('SOURCE_PIN');
    if (typeof s.origin !== 'string' || !/^fixture:\/\/synthetic\/[A-Za-z0-9_./-]+$/.test(s.origin) ||
      !id(s.revision)) reject('SYNTHETIC_SOURCE_REQUIRED');
    if (!exact(s.rights, ['scope', 'evidence_id']) || s.rights.scope !== 'SYNTHETIC_ONLY' ||
      !id(s.rights.evidence_id)) reject('SYNTHETIC_RIGHTS_REQUIRED');
  }
  if (!exact(c, ['sport', 'league', 'season', 'period']) || c.sport !== 'basketball' ||
    !['league', 'season', 'period'].every(k => id(c[k]))) reject('CONTEXT_MISMATCH');
  let mapping = new Map();
  if (!exact(i, ['event_id', 'team_ids', 'player_ids', 'player_teams', 'crosswalk']) || !id(i.event_id) ||
    !ids(i.team_ids) || i.team_ids.length !== 2 || !ids(i.player_ids) ||
    !Array.isArray(i.player_teams) ||
    !exact(i.crosswalk, ['evidence_id', 'mappings']) || !id(i.crosswalk.evidence_id) ||
    !Array.isArray(i.crosswalk.mappings)) reject('IDENTITY_UNRESOLVED');
  else {
    if (!i.player_teams.every(p => exact(p, ['player_id', 'team_id']) &&
      i.player_ids.includes(p.player_id) && i.team_ids.includes(p.team_id)) ||
      !same(i.player_teams.map(p => p.player_id).sort(), [...i.player_ids].sort())) reject('IDENTITY_UNRESOLVED');
    const m = i.crosswalk.mappings;
    if (!m.every(x => exact(x, ['source_id', 'atlas_id']) && id(x.source_id) && id(x.atlas_id)) ||
      new Set(m.map(x => x.source_id)).size !== m.length ||
      new Set(m.map(x => x.atlas_id)).size !== m.length ||
      !same([...m.map(x => x.atlas_id)].sort(), [...i.team_ids, ...i.player_ids].sort())) reject('IDENTITY_UNRESOLVED');
    else mapping = new Map(m.map(x => [x.source_id, x.atlas_id]));
  }
  const bound = millis(input.frozen_at), cutoff = millis(input.forecast_cutoff), times = {};
  if (!exact(t, ['observed_at', 'published_at', 'available_at', 'captured_at', 'precision'])) reject('SCHEMA_INVALID');
  else {
    if (t.precision !== 'second') reject('TIMESTAMP_PRECISION');
    for (const k of ['observed_at', 'published_at', 'available_at', 'captured_at']) {
      times[k] = millis(t[k]);
      if (t[k] === null) reject('TIMESTAMP_UNKNOWN');
      else if (times[k] === null) reject('TIMESTAMP_INVALID');
      else if (times[k] > bound || times[k] > cutoff) reject('POST_CUTOFF');
    }
    if (Object.values(times).every(v => v !== null)) {
      if (times.published_at > times.available_at || times.available_at > times.captured_at ||
        times.observed_at > times.captured_at) reject('TEMPORAL_ORDER');
      if (bound - Math.min(times.observed_at, times.published_at) > input.policy.max_age_minutes * 60000) reject('STALE');
    }
  }
  if (!exact(h, ['status', 'api_family', 'body'])) reject('SCHEMA_INVALID');
  else {
    result.body_sha256 = hashJSON(h.body);
    if (!hash(r.body_sha256) || result.body_sha256 !== r.body_sha256) reject('BODY_INTEGRITY');
    if (h.status !== 200) reject(h.status === 400 ? 'HTTP_400' : h.status === 404 ? 'HTTP_404' : 'HTTP_NON_200');
  }
  if (!Array.isArray(r.features) || r.features.length === 0) reject('FEATURE_UNKNOWN');
  else {
    const names = new Set();
    for (const f of r.features) {
      if (!exact(f, ['name', 'definition', 'unit', 'value', 'kind', 'quote_captured_at'])) { reject('SCHEMA_INVALID'); continue; }
      if (typeof f.name !== 'string' || f.kind !== 'independent' || /(^ou$|odds|price|sportsbook|bookmaker|predictor|moneyline|market)/i.test(f.name)) {
        reject('PHASE1_MARKET_FEATURE');
        if (millis(f.quote_captured_at) === null) reject('QUOTE_CAPTURE_UNKNOWN');
      }
      const shape = typeof f.name === 'string' && Object.hasOwn(FEATURE_TYPES, f.name) && FEATURE_TYPES[f.name];
      if (!shape || f.definition !== shape[0] || f.unit !== shape[1] || typeof f.value !== 'number' ||
        !Number.isFinite(f.value) || f.value < 0 || (f.name === 'games_played' && !Number.isSafeInteger(f.value))) reject('FEATURE_UNKNOWN');
      if (f.quote_captured_at !== null || names.has(f.name)) reject('PHASE1_MARKET_FEATURE');
      names.add(f.name);
    }
  }
  // Source-specific validators run even after shared exclusion to retain evidence.
  if (input.study_id === 'ESPN-SH-01') inspectESPN(r, times, bound, cutoff, reject, warnings);
  else inspectNBA(r, times, bound, cutoff, mapping, reject);
  result.reasons = [...reasons].sort(); result.warnings = [...warnings].sort();
  result.eligible = result.reasons.length === 0;
  return result;
}
function inspectESPN(r, times, bound, cutoff, reject, warnings) {
  const e = r.espn, h = r.http, i = r.identity, c = r.context;
  if (r.nba !== null || !exact(e, ['scope', 'expected_event_ids', 'snapshot_at', 'complete']) ||
    !['schedule', 'injuries'].includes(e.scope) || !ids(e.expected_event_ids)) { reject('SHAPE_MISMATCH'); return; }
  if (h?.api_family !== 'site') reject('SHAPE_MISMATCH');
  const snapshot = millis(e.snapshot_at);
  if (snapshot === null) reject('TIMESTAMP_UNKNOWN');
  else if (snapshot > bound || (times.captured_at !== null && snapshot > times.captured_at) ||
    (times.published_at !== null && snapshot > times.published_at)) reject('POST_CUTOFF');
  if (e.complete !== true) reject('SCHEDULE_INCOMPLETE');
  const body = h?.body;
  if (e.scope === 'schedule') {
    if (!exact(body, ['events']) || !Array.isArray(body.events)) { reject('SHAPE_MISMATCH'); return; }
    const found = [];
    for (const event of body.events) {
      if (!exact(event, ['event_id', 'team_ids', 'start_at', 'league', 'season', 'period']) ||
        !id(event.event_id) || !ids(event.team_ids) || event.team_ids.length !== 2 || millis(event.start_at) === null) {
        reject('SHAPE_MISMATCH'); continue;
      }
      found.push(event.event_id);
      if (!c || ['league', 'season', 'period'].some(k => c[k] !== event[k])) reject('CONTEXT_MISMATCH');
      if (event.event_id === i?.event_id) {
        if (!same(event.team_ids, i.team_ids)) reject('POSITIONAL_TEAM_MISMATCH');
        if (millis(event.start_at) <= cutoff) reject('POST_CUTOFF');
      }
    }
    if (new Set(found).size !== found.length) reject('SOURCE_CONFLICT');
    if (!e.expected_event_ids.length || !same([...found].sort(), [...e.expected_event_ids].sort()) ||
      !found.includes(i?.event_id)) reject('SCHEDULE_INCOMPLETE');
  } else {
    if (!exact(body, ['injuries']) || !Array.isArray(body.injuries)) { reject('SHAPE_MISMATCH'); return; }
    // Even a valid empty report cannot establish universal health/participation.
    warnings.add('INJURY_COVERAGE_UNKNOWN');
    const players = new Set();
    for (const injury of body.injuries) {
      if (!exact(injury, ['player_id', 'team_id', 'status', 'reported_at']) || !id(injury.player_id) ||
        !id(injury.team_id) || !['questionable', 'doubtful', 'out'].includes(injury.status)) { reject('SHAPE_MISMATCH'); continue; }
      if (!i?.player_ids?.includes(injury.player_id) || !i?.team_ids?.includes(injury.team_id)) reject('IDENTITY_UNRESOLVED');
      if (!i?.player_teams?.some(p => p.player_id === injury.player_id && p.team_id === injury.team_id)) reject('IDENTITY_UNRESOLVED');
      if (players.has(injury.player_id)) reject('SOURCE_CONFLICT'); players.add(injury.player_id);
      const reported = millis(injury.reported_at);
      if (reported === null) reject('TIMESTAMP_UNKNOWN');
      else if ((snapshot !== null && reported > snapshot) || reported > bound ||
        (times.published_at !== null && reported > times.published_at)) reject('POST_CUTOFF');
    }
  }
}
function inspectNBA(r, times, bound, cutoff, mapping, reject) {
  const n = r.nba, i = r.identity, h = r.http;
  if (r.espn !== null || !exact(n, ['target', 'contributors', 'table_vintage_at', 'archived_pre_cutoff', 'aggregation']) ||
    !exact(n.target, ['event_id', 'start_at', 'team_ids']) || !Array.isArray(n.contributors) || !n.contributors.length ||
    !['rolling', 'season'].includes(n.aggregation)) { reject('SHAPE_MISMATCH'); return; }
  if (h?.api_family !== 'nba-team') reject('SHAPE_MISMATCH');
  const target = n.target, start = millis(target.start_at), vintage = millis(n.table_vintage_at);
  if (start === null) reject('TIMESTAMP_INVALID');
  else if (start <= cutoff) reject('POST_CUTOFF');
  if (!id(target.event_id) || target.event_id !== i?.event_id || !ids(target.team_ids) ||
    !same(target.team_ids, i?.team_ids ?? null)) reject('IDENTITY_UNRESOLVED');
  if (vintage === null) reject('TABLE_VINTAGE_UNKNOWN');
  else if (vintage > bound || (times.observed_at !== null && vintage > times.observed_at) ||
    (times.published_at !== null && vintage > times.published_at) ||
    (times.captured_at !== null && vintage > times.captured_at)) reject('POST_CUTOFF');
  if (n.archived_pre_cutoff !== true) reject('ARCHIVE_UNVERIFIED');
  const games = new Set();
  for (const game of n.contributors) {
    if (!exact(game, ['event_id', 'start_at', 'end_at', 'team_ids']) || !id(game.event_id) ||
      !ids(game.team_ids) || game.team_ids.length !== 2) { reject('IDENTITY_UNRESOLVED'); continue; }
    if (games.has(game.event_id)) reject('SOURCE_CONFLICT'); games.add(game.event_id);
    if (game.event_id === target.event_id) reject('TARGET_GAME_CONTAMINATION');
    const a = millis(game.start_at), b = millis(game.end_at);
    if (a === null || b === null) reject('TIMESTAMP_INVALID');
    else {
      if (b < a) reject('TEMPORAL_ORDER');
      if (b > bound || (start !== null && b >= start) || (vintage !== null && b > vintage) ||
        (times.observed_at !== null && b > times.observed_at) || (times.published_at !== null && b > times.published_at) ||
        (times.available_at !== null && b > times.available_at)) reject('LATE_CONTRIBUTOR');
    }
    if (!same(game.team_ids, target.team_ids)) reject('IDENTITY_UNRESOLVED');
  }
  if (!exact(h?.body, ['league', 'season', 'period', 'team_rows']) ||
    !Array.isArray(h.body.team_rows) || h.body.team_rows.length !== 2) {
    reject('SHAPE_MISMATCH'); return;
  }
  if (!r.context || ['league', 'season', 'period'].some(k => h.body[k] !== r.context[k])) reject('CONTEXT_MISMATCH');
  h.body.team_rows.forEach((row, index) => {
    if (!exact(row, ['source_team_id', 'team_id']) || !id(row.source_team_id) || !id(row.team_id) ||
      mapping.get(row.source_team_id) !== row.team_id || row.team_id !== target.team_ids[index]) reject('POSITIONAL_TEAM_MISMATCH');
  });
}
function inspectStudy(receipt) {
  const input = verify(receipt);
  const folds = foldReasons(input.folds);
  const results = input.records.map((record, index) => {
    // Do not propagate producer exceptions or sensitive payloads in errors.
    try { return inspectRecord(record, input, index); }
    catch { return { record_id: id(record?.record_id) ? record.record_id : 'synthetic-invalid-' + index,
      eligible: false, reasons: ['SCHEMA_INVALID'], warnings: [], body_sha256: null }; }
  });
  const groups = new Map();
  input.records.forEach((r, index) => {
    if (!id(r?.report_group) || !['ESPN', 'NBA'].includes(r?.source?.family)) return;
    const key = canonicalJSON([r.source.family, r.report_group]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(index);
  });
  for (const members of groups.values()) {
    if (members.length < 2) continue;
    const signatures = members.map(k => {
      const r = input.records[k];
      return hashJSON(['context', 'identity', 'time', 'http', 'features', 'espn', 'nba'].map(key =>
        [key, Object.hasOwn(r, key), Object.hasOwn(r, key) ? r[key] : null]));
    });
    const conflict = new Set(signatures).size !== 1;
    const eligible = members.filter(k => results[k].eligible).sort((a, b) =>
      results[a].record_id.localeCompare(results[b].record_id, 'en'));
    for (const k of members) if (conflict || (results[k].eligible && k !== eligible[0])) {
      results[k].reasons.push(conflict ? 'SOURCE_CONFLICT' : 'SOURCE_DUPLICATE'); results[k].eligible = false;
    }
  }
  // The same content through two wrappers is one item even after relabeling a
  // report. This is deduplication, never proof that different content is independent.
  const semanticGroups = new Map();
  input.records.forEach((r, index) => {
    if (!results[index].eligible) return;
    const key = hashJSON([r.source.family, r.context, r.identity, r.http, r.features]);
    if (!semanticGroups.has(key)) semanticGroups.set(key, []);
    semanticGroups.get(key).push(index);
  });
  for (const members of semanticGroups.values()) {
    members.sort((a, b) => results[a].record_id.localeCompare(results[b].record_id, 'en'));
    for (const k of members.slice(1)) {
      results[k].reasons.push('SOURCE_DUPLICATE'); results[k].eligible = false;
    }
  }
  const identityCounts = new Map();
  for (const r of results) identityCounts.set(r.record_id, (identityCounts.get(r.record_id) || 0) + 1);
  for (const r of results) {
    if (identityCounts.get(r.record_id) > 1) r.reasons.push('IDENTITY_UNRESOLVED');
    r.reasons.push(...folds); r.reasons = [...new Set(r.reasons)].sort(); r.eligible = r.reasons.length === 0;
  }
  const eligible = results.filter(r => r.eligible).length;
  return immutable({ schema_version: VERSION, label: 'SYNTHETIC SHADOW', study_id: input.study_id,
    phase: input.phase, receipt_sha256: receipt.sha256, execution_authority: false,
    human_final_gate_required: true, predictive_value: 'NOT_ESTABLISHED', source_rights: 'REAL_SOURCE_BLOCKED',
    promotion: 'HOLD_INTEGRATION', denominators: { total: results.length, eligible, rejected: results.length - eligible },
    records: sorted(results), warnings: [], fold_reasons: folds });
}
function replayStudy(receipts, sha256) {
  try { jsonData(receipts); } catch { throw Error('CONTRACT_INVALID'); }
  if (!Array.isArray(receipts) || !hash(sha256)) throw Error('CONTRACT_INVALID');
  const matches = receipts.filter(r => r?.sha256 === sha256);
  if (!matches.length) throw Error('REPLAY_MISS');
  // Verify every match; a corrupt duplicate cannot hide behind a valid receipt.
  matches.forEach(verify);
  return inspectStudy(matches[0]);
}
module.exports = Object.freeze({ VERSION, PINS, hashJSON, freezeStudy, inspectStudy, replayStudy });
