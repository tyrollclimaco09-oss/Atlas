import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {readSourceWithBlob,validateProspectiveFreeze,freezePregameSource} from './prospective-source-freeze.mjs';
import {createRecordControl,verifyRecordControl} from './record-control-challenger.mjs';
const dir=new URL('./fixtures/',import.meta.url);
const registry=JSON.parse(readFileSync(new URL('prospective-nba-cohort-registry.json',dir),'utf8'));
const get=date=>{
 const compact=date.replaceAll('-','');
 const path=fileURLToPath(new URL('nba-connected-prestart-'+compact+'.json',dir));
 const {snapshot,source_git_blob_sha}=readSourceWithBlob(path);
 const cohort=JSON.parse(readFileSync(new URL('nba-prospective-forecast-freeze-'+compact+'.json',dir),'utf8'));
 const challenger=JSON.parse(readFileSync(new URL('nba-record-challenger-freeze-'+compact+'.json',dir),'utf8'));
 return {snapshot,sha:source_git_blob_sha,cohort,challenger};
};
test('source registry contains two distinct real prospective dates, no forged official claims',()=>{
 assert.equal(registry.contract,'ATLAS_SHADOW_NBA_CAPTURE_COHORT_REGISTRY_V1');
 assert.deepEqual(registry.cohorts.map(x=>[x.date,x.expected_cases]),[
  ['2026-11-11',10],['2026-11-12',4]]);
 for(const r of registry.cohorts){
  const f=get(r.date);
  assert.equal(r.source_git_blob_sha,f.sha);
  assert.equal(f.cohort.source_git_blob_sha,f.sha);
  assert.equal(f.cohort.count,r.expected_cases);
  assert.equal(f.cohort.slate_date_ct,r.date);
  assert(f.cohort.predictions.every(p=>p.result===null&&p.bookmaker_price===null));
 }
});
test('Nov12 4-case original PPG formula is independent of subsequent outcome and valid prestart',()=>{
 const {snapshot,sha,cohort}=get('20261112');
 const r=validateProspectiveFreeze(snapshot,cohort,sha);
 assert.equal(r.status,'FROZEN_SOURCE_ARITHMETIC_MATCH');
 assert.equal(r.cases,4);
 assert(cohort.predictions.every(x=>Date.parse(x.forecast_prepared_at)<Date.parse(x.event_start_utc)));
 assert.equal(cohort.model.calibrated,false);
 assert.equal(cohort.production_authority,false);
});
test('Nov12 separately recorded challenger is byte/ID-bound and frozen before tipoff',()=>{
 const {snapshot,sha,cohort,challenger}=get('20261112');
 const r=verifyRecordControl(snapshot,cohort,sha,challenger);
 assert.equal(r.status,'RECORD_CONTROL_FROZEN_MATCH');
 assert.equal(r.cases,4);
 assert(Date.parse(challenger.challenger_frozen_at)<Math.min(...cohort.predictions.map(x=>Date.parse(x.event_start_utc))));
 assert.equal(challenger.model.odds_or_market_prices_used,false);
});
test('mixing Nov11 source with Nov12 date or original forecast cannot counterfeit a new cohort',()=>{
 const original=get('20261111'),next=get('20261112');
 assert.throws(()=>validateProspectiveFreeze(original.snapshot,next.cohort,original.sha),/PROSPECTIVE_FREEZE_INTEGRITY_INVALID/);
 assert.throws(()=>freezePregameSource(next.snapshot,{preparedAt:next.cohort.prepared_at_utc,sourceBlobSha:next.sha,
  sourceArtifact:'integrations/learning/fixtures/nba-connected-prestart-20261111.json'}),/PROSPECTIVE_SOURCE_ARTIFACT_DATE_MISMATCH/);
});
test('both dates are different roots; games cannot inflate independent sample count',()=>{
 const keys=registry.cohorts.flatMap(r=>get(r.date.replaceAll('-','')).cohort.predictions.map(x=>x.canonical_source_event_key));
 assert.equal(keys.length,14);
 assert.equal(new Set(keys).size,14);
});
