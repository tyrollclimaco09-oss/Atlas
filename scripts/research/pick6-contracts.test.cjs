'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {validatePick6Selection:selection,validatePick6Entry:entry}=require('./pick6-contracts.cjs');
const options={allowedRulesIds:['fixture_rules'],asOfUtc:'2026-11-11T18:00:00Z'};
const pick=id=>({selectionId:id,pickGroupId:'fixture_group',eventId:'fixture_event',playerId:id,
 product:'draftkings_pick6',statistic:'points',period:'full_game',rulesId:'fixture_rules',sourceId:'fixture',
 rawSnapshotId:'fixture_snapshot',rawSha256:'a'.repeat(64),threshold:24.5,direction:'more',
 sourceObservedAtUtc:'2026-11-11T17:59:00Z',fetchedAtUtc:'2026-11-11T17:59:10Z',eventStartUtc:'2026-11-11T19:00:00Z'});
const request=()=>({product:'draftkings_pick6',entryId:'fixture_entry',pickGroupId:'fixture_group',entryFee:1,selections:[pick('a'),pick('b')]});
test('valid Pick6 structure permits only additional source-validation research',()=>{
 const r=selection(pick('a'),options);assert.equal(r.structure_passed,true);
 assert.equal(r.source_authenticated,false);assert.equal(r.venue_verified,false);assert.equal(r.entry_ev,null);
});
test('Sportsbook records cannot pass as Pick6 selections',()=>{
 assert.equal(selection({...pick('a'),product:'sportsbook'},options).structure_passed,false);
});
test('a selection pass never bypasses the exact-entry payout gate',()=>{
 const r=entry(request(),options);assert.equal(r.entry_valuation_supported,false);
 assert(r.blockers.includes('EXACT_ENTRY_PAYOUT_UNAVAILABLE'));assert.equal(r.entry_ev,null);
});
test('marginal probabilities and an asserted multiplier do not become joint EV',()=>{
 const p=request();p.selections.forEach(x=>x.probability=.99);p.payoutSnapshot={multiplier:10};
 p.jointOutcomeModel={assume_independent:true};const r=entry(p,options);
 assert.equal(r.entry_ev,null);assert.equal(r.status,'HOLD_ENTRY_VALUATION');
});
test('duplicate players and different Pick Groups are held',()=>{
 const p=request();p.selections[1].playerId='a';p.selections[1].pickGroupId='other';const r=entry(p,options);
 assert(r.blockers.includes('PICK6_DUPLICATE_SELECTION_OR_PLAYER'));assert(r.blockers.includes('PICK6_GROUP_MISMATCH'));
});
test('missing rules, evidence, timestamps and invalid numeric inputs fail structure',()=>{
 for(const change of [{rulesId:'unknown'},{rawSha256:'bad'},{threshold:NaN},{threshold:true},
  {direction:'over'},{sourceObservedAtUtc:'bad'},{eventStartUtc:'2026-11-11T17:00:00Z'}])
  assert.equal(selection({...pick('a'),...change},options).structure_passed,false);
});
