'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
require('../pricing.js');
const Slate = require('../slate-engine.js');

// Fictional device-local workflow only: no storage, real account, provider,
// sportsbook, backend, credentials, or production execution is exercised.
const NOW = Date.parse('2026-03-02T12:00:00Z');
const RECENT = '2026-03-02T11:59:00Z';

function researchFixture() {
  const run = Slate.newRun({ date: '2026-03-02', timezone: 'UTC' }, NOW);
  run.id = 'synthetic-arc2-local-run';
  const candidate = Slate.newCandidate();
  candidate.id = 'synthetic-arc2-local-candidate';
  Object.assign(candidate.scout, {
    event: 'Fictional Alpha vs Fictional Beta',
    selection: 'Fictional player over 10.5', market: 'Player prop',
    startsAt: '2026-03-02T15:00:00Z',
    discovery: 'Synthetic gate regression evidence.',
    source: 'https://example.invalid/fixture/schedule',
  });
  Object.assign(candidate.verify, {
    availability: 'Synthetic availability evidence.',
    source: 'https://example.invalid/fixture/availability', checkedAt: RECENT,
    rules: 'Synthetic two-outcome, no-push settlement.', reviewed: true,
  });
  Object.assign(candidate.oracle, {
    thesis: 'Synthetic opportunity thesis.', counter: 'Synthetic counter-case.',
    invalidation: 'Synthetic role-change condition.', method: 'Fictional model fixture.',
    probability: '55', independence: 'Synthetic price-independent research.', reviewed: true,
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
    comparison: 'Synthetic second-book comparison.', noPush: true,
  });
  Object.assign(candidate.kairos, { action: 'ACT', reason: 'Synthetic timing.', expiresAt: '2026-03-02T14:00:00Z' });
  Object.assign(candidate.sentinel, { stake: '5', correlation: 'Synthetic overlap reviewed.', reviewed: true });
  Object.assign(candidate.tactician, { expression: 'Single', reason: 'Synthetic expression.', routes: 'Synthetic routes.', correlation: 'Synthetic correlation.' });
  Object.assign(candidate.final, {
    book: candidate.pricing.book, line: candidate.pricing.line, odds: candidate.pricing.odds,
    stake: candidate.sentinel.stake, capturedAt: RECENT,
    image: { name: 'synthetic.png', data: 'data:image/png;base64,ZmFrZQ==' },
    imageReviewed: true, infoReviewed: true, confirmed: true,
  });
  assert.equal(Slate.evaluate(run, candidate, NOW).ready, true, 'positive fixture must satisfy the existing manual gates');
  return { run, candidate };
}

function assertApprovalBlocked(run, candidate, now = NOW) {
  const before = JSON.stringify(run);
  assert.equal(Slate.evaluate(run, candidate, now).ready, false);
  assert.throws(() => Slate.approve(run, candidate, now));
  assert.equal(JSON.stringify(run), before, 'failed confirmation must not change the draft or history');
  assert.equal(candidate.approval, null);
}

test('ARCII positive control retains singles-only manual confirmation and no placement', () => {
  const { run, candidate } = readyFixture();
  const approval = Slate.approve(run, candidate, NOW);
  assert.equal(approval.placed, false);
  assert.equal(approval.line, candidate.scout.selection);
  assert.equal(run.history.at(-1).action, 'Operator Final Gate confirmation; not placement');
});

test('ARCII valid leap day, explicit offsets, minute precision and fractional seconds remain supported', () => {
  const cases = [
    ['2024-02-29T11:59:00Z', '2024-02-29T12:00:00Z'],
    ['2026-03-01T00:30:00+02:00', '2026-02-28T23:00:00Z'],
    ['2026-03-01T23:30:00-02:00', '2026-03-02T02:00:00Z'],
    ['2026-03-02T11:59Z', '2026-03-02T12:00:00Z'],
    ['2026-03-02T11:59:00.1Z', '2026-03-02T12:00:00Z'],
    ['2026-03-02T11:59:00.12Z', '2026-03-02T12:00:00Z'],
    ['2026-03-02T11:59:00.123Z', '2026-03-02T12:00:00Z'],
  ];
  for (const [timestamp, now] of cases) {
    assert.equal(Slate.fresh(timestamp, 60, Date.parse(now)), true, timestamp);
  }
});

