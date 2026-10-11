'use strict';

/**
 * ATLAS health-state reference evaluator; isolated from deployed infrastructure.
 * Top-level states remain HEALTHY, DEGRADED, STALE.
 * No network calls, database writes, or deployment behavior.
 */
const THIRTY_MINUTES = 30 * 60 * 1000;
const TWO_HOURS = 120 * 60 * 1000;
const ALLOWED_FUTURE_SKEW = 60 * 1000;
const RFC3339 = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(?:\.\d+)?(?:Z|[+-](\d\d):(\d\d))$/;

function parseSnapshotTimestamp(value) {
  const parts = typeof value === 'string' ? RFC3339.exec(value) : null;
  if (!parts) return NaN;
  const [year, month, day, hour, minute, second, offsetHour, offsetMinute] =
    parts.slice(1).map(part => Number(part ?? 0));
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  // Date.parse can silently normalize February 30 and 24:00 into fresh dates.
  // Validate the source calendar/time before using its parsed instant.
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1] ||
      hour > 23 || minute > 59 || second > 59 || offsetHour > 23 || offsetMinute > 59) {
    return NaN;
  }
  return Date.parse(value);
}

function evaluateHealth({ latestMarketSnapshotAt, totalConnections, maxConnections, nowMs = Date.now() }) {
  const reasons = [];
  let freshness = 'UNKNOWN';
  let ageMinutes = null;

  if (!Number.isFinite(nowMs)) {
    reasons.push('CLOCK_INVALID');
  } else {
    const snapshotMs = parseSnapshotTimestamp(latestMarketSnapshotAt);
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

  const validCounts = Number.isSafeInteger(totalConnections) && totalConnections >= 0 &&
    Number.isSafeInteger(maxConnections) && maxConnections > 0;
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
