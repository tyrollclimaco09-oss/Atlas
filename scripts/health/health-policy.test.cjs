'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluateHealth } = require('./health-policy.cjs');

const NOW = Date.parse('2026-10-11T16:30:00.000Z');
const atAge = minutes => new Date(NOW - minutes * 60000).toISOString();
const check = (latestMarketSnapshotAt, totalConnections = 2, maxConnections = 20) =>
  evaluateHealth({ latestMarketSnapshotAt, totalConnections, maxConnections, nowMs: NOW });

const cases = [
  ['missing snapshot is not green', null, 2, 20, 'DEGRADED', 'UNKNOWN'],
  ['fresh at 20 min', atAge(20), 2, 20, 'HEALTHY', 'HEALTHY'],
  ['exactly 30 min is fresh', atAge(30), 2, 20, 'HEALTHY', 'HEALTHY'],
  ['30 min plus 1 second is degraded', new Date(NOW - 30*60000 - 1000).toISOString(), 2, 20, 'DEGRADED', 'DEGRADED'],
  ['60 min is degraded not green', atAge(60), 2, 20, 'DEGRADED', 'DEGRADED'],
  ['exactly 120 min degraded', atAge(120), 2, 20, 'DEGRADED', 'DEGRADED'],
  ['121 min is stale', atAge(121), 2, 20, 'STALE', 'STALE'],
  ['future snapshot is unverified', atAge(-10), 2, 20, 'DEGRADED', 'UNKNOWN'],
  ['60s future skew tolerated', atAge(-1), 2, 20, 'HEALTHY', 'HEALTHY'],
  ['invalid timestamp not green', 'not-a-timestamp', 2, 20, 'DEGRADED', 'UNKNOWN'],
  ['timezone omission rejected', '2026-10-11T16:10:00', 2, 20, 'DEGRADED', 'UNKNOWN'],
  ['high DB pressure is degraded', atAge(10), 17, 20, 'DEGRADED', 'HEALTHY'],
  ['invalid DB counts are degraded', atAge(10), 5, 0, 'DEGRADED', 'HEALTHY'],
  ['stale overrides concurrent high DB pressure', atAge(121), 17, 20, 'STALE', 'STALE'],
];
for (const [name, timestamp, total, max, state, freshness] of cases) {
  test(name, () => {
    const result = check(timestamp, total, max);
    assert.equal(result.health_state, state);
    assert.equal(result.freshness, freshness);
    assert.equal(result.health_state === 'HEALTHY',
      result.freshness === 'HEALTHY' && result.pressure_ratio !== null && result.pressure_ratio < 0.8);
  });
}
test('future skew beyond tolerance records a reason', () => {
  assert.ok(check(atAge(-10)).reason_codes.includes('SNAPSHOT_TIMESTAMP_IN_FUTURE'));
});
test('unknown snapshot never hides missing source', () => {
  assert.ok(check(undefined).reason_codes.includes('MARKET_DATA_UNVERIFIED'));
});
test('uses deterministic injected clock rather than wall clock', () => {
  assert.deepEqual(check(atAge(20)), check(atAge(20)));
});

// Invalid dates must stay invalid even when Date.parse normalizes them.
for (const [timestamp, now] of [
  ['2026-02-30T12:00:00Z', '2026-03-02T12:00:00Z'],
  ['2026-02-29T12:00:00Z', '2026-03-01T12:00:00Z'],
  ['2100-02-29T12:00:00Z', '2100-03-01T12:00:00Z'],
  ['2026-04-31T12:00:00Z', '2026-05-01T12:00:00Z'],
  ['2026-10-10T24:00:00Z', '2026-10-11T00:00:00Z'],
  ['2026-02-30T17:30:00+05:30', '2026-03-02T12:00:00Z'],
]) {
  test(`invalid RFC3339 calendar/time is not green: ${timestamp}`, () => {
    const result = evaluateHealth({
      latestMarketSnapshotAt: timestamp, nowMs: Date.parse(now),
      totalConnections: 2, maxConnections: 20,
    });
    assert.equal(result.health_state, 'DEGRADED');
    assert.equal(result.freshness, 'UNKNOWN');
    assert.equal(result.age_minutes, null);
    assert.ok(result.reason_codes.includes('SNAPSHOT_TIMESTAMP_MISSING_OR_INVALID'));
  });
}

for (const [timestamp, now] of [
  ['2024-02-29T12:00:00Z', '2024-02-29T12:00:00Z'],
  ['2000-02-29T12:00:00Z', '2000-02-29T12:00:00Z'],
  ['2026-10-11T17:40:00+05:30', '2026-10-11T12:30:00Z'],
  ['2026-10-11T08:40:00-03:30', '2026-10-11T12:30:00Z'],
]) {
  test(`valid leap date/offset retains healthy behavior: ${timestamp}`, () => {
    const result = evaluateHealth({
      latestMarketSnapshotAt: timestamp, nowMs: Date.parse(now),
      totalConnections: 2, maxConnections: 20,
    });
    assert.equal(result.health_state, 'HEALTHY');
    assert.equal(result.freshness, 'HEALTHY');
    assert.deepEqual(result.reason_codes, []);
  });
}

for (const [total, max] of [
  [2, 1e100],
  [2, Number.MAX_SAFE_INTEGER + 1],
  [Number.MAX_SAFE_INTEGER + 1, 1e100],
]) {
  test(`unsafe integer DB metrics fail closed: ${total}/${max}`, () => {
    const result = check(atAge(10), total, max);
    assert.equal(result.health_state, 'DEGRADED');
    assert.equal(result.pressure_ratio, null);
    assert.ok(result.reason_codes.includes('DB_CONNECTION_METRICS_INVALID'));
  });
}

test('exactly representable DB metrics retain their ratio', () => {
  const result = check(atAge(10), 2, Number.MAX_SAFE_INTEGER);
  assert.equal(result.health_state, 'HEALTHY');
  assert.equal(result.pressure_ratio, 2 / Number.MAX_SAFE_INTEGER);
});
