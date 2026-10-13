'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const fixtures = require('./source-contract-shadow.fixtures.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
const api = () => require('./source-contract-shadow.cjs');
const inspect = value => api().inspectStudy(api().freezeStudy(value));
const denied = result => {
  assert.equal(result.denominators.total, 1);
  assert.equal(result.denominators.eligible, 0);
  assert.equal(result.denominators.rejected, 1);
  assert.equal(result.records[0].eligible, false);
  assert.ok(result.records[0].reasons.length > 0);
};
const edit = (build, change) => { const s = build(); change(s, s.records[0]); return fixtures.sealBody(s); };
const assertFrozen = value => {
  if (value && typeof value === 'object') {
    assert.ok(Object.isFrozen(value));
    for (const child of Object.values(value)) assertFrozen(child);
  }
};

test('public API preserves SHADOW authority and the reviewed source pins', () => {
  assert.equal(api().VERSION, fixtures.VERSION);
  assert.deepEqual(api().PINS, fixtures.PINS);
  for (const name of ['freezeStudy', 'inspectStudy', 'replayStudy', 'hashJSON']) assert.equal(typeof api()[name], 'function');
  for (const build of [fixtures.baseESPN, fixtures.baseNBA]) {
    const result = inspect(build());
    assert.equal(result.label, 'SYNTHETIC SHADOW');
    assert.equal(result.execution_authority, false);
    assert.equal(result.human_final_gate_required, true);
    assert.equal(result.predictive_value, 'NOT_ESTABLISHED');
    assert.equal(result.source_rights, 'REAL_SOURCE_BLOCKED');
    assert.equal(result.promotion, 'HOLD_INTEGRATION');
    assert.equal(result.phase, 'PHASE1_PRICE_INDEPENDENT');
  }
});

for (const fixture of fixtures.cases) {
  test('source case: ' + fixture.name, () => {
    const input = fixture.build();
    const before = JSON.stringify(input);
    const result = inspect(input);
    assert.equal(result.records[0].eligible, fixture.eligible);
    assert.equal(result.denominators.total, 1);
    assert.equal(result.denominators.eligible, fixture.eligible ? 1 : 0);
    assert.equal(result.denominators.rejected, fixture.eligible ? 0 : 1);
    if (!fixture.eligible) assert.ok(result.records[0].reasons.length > 0);
    if (fixture.name === 'NBA unshifted rolling aggregate') assert.ok(result.records[0].reasons.includes('TARGET_GAME_CONTAMINATION'));
    assert.equal(JSON.stringify(input), before, 'inspection must not mutate source input');
  });
}

test('independent fixture definitions are immutable and builds are fresh copies', () => {
  assertFrozen(fixtures.templates);
  assertFrozen(fixtures.cases);
  const first = fixtures.baseESPN();
  first.records[0].features[0].value = 999;
  assert.equal(fixtures.baseESPN().records[0].features[0].value, 10);
  assert.notStrictEqual(first.records[0], fixtures.baseESPN().records[0]);
});

test('hashing has an independent known-answer control and object order is canonical', () => {
  assert.equal(api().hashJSON({ b: 2, a: 1 }), createHash('sha256').update('{"a":1,"b":2}').digest('hex'));
  assert.equal(api().hashJSON({ b: 2, a: 1 }), api().hashJSON({ a: 1, b: 2 }));
  assert.notEqual(api().hashJSON([1, 2]), api().hashJSON([2, 1]));
});

test('sealed receipts and inspection reports are recursively immutable', () => {
  const original = fixtures.baseESPN();
  const receipt = api().freezeStudy(original);
  assertFrozen(receipt);
  original.records[0].features[0].value = 999;
  assert.equal(receipt.input.records[0].features[0].value, 10);
  assert.throws(() => { receipt.input.records[0].features[0].value = 33; }, TypeError);
  assertFrozen(api().inspectStudy(receipt));
});

test('metadata and body changes alter the bound receipt, not merely the body digest', () => {
  const original = fixtures.baseESPN();
  const a = api().freezeStudy(original);
  const metadata = copy(original);
  metadata.records[0].source.revision = 'synthetic-rev-2';
  const b = api().freezeStudy(metadata);
  assert.notEqual(a.sha256, b.sha256);
  assert.equal(a.input.records[0].body_sha256, b.input.records[0].body_sha256);
  const body = copy(original);
  body.records[0].http.body.events[0].start_at = '2026-10-13T16:00:00Z';
  fixtures.sealBody(body);
  const c = api().freezeStudy(body);
  assert.notEqual(a.sha256, c.sha256);
  assert.notEqual(a.input.records[0].body_sha256, c.input.records[0].body_sha256);
});

