'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'local-only.cjs'), 'utf8');

function stub() {
  const requests = [];
  class Socket { connect() { throw new Error('Unexpected live socket call'); } }
  const sandbox = vm.createContext({
    URL,
    process: { env: {}, cwd: () => '/workspace/Atlas' },
    require(name) {
      if (name === 'node:net') return { Socket };
      if (name === 'node:fs') return { appendFileSync() { throw new Error('Unexpected audit write'); } };
      throw new Error('Unexpected import');
    },
    fetch: async (...args) => { requests.push(args); return { status: 200 }; },
  });
  vm.runInContext(source, sandbox);
  return { request: sandbox.fetch, requests };
}

test('loopback fetch disables automatic redirect-following', async () => {
  const h = stub();
  await h.request('http://127.0.0.1:20128/healthz');
  assert.equal(h.requests.length, 1);
  assert.equal(h.requests[0][1].redirect, 'error');
});

test('caller cannot override redirect policy with follow or manual', async () => {
  const h = stub();
  await h.request('http://localhost:20128/healthz', { redirect: 'follow' });
  await h.request('http://localhost:20128/healthz', { redirect: 'manual' });
  assert.equal(h.requests.length, 2);
  for (const [, init] of h.requests) assert.equal(init.redirect, 'error');
});

test('external first-hop URL remains blocked before fetch', async () => {
  const h = stub();
  await assert.rejects(h.request('https://provider.example/a'), /blocks non-loopback fetch/);
  assert.equal(h.requests.length, 0);
});
