'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const D=require('../discovery-registry.js');
const ui=readFileSync(join(__dirname,'..','slate.js'),'utf8');
const sample={schema:'atlas.research.v1',phase:'research',runId:'synthetic',candidates:[{scout:{event:'Synthetic match',startsAt:'2026-10-18T20:00:00Z',market:'Player prop',selection:'Synthetic 5+'}}]};
test('failed quota write does not mutate prior archive object',()=>{
 const before=D.ingest(D.empty(),sample,'2026-10-17T00:00:00Z');
 const stored=D.exportJSON(before);
 const fakeStorage={getItem:()=>stored,setItem:()=>{throw Object.assign(Error('Quota exceeded'),{name:'QuotaExceededError'});}};
 const next=D.ingest(D.importJSON(fakeStorage.getItem()),{...sample,runId:'another'},'2026-10-17T01:00:00Z');
 assert.throws(()=>fakeStorage.setItem('atlas.discovery.census.v1',D.exportJSON(next)),/Quota exceeded/);
 assert.equal(fakeStorage.getItem(),stored);
 assert.equal(D.census(D.importJSON(fakeStorage.getItem())).observations,1);
});
test('corrupted stored census rejects import without replacing data',()=>{
 const bad=JSON.stringify({...D.empty(),schema:'corrupt'});
 assert.throws(()=>D.ingest(D.importJSON(bad),sample),/Invalid/);
});
test('archive and restore writes must be read back before reporting success',()=>{
 assert.match(ui,/if\(localStorage\.getItem\(DISCOVERY_STORAGE\)!==serialized\)throw Error\('Discovery archive write could not be verified'\)/);
 assert.match(ui,/if\(localStorage\.getItem\(DISCOVERY_STORAGE\)!==serialized\)throw Error\('Restored archive write could not be verified'\)/);
 const apply=ui.slice(ui.indexOf("$('apply-import').addEventListener"),ui.indexOf("$('export-slate').addEventListener"));
 assert.ok(apply.indexOf('archiveResearchPacket(parsedPacket)')<apply.indexOf('run=next;'));
});
