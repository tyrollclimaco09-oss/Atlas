import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {settleOfficial} from './nhl-official-result-shadow.mjs';
const f=JSON.parse(readFileSync('docs/prospective/ATLAS_NHL_20261022_2026020154_UNPRICED_FREEZE.json','utf8'));
const SHA='b'.repeat(64);
const after='2026-10-23T04:00:00Z';
function final(){return {id:2026020154,startTimeUTC:'2026-10-22T23:00:00Z',gameState:'OFF',homeTeam:{id:6,score:3},awayTeam:{id:18,score:2}};}
test('signed archive joined with official identity computes baseline scoring without calibration authority',()=>{let r=settleOfficial(f,final(),after,SHA);assert.equal(r.home_win,1);assert.equal(r.brier_score,.25);assert.ok(Math.abs(r.log_loss-Math.log(2))<1e-10);assert.equal(r.calibrator_eligible,false);assert.equal(r.profit_loss,null);});
test('refuse non-final, tie, wrong teams and wrong game',()=>{let q=final();q.gameState='FUT';assert.throws(()=>settleOfficial(f,q,after,SHA),/OFFICIAL_FINAL_IDENTITY_INVALID/);q=final();q.homeTeam.score=2;assert.throws(()=>settleOfficial(f,q,after,SHA),/NO_UNAMBIGUOUS_FINAL_RESULT/);q=final();q.awayTeam.id=3;assert.throws(()=>settleOfficial(f,q,after,SHA),/OFFICIAL_FINAL_IDENTITY_INVALID/);q=final();q.id=99;assert.throws(()=>settleOfficial(f,q,after,SHA),/OFFICIAL_FINAL_IDENTITY_INVALID/);});
test('official result is rejected when observed before kickoff',()=>{assert.throws(()=>settleOfficial(f,final(),'2026-10-22T22:55:00Z',SHA),/RESULT_NOT_AFTER_GAME/);});
test('tampered freeze and invalid response hash cannot pass',()=>{let g=structuredClone(f);g.packet.forecast.estimated_probability=.95;assert.throws(()=>settleOfficial(g,final(),after,SHA),/TAMPERED_FREEZE/);assert.throws(()=>settleOfficial(f,final(),after,'not-hash'),/OFFICIAL_SHA_INVALID/);});
