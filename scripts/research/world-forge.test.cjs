'use strict';
const assert=require('node:assert/strict');
const {freezeCheck,evaluateWorlds,freezeComparison}=require('./world-forge.cjs');
let n=0;const t=(name,fn)=>{fn();n++;console.log('PASS '+n+' '+name)};
const packet=(a,b)=>({type:'SYNTHETIC_DEMO',legs:[{id:'PTS20'},{id:'AST6'}],worlds:[
  {id:'NORMAL',weight:.5,conditionalHit:{PTS20:a[0],AST6:b[0]}},
  {id:'SLOW',weight:.5,conditionalHit:{PTS20:a[1],AST6:b[1]}}
]});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} not ≈ ${b}`);
t('valid weights accepted',()=>assert.equal(freezeCheck(packet([.8,.2],[.8,.2])),true));
t('positive shared-world correlation',()=>near(evaluateWorlds(packet([.8,.2],[.8,.2])).mixtureJoint,.34));
t('independence comparator 0.25',()=>near(evaluateWorlds(packet([.8,.2],[.8,.2])).independentJoint,.25));
t('positive joint uplift +9pp',()=>near(evaluateWorlds(packet([.8,.2],[.8,.2])).difference,.09));
t('negative script correlation',()=>near(evaluateWorlds(packet([.8,.2],[.2,.8])).mixtureJoint,.16));
t('negative joint deviation -9pp',()=>near(evaluateWorlds(packet([.8,.2],[.2,.8])).difference,-.09));
t('flat world independent output',()=>near(evaluateWorlds(packet([.5,.5],[.5,.5])).difference,0));
t('marginal each 0.5',()=>near(evaluateWorlds(packet([.8,.2],[.2,.8])).marginal.AST6,.5));
t('perfect common shock -> correlation 1',()=>near(evaluateWorlds(packet([1,0],[1,0])).pairs[0].correlation,1));
t('perfect opposite shock -> correlation -1',()=>near(evaluateWorlds(packet([1,0],[0,1])).pairs[0].correlation,-1));
t('extreme probabilities remain finite',()=>near(evaluateWorlds(packet([1,1],[0,0])).mixtureJoint,0));
t('reject negative world weight',()=>assert.throws(()=>evaluateWorlds({...packet([.8,.2],[.8,.2]),worlds:[{id:'X',weight:-1,conditionalHit:{PTS20:.5,AST6:.5}}]}),/INVALID_WORLD_WEIGHT/));
t('reject weights not summing to 1',()=>assert.throws(()=>evaluateWorlds({...packet([.8,.2],[.8,.2]),worlds:[{id:'X',weight:.9,conditionalHit:{PTS20:.5,AST6:.5}}]}),/WORLD_WEIGHTS_NOT_ONE/));
t('reject missing conditional leg',()=>assert.throws(()=>evaluateWorlds({...packet([.8,.2],[.8,.2]),worlds:[{id:'X',weight:1,conditionalHit:{PTS20:.5}}]}),/MISSING_OR_INVALID_CONDITIONAL_HIT/));
t('reject duplicate leg id',()=>assert.throws(()=>evaluateWorlds({...packet([.8,.2],[.8,.2]),legs:[{id:'PTS20'},{id:'PTS20'}]}),/DUPLICATE_OR_MISSING_LEG_ID/));
t('reject duplicate world id',()=>assert.throws(()=>evaluateWorlds({...packet([.8,.2],[.8,.2]),worlds:[{id:'X',weight:.5,conditionalHit:{PTS20:.5,AST6:.5}},{id:'X',weight:.5,conditionalHit:{PTS20:.5,AST6:.5}}]}),/DUPLICATE_WORLD_ID/));
t('non-demo requires pre-event evidence',()=>assert.throws(()=>evaluateWorlds({...packet([.8,.2],[.8,.2]),type:'LIVE_RESEARCH'}),/MISSING_POINT_IN_TIME_PROVENANCE/));
t('provenance supports research-only packet',()=>assert.equal(evaluateWorlds({...packet([.8,.2],[.8,.2]),type:'LIVE_RESEARCH',forecastId:'f1',modelVersion:'shadow-v1',sourceRef:'internal-receipt-01',frozenAtUtc:'2026-11-05T01:00:00Z'}).executable,false));
t('calibrated flag requires calibration proof',()=>assert.throws(()=>evaluateWorlds({...packet([.8,.2],[.8,.2]),type:'LIVE_RESEARCH',forecastId:'f1',modelVersion:'shadow-v1',sourceRef:'internal-receipt-01',frozenAtUtc:'2026-11-05T01:00:00Z',calibrated:true}),/CALIBRATION_EVIDENCE_REQUIRED/));
t('zero-variance correlation stays null',()=>assert.equal(evaluateWorlds(packet([1,1],[.5,.5])).pairs[0].correlation,null));
t('refuse different legs in comparison',()=>assert.throws(()=>freezeComparison(packet([.8,.2],[.8,.2]),{...packet([.8,.2],[.8,.2]),legs:[{id:'PTS20'},{id:'OTHER'}]}),/MISSING_OR_INVALID_CONDITIONAL_HIT|MISMATCHED_SELECTION_SET/));
t('true shock change is visible',()=>near(freezeComparison(packet([.8,.2],[.8,.2]),packet([.7,.1],[.7,.1])).change,-.09));
t('cannot claim production/calibration by default',()=>assert.deepEqual([evaluateWorlds(packet([.8,.2],[.8,.2])).executable,evaluateWorlds(packet([.8,.2],[.8,.2])).calibrated,evaluateWorlds(packet([.8,.2],[.8,.2])).modelProvenProfitable],[false,false,false]));
console.log(`${n} tests passed (all synthetic, no real sports forecast or sportsbook access)`);