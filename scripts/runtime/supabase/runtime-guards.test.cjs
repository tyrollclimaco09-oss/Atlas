'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {test}=require('node:test');
const root='scripts/runtime/supabase/';
const locked=['atlas-odds-smoke','atlas-odds-ingest'];
for (const name of locked) test(name+' cannot spend any API credits',()=>{
 const s=fs.readFileSync(root+name+'/index.ts','utf8');
 assert.match(s,/LEGACY_ODDS_(SMOKE|INGEST)_DISABLED/);
 assert.doesNotMatch(s,/\bfetch\s*\(/);
 assert.doesNotMatch(s,/Deno\.env|apiKey|x-api-key|SUPABASE_SERVICE_ROLE_KEY/);
 assert.match(s,/external_api_calls:0/);
 const manifest=JSON.parse(fs.readFileSync(root+name+'/deploy-manifest.json','utf8'));
 assert.equal(manifest.verify_jwt,true);
 assert.equal(manifest.external_api_calls,0);
 assert.equal(manifest.production_execution_authority,false);
});
test('health endpoint refuses an unknown-freshness green status',()=>{
 const s=fs.readFileSync(root+'atlas-core-health/index.ts','utf8');
 assert.match(s,/freshness !== "HEALTHY"/);
 assert.match(s,/Number\.isFinite\(snapshotMs\)/);
 assert.match(s,/dbMetricsValid/);
 assert.doesNotMatch(s,/freshness === "STALE" \? "STALE" : "HEALTHY"/);
});
