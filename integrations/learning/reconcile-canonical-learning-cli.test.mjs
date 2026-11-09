import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cli=fileURLToPath(new URL('./reconcile-canonical-learning-cli.mjs',import.meta.url));
const legacy={
 experiment:{experiment_key:'EXISTING-RESEARCH-V1',experiment_id:'00000000-0000-4000-8000-000000000001'},
 frozen_cohort:null,
 observations:[{experiment_id:'00000000-0000-4000-8000-000000000001',candidate_key:'NARRATIVE-ROLE-HYPOTHESIS',
   event_id:null,observed_at:'2026-10-07T07:30:44Z',
   baseline_output:{baseline_read:'No numeric probability or market identity attached'},
   experimental_output:{state:'Pre-event role hypothesis'}}],
 predictions:[],official_outcomes:[],identities:[],quotes:[]
};
const run=(input)=>spawnSync(process.execPath,[cli],{input,encoding:'utf8'});
test('CLI runs on read-only legacy-shaped input and returns HOLD, not synthetic model scoring',()=>{
 const r=run(JSON.stringify(legacy));assert.equal(r.status,0);
 const p=JSON.parse(r.stdout);
 assert.equal(p.adapter_disposition,'HOLD_NO_MODEL_CALIBRATION');
 assert.equal(p.evidence_gate_disposition,'NOT_EVALUATED');
 assert.equal(p.forecast_metrics,null);assert.equal(p.pricing_metrics,null);
});
test('CLI cannot change production weights or virtual bankroll',()=>{
 const r=run(JSON.stringify(legacy));const p=JSON.parse(r.stdout);
 assert.equal(p.production_authority,false);assert.equal(p.real_betting_authority,false);
 assert.equal(p.model_weights_changed,false);assert.equal(p.virtual_bankroll_affected,false);
});
test('malformed JSON fails deterministically rather than inventing defaults',()=>{
 const r=run('not json');assert.equal(r.status,2);
 assert.match(r.stderr,/ATLAS_READ_ONLY_RECONCILE_ERROR/);
});
test('missing source arrays fails contract rather than score from prose',()=>{
 const r=run(JSON.stringify({...legacy,quotes:undefined}));
 assert.equal(r.status,2);assert.match(r.stderr,/CANONICAL_RECONCILE_INPUT_INVALID/);
});
