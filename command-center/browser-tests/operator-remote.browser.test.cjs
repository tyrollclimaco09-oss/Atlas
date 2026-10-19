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


test('mobile: project context can be reconstructed without fabricating saved slate progress or restoring consent',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  await page.locator('[data-action="MASTERSAVE"]').click();
  await page.locator('#execute-confirm').check();
  await page.locator('#atlas-context').click();
  const prompt=await page.locator('#command').inputValue();
  assert.match(prompt,/RECONSTRUCT WORK CONTINUITY/);
  assert.match(prompt,/ATLAS-REMOTE-PRIVATE-STATUS-20261019-HANDOFF-01/);
  assert.match(prompt,/This website has NOT loaded local browser slate drafts/);
  assert.match(prompt,/verify live HEAD/i);
  assert.match(prompt,/no production or Supabase writes/i);
  assert.equal(await page.locator('#execute-confirm').isChecked(),false);
  assert.equal(await page.locator('#execute-gate').isVisible(),false);
  assert.equal(await page.locator('#route-name').innerText(),'RECOVER CONTEXT');
  // Context handoff itself must not masquerade as an auto-executed remote registry command.
  assert.equal(await page.locator('[data-action][aria-pressed="true"]').count(),0);
  await page.locator('[data-action="RESUME"]').click();
  assert.match(await page.locator('#command').inputValue(),/MODE: PREVIEW_ONLY/);
  assert.deepEqual(errors,[]);
  await context.close();
 }finally{await browser.close();}
});

test('mobile: blocked copy-and-switch stays on ATLAS and selects the actual current command',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext();
  const page=await context.newPage();await page.goto(url);
  await page.locator('#atlas-slate').click();
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied');}}}));
  const from=page.url();
  await page.locator('#atlas-send').click();
  assert.equal(page.url(),from,'clipboard failure must never leave page');
  assert.match(await page.locator('#atlas-quick-message').innerText(),/Automatic copy was blocked/);
  const vals=await page.locator('#command').evaluate(n=>[n.selectionStart,n.selectionEnd,n.value.length]);
  assert.deepEqual(vals,[0,vals[2],vals[2]]);
  await context.close();
 }finally{await browser.close();}
});

test('mobile: successful copy-and-switch contains the selected prompt but no data in destination URL',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext();
  const page=await context.newPage();let saved='';
  await page.route('https://chatgpt.com/**',r=>r.fulfill({status:200,contentType:'text/html',body:'<title>Handoff destination</title>'}));
  await page.exposeBinding('captureAtlasCopy',(_,t)=>{saved=t;});
  await page.goto(url);
  await page.locator('#atlas-context').click();
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>window.captureAtlasCopy(t)}}));
  await Promise.all([page.waitForURL('https://chatgpt.com/'),page.locator('#atlas-send').click()]);
  assert.match(saved,/RECONSTRUCT WORK CONTINUITY/);
  assert.equal(new URL(page.url()).search,'');
  assert.equal(new URL(page.url()).hash,'');
  await context.close();
 }finally{await browser.close();}
});

test('mobile: hosted page never claims authentication success from hostname alone',async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const fs=require('node:fs'),root=resolve(__dirname,'..');
  await page.route('https://atlas-test.vercel.app/**',route=>{
   const name=new URL(route.request().url()).pathname.slice(1)||'operator-remote.html';
   const paths=new Set(['operator-remote.html','operator-continuity.js','operator-continuity.css','operator-remote.webmanifest']);
   if(!paths.has(name))return route.fulfill({status:404,body:'missing'});
   const type=name.endsWith('.css')?'text/css':name.endsWith('.js')?'text/javascript':name.endsWith('.webmanifest')?'application/manifest+json':'text/html';
   return route.fulfill({status:200,contentType:type,body:fs.readFileSync(resolve(root,name))});
  });
  await page.goto('https://atlas-test.vercel.app/operator-remote.html');
  await page.locator('#atlas-continuity').waitFor();
  assert.equal(await page.locator('#phone-readiness').getAttribute('data-auth-state'),'HOST_READBACK_REQUIRED');
  assert.match(await page.locator('#phone-readiness').innerText(),/Verify Vercel sign-in/);
  assert.match(await page.locator('#phone-readiness').innerText(),/cannot prove them/);
  await context.close();
 }finally{await browser.close();}
});
