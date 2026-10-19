'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {resolve}=require('node:path');
const url='file://'+resolve(__dirname,'../operator-remote.html');

test('real Chromium: ATLAS remote is usable on iPhone-sized screens without fetching private app data',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const outgoing=[];
  page.on('request',request=>{if(!request.url().startsWith('file://'))outgoing.push(request.url());});
  await page.goto(url);
  assert.match(await page.title(),/ATLAS.*Operator Remote/);
  assert.equal(await page.locator('[data-action]').count(),8);
  assert.equal(await page.locator('[data-action="STATUS"]').getAttribute('aria-pressed'),'true');
  assert.match(await page.locator('#command').inputValue(),/Execute only the action with id STATUS/);
  await page.locator('[data-action="MASTERSAVE"]').click();
  assert.match(await page.locator('#command').inputValue(),/Execute only the action with id MASTERSAVE/);
  await page.locator('[data-action="RESUME"]').click();
  assert.equal(await page.locator('[data-action="RESUME"]').getAttribute('aria-pressed'),'true');
  assert.match(await page.locator('#command').inputValue(),/Never silently deploy, place bets, install plugins/);
  const scroll=await page.evaluate(()=>({width:document.documentElement.scrollWidth,view:window.innerWidth}));
  assert.ok(scroll.width<=scroll.view+1,'unexpected horizontal overflow on mobile');
  assert.deepEqual(outgoing,[],'the remote must not call an external service by itself');
  await context.close();
 }finally{await browser.close();}
});

test('real Chromium: denied clipboard does not report false success and allows manual copy',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext();
  const page=await context.newPage();
  await page.goto(url);
  await page.evaluate(()=>{
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied');}}});
  });
  await page.locator('[data-action="AUDIT"]').click();
  await page.locator('#copy').click();
  await page.waitForFunction(()=>document.querySelector('#copy-status')?.textContent.includes('copy it manually'));
  const selection=await page.locator('#command').evaluate(node=>[node.selectionStart,node.selectionEnd,node.value.length]);
  assert.deepEqual(selection,[0,selection[2],selection[2]]);
  assert.match(await page.locator('#command').inputValue(),/action with id AUDIT/);
  await context.close();
 }finally{await browser.close();}
});
