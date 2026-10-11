'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const Pricing = require('../pricing.js');
const Slate = require('../slate-engine.js');

// These are fictional device-local records. No API, browser storage, real
// candidate, bankroll, provider, sportsbook, or backend authentication is used.
const NOW = Date.parse('2026-10-11T12:00:00Z');
const RECENT = '2026-10-11T11:59:00Z';

function researchFixture() {
  const run = Slate.newRun({ date: '2026-10-11', timezone: 'UTC' }, NOW);
  run.id = 'synthetic-local-run';
  const candidate = Slate.newCandidate();
  candidate.id = 'synthetic-local-candidate';
  Object.assign(candidate.scout, {
    event: 'Fictional Alpha vs Fictional Beta',
    selection: 'Fictional player over 10.5',
    market: 'Player prop',
    startsAt: '2026-10-11T15:00:00Z',
    discovery: 'Synthetic opportunity used only for offline tests.',
    source: 'https://example.invalid/fixture/schedule',
  });
  Object.assign(candidate.verify, {
    availability: 'Synthetic availability evidence.',
    source: 'https://example.invalid/fixture/availability',
    checkedAt: RECENT,
    rules: 'Synthetic two-outcome, no-push settlement.',
    reviewed: true,
  });
  Object.assign(candidate.oracle, {
    thesis: 'Synthetic opportunity thesis.',
    counter: 'Synthetic counter-case.',
    invalidation: 'Synthetic role-change condition.',
    method: 'Fictional model fixture, never a real forecast.',
    probability: '55',
    independence: 'Prepared before any market quote in this fixture.',
    reviewed: true,
  });
  run.candidates.push(candidate);
  return { run, candidate };
}

function readyFixture() {
  const { run, candidate } = researchFixture();
  Slate.seal(run, candidate, NOW);
  Object.assign(run, { bankroll: '100', exposure: '10', budget: '10', accountAt: RECENT });
  Object.assign(candidate.pricing, {
    book: 'Fictional Book', odds: '+113', line: candidate.scout.selection,
    source: 'https://example.invalid/fixture/quote', capturedAt: RECENT,
    comparison: 'Fictional second-book comparison.', noPush: true,
  });
  Object.assign(candidate.kairos, { action: 'ACT', reason: 'Synthetic timing.', expiresAt: '2026-10-11T14:00:00Z' });
  Object.assign(candidate.sentinel, { stake: '5', correlation: 'Synthetic overlap reviewed.', reviewed: true });
  Object.assign(candidate.tactician, { expression: 'Single', reason: 'Synthetic expression.', routes: 'Synthetic routes.', correlation: 'Synthetic correlation.' });
  Object.assign(candidate.final, {
    book: candidate.pricing.book, line: candidate.pricing.line, odds: candidate.pricing.odds,
    stake: candidate.sentinel.stake, capturedAt: RECENT,
    image: { name: 'fictional-test-image.png', data: 'data:image/png;base64,ZmFrZQ==' },
    imageReviewed: true, infoReviewed: true, confirmed: true,
  });
  assert.equal(Slate.evaluate(run, candidate, NOW).ready, true, 'fixture must satisfy the local gates');
  return { run, candidate };
}

function researchPacket(run, candidate, overrides = {}) {
  return {
    schema: 'atlas.research.v1', runId: run.id, phase: 'research',
    candidates: [{ scout: candidate.scout, verify: candidate.verify, oracle: candidate.oracle }],
    ...overrides,
  };
}

function pricingPacket(run, candidate, overrides = {}) {
  return {
    schema: 'atlas.research.v1', runId: run.id, phase: 'pricing',
    candidates: [{
      id: candidate.id, oracleRevision: candidate.sealed.id,
      selection: candidate.scout.selection,
      pricing: { ...candidate.pricing, odds: '+120' },
      kairos: candidate.kairos, tactician: candidate.tactician,
      ...overrides,
    }],
  };
}

test('pricing distinguishes a market hurdle from an independently supplied scenario', () => {
  const hurdle = Pricing.calculatePrice('+113');
  assert.equal(hurdle.decimal, 2.13);
  assert.ok(Math.abs(hurdle.breakEven - 100 / 213) < 1e-12);
  assert.equal(hurdle.expected, null);
  assert.equal(hurdle.fairOdds, null);
  const scenario = Pricing.calculatePrice('+113', '55');
  assert.ok(Math.abs(scenario.expected - 0.1715) < 1e-12);
  assert.ok(Math.abs(scenario.fairOdds - (-100 * 55 / 45)) < 1e-12);
  for (const odds of ['0', '+99', 'garbage', 'Infinity', '+1000001']) {
    assert.throws(() => Pricing.calculatePrice(odds));
  }
  for (const probability of ['0', '100', 'Infinity']) {
    assert.throws(() => Pricing.calculatePrice('+113', probability));
  }
});

