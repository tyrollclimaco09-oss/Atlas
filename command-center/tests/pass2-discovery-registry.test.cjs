'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const D=require('../discovery-registry.js');
const candidate=(selection,market='Player prop')=>({scout:{event:'Fictional A vs B',startsAt:'2026-10-16T20:00:00Z',market,selection,source:'https://example.invalid'},oracle:{thesis:'synthetic'}});
const packet=(runId,candidates)=>({schema:'atlas.research.v1',phase:'research',runId,candidates});
test('cross-run observations persist without duplicating unique candidate',()=>{
 const a=D.ingest(D.empty(),packet('run-A',[candidate('10+ attempts')]));
 const b=D.ingest(a,packet('run-B',[candidate('10+ attempts'),candidate('10+ attempts','Other')]));
 assert.deepEqual(D.census(b),{unique:2,observations:3,byRun:{'run-A':1,'run-B':2}});
 assert.equal(b.records[0].observations.length,2);
 assert.equal(a.records[0].observations.length,1);
});
test('duplicate packet fails atomically',()=>{
 const a=D.empty();
 assert.throws(()=>D.ingest(a,packet('run-A',[candidate('x'),candidate('x')])),/Duplicate candidate/);
 assert.equal(a.records.length,0);assert.equal(a.revision,0);
});
test('versioned registry exports and validates roundtrip',()=>{
 const a=D.ingest(D.empty(),packet('run-A',[candidate('x')]));
 assert.deepEqual(D.importJSON(D.exportJSON(a)),a);
 assert.throws(()=>D.importJSON(JSON.stringify({...a,schema:'wrong'})),/Invalid/);
});
test('reject oversized research packets and incomplete candidate identities',()=>{
 const a=D.empty();
 assert.throws(()=>D.ingest(a,packet('run-A',Array.from({length:9},(_,i)=>candidate(String(i))))),/1–8/);
 assert.throws(()=>D.ingest(a,packet('run-A',[{scout:{event:'Fictional A vs B'}}])),/Complete/);
});
