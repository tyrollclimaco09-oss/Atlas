'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const HEAD='c'.repeat(40);
const names=[
 'Original baseline provenance',
 'Review code and regression suite',
 'Real Chromium archive smoke',
 'Offline SCOUT and Outcome Intelligence shadow',
 'MasterSave source integrity and drift denials'
];
function fixture(){
 return {
 schema:'atlas.remote.private-status.v1',
 result:'MATCH',reason:'CURRENT_HEAD_REVIEW_JOBS_GREEN',
 observed_at:'2026-10-19T16:06:43.797Z',repository:'tyrollclimaco09-oss/Atlas',
 branch:'review/pass0-slate-regression-2026-10-16',head_sha:HEAD,
 ci:{run_id:39268529074,status:'completed',conclusion:'success',
  url:'https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39268529074'},
 jobs:names.map(name=>({name,status:'completed',conclusion:'success'})),
 sources:Array(4).fill({provider:'GitHub PUBLIC REST',status:'MATCH'}),
 auth_boundary:'VERCEL_AUTH_ALL_DEPLOYMENTS_REQUIRED',
 app_login:false,write_authority:false,sportsbook_execution:false
 };
}
async function withBrowser(resultFn,check) {
 let calls=0;
 const server=http.createServer((req,res)=>{
  if(req.url==='/api/status'){
   calls++;const output=resultFn();res.writeHead(output.code||200,{
    'content-type':output.contentType||'application/json; charset=utf-8',
    'cache-control':'no-store'});
   return res.end(typeof output.body==='string'?output.body:JSON.stringify(output.body));
  }
  const paths={
   '/operator-status.html':'operator-status.html',
   '/operator-status.js':'operator-status.js',
   '/operator-status.css':'operator-status.css',
   '/operator-icons/icon-192.png':'operator-icons/icon-192.png'
  };
  const file=paths[req.url];
  if(!file){res.writeHead(404);return res.end('missing');}
  const mime=file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':
   file.endsWith('.html')?'text/html':'image/png';
  res.writeHead(200,{'content-type':mime});
  res.end(fs.readFileSync(path.join(root,file)));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const addr=server.address();const origin='http://127.0.0.1:'+addr.port;
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:375,height:812},isMobile:true,hasTouch:true});
  const external=[];
  page.on('request',r=>{if(!r.url().startsWith(origin))external.push(r.url());});
  await page.goto(origin+'/operator-status.html');
  await check({page,calls:()=>calls,origin,external});
  await page.close();
 }finally{await browser.close();await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));}
}

test('phone-size authenticated-boundary STATUS UI shows source, five required jobs, and real refresh button',async()=>{
 await withBrowser(()=>({body:fixture()}),async({page,calls,external})=>{
  await page.waitForFunction(()=>document.querySelector('#state')?.textContent==='MATCH');
  assert.equal(await page.locator('#state').getAttribute('data-status'),'MATCH');
  assert.equal(await page.locator('#sha').innerText(),HEAD);
  assert.equal(await page.locator('#job-count').innerText(),'5/5 succeeded');
  assert.equal(await page.locator('#job-list li.pass').count(),5);
  assert.equal(await page.locator('#ci').getAttribute('href'),
   'https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39268529074');
  assert.equal(await page.locator('input').count(),0);
  const bounds=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:window.innerWidth}));
  assert.ok(bounds.scroll<=bounds.view+1,'no horizontal overflow on iPhone');
  assert.equal(calls(),1);
  await page.locator('#refresh').click();
  await page.waitForFunction(()=>document.querySelector('#busy')?.textContent==='');
  assert.equal(calls(),2);
  assert.deepEqual(external,[]);
 });
});

test('denied platform access and missing JSON never yield green status',async()=>{
 await withBrowser(()=>({code:403,body:'Vercel authentication required',contentType:'text/html'}),async({page})=>{
  await page.waitForFunction(()=>document.querySelector('#reason')?.textContent.includes('Authentication required'));
  assert.equal(await page.locator('#state').innerText(),'UNKNOWN');
  assert.equal(await page.locator('#ci').isVisible(),false);
  assert.equal(await page.locator('#job-list li.pass').count(),0);
 });
});

test('UI rejects fabricated MATCH missing jobs and cannot inject HTML in reason',async()=>{
 const payload=fixture();
 payload.jobs=payload.jobs.slice(1);
 payload.reason='<img src=x onerror=alert(1)>';
 await withBrowser(()=>({body:payload}),async({page})=>{
  await page.waitForFunction(()=>document.querySelector('#reason')?.textContent.includes('insufficient evidence'));
  assert.equal(await page.locator('#state').innerText(),'UNKNOWN');
  assert.equal(await page.locator('#reason img').count(),0);
 });
});
