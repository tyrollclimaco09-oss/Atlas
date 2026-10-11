'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createBridge, decodeCandidate, candidateRequestURL } = require('../canonical-read.js');

// These first fixtures exercise an optional INTERNAL decoder override, not a wire envelope.
// The default deployed envelope is verified below; its production version-domain
// validator remains an explicit injection. All fixture version values are synthetic.
const candidateA = 'fixture-candidate-A';
const candidateB = 'fixture-candidate-B';
const version1 = 'fixture-v1';
const version2 = 'fixture-v2';
const secretMarker = 'FIXTURE_PRIVATE_VALUE_MUST_NOT_ESCAPE';
const binding = (candidateKey = candidateA, expectedStateVersion = version1) => ({
  candidateKey,
  expectedStateVersion,
});

function fixturePayload(candidateKey = candidateA, stateVersion = version1) {
  return {
    testOnlyEnvelope: true,
    fixtureRecord: { testIdentity: candidateKey, testVersion: stateVersion },
    unrelatedPrivateState: secretMarker,
  };
}

function fixtureDecoder(payload) {
  if (!payload || payload.testOnlyEnvelope !== true || !('fixtureRecord' in payload)) {
    throw new TypeError('Malformed INTERNAL fixture envelope');
  }
  if (payload.fixtureRecord === null) return null;
  const record = payload.fixtureRecord;
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new TypeError('Malformed INTERNAL fixture record');
  }
  return { candidateKey: record.testIdentity, stateVersion: record.testVersion };
}

function fixtureVersionValidator(version) {
  return typeof version === 'string' && /^fixture-v[1-9][0-9]*$/.test(version);
}

function response(status = 200, payload = fixturePayload()) {
  return { status, json: async () => payload };
}

function bridgeWith(transport, overrides = {}) {
  return createBridge({
    transport,
    decodeCandidate: fixtureDecoder,
    validateStateVersion: fixtureVersionValidator,
    ...overrides,
  });
}

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function assertNoPrivateData(snapshot) {
  assert.equal(JSON.stringify(snapshot).includes(secretMarker), false);
  assert.equal(JSON.stringify(snapshot).includes('unrelatedPrivateState'), false);
}

test('initial bridge state preserves the locally saved baseline', () => {
  const bridge = bridgeWith(async () => response());
  assert.equal(bridge.getState().status, 'locally_saved');
  assertNoPrivateData(bridge.getState());
});

test('live access stays disabled unless transport and version validation are explicitly injected', async (t) => {
  for (const omitted of ['transport', 'validateStateVersion']) {
    await t.test(`missing ${omitted}`, async () => {
      let calls = 0;
      const options = {
        transport: async () => { calls += 1; return response(); },
        decodeCandidate: fixtureDecoder,
        validateStateVersion: fixtureVersionValidator,
      };
      delete options[omitted];
      const bridge = createBridge(options);
      assert.equal((await bridge.check(binding())).status, 'unavailable');
      assert.equal(calls, 0, 'a partial adapter must never invoke transport');
    });
  }
});

test('200 data confirms only a minimal frozen candidate GET descriptor', async () => {
  let descriptor;
  const bridge = bridgeWith(async (request) => {
    descriptor = request;
    assert.equal(Object.isFrozen(request), true);
    return response();
  });
  const state = await bridge.check(binding());
  assert.deepEqual(descriptor, { method: 'GET', mode: 'candidate', candidate_key: candidateA });
  assert.equal(state.status, 'remote_confirmed');
  assert.equal(bridge.getState().status, 'remote_confirmed');
  assertNoPrivateData(state);
});

test('200 null is a missing candidate, never remote confirmation', async () => {
  const bridge = bridgeWith(async () => response(200, {
    testOnlyEnvelope: true,
    fixtureRecord: null,
  }));
  assert.equal((await bridge.check(binding())).status, 'missing_candidate');
});

test('400, 401, 403 and 500 fail closed without decoding response bodies', async (t) => {
  const expected = new Map([[400, 'unavailable'], [401, 'unauthorized'], [403, 'unauthorized'], [500, 'unavailable']]);
  for (const [status, expectedStatus] of expected) {
    await t.test(`HTTP ${status}`, async () => {
      let bodyReads = 0;
      let decodes = 0;
      const bridge = bridgeWith(async () => ({
        status,
        json: async () => { bodyReads += 1; throw new Error(secretMarker); },
      }), {
        decodeCandidate: () => { decodes += 1; throw new Error(secretMarker); },
      });
      const state = await bridge.check(binding());
      assert.equal(state.status, expectedStatus);
      assert.equal(bodyReads, 0);
      assert.equal(decodes, 0);
      assertNoPrivateData(state);
    });
  }
});