test('first-phase intake preserves its source draft and never imports human approvals', () => {
  const { run: source, candidate } = researchFixture();
  const target = Slate.newRun({ date: source.date, timezone: source.timezone }, NOW);
  target.id = source.id;
  const packet = researchPacket(target, candidate);
  Object.assign(packet.candidates[0], {
    id: 'claimed-canonical-identity', approval: { placed: true },
    sentinel: { reviewed: true, stake: '999' },
    final: { confirmed: true, imageReviewed: true, infoReviewed: true },
  });
  const before = JSON.stringify(target);
  const imported = Slate.importResearch(target, JSON.stringify(packet), NOW);
  assert.equal(JSON.stringify(target), before);
  assert.equal(imported.candidates.length, 1);
  const actual = imported.candidates[0];
  assert.equal(actual.scout.selection, candidate.scout.selection);
  assert.notEqual(actual.id, packet.candidates[0].id);
  assert.equal(actual.verify.reviewed, false);
  assert.equal(actual.oracle.reviewed, false);
  assert.equal(actual.sentinel.reviewed, false);
  assert.equal(actual.final.confirmed, false);
  assert.equal(actual.final.imageReviewed, false);
  assert.equal(actual.final.infoReviewed, false);
  assert.equal(actual.approval, null);
  assert.equal(actual.sealed, null);
  assert.equal(actual.pricing.odds, '');
});

test('a failed multi-candidate intake is atomic, including its history', () => {
  const { run: source, candidate } = researchFixture();
  const target = Slate.newRun({ date: source.date, timezone: source.timezone }, NOW);
  target.id = source.id;
  const first = researchPacket(target, candidate).candidates[0];
  const before = JSON.stringify(target);
  const packet = researchPacket(target, candidate, { candidates: [first, first] });
  assert.throws(() => Slate.importResearch(target, JSON.stringify(packet), NOW), /Duplicate candidate/);
  assert.equal(JSON.stringify(target), before);
  packet.candidates[1] = { scout: { event: 'Incomplete second fixture' } };
  assert.throws(() => Slate.importResearch(target, JSON.stringify(packet), NOW), /event and selection/);
  assert.equal(JSON.stringify(target), before);
});

test('cross-slate research requires explicit reuse and retains its original identity', () => {
  const { run: source, candidate } = researchFixture();
  const target = Slate.newRun({ date: source.date, timezone: source.timezone }, NOW);
  target.id = 'synthetic-other-run';
  const packet = researchPacket(source, candidate);
  const raw = JSON.stringify(packet);
  const before = JSON.stringify(target);
  assert.throws(() => Slate.importResearch(target, raw, NOW), /different slate/);
  assert.equal(JSON.stringify(target), before);
  const imported = Slate.importResearch(target, raw, NOW, true);
  const transfer = imported.history.find(entry => entry.detail?.sourceRunId === source.id);
  assert.ok(transfer);
  assert.equal(transfer.detail.targetRunId, target.id);
  assert.deepEqual(transfer.detail.originalPacket, packet);
  assert.equal(imported.candidates[0].verify.reviewed, false);
  assert.equal(imported.candidates[0].oracle.reviewed, false);
  target.date = '2026-10-12';
  assert.throws(() => Slate.importResearch(target, raw, NOW, true), /future events on this slate/);
});

test('ambiguous or malformed research is rejected rather than silently repaired', () => {
  const { run, candidate } = researchFixture();
  const raw = JSON.stringify(researchPacket(run, candidate));
  assert.deepEqual(Slate.parse('Response:\n```json\n' + raw + '\n```'), JSON.parse(raw));
  assert.throws(() => Slate.parse(raw + '\n' + raw), /More than one research batch/);
  assert.throws(() => Slate.parse(raw.slice(0, -1)), /No complete ATLAS research batch/);
  assert.throws(() => Slate.parse('x'.repeat(1000001)), /under 1 MB/);
});

test('freezing requires independent reviewed research before a market quote', () => {
  const { run, candidate } = researchFixture();
  candidate.verify.reviewed = false;
  assert.throws(() => Slate.seal(run, candidate, NOW), /Review the sources yourself/);
  candidate.verify.reviewed = true;
  candidate.oracle.independence = '';
  assert.throws(() => Slate.seal(run, candidate, NOW), /independence evidence/);
  candidate.oracle.independence = 'Synthetic price-independent evidence.';
  candidate.pricing.odds = '+113';
  assert.throws(() => Slate.seal(run, candidate, NOW), /independence before pricing/);
  assert.equal(candidate.sealed, null);
  candidate.pricing.odds = '';
  const frozen = Slate.seal(run, candidate, NOW);
  assert.deepEqual(frozen.oracle, candidate.oracle);
  candidate.oracle.probability = '60';
  assert.equal(frozen.oracle.probability, '55');
  assert.ok(Slate.evaluate(run, candidate, NOW).errors[2].some(message => /changed after freezing/.test(message)));
});

