'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const D=require('../discovery-registry.js');
const candidate=(n)=>({scout:{event:'Synthetic game',startsAt:'2026-10-18T20:00:00Z',market:'Prop',selection:'selection '+n},verify:{},oracle:{}});
const packet=(runId,candidates)=>({schema:'atlas.research.v1',phase:'research',runId,candidates});
test('merge is idempotent for identical exported observations and preserves separate runs',()=>{
 const a=D.ingest(D.empty(),packet('a',[candidate(1)]),'2026-10-17T01:00:00Z');
 const b=D.ingest(D.empty(),packet('b',[candidate(1),candidate(2)]),'2026-10-17T02:00:00Z');
 const merged=D.merge(a,b);
 assert.equal(D.census(merged).unique,2);
 assert.equal(D.census(merged).observations,3);
 assert.equal(D.census(D.merge(merged,b)).observations,3);
 assert.equal(merged.records.find(r=>r.scout.selection==='selection 1').observations.length,2);
 assert.equal(a.records.length,1);
});
test('paging and search are bounded and deterministic',()=>{
 let db=D.empty();
 for(let i=0;i<8;i++)db=D.ingest(db,packet('r'+i,[candidate(i)]));
 assert.equal(D.page(db,{limit:3}).records.length,3);
 assert.equal(D.page(db,{offset:3,limit:3}).records[0].scout.selection,'selection 3');
 assert.equal(D.page(db,{query:'selection 7'}).total,1);
 assert.throws(()=>D.page(db,{limit:101}),/Invalid discovery page/);
});
test('malformed imported archive fails before any merge',()=>{
 const a=D.ingest(D.empty(),packet('a',[candidate(1)]));
 const corrupted=JSON.parse(D.exportJSON(a));corrupted.records[0].key='tampered';
 assert.throws(()=>D.merge(a,D.importJSON(JSON.stringify(corrupted))),/Invalid or duplicate/);
 assert.equal(a.records.length,1);
});
test('browser has archive restore, search and pagination controls',()=>{
 const html=readFileSync(join(__dirname,'..','index.html'),'utf8');
 const ui=readFileSync(join(__dirname,'..','slate.js'),'utf8');
 for(const id of ['restore-discovery','discovery-search','discovery-results','discovery-prev','discovery-next'])assert.ok(html.includes('id="'+id+'"'));
 assert.match(ui,/D\.merge\(readDiscovery\(\),incoming\)/);
 assert.match(ui,/D\.page\(readDiscovery\(\)/);
 assert.match(ui,/localStorage\\.setItem\\(DISCOVERY_STORAGE,serialized\\)/);
});
