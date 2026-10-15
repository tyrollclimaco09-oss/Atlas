'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const fixtures = require('./game-sense-workload-shadow.fixtures.cjs');
const api = () => require('./game-sense-workload-shadow.cjs');
const inspect = value => api().inspectScenario(api().freezeScenario(value));
const copy = value => JSON.parse(JSON.stringify(value));
const player = number => 'synthetic-player-' + number;
const changes = (report, number) => report.player_changes.find(p => p.player_id === player(number));
const reject = input => {
  const result = inspect(input);
  assert.equal(result.eligible, false);
  assert.ok(result.reasons.length > 0, 'rejection must retain an explicit reason');
  assert.equal(result.execution_authority, false);
  assert.equal(result.human_final_gate_required, true);
  assert.equal(result.scenario_probability, null);
  return result;
};
function assertFrozen(value) {
  if (value && typeof value === 'object') {
    assert.ok(Object.isFrozen(value));
    for (const child of Object.values(value)) assertFrozen(child);
  }
}

test('public API checks synthetic allocations without acquiring forecast authority', () => {
  assert.equal(api().VERSION, fixtures.VERSION);
  assert.deepEqual(Object.keys(api()).sort(), ['VERSION', 'freezeScenario', 'inspectScenario']);
  const result = inspect(fixtures.baseNBA());
  assert.equal(result.label, 'SYNTHETIC GS-01 SHADOW');
  assert.equal(result.execution_authority, false);
  assert.equal(result.human_final_gate_required, true);
  assert.equal(result.predictive_value, 'NOT_ESTABLISHED');
  assert.equal(result.scenario_probability, null);
  for (const forbidden of ['win_probability', 'points_forecast', 'confidence', 'p_value', 'joint_probability']) {
    assert.equal(Object.hasOwn(result, forbidden), false);
  }
});

for (const fixture of fixtures.cases) {
  test('GS-01 scenario: ' + fixture.name, () => {
    const input = fixture.build(), before = JSON.stringify(input);
    const result = inspect(input);
    assert.equal(result.eligible, fixture.eligible);
    assert.equal(result.denominators.total_players, fixture.name.startsWith('research roster scope') ? 31 : 7);
    assert.equal(result.execution_authority, false);
    assert.equal(result.human_final_gate_required, true);
    assert.equal(result.predictive_value, 'NOT_ESTABLISHED');
    assert.equal(result.scenario_probability, null);
    if (fixture.eligible) assert.deepEqual(result.reasons, []);
    else assert.ok(result.reasons.length > 0);
    if (fixture.name.startsWith('research roster scope')) assert.ok(result.reasons.includes('ROSTER_SCOPE_UNSUPPORTED'));
    assert.equal(JSON.stringify(input), before, 'inspection must preserve fixture input');
  });
}

test('NBA and WNBA budgets are independently known whole-team exposure totals', () => {
  const nba = inspect(fixtures.baseNBA()), wnba = inspect(fixtures.baseWNBA());
  assert.deepEqual(nba.budget, { game_minutes: 48, team_minutes_required: 240,
    team_minutes_before: 240, team_minutes_after: 240, possessions_before: 100, possessions_after: 100 });
  assert.deepEqual(wnba.budget, { game_minutes: 40, team_minutes_required: 200,
    team_minutes_before: 200, team_minutes_after: 200, possessions_before: 100, possessions_after: 100 });
  assert.equal(nba.pace_changed, false); assert.equal(wnba.pace_changed, false);
});

test('an absent starter receives zero volume and only explicit backups gain minutes', () => {
  const result = inspect(fixtures.absence());
  assert.deepEqual(changes(result, 1), { player_id: player(1), minutes_delta: -48,
    opportunity_delta: -20, efficiency_delta: 0 });
  assert.deepEqual(changes(result, 6), { player_id: player(6), minutes_delta: 48,
    opportunity_delta: 20, efficiency_delta: 0 });
  assert.equal(changes(result, 7).minutes_delta, 0);
  assert.equal(changes(result, 7).opportunity_delta, 0);
  assert.equal(result.player_changes.reduce((total, p) => total + p.minutes_delta, 0), 0);
  assert.equal(result.player_changes.reduce((total, p) => total + p.opportunity_delta, 0), 0);
});

