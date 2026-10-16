'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Slate=require('../slate-engine.js');
const NOW=Date.parse('2026-10-16T12:00:00Z');
function item(market,selection,start='2026-10-16T20:00:00Z'){
 return {scout:{event:'Fictional A vs B',startsAt:start,market,selection,discovery:'Synthetic fixture',source:'https://example.invalid/fixture'}};
}
function packet(run,candidates){return JSON.stringify({schema:'atlas.research.v1',runId:run.id,phase:'research',candidates});}
test('same exact market/selection/time rejected atomically',()=>{
 const run=Slate.newRun({date:'2026-10-16',timezone:'UTC'},NOW);
 const a=item('Player prop','Fictional player 10+ attempts');
 assert.throws(()=>Slate.importResearch(run,packet(run,[a,a]),NOW),/Duplicate exact/);
 assert.equal(run.candidates.length,0);assert.equal(run.history.length,0);
});
test('same selection text across distinct markets or starts is retained',()=>{
 const run=Slate.newRun({date:'2026-10-16',timezone:'UTC'},NOW);
 const selection='Fictional player 10+ attempts';
 const result=Slate.importResearch(run,packet(run,[item('Player prop',selection),item('Other',selection),item('Player prop',selection,'2026-10-16T21:00:00Z')]),NOW);
 assert.equal(result.candidates.length,3);
 assert.equal(run.candidates.length,0);
});
test('research import continues across packets beyond the former three candidate ceiling',()=>{
 let run=Slate.newRun({date:'2026-10-16',timezone:'UTC'},NOW);
 for(let batch=0;batch<2;batch++){
   const candidates=Array.from({length:8},(_,i)=>item('Player prop','Fictional selection '+(batch*8+i)));
   run=Slate.importResearch(run,packet(run,candidates),NOW);
 }
 assert.equal(run.candidates.length,16);
 assert.equal(run.history.length,16);
});
