'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
require('../pricing.js');
const E=require('../slate-engine.js');
const now=Date.parse('2026-09-17T15:00:00Z');
const iso=offset=>new Date(now+offset*60000).toISOString();
function prepared(){
  const run=E.newRun({date:'2026-09-17',timezone:'UTC'},now);
  Object.assign(run,{bankroll:'20',exposure:'0',budget:'3',accountAt:iso(-1)});
  const c=E.newCandidate();run.candidates.push(c);
  Object.assign(c.scout,{event:'Synthetic A vs Synthetic B',selection:'Synthetic A ML',market:'Moneyline',startsAt:iso(180),discovery:'Synthetic role evidence for tests.',source:'https://example.com/schedule'});
  Object.assign(c.verify,{availability:'Synthetic active roster.',source:'https://example.com/roster',checkedAt:iso(-10),rules:'Two-outcome regulation market for test fixture.',reviewed:true});
  Object.assign(c.oracle,{thesis:'Test forecast based on role data.',counter:'Opponent role could differ.',invalidation:'Starter change.',method:'Synthetic independent fixture model.',probability:'55',independence:'Fixture created before pricing.',reviewed:true});
  E.seal(run,c,now);
  Object.assign(c.pricing,{book:'DraftKings',odds:'+110',line:'Synthetic A ML',source:'https://example.com/odds',capturedAt:iso(0),comparison:'Synthetic comparison for tests.',noPush:true});
  Object.assign(c.kairos,{action:'ACT',reason:'Fixture evidence is current.',expiresAt:iso(10)});
  Object.assign(c.sentinel,{stake:'1',correlation:'No overlapping test positions.',reviewed:true});
  Object.assign(c.tactician,{reason:'Single expression for test.',routes:'Test outcome routes.',correlation:'No shared test risk.'});
  Object.assign(c.final,{book:'DraftKings',line:'Synthetic A ML',odds:'+110',stake:'1',capturedAt:iso(0),image:{name:'fixture.png',data:'data:image/png;base64,AAAA'},imageReviewed:true,infoReviewed:true,confirmed:true});
  return {run,c};
}
test('complete evidence permits a decision receipt, never a placement',()=>{
  const {run,c}=prepared();assert.equal(E.evaluate(run,c,now).ready,true);
  const approval=E.approve(run,c,now);assert.equal(approval.placed,false);assert.equal(approval.stake,1);
  assert.throws(()=>E.approve(run,c,now),/already exists/);
  assert.equal(run.history.at(-1).detail.candidate.final.image.name,'fixture.png');
});
test('time passing closes Final Gate without edits and future timestamps cannot pass',()=>{
  const {run,c}=prepared();E.approve(run,c,now);
  assert.equal(E.evaluate(run,c,now+16*60000).ready,false);
  assert.equal(E.evaluate(run,c,now+16*60000).status,'RECHECK REQUIRED');
  c.pricing.capturedAt=iso(1);assert.match(E.evaluate(run,c,now).errors[3].join(),/future/);
  c.pricing.capturedAt='2026-09-17T15:00:00';assert.equal(E.evaluate(run,c,now).ready,false);
});
test('Final Gate binds screenshot quote to priced market, book, and stake',()=>{
  for(const [field,value]of [['book','BetMGM'],['line','Synthetic A -1.5'],['odds','-110'],['stake','2'],['image',null],['imageReviewed',false],['confirmed',false]]){
    const {run,c}=prepared();c.final[field]=value;assert.equal(E.evaluate(run,c,now).ready,false,field);assert.throws(()=>E.approve(run,c,now));
  }
});
test('missing or stale bankroll does not become zero; open exposure and other candidates share the cap',()=>{
  const {run,c}=prepared();run.exposure='';assert.equal(E.evaluate(run,c,now).ready,false);run.exposure='0';
  run.accountAt=iso(-61);assert.equal(E.evaluate(run,c,now).ready,false);run.accountAt=iso(0);
  const other=E.copy(c);other.id='other';other.approval={stake:2.5};run.candidates.push(other);
  assert.match(E.evaluate(run,c,now).errors[5].join(),/slate cap/);
  other.approval=null;run.exposure='19.5';assert.match(E.evaluate(run,c,now).errors[5].join(),/bankroll/);
  run.exposure='0';c.sentinel.stake='0.001';assert.match(E.evaluate(run,c,now).errors[5].join(),/decimal/);
});
test('a freeze cannot be retroactively rewritten or granted after entering a market price',()=>{
  const {run,c}=prepared();c.oracle.probability='80';assert.match(E.evaluate(run,c,now).errors[2].join(),/changed after freezing/);
  assert.equal(c.sealed.oracle.probability,'55');assert.equal(run.history[0].detail.oracle.probability,'55');
  c.sealed=null;assert.throws(()=>E.seal(run,c,now),/independence before pricing/);
});
test('negative value, heavy favorites, unsupported combinations, and uncertain settlement cannot pass',()=>{
  for(const mutate of [c=>c.pricing.odds='-149',c=>c.pricing.odds='-151',c=>c.pricing.noPush=false,c=>c.tactician.expression='SGP',c=>c.verify.unresolved='Unconfirmed starter',c=>c.kairos.action='WAIT']){
    const {run,c}=prepared();mutate(c);assert.equal(E.evaluate(run,c,now).ready,false);
  }
});
test('closed PASS or WATCH cannot create a final receipt, and watch expiry is visible',()=>{
  const {run,c}=prepared();c.disposition={status:'WATCH',reason:'Wait',trigger:'Change',expires:iso(-1)};
  assert.equal(E.evaluate(run,c,now).status,'WATCH · review due');assert.throws(()=>E.approve(run,c,now),/Reopen/);
});
test('research import is atomic, bound to a run, deduplicated, and cannot import checkmarks or approvals',()=>{
  const run=E.newRun({date:'2026-09-17',timezone:'UTC'},now);
  const response={schema:'atlas.research.v1',runId:run.id,phase:'research',candidates:[{scout:{event:'Synthetic match',selection:'Synthetic prop'},verify:{reviewed:true},oracle:{reviewed:true,probability:'55'},approval:{stake:1}}]};
  const imported=E.importResearch(run,JSON.stringify(response),now);
  assert.equal(run.candidates.length,0);assert.equal(imported.candidates[0].verify.reviewed,false);assert.equal(imported.candidates[0].oracle.reviewed,false);assert.equal(imported.candidates[0].approval,null);
  imported.candidates[0].verify.reviewed=true;
  assert.deepEqual(E.importResearch(imported,JSON.stringify(response),now),imported);
  response.candidates[0].oracle.thesis='Different research';const before=JSON.stringify(imported);
  assert.throws(()=>E.importResearch(imported,JSON.stringify(response),now),/documented revision/);assert.equal(JSON.stringify(imported),before);
  response.runId='wrong';assert.throws(()=>E.importResearch(run,JSON.stringify(response),now),/different slate/);
});
test('pricing imports bind the frozen revision and reset operator checks without changing ORACLE',()=>{
  const {run,c}=prepared();E.approve(run,c,now);
  const response={schema:'atlas.research.v1',runId:run.id,phase:'pricing',candidates:[{id:c.id,oracleRevision:c.sealed.id,selection:c.scout.selection,pricing:{odds:'+115',noPush:true},oracle:{probability:'99'},final:{confirmed:true}}]};
  const changed=E.importResearch(run,JSON.stringify(response),now);
  const candidate=changed.candidates[0];assert.equal(candidate.oracle.probability,'55');assert.equal(candidate.approval,null);assert.equal(candidate.final.confirmed,false);assert.equal(candidate.pricing.noPush,false);assert.equal(c.pricing.odds,'+110');
  response.candidates[0].oracleRevision='wrong';assert.throws(()=>E.importResearch(run,JSON.stringify(response),now),/revision/);
});
test('pregame and slate-date boundaries must hold and prompt packets omit account/screenshot data',()=>{
  const {run,c}=prepared();run.bankroll='123.45';const p=E.prompt(run,'pricing');assert(!p.includes('123.45'));assert(!p.includes('base64'));assert(p.includes(c.sealed.id));
  c.scout.startsAt=iso(-1);assert.equal(E.evaluate(run,c,now).ready,false);
  c.scout.startsAt='2026-09-18T15:00:00Z';assert.match(E.evaluate(run,c,now).errors[0].join(),/slate date/);
});
test('whole-response paste accepts prose, fences, and quoted braces without changing the packet',()=>{
  const packet={schema:'atlas.research.v1',runId:'test',phase:'research',candidates:[{scout:{event:'Team {A}',selection:'Player says "go" \\ line'}}]};
  const json=JSON.stringify(packet);
  assert.deepEqual(E.parse('Here is your research:\n```json\n'+json+'\n```\nReview your sources.'),packet);
  assert.deepEqual(E.parse('Example metadata {"note":"other"}\n'+json),packet);
  assert.throws(()=>E.parse(json+'\n'+json),/More than one/);
  assert.throws(()=>E.parse('```json\n'+json.slice(0,-1)+'\n```'),/No complete/);
  assert.throws(()=>E.parse('Ordinary prose with no structured response.'),/No complete/);
});