test('a tampered metadata or body receipt is rejected, including on replay', () => {
  const good = api().freezeStudy(fixtures.baseESPN());
  for (const change of [
    r => { r.input.records[0].source.revision = 'synthetic-rev-forged'; },
    r => { r.input.records[0].http.body.events[0].start_at = '2026-10-13T17:00:00Z'; },
    r => { r.sha256 = '0'.repeat(64); }
  ]) {
    const bad = copy(good); change(bad);
    assert.throws(() => api().inspectStudy(bad), /RECEIPT_INTEGRITY/);
    assert.throws(() => api().replayStudy([bad], bad.sha256), /RECEIPT_INTEGRITY/);
  }
});

test('wrong raw snapshot digest cannot be repaired by freezing metadata', () => {
  const input = fixtures.baseESPN(); input.records[0].body_sha256 = '0'.repeat(64);
  denied(inspect(input));
});

test('exact offline replay succeeds and a missing key has no fallback', () => {
  const a = api().freezeStudy(fixtures.baseESPN());
  const b = api().freezeStudy(fixtures.baseNBA());
  assert.deepEqual(api().replayStudy([a, b], a.sha256), api().inspectStudy(a));
  assert.throws(() => api().replayStudy([a, b], 'f'.repeat(64)), /REPLAY_MISS/);
  assert.throws(() => api().replayStudy([], a.sha256), /REPLAY_MISS/);
});

test('malformed keys and corrupt duplicate replay entries cannot choose a convenient candidate', () => {
  const receipt = api().freezeStudy(fixtures.baseESPN());
  assert.throws(() => api().replayStudy([receipt], 'https://credential.invalid/secret'), /CONTRACT_INVALID/);
  assert.deepEqual(api().replayStudy([receipt, copy(receipt)], receipt.sha256), api().inspectStudy(receipt));
  const corrupt = copy(receipt); corrupt.input.records[0].source.revision = 'synthetic-forged-revision';
  assert.throws(() => api().replayStudy([receipt, corrupt], receipt.sha256), /RECEIPT_INTEGRITY/);
});

test('regression: replay refuses receipt getters before invoking producer code', () => {
  const receipt = api().freezeStudy(fixtures.baseESPN());
  let calls = 0;
  const poison = { get sha256() { calls++; return receipt.sha256; }, input: receipt.input };
  assert.throws(() => api().replayStudy([poison], receipt.sha256), /CONTRACT_INVALID|RECEIPT_INTEGRITY/);
  assert.equal(calls, 0);
});

test('freezing refuses getters custom prototypes and hidden executable fields without reading them', () => {
  let calls = 0;
  const s = fixtures.baseESPN();
  Object.defineProperty(s.records[0].features[0], 'value', { enumerable: true, get() { calls++; return 10; } });
  assert.throws(() => api().freezeStudy(s), /CONTRACT_INVALID/);
  assert.equal(calls, 0);
  const custom = fixtures.baseESPN(); Object.setPrototypeOf(custom, { synthetic: true });
  assert.throws(() => api().freezeStudy(custom), /CONTRACT_INVALID/);
  const hidden = fixtures.baseESPN(); Object.defineProperty(hidden.records, '0', { enumerable: true, get() { calls++; return fixtures.baseESPN().records[0]; } });
  assert.throws(() => api().freezeStudy(hidden), /CONTRACT_INVALID/);
  assert.equal(calls, 0);
  let iteratorCalls = 0, proxyCalls = 0;
  const inherited = fixtures.baseESPN();
  const arrayPrototype = Object.create(Array.prototype);
  arrayPrototype[Symbol.iterator] = function* () { iteratorCalls++; yield* Array.prototype.values.call(this); };
  Object.setPrototypeOf(inherited.records, arrayPrototype);
  const proxied = new Proxy(fixtures.baseESPN(), {
    getPrototypeOf(target) { proxyCalls++; return Reflect.getPrototypeOf(target); },
    ownKeys(target) { proxyCalls++; return Reflect.ownKeys(target); }
  });
  let iteratorError, proxyError;
  try { api().freezeStudy(inherited); } catch (error) { iteratorError = error; }
  try { api().freezeStudy(proxied); } catch (error) { proxyError = error; }
  assert.equal(iteratorError?.message, 'CONTRACT_INVALID');
  assert.equal(proxyError?.message, 'CONTRACT_INVALID');
  assert.equal(iteratorCalls, 0, 'custom array iterators must not run during receipt creation');
  assert.equal(proxyCalls, 0, 'native proxy refusal must precede reflective producer traps');
});