test('missing candidate binding causes no request', async (t) => {
  for (const candidateKey of [undefined, null, '', '   ']) {
    await t.test(`binding ${String(candidateKey)}`, async () => {
      let calls = 0;
      const bridge = bridgeWith(async () => { calls += 1; return response(); });
      assert.equal((await bridge.check({ candidateKey, expectedStateVersion: version1 })).status, 'missing_candidate');
      assert.equal(calls, 0);
    });
  }
});

test('a different returned candidate cannot synchronize the selected candidate', async () => {
  const bridge = bridgeWith(async () => response(200, fixturePayload(candidateB)));
  assert.equal((await bridge.check(binding())).status, 'stale_conflicting');
});

test('a changed state version is stale until the expected binding is explicitly updated', async () => {
  const bridge = bridgeWith(async () => response(200, fixturePayload(candidateA, version2)));
  assert.equal((await bridge.check(binding())).status, 'stale_conflicting');
  assert.equal((await bridge.check(binding(candidateA, version2))).status, 'remote_confirmed');
});

test('state versions use Object.is rather than coercion', async (t) => {
  // Both domains below are deliberate fixture domains, not production type claims.
  const validateFixturePrimitive = (value) =>
    typeof value === 'number' && Number.isInteger(value) ||
    typeof value === 'string' && /^\d+$/.test(value);
  for (const [expected, actual, label] of [[7, '7', 'number versus string'], [0, -0, 'positive versus negative zero']]) {
    await t.test(label, async () => {
      const bridge = bridgeWith(async () => response(200, fixturePayload(candidateA, actual)), {
        validateStateVersion: validateFixturePrimitive,
      });
      assert.equal((await bridge.check(binding(candidateA, expected))).status, 'stale_conflicting');
    });
  }
});

test('an invalid remote version cannot become synchronized', async (t) => {
  for (const stateVersion of [undefined, null, {}, [], 1, '']) {
    await t.test(`invalid ${JSON.stringify(stateVersion)}`, async () => {
      const bridge = bridgeWith(async () => response(200, {
        testOnlyEnvelope: true,
        fixtureRecord: { testIdentity: candidateA, testVersion: stateVersion },
      }));
      assert.equal((await bridge.check(binding())).status, 'unavailable');
    });
  }
  await t.test('an invalid expected local version prevents transport entirely', async () => {
    let calls = 0;
    const bridge = bridgeWith(async () => { calls += 1; return response(); });
    assert.equal((await bridge.check({
      candidateKey: candidateA,
      expectedStateVersion: null,
    })).status, 'stale_conflicting');
    assert.equal(calls, 0);
  });
});

test('malformed 200 data is unavailable and cannot leak its payload', async () => {
  const bridge = bridgeWith(async () => response(200, { malformedPrivatePayload: secretMarker }));
  const state = await bridge.check(binding());
  assert.equal(state.status, 'unavailable');
  assertNoPrivateData(state);
});

test('JSON failure, decoder failure and network failure remain unavailable', async (t) => {
  const variants = [
    ['JSON rejection', async () => ({ status: 200, json: async () => { throw new Error(secretMarker); } }), {}],
    ['decoder rejection', async () => response(), { decodeCandidate: () => { throw new Error(secretMarker); } }],
    ['network rejection', async () => { throw new Error(secretMarker); }, {}],
  ];
  for (const [label, transport, overrides] of variants) {
    await t.test(label, async () => {
      const bridge = bridgeWith(transport, overrides);
      const state = await bridge.check(binding());
      assert.equal(state.status, 'unavailable');
      assertNoPrivateData(state);
    });
  }
});

