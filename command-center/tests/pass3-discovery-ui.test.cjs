'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const root=join(__dirname,'..');
const ui=readFileSync(join(root,'slate.js'),'utf8');
const html=readFileSync(join(root,'index.html'),'utf8');
test('discovery archive script loads before slate UI and export control exists',()=>{
 assert.ok(html.indexOf('src="discovery-registry.js"')<html.indexOf('src="slate.js"'));
 assert.match(html,/id="discovery-census"/);
 assert.match(html,/id="export-discovery"/);
});
test('validated import commits draft and archive with readback before slate is applied',()=>{
 const start=ui.indexOf("$('apply-import').addEventListener");
 const end=ui.indexOf("$('export-slate').addEventListener",start);
 const section=ui.slice(start,end);
 assert.ok(section.indexOf('const next=E.importResearch(')>=0);
 assert.ok(section.indexOf('commitImportedResearch(next,parsedPacket);')>section.indexOf('const next=E.importResearch('));
 assert.ok(section.indexOf('run=next;')>section.indexOf('commitImportedResearch(next,parsedPacket);'));
 assert.ok(ui.includes('localStorage.setItem(STORAGE,draftBytes)'));
 assert.ok(ui.includes('localStorage.setItem(DISCOVERY_STORAGE,archiveBytes)'));
 assert.match(ui,/rollback incomplete/);
 assert.match(ui,/D\.ingest\(readDiscovery\(\),data\)/);
});
test('startup accepts larger valid local drafts and exports research separately',()=>{
 assert.match(ui,/d\.candidates\.length<=64/);
 assert.match(ui,/D\.exportJSON\(readDiscovery\(\)\)/);
});