for (const key of ['observed_at', 'published_at', 'available_at', 'captured_at']) {
  test('missing ' + key + ' never becomes a zero-age observation', () => {
    denied(inspect(edit(fixtures.baseNBA, (_, r) => { r.time[key] = null; })));
  });
}

for (const stamp of ['2026-02-30T10:00:00Z', '2026-10-12T24:00:00Z', '2026-10-12T10:00:00', '2026-10-12', '2026-10-12T10:00:00+00:00']) {
  test('unsupported or invalid timestamp is not normalized: ' + stamp, () => {
    denied(inspect(edit(fixtures.baseNBA, (_, r) => { r.time.published_at = stamp; })));
  });
}

test('exact cutoff is accepted but one later second remains ineligible', () => {
  const s = edit(fixtures.baseESPN, (s, r) => {
    for (const key of ['observed_at', 'published_at', 'available_at', 'captured_at']) r.time[key] = s.forecast_cutoff;
    r.espn.snapshot_at = s.forecast_cutoff;
  });
  assert.equal(inspect(s).records[0].eligible, true);
  s.records[0].time.captured_at = '2026-10-13T12:00:01Z';
  denied(inspect(s));
});

test('publication then availability then capture must be ordered', () => {
  denied(inspect(edit(fixtures.baseNBA, (_, r) => { r.time.available_at = '2026-10-12T09:59:59Z'; })));
  denied(inspect(edit(fixtures.baseNBA, (_, r) => { r.time.captured_at = '2026-10-12T09:59:59Z'; })));
  denied(inspect(edit(fixtures.baseNBA, (_, r) => { r.time.observed_at = '2026-10-12T10:00:01Z'; })));
});

test('evidence after the freeze cannot be rescued by a later forecast cutoff', () => {
  const s = edit(fixtures.baseESPN, (s, r) => {
    s.frozen_at = '2026-10-13T11:00:00Z';
    r.time.captured_at = '2026-10-13T11:30:00Z';
  });
  denied(inspect(s));
});

test('empty reported injuries preserve uncertainty instead of asserting all healthy', () => {
  const s = edit(fixtures.injuries, (_, r) => { r.http.body.injuries = []; });
  const result = inspect(s);
  assert.equal(result.records[0].eligible, true);
  assert.ok(result.records[0].warnings.includes('INJURY_COVERAGE_UNKNOWN'));
  assert.ok(!JSON.stringify(result).includes('healthy'));
});

test('injury report times cannot cross the cutoff or be unknown', () => {
  for (const stamp of [null, '2026-10-13T12:00:01Z']) {
    denied(inspect(edit(fixtures.injuries, (_, r) => { r.http.body.injuries[0].reported_at = stamp; })));
  }
});

test('NCAA-like truncation is rejected against an exact synthetic expected slate', () => {
  const s = edit(fixtures.baseESPN, (_, r) => {
    r.context.league = 'synthetic-NCAA'; r.http.body.events[0].league = 'synthetic-NCAA';
    r.espn.expected_event_ids = [r.identity.event_id, ...Array.from({ length: 35 }, (_, i) => 'synthetic-slate-event-' + i)];
    const event = r.http.body.events[0];
    r.http.body.events = r.espn.expected_event_ids.slice(0, 12).map(event_id => ({ ...copy(event), event_id }));
  });
  const truncated = inspect(s);
  denied(truncated);
  assert.deepEqual(truncated.records[0].reasons, ['SCHEDULE_INCOMPLETE']);
  const record = s.records[0];
  const event = record.http.body.events[0];
  record.http.body.events = record.espn.expected_event_ids.map(event_id => ({ ...copy(event), event_id }));
  fixtures.sealBody(s);
  assert.equal(inspect(s).records[0].eligible, true, 'exact 36-event control proves truncation is the rejection cause');
});

test('contradictory duplicate schedule event IDs are rejected rather than overwritten', () => {
  denied(inspect(edit(fixtures.baseESPN, (_, r) => {
    const event = copy(r.http.body.events[0]); event.start_at = '2026-10-13T16:00:00Z';
    r.http.body.events.push(event);
  })));
});

test('unexpected extra schedule events cannot masquerade as the exact frozen slate', () => {
  denied(inspect(edit(fixtures.baseESPN, (_, r) => {
    const event = copy(r.http.body.events[0]); event.event_id = 'synthetic-unexpected'; r.http.body.events.push(event);
  })));
});

test('event context mismatches cannot silently map leagues seasons or periods', () => {
  for (const key of ['league', 'season', 'period']) {
    denied(inspect(edit(fixtures.baseESPN, (_, r) => { r.http.body.events[0][key] = 'synthetic-other'; })));
  }
});

