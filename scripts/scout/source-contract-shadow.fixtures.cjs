'use strict';

// Independently invented research contracts, not provider payloads or game data.
const { createHash } = require('node:crypto');
const { canonicalJSON } = require('./opportunity-shadow.cjs');
const VERSION = 'atlas.scout.source-contract-shadow.v1';
const PINS = {
  espn: '3796c6a7c0b0c496c1f62408b0792e23254cd930',
  sports_skills: '09eb7e8566f48c01d1ea7bf7b4ac62a477d37b19',
  nba: '8e36b0b72ecc5082aa8976dff742cdf910b3aa36'
};
const copy = value => JSON.parse(JSON.stringify(value));
const hash = value => createHash('sha256').update(canonicalJSON(value)).digest('hex');
function deepFreeze(value) {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
function sealBody(study) {
  for (const record of study.records) record.body_sha256 = hash(record.http.body);
  return study;
}
const common = {
  record_id: 'synthetic-record-1', report_group: 'synthetic-report-1',
  source: {
    family: 'ESPN', repository: 'public-espn-api', commit: PINS.espn,
    origin: 'fixture://synthetic/source-1',
    rights: { scope: 'SYNTHETIC_ONLY', evidence_id: 'synthetic-rights-1' },
    revision: 'synthetic-rev-1'
  },
  context: { sport: 'basketball', league: 'synthetic-NBA', season: 'synthetic-2026', period: 'synthetic-regular' },
  identity: {
    event_id: 'synthetic-target', team_ids: ['synthetic-home', 'synthetic-away'],
    player_ids: ['synthetic-player-1'],
    player_teams: [{ player_id: 'synthetic-player-1', team_id: 'synthetic-home' }],
    crosswalk: {
      evidence_id: 'synthetic-crosswalk-1',
      mappings: [
        { source_id: 'synthetic-source-home', atlas_id: 'synthetic-home' },
        { source_id: 'synthetic-source-away', atlas_id: 'synthetic-away' },
        { source_id: 'synthetic-source-player-1', atlas_id: 'synthetic-player-1' }
      ]
    }
  },
  time: {
    observed_at: '2026-10-12T10:00:00Z', published_at: '2026-10-12T10:00:00Z',
    available_at: '2026-10-12T10:00:00Z', captured_at: '2026-10-12T10:00:00Z', precision: 'second'
  },
  http: { status: 200, api_family: 'site', body: {} },
  body_sha256: '',
  features: [{ name: 'workload', definition: 'workload-count-v1', unit: 'opportunities', kind: 'independent', value: 10, quote_captured_at: null }],
  espn: null, nba: null
};
function study(record, study_id) {
  return sealBody({
    schema_version: VERSION, synthetic: true, research_only: true, study_id,
    phase: 'PHASE1_PRICE_INDEPENDENT', frozen_at: '2026-10-13T12:00:00Z',
    forecast_cutoff: '2026-10-13T12:00:00Z', policy: { max_age_minutes: 4320 },
    records: [record], folds: []
  });
}
const espnRecord = copy(common);
espnRecord.espn = { scope: 'schedule', expected_event_ids: ['synthetic-target'], snapshot_at: '2026-10-12T10:00:00Z', complete: true };
espnRecord.http.body = { events: [{
  event_id: 'synthetic-target', team_ids: ['synthetic-home', 'synthetic-away'],
  start_at: '2026-10-13T15:00:00Z', league: 'synthetic-NBA',
  season: 'synthetic-2026', period: 'synthetic-regular'
}] };
const nbaRecord = copy(common);
Object.assign(nbaRecord.source, { family: 'NBA', repository: 'nba-machine-learning-sports-betting', commit: PINS.nba });
nbaRecord.http.api_family = 'nba-team';
nbaRecord.http.body = { league: 'synthetic-NBA', season: 'synthetic-2026', period: 'synthetic-regular', team_rows: [
  { source_team_id: 'synthetic-source-home', team_id: 'synthetic-home' },
  { source_team_id: 'synthetic-source-away', team_id: 'synthetic-away' }
] };
nbaRecord.nba = {
  target: { event_id: 'synthetic-target', start_at: '2026-10-13T15:00:00Z', team_ids: ['synthetic-home', 'synthetic-away'] },
  contributors: [{
    event_id: 'synthetic-prior', start_at: '2026-10-11T14:00:00Z', end_at: '2026-10-11T16:00:00Z',
    team_ids: ['synthetic-home', 'synthetic-away']
  }],
  table_vintage_at: '2026-10-12T10:00:00Z', archived_pre_cutoff: true, aggregation: 'rolling'
};
const templates = deepFreeze({ espn: study(espnRecord, 'ESPN-SH-01'), nba: study(nbaRecord, 'NBA-LK-01') });
function baseESPN() { return copy(templates.espn); }
function baseNBA() { return copy(templates.nba); }
function injuries() {
  const s = baseESPN();
  s.records[0].espn.scope = 'injuries';
  s.records[0].espn.expected_event_ids = [];
  s.records[0].http.body = { injuries: [{
    player_id: 'synthetic-player-1', team_id: 'synthetic-home', status: 'questionable',
    reported_at: '2026-10-12T10:00:00Z'
  }] };
  return sealBody(s);
}
function example(name, build, mutate, eligible = false) {
  return { name, eligible, build() { const s = build(); mutate(s, s.records[0]); return sealBody(s); } };
}
const cases = [
  example('ESPN valid synthetic schedule', baseESPN, () => {}, true),
  example('ESPN valid synthetic injury report', injuries, () => {}, true),
  example('NBA valid archived synthetic prior-game window', baseNBA, () => {}, true),
  example('HTTP 200 empty is unknown', baseESPN, (_, r) => { r.http.body = {}; }),
  example('injury HTTP 200 empty is unknown', injuries, (_, r) => { r.http.body = {}; }),
  example('missing publication time', baseESPN, (_, r) => { r.time.published_at = null; }),
  example('missing availability time', baseESPN, (_, r) => { r.time.available_at = null; }),
  example('missing capture time', baseESPN, (_, r) => { r.time.captured_at = null; }),
  example('restricted rights', baseESPN, (_, r) => { r.source.rights.scope = 'RESTRICTED'; }),
  example('unknown rights evidence', baseESPN, (_, r) => { r.source.rights.evidence_id = null; }),
  example('wrong fork revision', baseESPN, (_, r) => { r.source.commit = '0'.repeat(40); }),
  example('unknown crosswalk', baseESPN, (_, r) => { r.identity.crosswalk.evidence_id = null; }),
  example('incomplete schedule', baseESPN, (_, r) => { r.espn.complete = false; }),
  example('expected event omitted', baseESPN, (_, r) => { r.espn.expected_event_ids.push('synthetic-other-game'); }),
  example('malformed daily schedule cannot partly succeed', baseESPN, (_, r) => { r.http.body.events.push({ event_id: 'synthetic-other-game' }); }),
  example('API family drift', baseESPN, (_, r) => { r.http.api_family = 'core'; }),
  example('schema drift', baseESPN, (_, r) => { r.http.body.unreviewed = []; }),
  example('range HTTP 400', baseESPN, (_, r) => { r.http.status = 400; }),
  example('terminal HTTP 404', baseESPN, (_, r) => { r.http.status = 404; }),
  example('stale evidence', baseESPN, (_, r) => {
    for (const k of ['observed_at', 'published_at', 'available_at', 'captured_at']) r.time[k] = '2026-10-01T10:00:00Z';
    r.espn.snapshot_at = '2026-10-01T10:00:00Z';
  }),
  example('invalid injury status', injuries, (_, r) => { r.http.body.injuries[0].status = 'guaranteed-healthy'; }),
  example('ambiguous injury player', injuries, (_, r) => { r.http.body.injuries[0].player_id = 'unresolved-player'; }),
  example('NBA target game contamination', baseNBA, (_, r) => { r.nba.contributors[0].event_id = r.identity.event_id; }),
  example('NBA later same-day contributor', baseNBA, (_, r) => {
    r.nba.contributors[0].start_at = '2026-10-13T14:00:00Z'; r.nba.contributors[0].end_at = '2026-10-13T16:00:00Z';
  }),
  example('NBA unknown table vintage', baseNBA, (_, r) => { r.nba.table_vintage_at = null; }),
  example('NBA unarchived historical correction', baseNBA, (_, r) => { r.nba.archived_pre_cutoff = false; r.source.revision = 'synthetic-rev-2'; }),
  example('NBA prior day without publication proof', baseNBA, (_, r) => { r.time.published_at = null; }),
  example('NBA positional team reorder', baseNBA, (_, r) => { r.http.body.team_rows.reverse(); }),
  example('NBA table IDs disagree with crosswalk', baseNBA, (_, r) => { r.http.body.team_rows[0].team_id = 'synthetic-away'; }),
  example('NBA target identity mismatch', baseNBA, (_, r) => { r.nba.target.event_id = 'synthetic-other-target'; }),
  example('NBA season context mismatch', baseNBA, (_, r) => { r.context.season = 'synthetic-other-season'; }),
  example('NBA league context mismatch', baseNBA, (_, r) => { r.context.league = 'synthetic-other-league'; }),
  example('NBA ambiguous day-level chronology', baseNBA, (_, r) => { r.time.precision = 'day'; }),
  example('NBA missing contributor end', baseNBA, (_, r) => { r.nba.contributors[0].end_at = null; }),
  example('NBA unshifted rolling aggregate', baseNBA, (_, r) => { r.nba.contributors.push({ ...copy(r.nba.target), end_at: '2026-10-13T17:00:00Z' }); }),
  example('Phase 1 OU contamination', baseNBA, (_, r) => { r.features[0].name = 'OU'; r.features[0].kind = 'market'; }),
  example('Phase 1 predictor contamination', baseESPN, (_, r) => { r.features[0].name = 'espn_predictor'; r.features[0].kind = 'external-predictor'; }),
  example('unknown workload is not zero', baseESPN, (_, r) => { r.features[0].value = null; })
];
deepFreeze(cases);
module.exports = { VERSION, PINS: deepFreeze(PINS), templates, baseESPN, baseNBA, injuries, sealBody, cases };
