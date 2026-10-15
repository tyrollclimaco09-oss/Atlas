'use strict';

// GS-01 checks declared synthetic allocations. It never generates forecasts.
const { canonicalJSON } = require('./opportunity-shadow.cjs');
const { hashJSON } = require('./source-contract-shadow.cjs');
const VERSION = 'atlas.game-sense.workload-shadow.v1';
const ROOT = ['schema_version', 'synthetic', 'research_only', 'phase', 'scenario_id', 'event_id',
  'team_id', 'league', 'forecast_cutoff', 'frozen_at', 'evidence_at', 'roster_complete', 'assumptions',
  'rules', 'pace', 'players', 'rotations', 'transfers', 'disruptions'];
const PLAYER = ['player_id', 'available_before', 'available_after', 'minutes_before', 'minutes_after',
  'usage_before', 'usage_after', 'opportunities_before', 'opportunities_after', 'efficiency_before', 'efficiency_after'];
const exact = (v, keys) => v !== null && typeof v === 'object' && !Array.isArray(v) &&
  Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
const id = v => typeof v === 'string' && /^synthetic-[A-Za-z0-9_-]{1,80}$/.test(v);
const number = v => typeof v === 'number' && Number.isFinite(v) &&
  (!Number.isInteger(v) || Number.isSafeInteger(v));
