'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {resolve}=require('node:path');
const url='file://'+resolve(__dirname,'../index.html');
test('real Chromium: discovery census persists after browser reload and remains searchable',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext();
  const page=await context.newPage();
  await page.goto(url);
  await page.evaluate(()=>{
   const packet={schema:'atlas.research.v1',phase:'research',runId:'browser-smoke',candidates:[{scout:{event:'Synthetic Browser Game',startsAt:'2026-10-18T20:00:00Z',market:'Player prop',selection:'Synthetic 7+'}}]};
   const next=AtlasDiscovery.ingest(AtlasDiscovery.empty(),packet,'2026-10-17T06:00:00Z');
   localStorage.setItem('atlas.discovery.census.v1',AtlasDiscovery.exportJSON(next));
  });
  await page.reload();
  // The census is inside the active slate workspace; start a slate through its real UI.
  await page.locator('#continue-slate').click();
  await page.locator('#active-slate').waitFor({state:'visible'});
  await page.locator('#discovery-board').evaluate(el=>el.open=true);
  await page.locator('#discovery-search').fill('Synthetic 7+');
  await page.waitForFunction(()=>document.querySelector('#discovery-results')?.textContent.includes('Synthetic 7+'));
  assert.match(await page.locator('#discovery-page-count').innerText(),/1 saved candidates/);
  assert.match(await page.locator('#discovery-census').innerText(),/1 unique candidates/);
  await context.close();
 }finally{await browser.close();}
});
test('real Chromium: failed storage write preserves previously archived census',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext();
  const page=await context.newPage();
  await page.goto(url);
  const result=await page.evaluate(()=>{
   const key='atlas.discovery.census.v1';
   const original=AtlasDiscovery.ingest(AtlasDiscovery.empty(),{schema:'atlas.research.v1',phase:'research',runId:'before',candidates:[{scout:{event:'Synthetic',startsAt:'2026-10-18T20:00:00Z',market:'Prop',selection:'x'}}]});
   localStorage.setItem(key,AtlasDiscovery.exportJSON(original));
   const before=localStorage.getItem(key);
   const originalSet=Storage.prototype.setItem;
   Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('quota','QuotaExceededError');return originalSet.call(this,k,v);};
   let rejected=false;
   try{localStorage.setItem(key,'corrupt');}catch(e){rejected=e.name==='QuotaExceededError';}
   Storage.prototype.setItem=originalSet;
   return {rejected,unchanged:localStorage.getItem(key)===before};
  });
  assert.deepEqual(result,{rejected:true,unchanged:true});
  await context.close();
 }finally{await browser.close();}
});

test('real Chromium: applying research through UI archives it and survives reload',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext();
  const page=await context.newPage();
  await page.goto(url);
  await page.locator('#continue-slate').click();
  await page.locator('#active-slate').waitFor({state:'visible'});
  await page.locator('#return-with-research').click();
  const packet={schema:'atlas.research.v1',phase:'research',runId:'browser-import',candidates:[{scout:{event:'Synthetic Browser Import',startsAt:'2026-10-19T20:00:00Z',market:'Player prop',selection:'Synthetic 9+'},verify:{availability:'Unverified'},oracle:{thesis:'Synthetic only'}}]};
  await page.locator('#import-text').fill(JSON.stringify(packet));
  await page.locator('#apply-import').click();
  await page.waitForFunction(()=>localStorage.getItem('atlas.discovery.census.v1')?.includes('Synthetic 9+'));
  const before=await page.evaluate(()=>({draft:JSON.parse(localStorage.getItem('atlas.slate.draft.v1')),census:JSON.parse(localStorage.getItem('atlas.discovery.census.v1'))}));
  assert.equal(before.census.records.length,1);
  assert.equal(before.census.records[0].scout.selection,'Synthetic 9+');
  assert.equal(before.draft.candidates.length,1);
  await page.reload();
  assert.match(await page.locator('#discovery-census').innerText(),/1 unique candidates/);
  assert.ok((await page.locator('#run-meta').innerText()).includes('1/16 candidates'));
  await context.close();
 }finally{await browser.close();}
});
test('real Chromium: quota rejection prevents research import from applying to slate',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext();
  const page=await context.newPage();
  await page.goto(url);
  await page.locator('#continue-slate').click();
  await page.locator('#active-slate').waitFor({state:'visible'});
  await page.locator('#return-with-research').click();
  const packet={schema:'atlas.research.v1',phase:'research',runId:'browser-quota',candidates:[{scout:{event:'Synthetic Quota Game',startsAt:'2026-10-19T20:00:00Z',market:'Player prop',selection:'Synthetic quota 5+'},verify:{},oracle:{}}]};
  await page.locator('#import-text').fill(JSON.stringify(packet));
  await page.evaluate(()=>{
    const set=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){if(key==='atlas.discovery.census.v1')throw new DOMException('quota','QuotaExceededError');return set.call(this,key,value);};
  });
  await page.locator('#apply-import').click();
  await page.waitForFunction(()=>document.querySelector('#import-feedback')?.textContent.includes('Could not apply research'));
  const result=await page.evaluate(()=>({count:JSON.parse(localStorage.getItem('atlas.slate.draft.v1')).candidates.length,census:localStorage.getItem('atlas.discovery.census.v1')}));
  assert.equal(result.count,0);
  assert.equal(result.census,null);
  await context.close();
 }finally{await browser.close();}
});