test('two explicit backups share one absence budget without expanding opportunities', () => {
  const result = inspect(fixtures.absence('NBA', true));
  assert.equal(changes(result, 6).minutes_delta, 20);
  assert.equal(changes(result, 7).minutes_delta, 28);
  assert.equal(changes(result, 6).opportunity_delta, 8);
  assert.equal(changes(result, 7).opportunity_delta, 12);
  assert.equal(result.budget.team_minutes_after, 240);
  assert.equal(result.budget.possessions_after, 100);
});

test('pace volume and efficiency assumptions remain separate quantities', () => {
  const faster = inspect(fixtures.paceChange()), efficiency = inspect(fixtures.efficiencyChange());
  assert.equal(faster.pace_changed, true);
  assert.equal(faster.budget.team_minutes_after, 240);
  assert.equal(faster.budget.possessions_after, 110);
  assert.equal(changes(faster, 1).minutes_delta, 0);
  assert.equal(changes(faster, 1).opportunity_delta, 2);
  assert.equal(changes(faster, 1).efficiency_delta, 0);
  assert.equal(efficiency.pace_changed, false);
  assert.equal(changes(efficiency, 1).opportunity_delta, 0);
  assert.ok(Math.abs(changes(efficiency, 1).efficiency_delta - 0.3) < 1e-12);
  assert.equal(efficiency.scenario_probability, null);
});

test('overlapping disruption labels cannot acquire two copies of the same lost minutes', () => {
  const original = fixtures.overlappingDisruptions(), once = inspect(original);
  assert.equal(once.eligible, true);
  assert.equal(changes(once, 6).minutes_delta, 48);
  assert.ok(once.warnings.includes('CAUSAL_ATTRIBUTION_UNVERIFIED'));
  const twice = copy(original), repeated = copy(twice.transfers[0]);
  repeated.transfer_id = 'synthetic-renamed-transfer';
  repeated.disruption_ids = ['synthetic-foul_trouble'];
  twice.transfers[0].disruption_ids = ['synthetic-absence'];
  twice.transfers.push(repeated);
  reject(twice);
});

test('overtime adds explicit minutes and possessions without estimating pace for the extra period', () => {
  const nba = inspect(fixtures.overtime()), wnba = inspect(fixtures.overtime('WNBA'));
  assert.equal(nba.budget.game_minutes, 53); assert.equal(nba.budget.team_minutes_after, 265);
  assert.equal(wnba.budget.game_minutes, 45); assert.equal(wnba.budget.team_minutes_after, 225);
  assert.equal(nba.budget.possessions_after, 110); assert.equal(wnba.budget.possessions_after, 110);
  const missing = fixtures.overtime(); missing.pace.overtime_possessions_after = null; reject(missing);
  const unsolicited = fixtures.baseNBA(); unsolicited.pace.overtime_possessions_after = 10; reject(unsolicited);
});

test('foul trouble and blowout remain assumptions with unverified causal attribution', () => {
  for (const build of [fixtures.foulTrouble, fixtures.blowout]) {
    const result = inspect(build());
    assert.equal(result.eligible, true);
    assert.ok(result.warnings.includes('CAUSAL_ATTRIBUTION_UNVERIFIED'));
    assert.equal(result.predictive_value, 'NOT_ESTABLISHED');
    assert.equal(result.scenario_probability, null);
  }
});

test('disjoint half-game lineups can each allocate only their own fifty possessions', () => {
  const result = inspect(fixtures.intervalCapacity(true));
  assert.equal(result.eligible, true);
  assert.equal(result.denominators.total_players, 10);
  assert.equal(result.budget.team_minutes_after, 240);
  assert.equal(result.budget.possessions_after, 100);
  for (const p of result.player_changes) assert.equal(p.opportunity_delta, p.minutes_delta < 0 ? -10 : 10);
});

test('per-player bounds cannot allow one half-game lineup to consume the whole game budget', () => {
  const input = fixtures.intervalCapacity(false);
  // The first five players each use 20 of their individually permitted 50
  // opportunities, but together require 100 from a 50-possession interval.
  const result = reject(input);
  assert.ok(result.reasons.includes('OPPORTUNITY_TIMELINE_INFEASIBLE'));
});