const fraction = v => number(v) && v >= 0 && v <= 1;
const integer = v => Number.isSafeInteger(v) && v >= 0;
// Arithmetic tolerance, not a statistical precision or confidence estimate.
const equal = (a, b) => number(a) && number(b) && Math.abs(a - b) <= 1e-9;
const delta = (a, b) => number(a) && number(b) ? b - a : null;
function stamp(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v)) return null;
  const t = Date.parse(v);
  return Number.isFinite(t) && new Date(t).toISOString() ===
    (v.includes('.') ? v : v.replace('Z', '.000Z')) ? t : null;
}
function immutable(v) {
  if (v && typeof v === 'object') { Object.values(v).forEach(immutable); Object.freeze(v); }
  return v;
}
function root(v) {
  return exact(v, ROOT) && v.schema_version === VERSION && v.synthetic === true &&
    v.research_only === true && v.phase === 'PHASE1_PRICE_INDEPENDENT';
}
function freezeScenario(input) {
  try {
    hashJSON(input); // Existing SCOUT guard refuses proxies/accessors/non-JSON before copying.
    if (!root(input)) throw Error();
    const copy = JSON.parse(canonicalJSON(input));
    for (const key of ['players', 'transfers', 'disruptions']) if (Array.isArray(copy[key])) {
      copy[key].sort((a, b) => canonicalJSON(a).localeCompare(canonicalJSON(b), 'en'));
    }
    for (const phase of ['before', 'after']) if (Array.isArray(copy.rotations?.[phase])) {
      copy.rotations[phase].sort((a, b) => (a?.start ?? 0) - (b?.start ?? 0));
      for (const segment of copy.rotations[phase]) if (Array.isArray(segment?.player_ids)) segment.player_ids.sort();
    }
    return immutable({ sha256: hashJSON(copy), input: copy });
  } catch { throw Error('CONTRACT_INVALID'); }
}
// Feasibility only: interval possession supply must serve the declared player
// demands while those players are on court. No allocation or forecast is emitted.
function timelineFeasible(segments, players, phase) {
  const targets = players.filter(p => p['opportunities_' + phase] > 0);
  const sink = 1 + segments.length + targets.length, count = sink + 1;
  const capacity = Array.from({ length: count }, () => Array(count).fill(0));
  const nodes = new Map(targets.map((p, k) => [p.player_id, 1 + segments.length + k]));
  segments.forEach((segment, k) => {
    const node = k + 1; capacity[0][node] = segment.capacity;
    for (const key of segment.player_ids) if (nodes.has(key)) capacity[node][nodes.get(key)] = segment.capacity;
  });
  for (const p of targets) capacity[nodes.get(p.player_id)][sink] = p['opportunities_' + phase];
  let flow = 0;
  for (;;) {
    const parent = Array(count).fill(-1), queue = [0]; parent[0] = 0;
    for (let k = 0; k < queue.length && parent[sink] === -1; k++) {
      for (let next = 1; next < count; next++) if (parent[next] === -1 && capacity[queue[k]][next] > 1e-9) {
        parent[next] = queue[k]; queue.push(next);
      }
    }
    if (parent[sink] === -1) break;
    let amount = Infinity;
    for (let node = sink; node !== 0; node = parent[node]) amount = Math.min(amount, capacity[parent[node]][node]);
    for (let node = sink; node !== 0; node = parent[node]) {
      capacity[parent[node]][node] -= amount; capacity[node][parent[node]] += amount;
    }
    flow += amount;
  }
  return equal(flow, targets.reduce((sum, p) => sum + p['opportunities_' + phase], 0));
}
function inspectScenario(receipt) {
  let s;
  try {
    hashJSON(receipt);
    if (!exact(receipt, ['sha256', 'input']) || hashJSON(receipt.input) !== receipt.sha256 || !root(receipt.input)) throw Error();
    s = receipt.input;
  } catch { throw Error('RECEIPT_INTEGRITY'); }
  const reasons = new Set(), warnings = new Set(), reject = code => reasons.add(code);
  if (![s.scenario_id, s.event_id, s.team_id].every(id)) reject('IDENTITY_UNRESOLVED');
  if (s.roster_complete !== true) reject('ROSTER_INCOMPLETE');
  const a = s.assumptions;
  if (!exact(a, ['usage_definition', 'pace_timing', 'efficiency_definition', 'causal_claim']) ||
    a.usage_definition !== 'synthetic-possession-ending-share-v1' || a.pace_timing !== 'uniform' ||
    a.efficiency_definition !== 'synthetic-conversion-per-opportunity-v1') reject('ASSUMPTIONS_UNKNOWN');
  if (a?.causal_claim !== false) reject('UNSUPPORTED_CAUSAL_CLAIM');
  const frozen = stamp(s.frozen_at), cutoff = stamp(s.forecast_cutoff), evidence = stamp(s.evidence_at);
  if ([frozen, cutoff, evidence].includes(null)) reject('TIME_UNKNOWN');
  else if (evidence > frozen || frozen > cutoff) reject('POST_CUTOFF');
  const regulation = s.league === 'NBA' ? 48 : s.league === 'WNBA' ? 40 : null, r = s.rules;
  let duration = null;
  if (regulation === null || !exact(r, ['regulation_minutes', 'ot_periods', 'ot_minutes', 'players_on_court']) ||
    r.regulation_minutes !== regulation || !integer(r.ot_periods) || r.ot_periods > 12 ||
    r.ot_minutes !== 5 || r.players_on_court !== 5) reject('RULES_UNKNOWN');
  else duration = regulation + 5 * r.ot_periods;
  const p = s.pace, possessions = { before: null, after: null };
  if (!exact(p, ['basis_minutes', 'before', 'after', 'overtime_possessions_before', 'overtime_possessions_after']) ||
    regulation === null || p.basis_minutes !== regulation) reject('PACE_UNKNOWN');
  else for (const phase of ['before', 'after']) {
    const ot = p['overtime_possessions_' + phase];
    if (!number(p[phase]) || p[phase] <= 0 || !number(ot) || ot < 0 ||
      (r?.ot_periods === 0 && ot !== 0)) reject('PACE_UNKNOWN');
    else if (!number(p[phase] + ot)) reject('PACE_UNKNOWN');
    else possessions[phase] = p[phase] + ot;
  }
  const players = Array.isArray(s.players) ? s.players : [], byID = new Map();
  if (!players.length) reject('ROSTER_INCOMPLETE');
  // Research scope bound, not an official NBA/WNBA roster-size rule.
  if (players.length > 30) reject('ROSTER_SCOPE_UNSUPPORTED');
  for (const player of players) {
    if (!exact(player, PLAYER) || !id(player.player_id) || byID.has(player.player_id)) { reject('PLAYER_INVALID'); continue; }
    byID.set(player.player_id, player);
    for (const phase of ['before', 'after']) {
      const minutes = player['minutes_' + phase], usage = player['usage_' + phase], opp = player['opportunities_' + phase];
      if (typeof player['available_' + phase] !== 'boolean' || !integer(minutes) ||
        duration === null || minutes > duration) reject('MINUTES_INVALID');
      if (!fraction(usage) || !fraction(player['efficiency_' + phase]) || !number(opp) || opp < 0) reject('OPPORTUNITY_UNKNOWN');
      if (player['available_' + phase] === false && ((number(minutes) && minutes !== 0) ||
        (number(usage) && usage !== 0) || (number(opp) && opp !== 0))) reject('UNAVAILABLE_PLAYER_ALLOCATION');
      if (minutes === 0 && (usage !== 0 || opp !== 0)) reject('EXPOSURE_EXCEEDED');
      if (possessions[phase] !== null && fraction(usage) && number(opp) &&
        !equal(opp, possessions[phase] * usage)) reject('OPPORTUNITY_MISMATCH');
    }
  }
  const totals = { before: null, after: null };
  for (const phase of ['before', 'after']) {
    if (players.length && players.every(q => integer(q?.['minutes_' + phase]))) {
      const total = players.reduce((n, q) => n + q['minutes_' + phase], 0);
      if (integer(total)) totals[phase] = total;
      else reject('TEAM_MINUTES_MISMATCH');
      if (duration !== null && totals[phase] !== 5 * duration) reject('TEAM_MINUTES_MISMATCH');
    }
    if (players.length && players.every(q => fraction(q?.['usage_' + phase]))) {
      if (!equal(players.reduce((n, q) => n + q['usage_' + phase], 0), 1)) reject('USAGE_SHARE_MISMATCH');
    }
    if (!exact(s.rotations, ['before', 'after']) || !Array.isArray(s.rotations[phase]) || !s.rotations[phase].length) {
      reject('ROTATION_UNKNOWN'); continue;
    }
    const exposure = new Map([...byID.keys()].map(key => [key, 0]));
    const opportunityCaps = new Map([...byID.keys()].map(key => [key, 0])), segments = [];
    let timelineValid = players.length <= 30 && duration !== null && possessions[phase] !== null && byID.size === players.length &&
      players.every(q => number(q['opportunities_' + phase]) && q['opportunities_' + phase] >= 0);
    let cursor = 0;
    for (const segment of s.rotations[phase]) {
      if (!exact(segment, ['start', 'end', 'player_ids']) || !integer(segment.start) || !integer(segment.end) ||
        segment.start !== cursor || segment.end <= segment.start || duration === null || segment.end > duration ||
        !Array.isArray(segment.player_ids) || segment.player_ids.length !== 5 ||
        new Set(segment.player_ids).size !== 5 || !segment.player_ids.every(key => id(key) && byID.has(key))) {
        reject('ROTATION_INVALID'); timelineValid = false; continue;
      }
      cursor = segment.end;
      if (possessions[phase] !== null) {
        const regulationSpan = Math.min(segment.end, regulation) - Math.min(segment.start, regulation);
        const overtimeSpan = Math.max(segment.end - regulation, 0) - Math.max(segment.start - regulation, 0);
        const capacity = (regulationSpan / regulation) * p[phase] + (duration === regulation ? 0 :
          (overtimeSpan / (duration - regulation)) * p['overtime_possessions_' + phase]);
        segments.push({ player_ids: segment.player_ids, capacity });
        for (const key of segment.player_ids) opportunityCaps.set(key, opportunityCaps.get(key) + capacity);
      }
      for (const key of segment.player_ids) {
        if (byID.get(key)['available_' + phase] !== true) reject('ROTATION_UNAVAILABLE_PLAYER');
        exposure.set(key, exposure.get(key) + segment.end - segment.start);
      }
    }
    if (cursor !== duration) reject('ROTATION_INCOMPLETE');
    for (const [key, count] of exposure) if (count !== byID.get(key)['minutes_' + phase]) reject('ROTATION_MINUTES_MISMATCH');
    if (timelineValid && cursor === duration) {
      for (const [key, cap] of opportunityCaps) if (byID.get(key)['opportunities_' + phase] > cap + 1e-9) reject('EXPOSURE_EXCEEDED');
      if (!timelineFeasible(segments, players, phase)) reject('OPPORTUNITY_TIMELINE_INFEASIBLE');
    }
  }
  const disruptions = new Map();
  if (!Array.isArray(s.disruptions)) reject('DISRUPTION_UNKNOWN');
  else for (const d of s.disruptions) {
    if (!exact(d, ['disruption_id', 'kind', 'player_id', 'max_minutes_after', 'evidence_at']) || !id(d.disruption_id) ||
      disruptions.has(d.disruption_id) || !['absence', 'foul_trouble', 'blowout', 'rotation'].includes(d.kind)) {
      reject('DISRUPTION_UNKNOWN'); continue;
    }
    disruptions.set(d.disruption_id, d); warnings.add('CAUSAL_ATTRIBUTION_UNVERIFIED');
    if (stamp(d.evidence_at) === null) reject('TIME_UNKNOWN');
    else if (frozen !== null && stamp(d.evidence_at) > frozen) reject('POST_CUTOFF');
    const subject = byID.get(d.player_id);
    if (d.player_id !== null && !subject) reject('IDENTITY_UNRESOLVED');
    if (['absence', 'foul_trouble'].includes(d.kind) && !subject) reject('DISRUPTION_UNKNOWN');
    if (d.max_minutes_after !== null && (!integer(d.max_minutes_after) || duration === null || d.max_minutes_after > duration)) reject('DISRUPTION_UNKNOWN');
    if (d.kind === 'foul_trouble' && d.max_minutes_after === null) reject('ASSUMPTIONS_UNKNOWN');
    if (d.player_id === null && d.max_minutes_after !== null) reject('DISRUPTION_UNKNOWN');
    if (subject && integer(d.max_minutes_after) && integer(subject.minutes_after) &&
      subject.minutes_after > d.max_minutes_after) reject('DISRUPTION_CONTRADICTION');
    if (d.kind === 'absence' && (d.max_minutes_after !== 0 || subject?.available_after !== false)) reject('DISRUPTION_CONTRADICTION');
  }
  const flow = new Map([...byID.keys()].map(key => [key, { incoming: 0, outgoing: 0 }])), transferIDs = new Set();
  if (!Array.isArray(s.transfers)) reject('TRANSFER_UNKNOWN');
  else for (const transfer of s.transfers) {
    if (!exact(transfer, ['transfer_id', 'from_player_id', 'to_player_id', 'minutes', 'disruption_ids']) ||
      !id(transfer.transfer_id) || transferIDs.has(transfer.transfer_id) ||
      !flow.has(transfer.from_player_id) || !flow.has(transfer.to_player_id) ||
      transfer.from_player_id === transfer.to_player_id || !integer(transfer.minutes) || transfer.minutes === 0 ||
      !Array.isArray(transfer.disruption_ids) || !transfer.disruption_ids.length ||
      new Set(transfer.disruption_ids).size !== transfer.disruption_ids.length ||
      !transfer.disruption_ids.every(key => disruptions.has(key))) { reject('TRANSFER_INVALID'); continue; }
    transferIDs.add(transfer.transfer_id);
    flow.get(transfer.from_player_id).outgoing += transfer.minutes;
    flow.get(transfer.to_player_id).incoming += transfer.minutes;
  }
  for (const [key, q] of byID) {
    if (!integer(q.minutes_before) || !integer(q.minutes_after)) continue;
    const change = q.minutes_after - q.minutes_before, f = flow.get(key);
    if (f.incoming !== Math.max(change, 0) || f.outgoing !== Math.max(-change, 0)) reject('REDISTRIBUTION_MISMATCH');
  }
  return immutable({ label: 'SYNTHETIC GS-01 SHADOW', scenario_id: id(s.scenario_id) ? s.scenario_id : null,
    event_id: id(s.event_id) ? s.event_id : null, team_id: id(s.team_id) ? s.team_id : null,
    league: regulation === null ? null : s.league, eligible: reasons.size === 0,
    reasons: [...reasons].sort(), warnings: [...warnings].sort(), receipt_sha256: receipt.sha256,
    execution_authority: false, human_final_gate_required: true, predictive_value: 'NOT_ESTABLISHED', scenario_probability: null,
    budget: { game_minutes: duration, team_minutes_required: duration === null ? null : 5 * duration,
      team_minutes_before: totals.before, team_minutes_after: totals.after,
      possessions_before: possessions.before, possessions_after: possessions.after },
    denominators: { total_players: players.length }, pace_changed: possessions.before === null || possessions.after === null ? null :
      !equal(possessions.before, possessions.after),
    player_changes: [...byID.values()].sort((x, y) => x.player_id.localeCompare(y.player_id, 'en')).map(q => ({ player_id: q.player_id,
      minutes_delta: delta(q.minutes_before, q.minutes_after), opportunity_delta: delta(q.opportunities_before, q.opportunities_after),
      efficiency_delta: delta(q.efficiency_before, q.efficiency_after) })) });
}
module.exports = Object.freeze({ VERSION, freezeScenario, inspectScenario });
