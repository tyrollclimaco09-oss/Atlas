import {test} from 'node:test';import assert from 'node:assert/strict';
import {ENDPOINT,ORIGIN,verifyAnonymousDenied} from '../scripts/research/verify-anonymous-edge-v14.mjs';
test('expected isolated read-only function only',()=>assert.equal(ENDPOINT.endsWith('/atlas-slate-duo-v10?mode=integration'),true));
test('unauthenticated HTTP 401 accepted',async()=>assert.equal((await verifyAnonymousDenied({transport:async()=>({status:401})})).http_status,401));
test('unauthenticated HTTP 403 accepted',async()=>assert.equal((await verifyAnonymousDenied({transport:async()=>({status:403})})).http_status,403));
test('unauthenticated HTTP 200 rejected',async()=>assert.rejects(verifyAnonymousDenied({transport:async()=>({status:200})}),/AUTH_GATE_UNEXPECTED_HTTP_200/));
test('unauthenticated HTTP 500 rejected',async()=>assert.rejects(verifyAnonymousDenied({transport:async()=>({status:500})}),/AUTH_GATE_UNEXPECTED_HTTP_500/));
test('request never includes tokens',async()=>{let request;await verifyAnonymousDenied({transport:async(u,o)=>{request=o;return{status:401}}});assert.equal(request.headers.authorization,undefined);assert.equal(request.headers.apikey,undefined);assert.equal(request.headers.origin,ORIGIN)});
test('request never implies authenticated proof',async()=>assert.equal((await verifyAnonymousDenied({transport:async()=>({status:401})})).authenticated_http_proven,false));