test('overtime-only opportunity capacity comes from the explicit overtime period', () => {
  const input = fixtures.overtimeSubstitute(), result = inspect(input);
  assert.equal(result.eligible, true);
  assert.equal(result.budget.game_minutes, 53);
  assert.equal(result.budget.possessions_after, 120);
  assert.equal(changes(result, 6).minutes_delta, 5);
  assert.equal(changes(result, 6).opportunity_delta, 15);
  // Uniform pace within each declared period differs from incorrectly spreading
  // the combined 120 possessions over all 53 minutes: 15 legitimately exceeds
  // that full-game average's 11.32-possession bound for a five-minute substitute.
  const excess = copy(input);
  excess.players[0].usage_after = 0.025; excess.players[0].opportunities_after = 3;
  excess.players[5].usage_after = 0.175; excess.players[5].opportunities_after = 21;
  reject(excess); // An OT-only player cannot consume 21 of the period's 20.
});

test('fixture definitions, receipts and reports are recursively immutable', () => {
  assertFrozen(fixtures.templates); assertFrozen(fixtures.cases);
  const fresh = fixtures.baseNBA(); fresh.players[0].minutes_after = 999;
  assert.equal(fixtures.baseNBA().players[0].minutes_after, 48);
  const input = fixtures.absence(), receipt = api().freezeScenario(input);
  assertFrozen(receipt); assertFrozen(api().inspectScenario(receipt));
  input.players[0].minutes_before = 999;
  assert.equal(receipt.input.players.find(p => p.player_id === player(1)).minutes_before, 48);
  assert.throws(() => { receipt.input.players[0].minutes_after = 3; }, TypeError);
});

test('repeated inspection and irrelevant roster/lineup ordering produce identical receipts', () => {
  const original = fixtures.absence('NBA', true), reordered = copy(original);
  reordered.players.reverse(); reordered.transfers.reverse(); reordered.disruptions.reverse();
  reordered.rotations.before.reverse(); reordered.rotations.after.reverse();
  for (const phase of ['before', 'after']) for (const segment of reordered.rotations[phase]) segment.player_ids.reverse();
  const first = api().freezeScenario(original), second = api().freezeScenario(reordered);
  assert.equal(first.sha256, second.sha256);
  assert.deepEqual(api().inspectScenario(first), api().inspectScenario(second));
  assert.deepEqual(api().inspectScenario(first), api().inspectScenario(first));
});

test('metadata and allocation changes are both bound into the receipt', () => {
  const original = fixtures.baseNBA(), metadata = copy(original), allocation = copy(original);
  metadata.scenario_id = 'synthetic-reviewed-revision'; allocation.players[0].efficiency_after = 0.6;
  const receipt = api().freezeScenario(original);
  assert.notEqual(api().freezeScenario(metadata).sha256, receipt.sha256);
  assert.notEqual(api().freezeScenario(allocation).sha256, receipt.sha256);
  for (const change of [r => { r.input.scenario_id = 'synthetic-forged'; },
    r => { r.input.players[0].minutes_after = 2; }, r => { r.sha256 = '0'.repeat(64); }]) {
    const bad = copy(receipt); change(bad);
    assert.throws(() => api().inspectScenario(bad), /RECEIPT_INTEGRITY/);
  }
});

test('missing assumptions fail closed while known and unknown deltas remain distinct', () => {
  for (const key of ['usage_before', 'usage_after', 'efficiency_before', 'efficiency_after', 'minutes_after', 'opportunities_after']) {
    const input = fixtures.baseNBA(); input.players[0][key] = null;
    const result = reject(input), change = changes(result, 1);
    if (key === 'minutes_after') assert.equal(change.minutes_delta, null);
    if (key.startsWith('efficiency_')) assert.equal(change.efficiency_delta, null);
    if (key === 'opportunities_after') assert.equal(change.opportunity_delta, null);
  }
  const missingPace = fixtures.baseNBA(); missingPace.pace.before = null;
  const result = reject(missingPace);
  assert.equal(result.budget.possessions_before, null); assert.equal(result.pace_changed, null);
});

test('incomplete rosters, duplicate identities and malformed nested records cannot silently disappear', () => {
  for (const change of [
    s => { s.roster_complete = false; }, s => { s.players = []; },
    s => { s.players[1].player_id = player(1); }, s => { s.players[0] = null; },
    s => { delete s.players[0].usage_after; }, s => { s.rules = null; },
    s => { s.rotations.after = []; }, s => { s.rotations.after = [null]; },
    s => { s.rotations.before[0].player_ids = null; }, s => { s.transfers = null; },
    s => { s.disruptions = null; }
  ]) {
    const input = fixtures.baseNBA(); change(input); reject(input);
  }
  const malformed = fixtures.baseNBA(); malformed.players[0] = null;
  assert.equal(reject(malformed).denominators.total_players, 7);
});

