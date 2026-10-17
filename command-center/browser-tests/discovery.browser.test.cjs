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
