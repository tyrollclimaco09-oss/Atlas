'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const {packet}=require('./fixtures/reference-snapshot.cjs');
const cli=require('node:path').join(__dirname,'scan-reference-cli.cjs');
const run=(input,args=[])=>spawnSync(process.execPath,[cli,...args],{input,encoding:'utf8'});
test('offline CLI demo produces the complete reproducible synthetic example',()=>{
 const r=run('', ['--demo']);assert.equal(r.status,0,r.stderr);const out=JSON.parse(r.stdout);
 assert.equal(out.signals.length,1);assert.equal(out.signals[0].synthetic_fixture,true);
 assert.equal(out.signals[0].empirical_performance_eligible,false);assert.equal(out.network_requests,0);
});
test('stdin JSON is processed without writing or submitting a paper entry',()=>{
 const r=run(JSON.stringify(packet()));assert.equal(r.status,0,r.stderr);const out=JSON.parse(r.stdout);
 assert.equal(out.status,'SIGNALS_FOUND');assert.equal(out.paper_ledger_mutated,false);
 assert.equal(out.signals[0].paper_entry_created,false);
});
test('CLI ingestion failure has a nonzero exit and an explicit status',()=>{
 const p=packet();p.ingestion={status:'error',errors:['SYNTHETIC_SOURCE_ERROR']};
 const r=run(JSON.stringify(p));assert.equal(r.status,1);assert.equal(JSON.parse(r.stdout).status,'INGESTION_ERROR');
});
test('malformed or oversized input fails without echoing source bytes',()=>{
 for(const body of ['private_synthetic_marker{',' '.repeat(8_000_001)]){
  const r=run(body);assert.equal(r.status,2);assert.equal(r.stdout,'');
  assert(!r.stderr.includes('private_synthetic_marker'));
 }
});
test('CLI refuses unsupported flags instead of enabling any live mode',()=>{
 const r=run('',['--live']);assert.equal(r.status,2);assert(r.stderr.includes('REFERENCE_CLI_ARGUMENTS_INVALID'));
});
test('upstream ingestion error text cannot leak source URLs or payloads',()=>{
 const p=packet();p.ingestion={status:'error',errors:['PRIVATE_SYNTHETIC_URL?token=not_a_real_key']};
 const r=run(JSON.stringify(p));assert.equal(r.status,1);assert(!r.stdout.includes('PRIVATE_SYNTHETIC_URL'));
 assert.deepEqual(JSON.parse(r.stdout).ingestion_errors,['UPSTREAM_INGESTION_ERROR']);
});