test('wrong league, official-looking usage labels and unknown identities are not coerced', () => {
  for (const change of [
    s => { s.league = 'NCAA'; }, s => { s.league = ['NBA']; },
    s => { s.assumptions.usage_definition = 'official-USG-percent'; },
    s => { s.assumptions.efficiency_definition = 'true-shooting-percentage'; },
    s => { s.rules.players_on_court = 4; }, s => { s.scenario_id = 'real-record'; },
    s => { s.players[0].player_id = ['synthetic-player-1']; }
  ]) { const input = fixtures.baseNBA(); change(input); reject(input); }
});

test('invalid calendar dates, missing timestamps and post-freeze assumptions fail closed', () => {
  for (const change of [
    s => { s.forecast_cutoff = null; }, s => { s.frozen_at = null; },
    s => { s.evidence_at = '2026-02-30T10:00:00Z'; },
    s => { s.evidence_at = '2026-10-13'; },
    s => { s.evidence_at = '2026-10-13T10:00:00-05:00'; },
    s => { s.evidence_at = '2026-10-13T24:00:00Z'; },
    s => { s.evidence_at = '2026-10-13T11:00:01Z'; },
    s => { s.frozen_at = '2026-10-13T12:00:01Z'; }
  ]) { const input = fixtures.baseNBA(); change(input); reject(input); }
  const missing = fixtures.absence(); missing.disruptions[0].evidence_at = null; reject(missing);
  const boundary = fixtures.absence(); boundary.evidence_at = boundary.frozen_at;
  boundary.disruptions[0].evidence_at = boundary.frozen_at;
  assert.equal(inspect(boundary).eligible, true);
});

test('bounded synthetic numeric quantities refuse negative, excessive and missing values', () => {
  for (const change of [
    s => { s.players[0].efficiency_after = -0.1; }, s => { s.players[0].efficiency_after = 1.1; },
    s => { s.players[0].opportunities_after = -1; }, s => { s.players[0].minutes_after = 0.5; },
    s => { s.players[0].available_after = null; }, s => { s.pace.after = 0; },
    s => { s.pace.after = -1; }, s => { s.rules.ot_periods = 0.5; },
    s => { s.pace.overtime_possessions_after = -1; }
  ]) { const input = fixtures.baseNBA(); change(input); reject(input); }
  for (const value of [Infinity, NaN, undefined, 9007199254740992]) {
    const input = fixtures.baseNBA(); input.players[0].opportunities_after = value;
    assert.throws(() => api().freezeScenario(input), /CONTRACT_INVALID/);
  }
});

test('a missing or contradictory disruption subject and cap cannot explain redistribution', () => {
  for (const change of [
    s => { s.disruptions[0].player_id = null; },
    s => { s.disruptions[0].player_id = 'synthetic-unresolved'; },
    s => { s.disruptions[0].max_minutes_after = null; },
    s => { s.disruptions[0].kind = 'unsupported_effect'; },
    s => { s.disruptions.push(copy(s.disruptions[0])); }
  ]) { const input = fixtures.absence(); change(input); reject(input); }
  const uncapped = fixtures.foulTrouble(); uncapped.disruptions[0].max_minutes_after = null; reject(uncapped);
  const globalCap = fixtures.blowout(); globalCap.disruptions[0].max_minutes_after = 20; reject(globalCap);
});

test('redistribution rejects unresolved, repeated, zero and intermediary minute flows', () => {
  for (const change of [
    s => { s.transfers[0].to_player_id = 'synthetic-unresolved'; },
    s => { s.transfers[0].from_player_id = s.transfers[0].to_player_id; },
    s => { s.transfers[0].minutes = 0; }, s => { s.transfers[0].minutes = 47; },
    s => { s.transfers[0].disruption_ids = []; },
    s => { s.transfers[0].disruption_ids.push('synthetic-absence'); },
    s => { s.transfers.push(copy(s.transfers[0])); }
  ]) { const input = fixtures.absence(); change(input); reject(input); }
  const intermediary = fixtures.absence(); intermediary.transfers[0].to_player_id = player(7);
  intermediary.transfers.push({ transfer_id: 'synthetic-intermediary-transfer', from_player_id: player(7),
    to_player_id: player(6), minutes: 48, disruption_ids: ['synthetic-absence'] });
  reject(intermediary);
});