test('source labels cannot manufacture the missing rights of real provider data', () => {
  const s = edit(fixtures.baseESPN, (_, r) => {
    r.source.origin = 'https://provider.invalid/reported-open-api';
    r.source.rights = { scope: 'SYNTHETIC_ONLY', evidence_id: 'synthetic-self-declared-grant' };
  });
  denied(inspect(s));
  s.synthetic = false;
  assert.throws(() => api().freezeStudy(s), /CONTRACT_INVALID/);
});

test('API family and repository pin must agree with the study and source family', () => {
  denied(inspect(edit(fixtures.baseESPN, (_, r) => { r.source.family = 'NBA'; })));
  denied(inspect(edit(fixtures.baseNBA, (_, r) => { r.source.repository = 'sports-skills'; r.source.commit = fixtures.PINS.sports_skills; })));
});

test('duplicate exact source IDs and unresolved player mappings are ineligible', () => {
  denied(inspect(edit(fixtures.baseESPN, (_, r) => {
    r.identity.crosswalk.mappings[1].source_id = r.identity.crosswalk.mappings[0].source_id;
  })));
  denied(inspect(edit(fixtures.baseESPN, (_, r) => { r.identity.crosswalk.mappings.pop(); })));
  denied(inspect(edit(fixtures.baseESPN, (_, r) => { r.identity.crosswalk.mappings[2].atlas_id = 'synthetic-wrong-player'; })));
});

test('player affiliation requires one exact declared team for each declared player', () => {
  denied(inspect(edit(fixtures.baseESPN, (_, r) => { r.identity.player_teams = []; })));
  denied(inspect(edit(fixtures.baseESPN, (_, r) => { r.identity.player_teams.push(copy(r.identity.player_teams[0])); })));
  denied(inspect(edit(fixtures.baseESPN, (_, r) => { r.identity.player_teams[0].team_id = 'synthetic-unknown-team'; })));
});

test('an injury cannot silently transfer a player to the opposite target team', () => {
  denied(inspect(edit(fixtures.injuries, (_, r) => { r.http.body.injuries[0].team_id = 'synthetic-away'; })));
});

test('source conflicts include contradictory identities and contexts, not only changed bodies', () => {
  const s = fixtures.baseESPN();
  const conflicting = copy(s.records[0]); conflicting.record_id = 'synthetic-record-2';
  conflicting.context.season = 'synthetic-other-season'; s.records.push(conflicting);
  const result = inspect(s);
  assert.deepEqual(result.denominators, { total: 2, eligible: 0, rejected: 2 });
  for (const record of result.records) assert.ok(record.reasons.includes('SOURCE_CONFLICT'));
});

test('fuzzy names and team abbreviations are not authoritative identities', () => {
  denied(inspect(edit(fixtures.baseNBA, (_, r) => { r.identity.team_ids[0] = 'HOME'; })));
  denied(inspect(edit(fixtures.baseESPN, (_, r) => { r.identity.event_id = null; })));
  denied(inspect(edit(fixtures.baseNBA, (_, r) => { r.identity.team_ids = ['synthetic-home', 'synthetic-home']; })));
});

test('same-family ESPN wrappers count once and record ordering cannot inflate evidence', () => {
  const s = fixtures.baseESPN();
  const duplicate = copy(s.records[0]);
  duplicate.record_id = 'synthetic-record-2'; duplicate.source.repository = 'sports-skills';
  duplicate.source.commit = fixtures.PINS.sports_skills; duplicate.source.origin = 'fixture://synthetic/wrapper-2';
  s.records.push(duplicate);
  const receipt = api().freezeStudy(s);
  const result = api().inspectStudy(receipt);
  assert.deepEqual(result.denominators, { total: 2, eligible: 1, rejected: 1 });
  assert.ok(result.records.find(r => r.record_id === 'synthetic-record-2').reasons.includes('SOURCE_DUPLICATE'));
  s.records.reverse();
  assert.equal(api().freezeStudy(s).sha256, receipt.sha256);
  assert.deepEqual(inspect(s), result);
});

test('conflicting source-family snapshots quarantine every member and retain denominators', () => {
  const s = fixtures.baseESPN();
  const conflict = copy(s.records[0]); conflict.record_id = 'synthetic-record-2';
  conflict.http.body.events[0].start_at = '2026-10-13T16:00:00Z'; s.records.push(conflict);
  fixtures.sealBody(s);
  const result = inspect(s);
  assert.deepEqual(result.denominators, { total: 2, eligible: 0, rejected: 2 });
  for (const r of result.records) assert.ok(r.reasons.includes('SOURCE_CONFLICT'));
});

