'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const {build}=require('../../scripts/remote/package-private-preview.cjs');

test('actual private deployment bundle runs external script and preserves safe command routing',async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-remote-private-smoke-'));
 const dest=path.join(tmp,'dist');
 let browser,server;
 try{
  build(dest);
  const errors=[],outbound=[];
  const available=new Set([
    'index.html','operator-remote.html','operator-remote.js','operator-remote.webmanifest',
    'operator-status.html','operator-status.css','operator-status.js',
    'operator-icons/icon-192.png','operator-icons/icon-512.png'
  ]);
  server=http.createServer((req,res)=>{
   if(req.url==='/api/status'){
    res.writeHead(403,{'content-type':'text/plain'});return res.end('Authentication required');
   }
   const relative=(req.url||'/').slice(1)||'index.html';
   if(!available.has(relative)){res.writeHead(404);return res.end('not found');}
   const type=relative.endsWith('.html')?'text/html':relative.endsWith('.js')?'text/javascript':
    relative.endsWith('.css')?'text/css':relative.endsWith('.webmanifest')?'application/manifest+json':'image/png';
   res.writeHead(200,{'content-type':type,'cache-control':'no-store'});
   res.end(fs.readFileSync(path.join(dest,relative)));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(!request.url().startsWith(origin))outbound.push(request.url());});
  await page.goto(origin+'/operator-remote.html');
  assert.equal(await page.locator('[data-action]').count(),8);
  assert.equal(await page.locator('[data-routine]').count(),3);
  assert.equal(await page.locator('[data-provider]').count(),7);
  assert.equal(await page.locator('[data-action="STATUS"]').getAttribute('aria-pressed'),'true');
  assert.match(await page.locator('#command').inputValue(),/ATLAS OPERATOR REMOTE v2/);
  await page.locator('[data-routine="RECOVERY"]').click();
  assert.match(await page.locator('#command').inputValue(),/ROUTINE RECOVERY/);
  await page.locator('[data-action="MASTERSAVE"]').click();
  assert.match(await page.locator('#command').inputValue(),/PREVIEW_ONLY/);
  assert.equal(await page.locator('#execute-gate').isVisible(),true);
  await page.locator('#execute-confirm').check();
  assert.match(await page.locator('#command').inputValue(),/OPERATOR_APPROVED_REVIEW_ONLY/);
  await page.locator('[data-action="RESUME"]').click();
  assert.equal(await page.locator('#execute-confirm').isChecked(),false);
  assert.match(await page.locator('#command').inputValue(),/PREVIEW_ONLY/);
  await page.locator('#protected-status-link').click();
  await page.waitForFunction(()=>document.querySelector('#state')?.textContent==='UNKNOWN');
  assert.match(await page.locator('#reason').innerText(),/Authentication required/);
  assert.deepEqual(errors,[]);
  assert.deepEqual(outbound,[]);
  const width=await page.evaluate(()=>[document.documentElement.scrollWidth,window.innerWidth]);
  assert.ok(width[0]<=width[1]+1,'mobile preview has horizontal overflow');
 }finally{
  if(browser)await browser.close();
  if(server)await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));
  fs.rmSync(tmp,{recursive:true,force:true});
 }
});