test('new probability, market, network and unknown root capabilities are rejected opaquely', () => {
  for (const change of [
    s => { s.synthetic = false; }, s => { s.research_only = false; },
    s => { s.phase = 'MARKET_INFORMED'; }, s => { s.schema_version = 'unknown'; },
    s => { s.scenario_probability = 0.7; }, s => { s.bookmaker_OU = 220; },
    s => { s.fallback_url = 'https://invalid/private?token=synthetic-secret'; },
    s => { delete s.assumptions; }
  ]) {
    const input = fixtures.baseNBA(); change(input);
    assert.throws(() => api().freezeScenario(input), error => error.message === 'CONTRACT_INVALID');
  }
  const invalid = fixtures.baseNBA(); invalid.scenario_id = 'synthetic-secret-credential-text/';
  const text = JSON.stringify(reject(invalid));
  assert.ok(!text.includes(invalid.scenario_id));
});

test('executable producer getters, custom iterators and proxies remain uninvoked', () => {
  let calls = 0;
  const getter = fixtures.baseNBA();
  Object.defineProperty(getter.players[0], 'usage_after', { enumerable: true, get() { calls++; throw Error('secret'); } });
  assert.throws(() => api().freezeScenario(getter), /CONTRACT_INVALID/);
  const custom = fixtures.baseNBA(), prototype = Object.create(Array.prototype);
  prototype[Symbol.iterator] = function* () { calls++; throw Error('secret'); };
  Object.setPrototypeOf(custom.players, prototype);
  assert.throws(() => api().freezeScenario(custom), /CONTRACT_INVALID/);
  const proxy = new Proxy(fixtures.baseNBA(), { ownKeys() { calls++; throw Error('secret'); } });
  assert.throws(() => api().freezeScenario(proxy), /CONTRACT_INVALID/);
  const receipt = api().freezeScenario(fixtures.baseNBA());
  const poison = { get sha256() { calls++; throw Error('secret'); }, input: receipt.input };
  assert.throws(() => api().inspectScenario(poison), /RECEIPT_INTEGRITY/);
  assert.equal(calls, 0);
});

test('existing SCOUT Game Sense uncertainty and authority are unchanged after GS-01 inspection', () => {
  const existing = require('./opportunity-shadow.cjs');
  const research = require('./opportunity-shadow.fixtures.cjs').researchFixtures;
  for (const name of ['foul-trouble-confounds-workload', 'overtime-confounds-workload', 'multiple-injuries-confound-causality']) {
    const receipt = existing.freezeResearch(research.find(f => f.name === name).build());
    const before = existing.inspectResearch(receipt);
    inspect(fixtures.foulTrouble()); inspect(fixtures.overtime()); inspect(fixtures.overlappingDisruptions());
    assert.deepEqual(existing.inspectResearch(receipt), before);
    assert.ok(before.warnings.length > 0);
    assert.equal(before.execution_authority, false); assert.equal(before.human_final_gate_required, true);
  }
});

