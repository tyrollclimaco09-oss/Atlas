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

test('real Chromium: phone-install readiness is explicit and no fake auth control appears',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage(),outgoing=[];
  page.on('request',req=>{if(!req.url().startsWith('file://'))outgoing.push(req.url());});
  await page.goto(url);
  assert.equal(await page.locator('link[rel="manifest"]').getAttribute('href'),'./operator-remote.webmanifest');
  assert.equal(await page.locator('#phone-readiness').getAttribute('data-auth-state'),'NOT_CONFIGURED');
  assert.equal(await page.locator('#phone-readiness').getAttribute('data-install-state'),'REQUIRES_HTTPS');
  assert.match(await page.locator('#phone-readiness').innerText(),/Authentication not configured/);
  await page.locator('#ios-install-instructions summary').click();
  assert.match(await page.locator('#ios-install-instructions').innerText(),/Add to Home Screen/);
  assert.deepEqual(outgoing,[]);
  assert.equal(await page.locator('input[type="password"]').count(),0);
  await context.close();
 }finally{await browser.close();}
});

test('mobile: local workflow resumes safely and slate handoff preserves no execution approval',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  await page.locator('#atlas-continuity').waitFor();
  assert.equal(await page.locator('[data-action]').count(),8,'canonical action count unchanged');
  assert.equal(await page.locator('[data-routine]').count(),3,'canonical routine count unchanged');
  assert.equal(await page.locator('#atlas-continue').isDisabled(),true);
  await page.locator('[data-action="MASTERSAVE"]').click();
  await page.locator('#execute-confirm').check();
  assert.match(await page.locator('#command').inputValue(),/MODE: OPERATOR_APPROVED_REVIEW_ONLY/);
  await page.reload();
  assert.equal(await page.locator('[data-action="MASTERSAVE"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#execute-confirm').isChecked(),false,'approval MUST NEVER persist');
  assert.match(await page.locator('#command').inputValue(),/MODE: PREVIEW_ONLY/);
  await page.locator('#atlas-slate').click();
  const prompt=await page.locator('#command').inputValue();
  assert.match(prompt,/RUN THE SLATE/);
  assert.match(prompt,/Human Final Gate is mandatory/);
  assert.match(prompt,/not executed|NOT AUTOMATIC WEBSITE EXECUTION|RESEARCH HANDOFF/i);
  assert.equal(await page.locator('#execute-gate').isVisible(),false);
  assert.match(await page.locator('#atlas-notes').getAttribute('href'),/PASS0_SLATE_REGRESSION_2026-10-16.md/);
  assert.match(page.url(),/#atlas=slate:SLATE$/);
  await page.reload();
  assert.match(await page.locator('#command').inputValue(),/RUN THE SLATE/);
  await page.locator('#atlas-clear').click();
  assert.match(await page.locator('#command').inputValue(),/ACTION STATUS/);
  assert.equal(await page.locator('#atlas-continue').isDisabled(),true);
  assert.ok(!page.url().includes('#atlas='),'clearing shortcut clears URL state');
  const layout=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:innerWidth}));
  assert.ok(layout.scroll<=layout.view+1,'no mobile horizontal overflow');
  assert.deepEqual(errors,[]);
  await context.close();
 }finally{await browser.close();}
});