test('version validation requires explicit true and fails closed on exceptions', async (t) => {
  await t.test('validator exception', async () => {
    const bridge = bridgeWith(async () => response(), {
      validateStateVersion: () => { throw new Error(secretMarker); },
    });
    const state = await bridge.check(binding());
    assert.notEqual(state.status, 'remote_confirmed');
    assertNoPrivateData(state);
  });
  for (const truthyValue of [1, 'true', {}]) {
    await t.test(`nonboolean ${JSON.stringify(truthyValue)}`, async () => {
      let calls = 0;
      const bridge = bridgeWith(async () => { calls += 1; return response(); }, {
        validateStateVersion: () => truthyValue,
      });
      assert.equal((await bridge.check(binding())).status, 'stale_conflicting');
      assert.equal(calls, 0);
    });
  }
  // These are client identity/comparison limits, not asserted SQL version types.
  const unsupportedVersions = [
    ['mutable object', {}],
    ['mutable array', []],
    ['function', () => {}],
    ['symbol', Symbol('fixture-version')],
    ['bigint', 1n],
    ['null', null],
    ['undefined', undefined],
    ['NaN', NaN],
    ['positive infinity', Infinity],
    ['negative infinity', -Infinity],
    ['unsafe integer', Number.MAX_SAFE_INTEGER + 1],
  ];
  for (const [label, unsupportedVersion] of unsupportedVersions) {
    await t.test(`permissive validator cannot admit ${label}`, async () => {
      let calls = 0;
      const bridge = createBridge({
        transport: async () => {
          calls += 1;
          return response(200, candidateEnvelope({
            candidate_key: candidateA,
            state_version: unsupportedVersion,
          }));
        },
        validateStateVersion: () => true,
      });
      assert.equal((await bridge.check({
        candidateKey: candidateA,
        expectedStateVersion: unsupportedVersion,
      })).status, 'stale_conflicting');
      assert.equal(calls, 0);
    });
  }
});

test('a later candidate request wins over an older successful response', async () => {
  const older = deferred();
  const bridge = bridgeWith(async (request) => request.candidate_key === candidateA
    ? older.promise
    : response(200, fixturePayload(candidateB)));
  const first = bridge.check(binding(candidateA));
  const second = await bridge.check(binding(candidateB));
  assert.equal(second.status, 'remote_confirmed');
  older.resolve(response(200, fixturePayload(candidateA)));
  await first;
  assert.deepEqual(bridge.getState(), second, 'the stale response must not replace the newer candidate binding');
});

test('a later unauthorized result cannot be overwritten by an older successful response', async () => {
  const older = deferred();
  const bridge = bridgeWith(async (request) => request.candidate_key === candidateA
    ? older.promise
    : response(401));
  const first = bridge.check(binding(candidateA));
  const second = await bridge.check(binding(candidateB));
  assert.equal(second.status, 'unauthorized');
  older.resolve(response());
  await first;
  assert.deepEqual(bridge.getState(), second);
});

test('invalidate removes remote confirmation and rejects an in-flight late confirmation', async () => {
  const pending = deferred();
  let calls = 0;
  const bridge = bridgeWith(async () => ++calls === 2 ? pending.promise : response());
  assert.equal((await bridge.check(binding())).status, 'remote_confirmed');
  const inFlight = bridge.check(binding());
  bridge.invalidate();
  assert.equal(bridge.getState().status, 'stale_conflicting');
  pending.resolve(response());
  await inFlight;
  assert.equal(bridge.getState().status, 'stale_conflicting');
  assert.equal((await bridge.check(binding())).status, 'remote_confirmed');
});

test('private response state, injected credentials and exception details never enter published snapshots', async () => {
  const published = [];
  const bridge = bridgeWith(async () => response(), {
    onState: (state) => published.push(state),
    // Extra options are intentionally ignored; transport owns its private authentication.
    privilegedCredential: secretMarker,
  });
  const confirmed = await bridge.check(binding());
  assert.equal(confirmed.status, 'remote_confirmed');
  bridge.invalidate();
  for (const state of [confirmed, bridge.getState(), ...published]) assertNoPrivateData(state);
});

test('a failed later check revokes an earlier confirmation', async () => {
  let calls = 0;
  const bridge = bridgeWith(async () => ++calls === 1 ? response() : response(500));
  assert.equal((await bridge.check(binding())).status, 'remote_confirmed');
  assert.equal((await bridge.check(binding())).status, 'unavailable');
  assert.equal(bridge.getState().status, 'unavailable');
});

// The wire envelope below follows the user-supplied deployed-source contract.
// Its version VALUES remain synthetic; no production SQL type is asserted here.
function candidateEnvelope(data = {
  candidate_key: candidateA,
  state_version: version1,
  ignored_private_state: secretMarker,
}) {
  return {
    ok: true,
    mode: 'candidate',
    human_final_gate_required: true,
    execution_authority: false,
    data,
  };
}

test('verified candidate wire decoder extracts only identity and version', () => {
  assert.deepEqual(decodeCandidate(candidateEnvelope()), {
    candidateKey: candidateA,
    stateVersion: version1,
  });
  assert.equal(decodeCandidate(candidateEnvelope(null)), null);
});

test('the default decoder confirms the actual candidate envelope without importing row state', async () => {
  const published = [];
  const bridge = createBridge({
    transport: async () => response(200, candidateEnvelope()),
    validateStateVersion: fixtureVersionValidator,
    onState: (state) => published.push(state),
  });
  const confirmed = await bridge.check(binding());
  assert.equal(confirmed.status, 'remote_confirmed');
  assert.equal(confirmed.candidateKey, candidateA);
  assert.equal(confirmed.stateVersion, version1);
  for (const state of [confirmed, ...published]) assertNoPrivateData(state);
});