test('fresh-process offline proof covers imports, every scenario and executable producer objects', () => {
  const script = String.raw`
    'use strict';
    const assert = require('node:assert/strict');
    const Module = require('node:module');
    const stdout = process.stdout;
    const forbidden = ['http','https','http2','net','tls','dns','dns/promises','dgram','child_process','worker_threads'];
    const loaded = forbidden.map(name => [name, require('node:' + name)]);
    let attempts = 0;
    function deny() { attempts++; throw Error('OFFLINE_TRANSPORT_DENIED'); }
    for (const [, namespace] of loaded) {
      for (const key of Object.keys(namespace)) {
        if (typeof namespace[key] === 'function') {
          try { namespace[key] = deny; } catch {}
        }
      }
    }
    globalThis.fetch = deny; globalThis.WebSocket = deny;
    globalThis.EventSource = deny; globalThis.XMLHttpRequest = deny;
    Module.syncBuiltinESMExports();
    for (const invoke of [() => fetch('https://invalid'), () => new WebSocket('wss://invalid'),
      () => loaded.find(([n]) => n === 'http')[1].get('http://invalid'),
      () => loaded.find(([n]) => n === 'child_process')[1].spawn('curl', ['https://invalid'])]) {
      assert.throws(invoke, /OFFLINE_TRANSPORT_DENIED/);
    }
    const selfControls = attempts; attempts = 0;
    const originalLoad = Module._load, importRequests = [];
    const allowed = ['node:crypto','node:util','./opportunity-shadow.cjs','./source-contract-shadow.cjs',
      './game-sense-workload-shadow.cjs','./game-sense-workload-shadow.fixtures.cjs'];
    Module._load = function(request, ...args) {
      importRequests.push(request);
      if (forbidden.includes(request.replace(/^node:/,''))) return deny();
      if (!allowed.includes(request)) { attempts++; throw Error('UNAPPROVED_IMPORT'); }
      return originalLoad.call(this, request, ...args);
    };
    const guard = require('./game-sense-workload-shadow.cjs');
    const fixtures = require('./game-sense-workload-shadow.fixtures.cjs');
    for (const fixture of fixtures.cases) {
      const receipt = guard.freezeScenario(fixture.build());
      const result = guard.inspectScenario(receipt);
      assert.equal(result.eligible, fixture.eligible);
      const corrupted = JSON.parse(JSON.stringify(receipt)); corrupted.sha256 = '0'.repeat(64);
      assert.throws(() => guard.inspectScenario(corrupted), /RECEIPT_INTEGRITY/);
    }
    for (const valid of [true, false]) {
      const result = guard.inspectScenario(guard.freezeScenario(fixtures.intervalCapacity(valid)));
      assert.equal(result.eligible, valid);
    }
    assert.equal(guard.inspectScenario(guard.freezeScenario(fixtures.overtimeSubstitute())).eligible, true);
    let getterCalls = 0, iteratorCalls = 0, proxyCalls = 0;
    const getter = fixtures.baseNBA();
    Object.defineProperty(getter.players[0], 'usage_after', { enumerable:true,
      get() { getterCalls++; return fetch('https://invalid'); } });
    assert.throws(() => guard.freezeScenario(getter), /CONTRACT_INVALID/);
    const inherited = fixtures.baseNBA(), custom = Object.create(Array.prototype);
    custom[Symbol.iterator] = function* () { iteratorCalls++; fetch('https://invalid'); };
    Object.setPrototypeOf(inherited.players, custom);
    assert.throws(() => guard.freezeScenario(inherited), /CONTRACT_INVALID/);
    const proxied = new Proxy(fixtures.baseNBA(), {
      getPrototypeOf() { proxyCalls++; return fetch('https://invalid'); },
      ownKeys() { proxyCalls++; return fetch('https://invalid'); }
    });
    assert.throws(() => guard.freezeScenario(proxied), /CONTRACT_INVALID/);
    assert.equal(getterCalls, 0); assert.equal(iteratorCalls, 0); assert.equal(proxyCalls, 0);
    assert.equal(attempts, 0, 'caught attempts must also invalidate the offline proof');
    assert.ok(importRequests.includes('./source-contract-shadow.cjs'));
    assert.ok(importRequests.includes('./opportunity-shadow.cjs'));
    stdout.write(JSON.stringify({ cases:fixtures.cases.length, intervalControls:2, overtimeControl:1, attempts, selfControls,
      getterCalls, iteratorCalls, proxyCalls, importRequests }));
  `;
  const run = spawnSync(process.execPath, ['-e', script], { cwd: __dirname, encoding: 'utf8', timeout: 10000 });
  assert.equal(run.status, 0, run.stderr);
  const proof = JSON.parse(run.stdout);
  assert.equal(proof.cases, fixtures.cases.length); assert.equal(proof.attempts, 0);
  assert.equal(proof.intervalControls, 2);
  assert.equal(proof.overtimeControl, 1);
  assert.equal(proof.selfControls, 4); assert.equal(proof.getterCalls, 0);
  assert.equal(proof.iteratorCalls, 0); assert.equal(proof.proxyCalls, 0);
});

test('the pure checker has no dynamic imports or network entry points', () => {
  const source = readFileSync(join(__dirname, 'game-sense-workload-shadow.cjs'), 'utf8');
  const imports = [...source.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map(match => match[1]);
  assert.deepEqual([...new Set(imports)].sort(), ['./opportunity-shadow.cjs', './source-contract-shadow.cjs']);
  assert.ok(!/\bimport\s*\(|\bfetch\s*\(|\bWebSocket\s*\(|\beval\s*\(|\bFunction\s*\(/.test(source));
});