test('pricing binds the same local candidate, exact selection, and frozen revision', () => {
  const { run, candidate } = readyFixture();
  const before = JSON.stringify(run);
  for (const mismatch of [
    { id: 'different-local-candidate' },
    { oracleRevision: 'different-frozen-revision' },
    { selection: 'Different fictional selection' },
  ]) {
    assert.throws(() => Slate.importResearch(run, JSON.stringify(pricingPacket(run, candidate, mismatch)), NOW));
    assert.equal(JSON.stringify(run), before);
  }
  const packet = pricingPacket(run, candidate);
  packet.runId = 'different-local-run';
  assert.throws(() => Slate.importResearch(run, JSON.stringify(packet), NOW, true), /different slate/);
  assert.equal(JSON.stringify(run), before);
});

test('fresh pricing invalidates approvals without changing the frozen forecast', () => {
  const { run, candidate } = readyFixture();
  const approval = Slate.approve(run, candidate, NOW);
  const sealed = Slate.copy(candidate.sealed);
  const before = JSON.stringify(run);
  const imported = Slate.importResearch(run, JSON.stringify(pricingPacket(run, candidate)), NOW);
  const actual = imported.candidates[0];
  assert.equal(JSON.stringify(run), before);
  assert.deepEqual(actual.sealed, sealed);
  assert.equal(actual.pricing.odds, '+120');
  assert.equal(actual.pricing.noPush, false);
  assert.equal(actual.sentinel.reviewed, false);
  assert.equal(actual.final.confirmed, false);
  assert.equal(actual.final.imageReviewed, false);
  assert.equal(actual.final.infoReviewed, false);
  assert.equal(actual.approval, null);
  assert.ok(imported.history.some(entry => entry.action === 'Final confirmation invalidated' && entry.detail.previous.id === approval.id));
});

test('each independent human Final Gate review is mandatory', () => {
  for (const field of ['imageReviewed', 'infoReviewed', 'confirmed']) {
    const { run, candidate } = readyFixture();
    candidate.final[field] = false;
    const before = JSON.stringify(run);
    assert.equal(Slate.evaluate(run, candidate, NOW).ready, false, field);
    assert.throws(() => Slate.approve(run, candidate, NOW), undefined, field);
    assert.equal(JSON.stringify(run), before, 'a blocked approval cannot mutate the draft');
    assert.equal(candidate.approval, null);
  }
});

test('Final Gate rejects changed executable details, stale quotes, and unsupported parlays', () => {
  const mutations = [
    candidate => { candidate.final.book = 'Another Fictional Book'; },
    candidate => { candidate.final.line = 'Fictional player over 11.5'; },
    candidate => { candidate.final.odds = '+120'; },
    candidate => { candidate.final.stake = '6'; },
    candidate => { candidate.pricing.capturedAt = '2026-10-11T11:30:00Z'; },
    candidate => { candidate.final.capturedAt = '2026-10-11T11:30:00Z'; },
    candidate => { candidate.tactician.expression = 'Parlay'; },
    candidate => { candidate.kairos.action = 'WAIT'; },
  ];
  for (const mutate of mutations) {
    const { run, candidate } = readyFixture();
    mutate(candidate);
    assert.equal(Slate.evaluate(run, candidate, NOW).ready, false);
    assert.throws(() => Slate.approve(run, candidate, NOW));
    assert.equal(candidate.approval, null);
  }
});

test('SENTINEL includes other local commitments and never grants approval over a cap', () => {
  const { run, candidate } = readyFixture();
  const other = Slate.newCandidate();
  other.id = 'synthetic-other-candidate';
  other.approval = { stake: 6, placed: false };
  run.candidates.push(other);
  assert.equal(Slate.evaluate(run, candidate, NOW).approved, 6);
  assert.throws(() => Slate.approve(run, candidate, NOW), /slate cap/);
  run.budget = '20';
  run.bankroll = '20';
  assert.throws(() => Slate.approve(run, candidate, NOW), /recorded bankroll/);
  assert.equal(candidate.approval, null);
});

test('an explicit eligible confirmation is only a local decision receipt, never placement', () => {
  const { run, candidate } = readyFixture();
  const approval = Slate.approve(run, candidate, NOW);
  assert.equal(approval.placed, false);
  assert.equal(approval.stake, 5);
  assert.equal(approval.book, candidate.final.book);
  assert.equal(approval.line, candidate.final.line);
  assert.equal(approval.odds, candidate.final.odds);
  const receipt = run.history.at(-1);
  assert.equal(receipt.action, 'Operator Final Gate confirmation; not placement');
  assert.equal(receipt.detail.approval.placed, false);
  assert.equal(receipt.detail.risk.bankroll, '100');
  assert.equal(receipt.detail.risk.otherCommitments, 0);
  const before = JSON.stringify(run);
  assert.throws(() => Slate.approve(run, candidate, NOW), /already exists/);
  assert.equal(JSON.stringify(run), before);
});
