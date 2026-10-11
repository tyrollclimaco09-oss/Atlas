const assert = require('node:assert/strict');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'local-only.cjs'), 'utf8');

// Execute the real preload with stubbed I/O. Tests never open sockets or fetch.
function harness() {
  const connections = [];
  const requests = [];
  const audit = [];
  class Socket {
    connect(...args) {
      connections.push(args);
      return this;
    }
  }
  const context = vm.createContext({
    URL,
    require(name) {
      if (name === 'node:net') return { Socket };
      if (name === 'node:fs') return {
        appendFileSync: (...args) => audit.push(args),
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
    process: { env: { ATLAS_REQUEST_AUDIT: '/ignored/request-audit' }, cwd: () => '/workspace/Atlas' },
    fetch: async (...args) => {
      requests.push(args);
      return { status: 400 };
    },
  });
  vm.runInContext(source, context, { filename: 'local-only.cjs' });
  return { socket: new Socket(), fetch: context.fetch, connections, requests, audit };
}

test('string Unix socket paths are rejected before connecting', () => {
  const h = harness();
  for (const value of ['/tmp/gateway.sock', './gateway.sock', '@abstract-socket']) {
    assert.throws(() => h.socket.connect(value), /blocks outgoing Unix sockets/);
  }
  assert.equal(h.connections.length, 0);
});

test('object Unix socket paths are rejected before connecting', () => {
  const h = harness();
  assert.throws(() => h.socket.connect({ path: '/tmp/gateway.sock' }), /blocks outgoing Unix sockets/);
  assert.throws(() => h.socket.connect(net._normalizeArgs(['/tmp/gateway.sock', () => {}])), /blocks outgoing Unix sockets/);
  assert.equal(h.connections.length, 0);
});

test('external TCP destinations are rejected across positional and normalized inputs', () => {
  const h = harness();
  for (const args of [
    [{ port: 443, host: 'provider.example' }],
    [443, '198.51.100.1'],
    ['443', 'provider.example'],
    [net._normalizeArgs([443, 'provider.example', () => {}])],
    [[{ port: 443, host: 'provider.example' }]],
    // Extra wrapper input hardening; this unmarked array is not a native Node signature.
    [[443, 'provider.example']],
  ]) {
    assert.throws(() => h.socket.connect(...args), /blocks non-loopback Node sockets/);
  }
  assert.equal(h.connections.length, 0);
});

test('loopback TCP and numeric string ports retain original connect arguments', () => {
  const h = harness();
  const callback = () => {};
  // Node's normalizer marks this array with the internal symbol Socket.connect uses.
  const normalized = net._normalizeArgs([20128, '127.0.0.1', callback]);
  for (const args of [
    [{ port: 20128, host: '127.0.0.1' }],
    [{ port: 20128, host: '::1' }],
    [20128, 'localhost'],
    ['20128', '127.0.0.1'],
    [20128],
    [normalized],
    [[20128, '127.0.0.1']],
  ]) {
    assert.equal(h.socket.connect(...args), h.socket);
    assert.deepEqual(h.connections.at(-1), args);
  }
  assert.equal(h.connections.length, 7);
  assert.equal(normalized[1], callback);
});

test('external fetch is rejected without calling the original fetch', async () => {
  const h = harness();
  await assert.rejects(h.fetch('https://provider.example/v1/chat/completions'), /blocks non-loopback fetch/);
  assert.equal(h.requests.length, 0);
  assert.equal(h.audit.length, 0);
});

test('custom localhost DNS lookup is rejected before it can redirect a socket', () => {
  const h = harness();
  let lookups = 0;
  const lookup = () => { lookups += 1; };
  for (const options of [{ port: 20128, host: 'localhost', lookup }, { port: 20128, lookup }]) {
    assert.throws(() => h.socket.connect(options), /blocks custom loopback DNS lookup/);
  }
  assert.equal(lookups, 0);
  assert.equal(h.connections.length, 0);
});

test('loopback request audit contains metadata only', async () => {
  const h = harness();
  await h.fetch('http://127.0.0.1:20128/v1/chat/completions', {
    headers: { Authorization: 'Bearer test-placeholder' },
    body: JSON.stringify({ model: 'atlas-unconfigured-probe', messages: [{ content: 'test prompt' }] }),
  });
  assert.equal(h.requests.length, 1);
  assert.equal(h.audit.length, 1);
  assert.deepEqual(JSON.parse(h.audit[0][1]), {
    cwd: '/workspace/Atlas', path: '/v1/chat/completions',
    host: '127.0.0.1:20128', model: 'atlas-unconfigured-probe',
  });
  assert.equal(h.audit[0][2].mode, 0o600);
});
