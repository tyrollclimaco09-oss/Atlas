// Extra defense for validation. Not an OS firewall or a native-library sandbox.
const net = require('node:net');
const fs = require('node:fs');
const allowed = new Set(['127.0.0.1', 'localhost', '::1']);
const originalConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const connectionArgs = Array.isArray(args[0]) ? args[0] : args;
  const options = connectionArgs[0];
  const host = typeof options === 'object' ? options.host :
    (typeof connectionArgs[1] === 'string' ? connectionArgs[1] : 'localhost');
  // Node accepts both connect(path) and connect({ path }), as well as string ports.
  const pipePath = typeof options === 'string' &&
    (!Number.isFinite(Number(options)) || Number(options) < 0);
  if (pipePath || (typeof options === 'object' && options.path)) {
    throw new Error('ATLAS validation blocks outgoing Unix sockets');
  }
  if (host && !allowed.has(host)) {
    throw new Error('ATLAS validation blocks non-loopback Node sockets');
  }
  if (typeof options === 'object' && typeof options.lookup === 'function' &&
      host !== '127.0.0.1' && host !== '::1') {
    throw new Error('ATLAS validation blocks custom loopback DNS lookup');
  }
  return originalConnect.apply(this, args);
};
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (!allowed.has(url.hostname)) {
    throw new Error('ATLAS validation blocks non-loopback fetch');
  }
  if (process.env.ATLAS_REQUEST_AUDIT && url.pathname === '/v1/chat/completions') {
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : {};
    fs.appendFileSync(process.env.ATLAS_REQUEST_AUDIT, JSON.stringify({
      cwd: process.cwd(), path: url.pathname, host: url.host, model: body.model,
    }) + '\n', { mode: 0o600 });
  }
  return originalFetch(input, init);
};