test('the actual candidate wire contract recognizes null and rejects malformed envelopes', async (t) => {
  const rejected = [
    ['not ok', { ...candidateEnvelope(), ok: false }],
    ['wrong mode', { ...candidateEnvelope(), mode: 'board' }],
    ['missing human gate', { ...candidateEnvelope(), human_final_gate_required: false }],
    ['execution authority', { ...candidateEnvelope(), execution_authority: true }],
    ['missing authority flag', { ok: true, mode: 'candidate', human_final_gate_required: true, data: null }],
    ['array data', candidateEnvelope([])],
    ['missing candidate identity', candidateEnvelope({ state_version: version1 })],
    ['missing state version', candidateEnvelope({ candidate_key: candidateA })],
    ['undefined version', candidateEnvelope({ candidate_key: candidateA, state_version: undefined })],
    ['nonstring candidate identity', candidateEnvelope({ candidate_key: 42, state_version: version1 })],
    ['unrecognized empty payload', {}],
  ];
  for (const [label, payload] of rejected) {
    await t.test(label, async () => {
      const bridge = createBridge({
        transport: async () => response(200, payload),
        validateStateVersion: fixtureVersionValidator,
      });
      assert.equal((await bridge.check(binding())).status, 'unavailable');
    });
  }
  await t.test('recognized null candidate', async () => {
    const bridge = createBridge({
      transport: async () => response(200, candidateEnvelope(null)),
      validateStateVersion: fixtureVersionValidator,
    });
    assert.equal((await bridge.check(binding())).status, 'missing_candidate');
  });
});

test('candidate keys are trimmed only at the explicit request binding boundary', async () => {
  let request;
  const bridge = createBridge({
    transport: async (descriptor) => { request = descriptor; return response(200, candidateEnvelope()); },
    validateStateVersion: fixtureVersionValidator,
  });
  assert.equal((await bridge.check(binding(`  ${candidateA}  `))).status, 'remote_confirmed');
  assert.equal(request.candidate_key, candidateA);

  const mismatched = createBridge({
    transport: async () => response(200, candidateEnvelope({
      candidate_key: `  ${candidateA}  `,
      state_version: version1,
    })),
    validateStateVersion: fixtureVersionValidator,
  });
  assert.equal((await mismatched.check(binding())).status, 'stale_conflicting',
    'returned identity is compared exactly rather than silently normalized');
});

test('the request URL uses only the verified candidate query contract with encoded identity', () => {
  const endpoint = 'https://lhliqbbooproqtslmgqi.supabase.co/functions/v1/atlas-site-runtime';
  const candidateKey = 'fixture / ? & candidate';
  const url = new URL(candidateRequestURL(endpoint, `  ${candidateKey}  `));
  assert.equal(url.origin + url.pathname, endpoint);
  assert.deepEqual([...url.searchParams.keys()], ['mode', 'candidate_key']);
  assert.equal(url.searchParams.get('mode'), 'candidate');
  assert.equal(url.searchParams.get('candidate_key'), candidateKey);
  assert.equal(url.searchParams.has('run_id'), false);
  assert.equal(url.username, '');
  assert.equal(url.password, '');
  assert.equal(url.hash, '');
});

test('the request URL rejects unknown endpoints, existing query/auth fragments and missing identity', async (t) => {
  const endpoint = 'https://lhliqbbooproqtslmgqi.supabase.co/functions/v1/atlas-site-runtime';
  const rejectedEndpoints = [
    ['insecure transport', endpoint.replace('https:', 'http:')],
    ['unknown host', endpoint.replace('lhliqbbooproqtslmgqi.supabase.co', 'fixture.invalid')],
    ['unknown function', endpoint.replace('atlas-site-runtime', 'atlas-runtime-intake')],
    ['pre-existing mode query', `${endpoint}?mode=memory`],
    ['credential query', `${endpoint}?credential=${secretMarker}`],
    ['URL user information', endpoint.replace('https://', `https://${secretMarker}@`)],
    ['URL fragment', `${endpoint}#fixture`],
  ];
  for (const [label, rejectedEndpoint] of rejectedEndpoints) {
    await t.test(`reject ${label}`, () => {
      assert.throws(() => candidateRequestURL(rejectedEndpoint, candidateA));
    });
  }
  assert.throws(() => candidateRequestURL(endpoint, '   '));
});
