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
