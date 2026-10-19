'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const {build,files}=require('./package-private-preview.cjs');
const {pathToFileURL}=require('node:url');

async function packaged(action){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-private-preview-'));
 const folder=path.join(tmp,'dist');
 try{return await action(folder,tmp);}
 finally{fs.rmSync(tmp,{recursive:true,force:true});}
}
test('package generator produces deterministic, isolated static files and API entrypoint',async()=>{
 await packaged(async dest=>{
  const receipt=build(dest);
  assert.equal(receipt.schema,'atlas.private-preview.package.v1');
  assert.equal(receipt.deployment,'NOT_DEPLOYED');
  assert.equal(receipt.login,'REQUIRES_VERCEL_AUTH_ALL_DEPLOYMENTS');
  assert.equal(receipt.readonly,true);
  assert.equal(receipt.files.length,Object.keys(files).length+2);
  for(const entry of receipt.files){
   const source=fs.readFileSync(path.join(dest,entry.file));
   assert.equal(source.length,entry.bytes);
   assert.equal(crypto.createHash('sha256').update(source).digest('hex'),entry.sha256);
  }
  const dir=fs.readdirSync(dest);
  assert.ok(dir.includes('api'));assert.ok(dir.includes('index.html'));
  assert.ok(dir.includes('operator-status.html'));assert.ok(dir.includes('operator-remote.html'));
  assert.ok(dir.includes('vercel.json'));
  assert.ok(fs.existsSync(path.join(dest,'operator-icons/icon-192.png')));
  assert.ok(fs.existsSync(path.join(dest,'operator-icons/icon-512.png')));
  assert.ok(fs.existsSync(path.join(dest,'api/status.mjs')));
  assert.ok(fs.existsSync(path.join(dest,'operator-continuity.js')));
  assert.ok(fs.existsSync(path.join(dest,'operator-continuity.css')));
  assert.ok(fs.existsSync(path.join(dest,'operator-raphael.css')));
  assert.match(fs.readFileSync(path.join(dest,'operator-raphael.css'),'utf8'),/RAPHAEL visual language/);
  assert.match(fs.readFileSync(path.join(dest,'operator-remote.html'),'utf8'),/href="\.\/operator-raphael\.css"/);
  const deploymentConfig=JSON.parse(fs.readFileSync(path.join(dest,'vercel.json'),'utf8'));
  assert.deepEqual(deploymentConfig.builds.map(b=>[b.src,b.use]),[
   ['index.html','@vercel/static'],
   ['operator-*.html','@vercel/static'],
   ['operator-*.js','@vercel/static'],
   ['operator-*.css','@vercel/static'],
   ['operator-*.webmanifest','@vercel/static'],
   ['operator-icons/*.png','@vercel/static'],
   ['api/status.mjs','@vercel/node'],
  ]);
  const headers=deploymentConfig.headers.find(r=>r.source==='/operator-remote.html')?.headers;
  assert.ok(headers,'remote static page needs deployment-time response headers');
  const csp=headers.find(h=>h.key==='Content-Security-Policy')?.value||'';
  assert.match(csp,/script-src 'self'/);
  assert.match(csp,/frame-ancestors 'none'/);
  assert.doesNotMatch(csp,/script-src 'unsafe-inline'/);
  assert.ok(headers.some(h=>h.key==='Cache-Control'&&h.value.includes('no-store')));

  assert.doesNotMatch(fs.readFileSync(path.join(dest,'operator-remote.html'),'utf8'),/<script>/);
  assert.doesNotMatch(fs.readFileSync(path.join(dest,'operator-remote.html'),'utf8'),/script-src 'unsafe-inline'/);
  assert.match(fs.readFileSync(path.join(dest,'operator-remote.html'),'utf8'),/script-src 'self'/);
  assert.match(fs.readFileSync(path.join(dest,'operator-remote.html'),'utf8'),/src="\.\/operator-remote\.js"/);
  assert.match(fs.readFileSync(path.join(dest,'operator-remote.js'),'utf8'),/ATLAS OPERATOR REMOTE v2/);
  assert.equal(fs.existsSync(path.join(dest,'.env')),false);
 });
});
test('packaged API wrapper imports the actual bounded status handler',async()=>{
 await packaged(async dest=>{
  build(dest);
  const url=pathToFileURL(path.join(dest,'api/status.mjs')).href;
  const mod=await import(url);
  assert.equal(typeof mod.default.fetch,'function');
  // Reject unauthorized verbs without entering the GitHub data adapter.
  const out=await mod.default.fetch(new Request('https://operator.example.invalid/api/status',{method:'POST'}));
  assert.equal(out.status,405);
  const data=await out.json();
  assert.equal(data.app_login,false);
  assert.equal(data.write_authority,false);
  assert.equal(data.sportsbook_execution,false);
 });
});
test('builder refuses unsafe directory reuse and cannot overwrite checked-out sources',async()=>{
 await packaged(async (dest,tmp)=>{
  assert.throws(()=>build(''),/DESTINATION_REQUIRED/);
  const original=path.resolve(__dirname,'../..');
  assert.throws(()=>build(original),/UNSAFE_OUTPUT_DESTINATION/);
  assert.throws(()=>build(path.parse(original).root),/UNSAFE_OUTPUT_DESTINATION/);
  fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'existing'),'preserve');
  assert.throws(()=>build(dest),/DESTINATION_NOT_EMPTY/);
  assert.equal(fs.readFileSync(path.join(dest,'existing'),'utf8'),'preserve');
 });
});
