import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {readSourceWithBlob} from './prospective-source-freeze.mjs';
import {stressFrozenOutcomePatterns,WORLDS_CONTRACT} from './prospective-outcome-stress.mjs';
const b=new URL('./fixtures/',import.meta.url);
const {snapshot:source,source_git_blob_sha:sourceBlobSha}=readSourceWithBlob(fileURLToPath(new URL('nba-connected-prestart-20261111.json',b)));
const cohort=JSON.parse(readFileSync(new URL('nba-prospective-forecast-freeze-20261111.json',b),'utf8'));
const challenger=JSON.parse(readFileSync(new URL('nba-record-challenger-freeze-20261111.json',b),'utf8'));
const run=()=>stressFrozenOutcomePatterns({source,cohort,sourceBlobSha,challenger});
test('exact ten real frozen game forecasts produce exhaustive 1024 counterfactual patterns',()=>{
 const r=run();
 assert.equal(r.contract,WORLDS_CONTRACT);
 assert.equal(r.patterns_considered,1024);
 assert.equal(r.game_count,10);
 assert.equal(r.empirical_sample_count,0);
 assert.equal(r.interpreted_probability,null);
 assert.equal(r.production_authority,false);
 assert.equal(r.model_calibration_authority,false);
 assert.equal(r.no_bets,true);
});
test('neither PPG nor record heuristic dominates a neutral baseline for all logically possible outcomes',()=>{
 const r=run();
 assert(r.ppg_better_neutral>0);
 assert(r.ppg_worse_neutral>0);
 assert(r.record_better_neutral>0);
 assert(r.record_worse_neutral>0);
 assert(r.min_ppg_minus_neutral<0);
 assert(r.max_ppg_minus_neutral>0);
});
test('frozen PPG and record models admit opposing relative-performance scenarios',()=>{
 const r=run();
 assert(r.ppg_better_record>0);
 assert(r.ppg_better_record<r.patterns_considered);
 assert(r.min_ppg_minus_record<0);
 assert(r.max_ppg_minus_record>0);
});
test('repeated stress result is byte-for-byte deterministic and not a simulated betting performance',()=>{
 const x=run(),y=run();
 assert.deepEqual(x,y);
 assert.equal(x.selection_strategy,null);
 assert.match(x.warning,/NOT odds/);
});
test('tampered forecast cannot be stress-scored to rewrite original model',()=>{
 const changed=structuredClone(cohort);changed.predictions[0].model_probability_home=0.99;
 assert.throws(()=>stressFrozenOutcomePatterns({source,cohort:changed,sourceBlobSha,challenger}),/PROSPECTIVE_FREEZE_DRIFT_OR_REWRITE/);
});
test('standalone stress CLI executes real frozen files without outcomes or market prices',()=>{
 const cli=fileURLToPath(new URL('outcome-pattern-check.mjs',import.meta.url));
 const r=spawnSync(process.execPath,[cli],{encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
 const x=JSON.parse(r.stdout);
 assert.equal(x.patterns_considered,1024);
 assert.equal(x.empirical_sample_count,0);
 assert.equal(x.interpreted_probability,null);
});