test('a valid same-date NBA snapshot with proven earlier games is not automatically leakage', () => {
  const s = edit(fixtures.baseNBA, (_, r) => {
    r.nba.contributors[0].start_at = '2026-10-13T07:00:00Z';
    r.nba.contributors[0].end_at = '2026-10-13T09:00:00Z';
    r.nba.table_vintage_at = '2026-10-13T10:00:00Z';
    for (const key of ['observed_at', 'published_at', 'available_at', 'captured_at']) r.time[key] = '2026-10-13T10:00:00Z';
  });
  const result = inspect(s);
  assert.equal(result.records[0].eligible, true);
  assert.equal(result.predictive_value, 'NOT_ESTABLISHED');
});

test('a later same-day game cannot contribute to an earlier archived snapshot', () => {
  denied(inspect(edit(fixtures.baseNBA, (_, r) => {
    r.nba.contributors[0].start_at = '2026-10-12T11:00:00Z';
    r.nba.contributors[0].end_at = '2026-10-12T13:00:00Z';
  })));
});

test('regression: ESPN target game must start after the forecast cutoff even with an earlier freeze', () => {
  denied(inspect(edit(fixtures.baseESPN, (s, r) => {
    s.frozen_at = '2026-10-13T11:00:00Z';
    r.http.body.events[0].start_at = '2026-10-13T11:30:00Z';
  })));
});

test('regression: NBA contributor cannot finish after the declared source table vintage', () => {
  denied(inspect(edit(fixtures.baseNBA, (_, r) => { r.nba.table_vintage_at = '2026-10-10T10:00:00Z'; })));
});

test('regression: changing wrapper report labels cannot make the same ESPN snapshot independent', () => {
  const s = fixtures.baseESPN();
  const duplicate = copy(s.records[0]);
  duplicate.record_id = 'synthetic-record-2'; duplicate.report_group = 'synthetic-wrapper-label-2';
  duplicate.source.repository = 'sports-skills'; duplicate.source.commit = fixtures.PINS.sports_skills;
  duplicate.source.origin = 'fixture://synthetic/wrapper-2'; s.records.push(duplicate);
  assert.deepEqual(inspect(s).denominators, { total: 2, eligible: 1, rejected: 1 });
});

test('regression: feature names must be primitive strings rather than coerced arrays', () => {
  denied(inspect(edit(fixtures.baseESPN, (_, r) => { r.features[0].name = ['workload']; })));
});

test('regression: repository names must be primitive strings rather than coerced arrays', () => {
  denied(inspect(edit(fixtures.baseESPN, (_, r) => { r.source.repository = ['public-espn-api']; })));
});

test('regression: fold split labels must be primitive strings rather than coerced arrays', () => {
  const s = fixtures.baseNBA(); s.folds = [fold(['train'], 'synthetic-train', '05')];
  const result = inspect(s);
  assert.ok(result.fold_reasons.length > 0);
  assert.equal(result.records[0].eligible, false);
});

test('regression: NBA contributors must already exist when the source snapshot is observed', () => {
  denied(inspect(edit(fixtures.baseNBA, (_, r) => { r.time.observed_at = '2026-10-11T15:00:00Z'; })));
});

test('regression: unknown source time bounds never become numeric zero and fabricated temporal violations', () => {
  for (const [change, reason] of [
    [r => { r.nba.table_vintage_at = null; }, 'TABLE_VINTAGE_UNKNOWN'],
    [r => { r.nba.target.start_at = null; }, 'TIMESTAMP_INVALID']
  ]) {
    const result = inspect(edit(fixtures.baseNBA, (_, r) => change(r)));
    denied(result);
    assert.ok(result.records[0].reasons.includes(reason));
    assert.ok(!result.records[0].reasons.includes('LATE_CONTRIBUTOR'), 'unknown bounds remain unknown rather than becoming zero-time');
  }
  const injury = inspect(edit(fixtures.injuries, (_, r) => { r.espn.snapshot_at = null; }));
  denied(injury);
  assert.ok(injury.records[0].reasons.includes('TIMESTAMP_UNKNOWN'));
  assert.ok(!injury.records[0].reasons.includes('POST_CUTOFF'), 'an unknown injury snapshot cannot establish a post-cutoff claim');
});

test('NBA table vintage cannot follow its archive capture or come from after the cutoff', () => {
  for (const stamp of ['2026-10-12T11:00:00Z', '2026-10-13T13:00:00Z']) {
    denied(inspect(edit(fixtures.baseNBA, (_, r) => { r.nba.table_vintage_at = stamp; })));
  }
});

