'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const v=require('./verify-master-save.cjs');
const root=path.resolve(__dirname,'../..');
const manifest=require('./master-save.snapshot.json');
const sourceFiles={
 arc:fs.readFileSync(path.join(root,'docs/ARCIII_REALITY_FORGE_RESUME_HANDOFF_2026-10-18.md'),'utf8'),
 graph:fs.readFileSync(path.join(root,'docs/ATLAS_CONTINUITY_PLUGIN_ARCHITECTURE_2026-10-18.md'),'utf8')
};
const clone=x=>JSON.parse(JSON.stringify(x));
const reader=p=>fs.readFileSync(path.join(root,p));

test('frozen snapshot matches both original Git blob digests without querying live external systems',()=>{
 const report=v.verifyFiles(manifest,reader);
 assert.equal(report.status,'VERIFIED_LOCAL_CONTENT');
 assert.equal(report.file_count,2);
 assert.equal(report.matched_files,2);
 assert.equal(report.external_mirrors,'NOT_CHECKED');
 assert.equal(report.live_ci_verification,'NOT_CHECKED');
 assert.equal(report.source_commit_authenticity,'NOT_CHECKED');
 assert.equal(report.production_promotion,false);
 assert.equal(report.execution_authority,false);
 assert.equal(Object.isFrozen(report.files),true);
});
test('single-byte historical handoff change fails closed, even if its title and pass counts still match',()=>{
 const report=v.verifyFiles(manifest,p=>{
  const bytes=reader(p);
  return p.includes('ARCIII')?Buffer.concat([bytes,Buffer.from(' ')]):bytes;
 });
 assert.equal(report.status,'BLOCKED_DRIFT');
 assert.equal(report.matched_files,1);
 assert.equal(report.failures[0].status,'DRIFT');
});
test('missing unreadable evidence is a blocker, not a presumed empty or successful result',()=>{
 const report=v.verifyFiles(manifest,p=>{if(p.includes('CONTINUITY'))throw Error('NOT_READABLE');return reader(p);});
 assert.equal(report.status,'BLOCKED_DRIFT');
 assert.equal(report.failures[0].status,'MISSING_OR_UNREADABLE');
});
test('manifest refuses mismatched branch, release authority, CI reference or pass counts',()=>{
 const invalid=[
  x=>x.source_commit='f'.repeat(40),
  x=>x.ci.recorded_head_sha='b'.repeat(40),
  x=>x.review_only=false,
  x=>x.branch='main',
  x=>x.arc.formal_passes_closed=15,
  x=>x.arc.floot='ACTIVE',
  x=>x.operational_claims.production_promoted=true,
  x=>x.ci.verification='LIVE_CONFIRMED'
 ];
 for(const mutate of invalid){
  const m=clone(manifest);mutate(m);
  assert.throws(()=>v.assertManifest(m),/MANIFEST_/,JSON.stringify(m));
 }
});
test('manifest forbids path traversal, file aliases, and duplicate evidence',()=>{
 for(const file of ['docs/../private.txt','docs//ARCIII_REALITY_FORGE_RESUME_HANDOFF_2026-10-18.md']){
  const m=clone(manifest);m.files[0].path=file;
  assert.throws(()=>v.assertManifest(m),/MANIFEST_FILE_IDENTITY/);
 }
 const m=clone(manifest);m.files[1]=clone(m.files[0]);
 assert.throws(()=>v.assertManifest(m),/MANIFEST_FILE_IDENTITY/);
});
test('remote mirror reconciliation distinguishes readback matches, absence, and explicit conflicts',()=>{
 const arcPath='docs/ARCIII_REALITY_FORGE_RESUME_HANDOFF_2026-10-18.md';
 const graphPath='docs/ATLAS_CONTINUITY_PLUGIN_ARCHITECTURE_2026-10-18.md';
 const good={
  notion:'Indexed: '+arcPath+' and '+graphPath+' HEAD '+manifest.source_commit,
  google_drive:'Recovered '+manifest.source_commit+'\n'+sourceFiles.arc+'\n'+sourceFiles.graph,
  create_state:'Cached '+arcPath+' at '+manifest.source_commit
 };
 const exact=v.compareMirrors(manifest,sourceFiles,good);
 assert.equal(exact.status,'CONSISTENT_READBACK_MARKERS');
 assert.equal(exact.surfaces.every(x=>x.status==='CONTENT_MATCH'),true);
 assert.equal(exact.execution_authority,false);
 const missing=v.compareMirrors(manifest,sourceFiles,{...good,create_state:null});
 assert.equal(missing.status,'PARTIAL_UNVERIFIED');
 assert.equal(missing.surfaces[2].status,'NOT_CHECKED');
 const stale=v.compareMirrors(manifest,sourceFiles,{...good,notion:'Old summary only'});
 assert.equal(stale.status,'BLOCKED_CONFLICT');
 assert.equal(stale.surfaces[0].reason,'EXPECTED_MARKER_MISSING');
});
test('supplying a stale Drive backup or absent graph fails despite valid local Git evidence',()=>{
 const good={notion:null,google_drive:sourceFiles.arc,create_state:null};
 const report=v.compareMirrors(manifest,sourceFiles,good);
 assert.equal(report.status,'BLOCKED_CONFLICT');
 assert.equal(report.surfaces[1].status,'BLOCKED_CONFLICT');
});
test('Git blob SHA1 uses actual bytes and distinguishes changed line endings',()=>{
 const buffer=Buffer.from('hello\n');
 assert.equal(v.gitBlobSha1(buffer),v.gitBlobSha1('hello\n'));
 assert.notEqual(v.gitBlobSha1(buffer),v.gitBlobSha1('hello\r\n'));
 assert.equal(v.gitBlobSha1(''),'e69de29bb2d1d6434b8b29ae775ad8c2e48c5391');
});
