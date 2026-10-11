'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { once } = require('node:events');

// Exercise the existing preload with real HTTP, entirely on an ephemeral loopback
// listener. No gateway, external destination, credential, or model is involved.
require('../local-only.cjs');

test('real loopback fetch works but a redirect never reaches its target', async () => {
  let redirects = 0;
  let targets = 0;
  const server = http.createServer((request, response) => {
    if (request.url === '/redirect') {
      redirects += 1;
      response.writeHead(302, { Location: '/target' });
      response.end();
    } else if (request.url === '/target') {
      targets += 1;
      response.end('unexpected target request');
    } else {
      response.end('ok');
    }
  });
  try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    const healthy = await fetch(`${base}/healthz`, { signal: AbortSignal.timeout(5000) });
    assert.equal(healthy.status, 200);
    assert.equal(await healthy.text(), 'ok');

    await assert.rejects(
      fetch(`${base}/redirect`, { redirect: 'follow', signal: AbortSignal.timeout(5000) }),
      error => error instanceof TypeError && /redirect/i.test(String(error.cause)),
    );
    assert.equal(redirects, 1);
    assert.equal(targets, 0);
  } finally {
    await new Promise(resolve => {
      server.close(resolve);
      server.closeAllConnections();
    });
  }
});