test('missing contributor IDs timestamps and ambiguous date precision are not repaired', () => {
  denied(inspect(edit(fixtures.baseNBA, (_, r) => { r.nba.contributors[0].event_id = null; })));
  denied(inspect(edit(fixtures.baseNBA, (_, r) => { r.nba.contributors[0].start_at = '2026-10-11'; })));
  denied(inspect(edit(fixtures.baseNBA, (_, r) => { r.nba.contributors = []; })));
});

test('unknown NBA aggregation cannot claim a shifted independent feature window', () => {
  denied(inspect(edit(fixtures.baseNBA, (_, r) => { r.nba.aggregation = 'unshifted-season-total'; })));
});

test('market disguised as an independent alias or body field still cannot enter Phase 1', () => {
  denied(inspect(edit(fixtures.baseNBA, (_, r) => { r.features[0].name = 'OU'; r.features[0].kind = 'independent'; })));
  denied(inspect(edit(fixtures.baseNBA, (_, r) => { r.features[0].name = 'bookmaker_odds'; })));
  denied(inspect(edit(fixtures.baseNBA, (_, r) => { r.http.body.OU = 220; })));
  denied(inspect(edit(fixtures.baseESPN, (_, r) => { r.http.body.predictor = { home_win_probability: 0.7 }; })));
});

test('a missing quote timestamp stays unknown even when market scope is declared', () => {
  const result = inspect(edit(fixtures.baseNBA, (_, r) => {
    r.features[0].name = 'OU'; r.features[0].kind = 'market'; r.features[0].quote_captured_at = null;
  }));
  denied(result);
  assert.ok(result.records[0].reasons.includes('QUOTE_CAPTURE_UNKNOWN'));
  assert.ok(result.records[0].reasons.includes('PHASE1_MARKET_FEATURE'));
});

test('feature units definitions and finite positive magnitudes are enforced', () => {
  denied(inspect(edit(fixtures.baseNBA, (_, r) => { r.features[0].unit = 'seconds'; })));
  denied(inspect(edit(fixtures.baseNBA, (_, r) => { r.features[0].definition = 'unknown-workload-v2'; })));
  denied(inspect(edit(fixtures.baseNBA, (_, r) => { r.features[0].value = -1; })));
  const s = fixtures.baseNBA(); s.records[0].features[0].value = Infinity;
  assert.throws(() => api().freezeStudy(s), /CONTRACT_INVALID/);
});

const fold = (split, game_id, day) => ({ split, game_id, start_at: '2026-10-' + day + 'T14:00:00Z', end_at: '2026-10-' + day + 'T16:00:00Z', precision: 'second' });
test('synthetic whole-game chronological train calibration and test partitions are admissible', () => {
  const s = fixtures.baseNBA();
  s.folds = [fold('train', 'synthetic-train', '05'), fold('calibration', 'synthetic-calibration', '07'), fold('test', 'synthetic-test', '09')];
  const result = inspect(s);
  assert.deepEqual(result.fold_reasons, []);
  assert.equal(result.records[0].eligible, true);
  assert.equal(result.predictive_value, 'NOT_ESTABLISHED');
});

test('whole game overlap cannot be disguised by different partition row ordering', () => {
  const s = fixtures.baseNBA();
  s.folds = [fold('train', 'synthetic-same-game', '05'), fold('test', 'synthetic-same-game', '09')];
  const result = inspect(s);
  assert.ok(result.fold_reasons.includes('FOLD_GAME_OVERLAP'));
  assert.equal(result.records[0].eligible, false);
  const reversed = copy(s); reversed.folds.reverse();
  assert.deepEqual(inspect(reversed), result);
});

test('reversed chronological partitions and same-day boundaries fail closed', () => {
  for (const folds of [
    [fold('train', 'synthetic-train', '09'), fold('test', 'synthetic-test', '05')],
    [fold('train', 'synthetic-train', '05'), fold('test', 'synthetic-test', '05')]
  ]) {
    const s = fixtures.baseNBA(); s.folds = folds;
    const result = inspect(s);
    assert.ok(result.fold_reasons.length > 0);
    assert.equal(result.denominators.eligible, 0);
  }
});

test('missing fold dates and ambiguous day-only partitions cannot imply chronology', () => {
  for (const change of [f => { f.end_at = null; }, f => { f.precision = 'day'; }, f => { f.start_at = '2026-02-30T14:00:00Z'; }]) {
    const s = fixtures.baseNBA(); s.folds = [fold('train', 'synthetic-train', '05')]; change(s.folds[0]);
    const result = inspect(s);
    assert.ok(result.fold_reasons.length > 0);
    assert.equal(result.records[0].eligible, false);
  }
});