test('Run / Continue routes to real work without granting approval',()=>{
  assert.equal(E.nextAction(null,now).action,'start');
  const empty=E.newRun({},now);assert.equal(E.nextAction(empty,now).action,'research');
  empty.pendingPhase='research';assert.equal(E.nextAction(empty,now).action,'import');
  const {run,c}=prepared();assert.equal(E.nextAction(run,now).stage,7);assert.equal(c.approval,null);
  c.pricing.capturedAt=iso(-16);assert.equal(E.nextAction(run,now).action,'pricing');
  c.sealed=null;c.pricing=E.newCandidate().pricing;
  assert.equal(E.nextAction(run,now).action,'freeze');
  c.oracle.reviewed=false;assert.equal(E.nextAction(run,now).action,'review');
  c.disposition={status:'PASS'};assert.equal(E.nextAction(run,now).action,'done');
});

test('Empty research is a completed outcome, remains bound to its slate, and preserves existing candidates',()=>{
 const {run,c}=prepared();
 const packet={schema:'atlas.research.v1',runId:run.id,phase:'research',candidates:[]};
 const imported=E.importResearch(run,JSON.stringify(packet),now);
 assert.equal(imported.emptyResearchAt,new Date(now).toISOString());assert.deepEqual(imported.candidates,[c]);assert.equal(run.emptyResearchAt,undefined);
 assert.deepEqual(E.importResearch(imported,JSON.stringify(packet),now+1000),imported);
 packet.phase='pricing';assert.throws(()=>E.importResearch(run,JSON.stringify(packet),now),/pricing candidates/);
 packet.phase='research';packet.runId='another-run';assert.throws(()=>E.importResearch(run,JSON.stringify(packet),now,true),/original slate/);
 const emptyRun=E.newRun({},now);emptyRun.emptyResearchAt=new Date(now).toISOString();assert.equal(E.nextAction(emptyRun,now).label,'Research again →');
});
test('Confirmed shortlist excludes unapproved, closed, expired, and invalidated candidates',()=>{
 const {run,c}=prepared();assert.equal(E.confirmedShortlist(run,now),'');
 E.approve(run,c,now);run.candidates.push(E.newCandidate());
 const text=E.confirmedShortlist(run,now);assert.match(text,/Synthetic A ML \| \+110 \| DraftKings \| Stake \$1.00/);assert.doesNotMatch(text,/2\./);
 assert.equal(E.confirmedShortlist(run,now+16*60000),'');
 c.disposition={status:'WATCH'};assert.equal(E.confirmedShortlist(run,now),'');c.disposition=null;
 E.invalidate(run,c,'Changed evidence',now);assert.equal(E.confirmedShortlist(run,now),'');
});
test('New slates default to Mixed while an explicit sport is respected',()=>{
 assert.equal(E.newRun().sport,'Mixed');assert.equal(E.newRun({sport:'NFL'}).sport,'NFL');
});
