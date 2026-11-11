'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {scanOfflineReferencePacket:scan}=require('./market-reference-scanner.cjs');
const {packet,quotes,replaceQuotes}=require('./fixtures/reference-snapshot.cjs');
function altered(fn){const p=packet(),q=quotes(p);fn(q,p);return replaceQuotes(p,q);}
test('complete synthetic snapshot reproduces reference and EV without independent model or venue authority',()=>{
 const r=scan(packet());assert.equal(r.status,'SIGNALS_FOUND');assert.equal(r.signals.length,1);
 const s=r.signals[0];assert.equal(s.valuation_kind,'market-reference EV');
 assert(Math.abs(s.reference_probability-12/23)<1e-12);
 assert(Math.abs(s.market_reference_ev-.06956521739130417)<1e-12);
 assert.equal(s.reference_books.length,3);assert(!s.reference_books.includes('draftkings'));
 assert.equal(s.independent_model_probability,null);assert.equal(s.venue_verified,false);
 assert.equal(s.empirical_performance_eligible,false);assert.equal(s.paper_entry_created,false);
 assert.equal(s.synthetic_fixture,true);assert.equal(r.network_requests,0);assert.equal(r.real_money_staked,0);
});
test('target does not count toward the minimum number of reference books',()=>{
 const r=scan(altered(q=>q.pop()));assert.equal(r.status,'INSUFFICIENT_REFERENCES');assert.equal(r.signals.length,0);
});
test('duplicate book observations never create extra reference books',()=>{
 const r=scan(altered(q=>q[3].book='reference_a'));
 assert.equal(r.status,'INSUFFICIENT_REFERENCES');assert.equal(r.signals.length,0);
});
for(const [name,fn,code] of [
 ['period',q=>q[1].period='regulation','RULES_MISMATCH'],
 ['rules',q=>q[1].settlementRuleId='unknown','UNAPPROVED_RULES'],
 ['stale quote',q=>q[1].sourceObservedAtUtc='2026-11-11T17:00:00Z','STALE_SOURCE'],
 ['future quote',q=>q[1].sourceObservedAtUtc='2026-11-11T18:01:00Z','FUTURE_SOURCE'],
 ['missing side',q=>q[1].outcomes.pop(),'INCOMPLETE_TWO_SIDED_MARKET'],
 ['wrong participant',q=>q[1].outcomes[0].participantId='OTHER','PARTICIPANT_MISMATCH'],
 ['invalid price',q=>q[1].outcomes[0].americanOdds=0,'INVALID_ODDS'],
 ['closed market',q=>q[1].marketStatus='CLOSED','MARKET_NOT_OPEN'],
 ['unknown status',q=>q[1].marketStatus='UNKNOWN','MARKET_STATUS_UNKNOWN'],
 ['wrong product',q=>q[1].product='draftkings_pick6','UNSUPPORTED_PRODUCT'],
 ['already started',q=>q[1].eventStartUtc='2026-11-11T17:00:00Z','NOT_PREGAME']
])test(name+' is rejected before reference construction',()=>{
 const r=scan(altered(fn));assert(r.rejected_observations.some(x=>x.errors.includes(code)));
 assert.equal(r.signals.length,0);
});
test('raw byte digest mismatch quarantines the snapshot',()=>{
 const p=packet();p.snapshots[0].rawSha256='0'.repeat(64);
 const r=scan(p);assert.equal(r.status,'VALIDATION_FAILED');assert.equal(r.signals.length,0);
 assert(r.snapshot_errors.some(x=>x.errors.includes('RAW_HASH_MISMATCH')));
});
test('source capability and permission are product specific',()=>{
 for(const field of ['capabilities','products']){
  const p=packet();p.sourceRegistry[0][field]=[];const r=scan(p);
  assert.equal(r.signals.length,0);assert(r.rejected_observations.length>0);
 }
});
test('ingestion failure, incomplete references and a genuine zero-signal scan differ',()=>{
 const a=packet();a.ingestion={status:'error',errors:['fixture ingestion failed']};a.snapshots=[];
 assert.equal(scan(a).status,'INGESTION_ERROR');
 assert.equal(scan(altered(q=>q.pop())).status,'INSUFFICIENT_REFERENCES');
 const z=scan(altered(q=>q[0].outcomes[0].americanOdds=-120));
 assert.equal(z.status,'COMPLETE_ZERO_SIGNALS');assert.equal(z.signals.length,0);
});
test('repeated scan preserves observations but cannot create another paper decision',()=>{
 const p=packet(),first=scan(p),id=first.signals[0].decision_id;
 p.priorDecisionIds=[id];const second=scan(p);
 assert.equal(second.signals.length,0);assert.equal(second.duplicate_decisions.length,1);
 assert.equal(second.observations.length,4);assert.equal(second.duplicate_decisions[0].decision_id,id);
});
test('changed later price is a new observation under the same decision identity',()=>{
 const p=packet(),id=scan(p).signals[0].decision_id;
 const q=quotes(p);q[0].observationId='synthetic-later';q[0].outcomes[0].americanOdds=110;
 replaceQuotes(p,q);p.priorDecisionIds=[id];const r=scan(p);
 assert.equal(r.signals.length,0);assert.equal(r.duplicate_decisions[0].decision_id,id);
 assert(r.observations.some(o=>o.observation_id==='synthetic-later'));
});
test('cross-book timing gap cannot produce an actionable research signal',()=>{
 const p=altered(q=>q[1].sourceObservedAtUtc='2026-11-11T17:57:30Z');
 const r=scan(p);assert.equal(r.signals.length,0);assert(r.reference_holds.some(x=>x.reason==='ASYNCHRONOUS_REFERENCES'));
});
test('unknown ingestion state never becomes a successful empty scan',()=>{
 const p=packet();p.ingestion={};assert.equal(scan(p).status,'INGESTION_ERROR');
});
test('a later closed target suppresses its earlier open price',()=>{
 const p=altered(q=>q.push({...structuredClone(q[0]),observationId:'closure',marketStatus:'CLOSED',sourceObservedAtUtc:'2026-11-11T17:59:34Z'}));
 assert.equal(scan(p).signals.length,0);
});
test('a later suspended reference cannot leave an older quote in the benchmark',()=>{
 const p=altered(q=>q.push({...structuredClone(q[1]),observationId:'suspension',marketStatus:'SUSPENDED',sourceObservedAtUtc:'2026-11-11T17:59:34Z'}));
 assert.equal(scan(p).signals.length,0);
});
test('duplicate snapshot ids quarantine both competing versions',()=>{
 const p=packet();p.snapshots.push(structuredClone(p.snapshots[0]));
 const r=scan(p);assert.equal(r.signals.length,0);assert.equal(r.snapshot_errors.length,2);
});
test('malformed source or rule registries reject data without crashing',()=>{
 for(const key of ['sourceRegistry','rulesRegistry']){
  const p=packet();p[key]=[null];const r=scan(p);assert.equal(r.signals.length,0);
 }
});
test('capability strings are not capability lists',()=>{
 const p=packet();p.sourceRegistry[0].capabilities='two_sided_prices';assert.equal(scan(p).signals.length,0);
});
test('non-canonical book aliases cannot inflate reference count',()=>{
 const p=altered(q=>q[3].book='REFERENCE_A');assert.equal(scan(p).signals.length,0);
});
test('impossible calendar times are rejected rather than normalized',()=>{
 const p=altered(q=>q[1].sourceObservedAtUtc='2026-02-30T17:59:30Z');
 assert(scan(p).rejected_observations.some(x=>x.errors.includes('INVALID_TIMESTAMP')));
});
test('nonnumeric and nonfinite quote inputs cannot produce a signal',()=>{
 for(const bad of [true,'105',null,NaN,Infinity,Number.MAX_VALUE]){
  const r=scan(altered(q=>q[0].outcomes[0].americanOdds=bad));assert.equal(r.signals.length,0);
 }
});
test('validation receipts preserve a failure and a later success as separate append-only events',()=>{
 const bad=altered(q=>q[0].marketStatus='CLOSED'),before=structuredClone(bad);
 const fail=scan(bad).validation_receipts.find(x=>x.payload.observation_id==='synthetic-0');
 const good=scan(packet()).validation_receipts.find(x=>x.payload.observation_id==='synthetic-0');
 assert.equal(fail.payload.disposition,'REJECTED');assert.equal(good.payload.disposition,'PASSED_STRUCTURE');
 assert.notEqual(fail.receipt_key,good.receipt_key);assert.equal(fail.append_only,true);
 assert.equal(good.storage_status,'NOT_PERSISTED');assert.deepEqual(bad,before);
});
test('an unavailable latest observation without retained prices still suppresses the old target',()=>{
 const p=altered(q=>q.push({...structuredClone(q[0]),observationId:'closure_without_prices',marketStatus:'CLOSED',
  outcomes:[],sourceObservedAtUtc:'2026-11-11T17:59:34Z'}));
 assert.equal(scan(p).signals.length,0);
});
test('equal-time open and closed claims hold regardless of record order',()=>{
 const p=altered(q=>q.push({...structuredClone(q[0]),observationId:'equal_time_closed',marketStatus:'CLOSED'}));
 assert.equal(scan(p).signals.length,0);
 const q=quotes(p).reverse();replaceQuotes(p,q);assert.equal(scan(p).signals.length,0);
});
test('a complete zero-signal run is distinct from a partial scan with rejected data',()=>{
 const p=altered(q=>{q[0].outcomes[0].americanOdds=-120;q.push({...structuredClone(q[0]),observationId:'bad_other',eventId:'OTHER_EVENT',period:'bad'});});
 const r=scan(p);assert.equal(r.signals.length,0);assert.equal(r.status,'PARTIAL_ZERO_SIGNALS');
 assert.equal(r.run_quality,'PARTIAL');assert.equal(r.rejected_observations.length,1);
});
test('reordering the same reference-book set cannot create a second decision',()=>{
 const p=packet();p.priorDecisionIds=scan(p).signals.map(s=>s.decision_id);
 p.policy.referenceBooks.reverse();const r=scan(p);
 assert.equal(r.signals.length,0);assert.equal(r.duplicate_decisions.length,1);
});
test('equivalent same-time prices with reversed outcomes do not become ambiguous',()=>{
 const p=altered(q=>q.push({...structuredClone(q[0]),observationId:'same_prices_reversed',outcomes:[...q[0].outcomes].reverse()}));
 const r=scan(p);assert.equal(r.signals.length,1);
 assert(!r.reference_holds.some(x=>x.reason==='AMBIGUOUS_BOOK_QUOTE'));
});
test('reference book and observation identifiers stay aligned after input reordering',()=>{
 const p=packet(),q=quotes(p);replaceQuotes(p,[q[0],q[3],q[1],q[2]]);
 const s=scan(p).signals[0];
 assert.deepEqual(s.reference_books,['reference_a','reference_b','reference_c']);
 assert.deepEqual(s.reference_observation_ids,['synthetic-1','synthetic-2','synthetic-3']);
});
test('snapshot validation never reuses a previous scan after retained bytes change',()=>{
 const p=packet();assert.equal(scan(p).signals.length,1);
 p.snapshots[0].rawBody+=' ';const r=scan(p);
 assert.equal(r.signals.length,0);assert(r.snapshot_errors.some(x=>x.errors.includes('RAW_HASH_MISMATCH')));
});
test('reference alignment is independent of locale punctuation collation',()=>{
 const p=packet(),q=quotes(p),books=['_reference','1reference','areference'];
 q.slice(1).forEach((row,i)=>row.book=books[i]);p.policy.referenceBooks=books;
 p.sourceRegistry[0].bookIds=['draftkings',...books];replaceQuotes(p,q);
 const s=scan(p).signals[0];
 assert.deepEqual(s.reference_observation_ids,s.reference_books.map(book=>q.find(row=>row.book===book).observationId));
});