test('valid and rejected rows both remain in the fixed receipt denominator', () => {
  const s = fixtures.baseNBA();
  const bad = copy(s.records[0]); bad.record_id = 'synthetic-record-2'; bad.report_group = 'synthetic-report-2';
  bad.time.captured_at = null; s.records.push(bad);
  assert.deepEqual(inspect(s).denominators, { total: 2, eligible: 1, rejected: 1 });
});

test('malformed JSON-safe source members retain denominator and cannot break conflict inspection', () => {
  const s = fixtures.baseESPN();
  const missing = copy(s.records[0]); missing.record_id = 'synthetic-record-2'; delete missing.features;
  s.records.push(missing);
  const result = inspect(s);
  assert.equal(result.denominators.total, 2);
  assert.equal(result.denominators.eligible, 0);
  assert.equal(result.denominators.rejected, 2);
});

test('an empty replay study is an empty denominator rather than invented observations', () => {
  const s = fixtures.baseESPN(); s.records = [];
  assert.deepEqual(inspect(s).denominators, { total: 0, eligible: 0, rejected: 0 });
});

test('study flags scope unknown root fields and nonJSON values are rejected opaquely', () => {
  for (const change of [
    s => { s.research_only = false; }, s => { s.synthetic = false; },
    s => { s.phase = 'MARKET_INFORMED'; }, s => { s.fetch_fallback = true; },
    s => { s.frozen_at = '2026-10-13T13:00:00Z'; }, s => { s.policy.max_age_minutes = -1; },
    s => { s.policy.max_age_minutes = Infinity; }, s => { s.records = Array(1); },
    s => { s.records[0].features[0].value = undefined; }
  ]) {
    const s = fixtures.baseESPN(); change(s);
    assert.throws(() => api().freezeStudy(s), error => error.message === 'CONTRACT_INVALID');
  }
});

test('raw provider errors and hostile producer identifiers do not leak into reports', () => {
  const secret = 'PRIVATE-EXAMPLE-NOT-A-CREDENTIAL';
  const s = fixtures.baseESPN();
  s.records[0].record_id = 'synthetic-https://invalid/?token=' + secret;
  s.records[0].http.status = 500;
  s.records[0].http.body = { error: secret, url: 'https://invalid/?token=' + secret };
  fixtures.sealBody(s);
  const report = JSON.stringify(inspect(s));
  assert.ok(!report.includes(secret));
  assert.ok(!report.includes('https://'));
  assert.ok(!report.includes('token='));
  const invalid = fixtures.baseESPN(); invalid.secret = secret;
  assert.throws(() => api().freezeStudy(invalid), error => error.message === 'CONTRACT_INVALID');
});

