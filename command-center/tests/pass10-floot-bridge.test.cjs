'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../discovery-registry.js');
// This fixture mirrors Floot Shadow's documented atlas.discovery.v1 export shape.
// It is research-only: no independent model certification, betting prices or approvals.
const scout={event:'Synthetic bridge matchup',startsAt:'2026-10-19T20:00:00Z',market:'Player prop',selection:'Synthetic QB 30+',source:'https://example.org/synthetic'};
const key=[scout.event,scout.startsAt,scout.market,scout.selection].map(x=>x.trim().toLowerCase()).join('|');
const first={at:'2026-10-18T05:00:00Z',runId:'synthetic-run-A',verify:{availability:'UNKNOWN'},oracle:{probability:'',counter:'Synthetic alternative'},disposition:'DISCOVERED'};
const second={at:'2026-10-18T06:00:00Z',runId:'synthetic-run-B',verify:{availability:'UNKNOWN'},oracle:{probability:'',counter:'Synthetic alternative'},disposition:'DISCOVERED'};
const shadowExport={schema:'atlas.discovery.v1',revision:1,records:[{key,scout,firstSeenAt:first.at,observations:[first,second]}],events:[
 {at:first.at,runId:first.runId,key,action:'DISCOVERED'},
 {at:second.at,runId:second.runId,key,action:'REOBSERVED'}
]};
test('Floot Shadow discovery export contract imports into current ATLAS census without authority promotion',()=>{
 const restored=D.importJSON(JSON.stringify(shadowExport));
 assert.deepEqual(D.census(restored),{unique:1,observations:2,byRun:{'synthetic-run-A':1,'synthetic-run-B':1}});
 assert.equal(D.page(restored,{query:'Synthetic QB'}).records[0].scout.selection,scout.selection);
 assert.equal(restored.records[0].observations[0].oracle.probability,'');
 assert.equal(JSON.stringify(restored).includes('"approval"'),false);
 assert.equal(JSON.stringify(restored).includes('"pricing"'),false);
 const merged=D.merge(restored,restored);
 assert.equal(D.census(merged).observations,2,'restoring same export twice must not duplicate receipts');
 assert.equal(D.census(merged).unique,1);
});
test('bridge refuses altered discovery identity rather than treating it as a second authoritative candidate',()=>{
 const corrupted=structuredClone(shadowExport);
 corrupted.records[0].scout.selection='Different line';
 assert.throws(()=>D.importJSON(JSON.stringify(corrupted)),/Invalid or duplicate discovery record/);
});
