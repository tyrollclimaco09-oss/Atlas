const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
require('../pricing.js');
const E=require('../slate-engine.js');
const source=fs.readFileSync(require.resolve('../slate.js'),'utf8');
function browser(writeText){
 const elements=new Map(),events=[],handlers={};
 const ctx={URL,run:E.newRun(),preferredChat:'',storageOK:true,persist(){},localStorage:{setItem(){}},navigator:{clipboard:{writeText}},window:{location:{assign(url){events.push('redirect:'+url);}},open(){events.push('reserved');return popup;}},$:(id)=>{
  if(!elements.has(id))elements.set(id,{value:'',textContent:'',hidden:false,disabled:false,focus(){},select(){},removeAttribute(name){delete this[name];},addEventListener(_,fn){handlers[id]=fn;}});
  return elements.get(id);
 }};
 const popup={closed:false,opener:{},location:{replace(url){events.push(url);}},close(){popup.closed=true;events.push('closed');}};
 ctx.$('handoff-text').value='Complete slate prompt';
 vm.runInNewContext(source.slice(source.indexOf('  function chatDestination'),source.indexOf('  function download')),ctx);
 return {ctx,elements,events,popup,handlers};
}
test('Copying stays on the slate and concurrent clicks cannot start another copy',async()=>{
 let complete;const pending=new Promise(resolve=>{complete=resolve;});
 const {ctx,events,popup}=browser(text=>{assert.equal(text,'Complete slate prompt');return pending;});
 const write=ctx.navigator.clipboard.writeText;ctx.navigator.clipboard.writeText=text=>{events.push('copy requested');return write(text);};
 ctx.$('chat-url').value='https://chatgpt.com/c/example-atlas';
 const action=ctx.copyPrompt();await ctx.copyPrompt();
 assert.deepEqual(events,['copy requested']);assert.equal(ctx.$('copy-open-handoff').disabled,true);
 complete();await action;
 assert.deepEqual(events,['copy requested']);assert.equal(ctx.$('copy-open-handoff').disabled,false);assert.match(ctx.$('copy-result').textContent,/Copied/);assert.equal(ctx.$('open-chatgpt').href,'https://chatgpt.com/c/example-atlas');
});
test('Clipboard denial stays on the slate and exposes manual copying',async()=>{
 const {ctx,events}=browser(()=>Promise.reject(new Error('denied')));
 await ctx.copyPrompt();
 assert.deepEqual(events,[]);assert.equal(ctx.$('prompt-details').open,true);assert.match(ctx.$('copy-result').textContent,/blocked copying/);
});
test('Successful copying explains the viewer exit and how to resume the same slate',async()=>{
 const {ctx,events}=browser(()=>Promise.resolve());ctx.window.open=()=>null;
 await ctx.copyPrompt();
 assert.deepEqual(events,[]);assert.match(ctx.$('copy-result').textContent,/tap × at the top/);assert.match(ctx.$('copy-result').textContent,/reopen this slate/);assert.equal(ctx.$('open-chatgpt').href,'https://chatgpt.com/');
});
test('Invalid or shared chat links block only the link; copying still succeeds',async()=>{
 for(const url of ['https://example.com/c/atlas','javascript:alert(1)','https://chatgpt.com/share/example']){
  let copied=0;const {ctx,events}=browser(()=>{copied++;return Promise.resolve();});ctx.$('chat-url').value=url;
  await ctx.copyPrompt();assert.equal(copied,1);assert.deepEqual(events,[]);assert.equal(ctx.$('open-chatgpt').hidden,true);assert.match(ctx.$('chat-link-feedback').textContent,/Copying still works/);assert.match(ctx.$('copy-result').textContent,/Copied/);assert.equal(ctx.run.chatUrl,undefined);
 }
});
test('Reopening import restores the response for the pending phase',()=>{
 const elements=new Map();let click;
 const ctx={run:{pendingPhase:'pricing',handoffDrafts:{research:'First batch',pricing:'Unfinished quote response'}},pendingImport:{},importTimer:0,clearTimeout(){},checkImport(){},toast(){},slateContext:phase=>'Current slate · '+phase,$:(id)=>{
  if(!elements.has(id))elements.set(id,{value:'',addEventListener(_,fn){click=fn;},showModal(){}});return elements.get(id);
 }};
 const from=source.indexOf("  $('import-research').addEventListener");
 vm.runInNewContext(source.slice(from,source.indexOf("  $('import-text').addEventListener",from)),ctx);
 click();assert.equal(ctx.$('import-text').value,'Unfinished quote response');assert.match(ctx.$('import-context').textContent,/pricing/);
});
test('Format repair preserves the source, requests no research, and rejects other run identities',()=>{
 const run=E.newRun(),raw='Research with missing probability and a dated source.';
 const before=JSON.stringify(run),prompt=E.formatPrompt(run,'research',raw);
 assert.match(prompt,/Do not browse, rerun research, or add new facts/);assert.ok(prompt.includes(JSON.stringify(raw)));assert.equal(JSON.stringify(run),before);
 assert.throws(()=>E.formatPrompt(run,'research',JSON.stringify({schema:'atlas.research.v1',runId:'other',phase:'research',candidates:[]})),/another slate or phase/);
 assert.throws(()=>E.formatPrompt(run,'research',JSON.stringify({schema:'atlas.research.v1',runId:run.id,phase:'pricing',candidates:[]})),/another slate or phase/);
});

