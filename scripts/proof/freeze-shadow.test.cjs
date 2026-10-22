'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),P=require('./freeze-shadow.cjs');
const h=x=>x.repeat(64);
function packet(){return {version:P.VERSION,synthetic:true,research_only:true,
 event:{id:'test-nba',league:'NBA',home:'A',away:'B',starts_at:'2026-10-25T22:00:00Z'},
 forecast:{model_version:'unvalidated-0',selection:'A',probability:.6,cutoff:'2026-10-25T20:00:00Z',feature_hash:h('a')},
 quote:{provider:'odds-provider',book:'DK',market:'h2h',selection:'A',decimal:2,retrieved_at:'2026-10-25T19:30:00Z',source_at:'2026-10-25T19:29:00Z',source_hash:h('b')},
 sources:[{provider:'stats-provider',id:'stats-1',sha256:h('c'),published_at:'2026-10-25T18:00:00Z',observed_at:'2026-10-25T19:00:00Z'}],
 frozen_at:'2026-10-25T20:01:00Z'};}
function result(){return {event_id:'test-nba',winner:'A',source:'result-provider',sha256:h('d'),published_at:'2026-10-26T03:00:00Z',observed_at:'2026-10-26T03:01:00Z'};}
test('freeze hash deterministic but NOT externally attested',()=>{const f=P.freeze(packet());assert.equal(f.hash_sha256,P.freeze(packet()).hash_sha256);assert.equal(f.calibrator_eligible,false);});
test('result scoring without betting authority',()=>{const v=P.outcome(P.freeze(packet()),result());assert.ok(Math.abs(v.brier_score-.16)<1e-10);assert.ok(Math.abs(v.conditional_expected_roi-.2)<1e-10);assert.equal(v.execution_authority,false);});
test('future feature prohibited',()=>{let d=packet();d.sources[0].observed_at='2026-10-25T20:00:01Z';assert.throws(()=>P.freeze(d),/FUTURE_LEAKAGE/);});
test('stale time and after-tipoff freeze prohibited',()=>{let d=packet();d.frozen_at='2026-10-25T22:00:01Z';assert.throws(()=>P.freeze(d),/FREEZE_CHRONOLOGY/);d=packet();d.quote.source_at='2026-10-25T19:31:00Z';assert.throws(()=>P.freeze(d),/FREEZE_CHRONOLOGY/);});
test('provider overlap and duplicate provenance prohibited',()=>{let d=packet();d.sources[0].provider='odds-provider';assert.throws(()=>P.freeze(d),/SOURCE_PRICE_LEAKAGE/);d=packet();d.sources.push({...d.sources[0]});assert.throws(()=>P.freeze(d),/SOURCE_DUPLICATE/);});
test('tamper and forged timestamp attestation prohibited',()=>{let f=P.freeze(packet());f.payload.forecast.probability=.9;assert.throws(()=>P.verify(f),/TAMPERED/);f=P.freeze(packet());f.external_timestamp_verified=true;assert.throws(()=>P.verify(f),/RECEIPT_SCHEMA/);});
test('wrong event and pregame result prohibited',()=>{const f=P.freeze(packet());let r=result();r.event_id='not-test';assert.throws(()=>P.outcome(f,r),/RESULT_IDENTITY/);r=result();r.published_at='2026-10-25T21:00:00Z';assert.throws(()=>P.outcome(f,r),/RESULT_CHRONOLOGY/);});
test('non-synthetic label still never earns calibration status',()=>{const d=packet();d.synthetic=false;const v=P.outcome(P.freeze(d),result());assert.equal(v.proof_status,'REAL_UNATTESTED');assert.equal(v.calibrator_eligible,false);});