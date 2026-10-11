'use strict';

/**
 * ATLAS health-state reference evaluator; isolated from deployed infrastructure.
 * Top-level states remain HEALTHY, DEGRADED, STALE.
 * No network calls, database writes, or deployment behavior.
 */
const THIRTY_MINUTES = 30 * 60 * 1000;
const TWO_HOURS = 120 * 60 * 1000;
const ALLOWED_FUTURE_SKEW = 60 * 1000;
const RFC3339 = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/;

function evaluateHealth({ latestMarketSnapshotAt, totalConnections, maxConnections, nowMs = Date.now() }) {
  const reasons = [];
  let freshness = 'UNKNOWN';
  let ageMinutes = null;

  if (!Number.isFinite(nowMs)) {
    reasons.push('CLOCK_INVALID');
  } else if (typeof latestMarketSnapshotAt !== 'string' || !RFC3339.test(latestMarketSnapshotAt)) {
    reasons.push('SNAPSHOT_TIMESTAMP_MISSING_OR_INVALID');
  } else {
    const snapshotMs = Date.parse(latestMarketSnapshotAt);
    const ageMs = nowMs - snapshotMs;
    if (!Number.isFinite(snapshotMs)) {
      reasons.push('SNAPSHOT_TIMESTAMP_MISSING_OR_INVALID');
    } else if (ageMs < -ALLOWED_FUTURE_SKEW) {
      reasons.push('SNAPSHOT_TIMESTAMP_IN_FUTURE');
    } else {
      const nonNegativeAge = Math.max(0, ageMs);
      ageMinutes = Math.round(nonNegativeAge / 60000);
      if (nonNegativeAge <= THIRTY_MINUTES) freshness = 'HEALTHY';
      else if (nonNegativeAge <= TWO_HOURS) freshness = 'DEGRADED';
      else freshness = 'STALE';
    }
  }

  const validCounts = Number.isInteger(totalConnections) && totalConnections >= 0 &&
    Number.isInteger(maxConnections) && maxConnections > 0;
  const pressureRatio = validCounts ? totalConnections / maxConnections : null;
  if (!validCounts) reasons.push('DB_CONNECTION_METRICS_INVALID');
  else if (pressureRatio >= 0.8) reasons.push('DB_CONNECTION_PRESSURE_HIGH');
  if (freshness === 'DEGRADED') reasons.push('MARKET_DATA_DEGRADED');
  if (freshness === 'STALE') reasons.push('MARKET_DATA_STALE');
  if (freshness === 'UNKNOWN') reasons.push('MARKET_DATA_UNVERIFIED');

  // A green result must have valid, fresh evidence AND healthy DB pressure.
  const healthState = freshness === 'STALE' ? 'STALE' :
    (freshness !== 'HEALTHY' || !validCounts || pressureRatio >= 0.8 || reasons.length)
      ? 'DEGRADED' : 'HEALTHY';

  return {
    health_state: healthState,
    freshness,
    age_minutes: ageMinutes,
    pressure_ratio: pressureRatio,
    reason_codes: [...new Set(reasons)],
  };
}

module.exports = { evaluateHealth };