test('fresh imports all source cases and replay misses perform zero network or subprocess attempts', () => {
  const script = String.raw`
    const assert = require('node:assert/strict');
    const Module = require('node:module');
    const stdout = process.stdout; // Initialize the existing report pipe before denying sockets.
    const forbidden = ['http','https','http2','net','tls','dgram','dns','dns/promises','child_process'];
    const loaded = forbidden.map(name => [name, require('node:' + name)]);
    let attempts = 0;
    function deny() { attempts++; throw new Error('OFFLINE_TRANSPORT_DENIED'); }
    for (const [, namespace] of loaded) {
      for (const key of Object.keys(namespace)) {
        const desc = Object.getOwnPropertyDescriptor(namespace, key);
        if (typeof namespace[key] === 'function' && desc && desc.writable) namespace[key] = deny;
      }
    }
    globalThis.fetch = deny;
    globalThis.WebSocket = deny;
    globalThis.EventSource = deny;
    globalThis.XMLHttpRequest = deny;
    Module.syncBuiltinESMExports();
    // Positive self-controls demonstrate that imported namespaces and globals trap calls.
    for (const invoke of [() => globalThis.fetch('https://invalid'), () => new globalThis.WebSocket('wss://invalid'),
      () => loaded.find(([name]) => name === 'http')[1].get('http://invalid'),
      () => loaded.find(([name]) => name === 'child_process')[1].spawn('curl', ['https://invalid'])]) {
      assert.throws(invoke, /OFFLINE_TRANSPORT_DENIED/);
    }
    const selfControls = attempts; attempts = 0;
    const originalLoad = Module._load;
    const importRequests = [];
    Module._load = function(request, ...args) {
      importRequests.push(request);
      const name = request.replace(/^node:/, '');
      if (forbidden.includes(name)) return deny();
      const allowed = ['node:crypto', 'node:util', './opportunity-shadow.cjs', './source-contract-shadow.cjs',
        './source-contract-shadow.fixtures.cjs'];
      if (!allowed.includes(request)) { attempts++; throw new Error('UNAPPROVED_IMPORT'); }
      return originalLoad.call(this, request, ...args);
    };
    const guard = require('./source-contract-shadow.cjs');
    const fixtures = require('./source-contract-shadow.fixtures.cjs');
    for (const fixture of fixtures.cases) {
      const receipt = guard.freezeStudy(fixture.build());
      guard.inspectStudy(receipt);
      guard.replayStudy([receipt], receipt.sha256);
      assert.throws(() => guard.replayStudy([], receipt.sha256), /REPLAY_MISS/);
      const corrupt = JSON.parse(JSON.stringify(receipt)); corrupt.sha256 = '0'.repeat(64);
      assert.throws(() => guard.inspectStudy(corrupt), /RECEIPT_INTEGRITY/);
    }
    const good = guard.freezeStudy(fixtures.baseESPN());
    let getterCalls = 0;
    const poison = { get sha256() { getterCalls++; return globalThis.fetch('https://invalid'); }, input: good.input };
    assert.throws(() => guard.replayStudy([poison], good.sha256), /CONTRACT_INVALID|RECEIPT_INTEGRITY/);
    assert.equal(getterCalls, 0, 'replay must reject executable producer objects before reading them');
    let iteratorCalls = 0, proxyCalls = 0;
    const inherited = fixtures.baseESPN();
    const arrayPrototype = Object.create(Array.prototype);
    arrayPrototype[Symbol.iterator] = function* () { iteratorCalls++; globalThis.fetch('https://invalid'); };
    Object.setPrototypeOf(inherited.records, arrayPrototype);
    assert.throws(() => guard.freezeStudy(inherited), /CONTRACT_INVALID/);
    const proxied = new Proxy(fixtures.baseESPN(), {
      getPrototypeOf() { proxyCalls++; return globalThis.fetch('https://invalid'); },
      ownKeys() { proxyCalls++; return globalThis.fetch('https://invalid'); }
    });
    assert.throws(() => guard.freezeStudy(proxied), /CONTRACT_INVALID/);
    assert.equal(iteratorCalls, 0, 'producer array iterators must remain uninvoked');
    assert.equal(proxyCalls, 0, 'producer proxy traps must remain uninvoked');
    assert.equal(attempts, 0, 'even caught transport attempts must fail this proof');
    assert.ok(importRequests.includes('./opportunity-shadow.cjs'), 'existing canonical helper was freshly inspected too');
    stdout.write(JSON.stringify({cases:fixtures.cases.length,attempts,selfControls,getterCalls,iteratorCalls,proxyCalls,importRequests}));
  `;
  const run = spawnSync(process.execPath, ['-e', script], { cwd: __dirname, encoding: 'utf8', timeout: 10000 });
  assert.equal(run.status, 0, run.stderr);
  const proof = JSON.parse(run.stdout);
  assert.equal(proof.attempts, 0);
  assert.equal(proof.cases, fixtures.cases.length);
  assert.equal(proof.selfControls, 4);
  assert.equal(proof.getterCalls, 0);
  assert.equal(proof.iteratorCalls, 0);
  assert.equal(proof.proxyCalls, 0);
});

test('inspection imports only native hashing object checks and the existing canonical JSON collaborator', () => {
  const source = readFileSync(join(__dirname, 'source-contract-shadow.cjs'), 'utf8');
  const imports = [...source.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map(match => match[1]);
  assert.deepEqual([...new Set(imports)].sort(), ['./opportunity-shadow.cjs', 'node:crypto', 'node:util']);
  assert.ok(!/\bimport\s*\(/.test(source), 'dynamic imports would evade the CJS allowlist');
  assert.ok(!/\bfetch\s*\(|\bWebSocket\s*\(|\beval\s*\(|\bFunction\s*\(/.test(source));
});

test('existing Game Sense confounders and authority remain intact beside source-contract receipts', () => {
  const existing = require('./opportunity-shadow.cjs');
  const priorFixtures = require('./opportunity-shadow.fixtures.cjs').researchFixtures;
  for (const name of ['foul-trouble-confounds-workload', 'overtime-confounds-workload', 'multiple-injuries-confound-causality']) {
    const original = priorFixtures.find(f => f.name === name).build();
    const receipt = existing.freezeResearch(original);
    const before = existing.inspectResearch(receipt);
    inspect(fixtures.baseESPN()); inspect(fixtures.baseNBA());
    assert.deepEqual(existing.inspectResearch(receipt), before);
    assert.equal(before.execution_authority, false);
    assert.equal(before.human_final_gate_required, true);
    assert.ok(before.warnings.length > 0, name + ' still exposes its existing uncertainty');
  }
});