test('An unsaved slate keeps copying available but hides the departure link',async()=>{
 const {ctx,events}=browser(()=>Promise.resolve());ctx.window.open=()=>null;ctx.storageOK=false;
 await ctx.copyPrompt();assert.deepEqual(events,[]);assert.match(ctx.$('copy-result').textContent,/Export your draft/);assert.equal(ctx.$('open-chatgpt').hidden,true);
});
test('Research and pricing buttons copy in one click, but respect preparation guards',()=>{
 for(const allowed of [true,false]){
  const handlers={},calls=[];
  const ctx={$:id=>({addEventListener:(_,fn)=>handlers[id]=fn}),showPrompt:phase=>{calls.push(phase);return allowed;},copyPrompt:()=>calls.push('copy')};
  const start=source.indexOf("  $('research-handoff').addEventListener");
  vm.runInNewContext(source.slice(start,source.indexOf("  $('copy-open-handoff').addEventListener",start)),ctx);
  handlers['research-handoff']();handlers['pricing-handoff']();
  assert.deepEqual(calls,allowed?['research','copy','pricing','copy']:['research','pricing']);
 }
});

test('An explicit Open ChatGPT click revalidates the destination and draft saving',()=>{
 for(const state of ['valid','bad-link','save-failed']){
  const {ctx,handlers}=browser(()=>Promise.resolve());let prevented=false;
  ctx.$('chat-url').value=state==='bad-link'?'https://example.com/':'https://chatgpt.com/c/atlas';ctx.storageOK=state!=='save-failed';
  const start=source.indexOf("  $('open-chatgpt').addEventListener");
  vm.runInNewContext(source.slice(start,source.indexOf("  $('return-with-research').addEventListener",start)),ctx);
  handlers['open-chatgpt']({currentTarget:ctx.$('open-chatgpt'),preventDefault(){prevented=true;}});
  assert.equal(prevented,state!=='valid');assert.equal(ctx.$('open-chatgpt').hidden,state!=='valid');
  if(state==='valid')assert.equal(ctx.$('open-chatgpt').href,'https://chatgpt.com/c/atlas');
 }
});
test('Correcting a bad link clears its error without changing the copied request',()=>{
 const {ctx}=browser(()=>Promise.resolve());ctx.$('chat-url').value='bad';assert.equal(ctx.syncChatLink(),false);
 ctx.$('chat-url').value='https://chatgpt.com/c/atlas';assert.equal(ctx.syncChatLink(),true);assert.equal(ctx.$('chat-link-feedback').textContent,'');assert.equal(ctx.$('handoff-text').value,'Complete slate prompt');
});
test('Cross-slate research requires consent, retains original packet and cannot import approval',()=>{
 const now=Date.parse('2026-09-30T15:00:00-05:00');
 const run=E.newRun({date:'2026-09-30',timezone:'America/Chicago'},now);
 const packet={schema:'atlas.research.v1',runId:'original-slate',phase:'research',candidates:[{scout:{event:'Synthetic event',selection:'Synthetic research',startsAt:'2026-09-30T20:00:00-05:00'},verify:{reviewed:true},oracle:{reviewed:true},final:{confirmed:true}}]};
 const raw=JSON.stringify(packet),before=JSON.stringify(run);
 assert.throws(()=>E.importResearch(run,raw,now),/different slate/);
 const next=E.importResearch(run,raw,now,true);
 assert.equal(JSON.stringify(run),before);assert.equal(next.id,run.id);assert.equal(next.candidates[0].verify.reviewed,false);assert.equal(next.candidates[0].final.confirmed,false);
 assert.deepEqual(next.history.at(-1).detail.originalPacket,packet);
 packet.phase='pricing';assert.throws(()=>E.importResearch(run,JSON.stringify(packet),now,true),/different slate/);
 packet.phase='research';for(const startsAt of ['','2026-09-30T14:00:00-05:00','2026-10-01T20:00:00-05:00']){
  packet.candidates[0].scout.startsAt=startsAt;assert.throws(()=>E.importResearch(run,JSON.stringify(packet),now,true),/future events/);
 }
});

test('Resume restores the same candidate and stage without carrying position into another slate',()=>{
 let stored=null;
 const run=E.newRun();run.candidates=[E.newCandidate(),E.newCandidate()];
 const ctx={E,run,VIEW:'view',selected:run.candidates[1].id,stage:5,localStorage:{setItem(_,v){stored=v;},getItem(){return stored;}}};
 vm.runInNewContext(source.slice(source.indexOf('  function saveView'),source.indexOf('  function toLocal')),ctx);
 ctx.saveView();ctx.selected=run.candidates[0].id;ctx.stage=0;ctx.restoreView();assert.equal(ctx.selected,run.candidates[1].id);assert.equal(ctx.stage,5);
 ctx.run=E.newRun();ctx.selected=null;ctx.stage=0;ctx.restoreView();assert.equal(ctx.selected,null);assert.equal(ctx.stage,0);
 ctx.run=run;stored=JSON.stringify({runId:run.id,selected:run.candidates[1].id,stage:99});ctx.restoreView();assert.equal(ctx.stage,0);
});