test('ARCII impossible calendar dates cannot normalize into a fresh observation', async (t) => {
  const cases = [
    ['2026-02-30T11:59:00Z', '2026-03-02T12:00:00Z'],
    ['2026-02-29T11:59:00Z', '2026-03-01T12:00:00Z'],
    ['2026-04-31T11:59:00Z', '2026-05-01T12:00:00Z'],
    ['2026-02-30T13:59:00+02:00', '2026-03-02T12:00:00Z'],
    ['2026-03-01T24:00:00Z', '2026-03-02T00:01:00Z'],
    ['2026-03-02T11:59:60Z', '2026-03-02T12:00:00Z'],
    ['2026-03-02T11:59:00+24:00', '2026-03-02T12:00:00Z'],
    ['2026-03-02T11:59:00+00:60', '2026-03-02T12:00:00Z'],
  ];
  for (const [timestamp, now] of cases) await t.test(timestamp, () => {
    assert.equal(Slate.fresh(timestamp, 15, Date.parse(now)), false);
  });
});

test('ARCII freezing rejects an impossible event date without mutating the draft', () => {
  const { run, candidate } = researchFixture();
  candidate.scout.startsAt = '2026-02-30T15:00:00Z';
  const before = JSON.stringify(run);
  assert.throws(() => Slate.seal(run, candidate, NOW));
  assert.equal(JSON.stringify(run), before);
  assert.equal(candidate.sealed, null);
});

test('ARCII impossible quote, screenshot, expiry, availability and account dates block Final Gate', async (t) => {
  const mutations = [
    ['quote', (run, c) => { c.pricing.capturedAt = '2026-02-30T11:59:00Z'; }],
    ['screenshot', (run, c) => { c.final.capturedAt = '2026-02-30T11:59:00Z'; }],
    ['expiry', (run, c) => { c.kairos.expiresAt = '2026-02-30T14:00:00Z'; }],
    ['availability', (run, c) => { c.verify.checkedAt = '2026-02-30T11:59:00Z'; }],
    ['account', (run) => { run.accountAt = '2026-02-30T11:59:00Z'; }],
  ];
  for (const [name, mutate] of mutations) await t.test(name, () => {
    const { run, candidate } = readyFixture();
    mutate(run, candidate);
    assertApprovalBlocked(run, candidate);
  });
});

test('ARCII matching PRICING and Final Gate cannot authorize a different frozen selection', async (t) => {
  for (const selection of ['Fictional OTHER player over 10.5', 'Fictional player under 10.5', 'Fictional player over 11.5']) {
    await t.test(selection, () => {
      const { run, candidate } = readyFixture();
      candidate.pricing.line = selection;
      candidate.final.line = selection;
      assertApprovalBlocked(run, candidate);
    });
  }
});

test('ARCII pricing intake rejects contradictory nested selection atomically', () => {
  const { run, candidate } = readyFixture();
  const packet = {
    schema: 'atlas.research.v1', runId: run.id, phase: 'pricing',
    candidates: [{
      id: candidate.id, oracleRevision: candidate.sealed.id,
      selection: candidate.scout.selection,
      pricing: { ...candidate.pricing, line: 'Fictional OTHER player under 99.5' },
    }],
  };
  const before = JSON.stringify(run);
  assert.throws(() => Slate.importResearch(run, JSON.stringify(packet), NOW));
  assert.equal(JSON.stringify(run), before, 'a rejected packet must preserve all candidates, approvals and history');
});

test('ARCII exact selection intake preserves frozen research and requires fresh human review', () => {
  const { run, candidate } = readyFixture();
  const packet = {
    schema: 'atlas.research.v1', runId: run.id, phase: 'pricing',
    candidates: [{ id: candidate.id, oracleRevision: candidate.sealed.id,
      selection: candidate.scout.selection,
      pricing: { ...candidate.pricing, line: `  ${candidate.scout.selection}  `, odds: '+120' } }],
  };
  const before = JSON.stringify(run);
  const imported = Slate.importResearch(run, JSON.stringify(packet), NOW);
  assert.equal(JSON.stringify(run), before, 'successful intake returns a new draft');
  assert.deepEqual(imported.candidates[0].sealed, candidate.sealed);
  assert.equal(imported.candidates[0].final.confirmed, false);
  assert.equal(imported.candidates[0].final.imageReviewed, false);
  assert.equal(imported.candidates[0].pricing.noPush, false);
  assert.equal(imported.candidates[0].sentinel.reviewed, false);
  assertApprovalBlocked(imported, imported.candidates[0]);
});

test('ARCII selection binding trims presentation whitespace but does not relax identity', () => {
  const { run, candidate } = readyFixture();
  candidate.pricing.line = `  ${candidate.scout.selection}  `;
  candidate.final.line = candidate.scout.selection;
  assert.equal(Slate.evaluate(run, candidate, NOW).ready, true);
  assert.equal(Slate.approve(run, candidate, NOW).placed, false);
});

test('ARCII current timestamps and exact selection still require every independent human signoff', async (t) => {
  for (const field of ['imageReviewed', 'infoReviewed', 'confirmed']) await t.test(field, () => {
    const { run, candidate } = readyFixture();
    candidate.final[field] = false;
    assertApprovalBlocked(run, candidate);
  });
});
