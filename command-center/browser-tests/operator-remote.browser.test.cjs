'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {resolve}=require('node:path');
const url='file://'+resolve(__dirname,'../operator-remote.html');

test('real Chromium: mobile remote routes 8 actions and three read-only kits without outside traffic',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage(),outgoing=[];
  page.on('request',request=>{if(!request.url().startsWith('file://'))outgoing.push(request.url());});
  await page.goto(url);
  assert.match(await page.title(),/Operator Remote v2/);
  assert.equal(await page.locator('[data-action]').count(),8);
  assert.equal(await page.locator('[data-routine]').count(),3);
  assert.equal(await page.locator('[data-provider]').count(),7);
  assert.equal(await page.locator('[data-action="STATUS"]').getAttribute('aria-pressed'),'true');
  assert.match(await page.locator('#command').inputValue(),/MODE: READ_ONLY/);
  assert.match(await page.locator('#route-summary').innerText(),/GitHub/);
  await page.locator('[data-routine="RECOVERY"]').click();
  assert.match(await page.locator('#command').inputValue(),/ROUTINE RECOVERY/);
  assert.match(await page.locator('#command').inputValue(),/1. RESTORE/);
  assert.match(await page.locator('#command').inputValue(),/2. AUDIT/);
  assert.equal(await page.locator('#execute-gate').isVisible(),false);
  await page.locator('[data-action="GRAPH"]').click();
  assert.match(await page.locator('#route-summary').innerText(),/Figma/);
  assert.equal(await page.locator('[data-provider="figma"]').getAttribute('data-routed'),'true');
  assert.equal(await page.locator('[data-provider="drive"]').getAttribute('data-routed'),'false');
  assert.deepEqual(outgoing,[]);
  const scroll=await page.evaluate(()=>({width:document.documentElement.scrollWidth,view:window.innerWidth}));
  assert.ok(scroll.width<=scroll.view+1,'mobile must not overflow horizontally');
  await context.close();
 }finally{await browser.close();}
});

test('real Chromium: MasterSave and Resume require fresh explicit gate; consent resets on switching',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
  const page=await context.newPage();await page.goto(url);
  await page.locator('[data-action="MASTERSAVE"]').click();
  assert.equal(await page.locator('#execute-gate').isVisible(),true);
  assert.match(await page.locator('#command').inputValue(),/MODE: PREVIEW_ONLY/);
  await page.locator('#execute-confirm').check();
  assert.match(await page.locator('#command').inputValue(),/MODE: OPERATOR_APPROVED_REVIEW_ONLY/);
  await page.locator('[data-action="RESUME"]').click();
  assert.equal(await page.locator('#execute-confirm').isChecked(),false);
  assert.match(await page.locator('#command').inputValue(),/MODE: PREVIEW_ONLY/);
  await page.locator('[data-routine="PREFLIGHT"]').click();
  assert.equal(await page.locator('#execute-gate').isVisible(),false);
  assert.match(await page.locator('#command').inputValue(),/MODE: READ_ONLY/);
  assert.equal(await page.locator('#execute-confirm').isChecked(),false);
  await context.close();
 }finally{await browser.close();}
});

test('real Chromium: clipboard refusal selects only visible prompt, never claims copy succeeded',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext();const page=await context.newPage();
  await page.goto(url);
  await page.evaluate(()=>{
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('permission denied');}}});
  });
  await page.locator('[data-routine="RESEARCH_PREP"]').click();
  await page.locator('#copy').click();
  await page.waitForFunction(()=>document.querySelector('#copy-status')?.textContent.includes('copy it manually'));
  const selection=await page.locator('#command').evaluate(node=>[node.selectionStart,node.selectionEnd,node.value.length]);
  assert.deepEqual(selection,[0,selection[2],selection[2]]);
  assert.match(await page.locator('#command').inputValue(),/ROUTINE RESEARCH_PREP/);
  await context.close();
 }finally{await browser.close();}
});
