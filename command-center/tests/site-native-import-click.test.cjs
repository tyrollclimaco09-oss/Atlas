const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
require('../pricing.js');
const E=require('../slate-engine.js');
const source=fs.readFileSync(require.resolve('../slate.js'),'utf8');
const handler=source.slice(source.indexOf("  $('apply-import').addEventListener"),source.indexOf("  $('export-slate').addEventListener"));
function setup(raw){
  const elements=new Map();let click;
  const ctx={E,run:E.newRun(),storageOK:true,selected:'stale-selection',stage:0,pendingImport:null,importTimer:1,clearTimeout(){},showReuseOption(){},persist(){ctx.saved=true;},render(){},toast(message){ctx.message=message;},$:(id)=>{
    if(!elements.has(id))elements.set(id,{value:'',textContent:'',className:'',addEventListener(_,fn){click=fn;},close(){ctx.closed=true;},scrollIntoView(){}});
    return elements.get(id);
  }};
  ctx.$('import-text').value=typeof raw==='function'?raw(ctx.run):raw;
  vm.runInNewContext(handler,ctx);return {ctx,click,elements};
}
test('Apply imports immediately without a preview and recovers a missing selected candidate',()=>{
  const {ctx,click}=setup(run=>JSON.stringify({schema:'atlas.research.v1',runId:run.id,phase:'research',candidates:[{scout:{event:'Synthetic matchup',selection:'Synthetic selection'}}]}));
  click();assert.equal(ctx.run.candidates.length,1);assert.equal(ctx.selected,ctx.run.candidates[0].id);assert.equal(ctx.saved,true);assert.equal(ctx.closed,true);
  assert.match(ctx.message,/Research saved/);assert.match(ctx.message,/missing forecast evidence/);assert.equal(ctx.run.candidates[0].oracle.probability,'');assert.equal(ctx.run.candidates[0].verify.reviewed,false);
});

test('A storage failure keeps the valid research in session and does not claim it was saved',()=>{
 const {ctx,click}=setup(run=>JSON.stringify({schema:'atlas.research.v1',runId:run.id,phase:'research',candidates:[]}));
 ctx.storageOK=false;click();assert.ok(ctx.run.emptyResearchAt);assert.equal(ctx.closed,undefined);assert.equal(ctx.message,undefined);assert.match(ctx.$('import-feedback').textContent,/could not save/);assert.match(ctx.$('import-feedback').textContent,/export your draft/);
});
test('Apply displays an error for empty or wrong-run text and leaves the draft unchanged',()=>{
  for(const raw of ['',JSON.stringify({schema:'atlas.research.v1',runId:'wrong',phase:'research',candidates:[]})]){
    const {ctx,click,elements}=setup(raw);const before=JSON.stringify(ctx.run);click();
    assert.equal(JSON.stringify(ctx.run),before);assert.match(elements.get('import-feedback').textContent,/Could not apply research:/);assert.equal(ctx.closed,undefined);assert.equal(ctx.saved,undefined);
  }
});

test('Apply completes an empty research result and leaves the slate resumable',()=>{
 const {ctx,click}=setup(run=>JSON.stringify({schema:'atlas.research.v1',runId:run.id,phase:'research',candidates:[]}));
 ctx.run.pendingPhase='research';click();assert.equal(ctx.run.candidates.length,0);assert.ok(ctx.run.emptyResearchAt);assert.equal(ctx.run.pendingPhase,null);assert.equal(ctx.closed,true);assert.equal(ctx.saved,true);
});
