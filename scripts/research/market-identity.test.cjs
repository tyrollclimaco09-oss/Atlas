'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const m=require('./market-intelligence.cjs');
const q={quoteId:'fixture',product:'sportsbook',sport:'NBA',eventId:'QA_ONLY',eventStartUtc:'2026-11-11T19:00:00Z',
 participantId:'TEAM:A',market:'moneyline',side:'win',line:null,period:'full_game',overtimeRule:'included',
 settlementRuleId:'nba_ml_ot_v1',book:'draftkings',americanOdds:105,observedAtUtc:'2026-11-11T17:59:00Z',availability:'OFFERED',accountConfirmed:true};
const screen=items=>m.screenQuotes(items,{nowUtc:'2026-11-11T18:00:00Z'});
test('regulation and full-game prices never share an identity',()=>{
 assert.equal(screen([q,{...q,period:'regulation',overtimeRule:'excluded',settlementRuleId:'reg_v1'}]).ranked.length,2);
});
for(const field of ['product','sport','participantId','period','overtimeRule','settlementRuleId','eventStartUtc']){
 test('missing '+field+' cannot enter the old quote screen',()=>{
  const bad={...q};delete bad[field];const r=screen([bad]);
  assert.equal(r.ranked.length,0);assert.equal(r.excluded[0].reason,'MISSING_EXACT_MARKET');
 });
}
test('closing comparison refuses mismatched period or settlement',()=>{
 for(const override of [{period:'regulation'},{settlementRuleId:'other'},{participantId:'TEAM:B'},{product:'draftkings_pick6'}])
  assert.equal(m.comparableCLV({bet:q,closing:{...q,...override,observedAtUtc:'2026-11-11T18:30:00Z'}}).status,'INCOMPARABLE_LINE_OR_EVENT');
});
test('hypothetical worked examples retain existing arithmetic',()=>{
 const p=m.devigTwoWay(-120,100).for;
 assert(Math.abs(p-12/23)<1e-12);assert(Math.abs(m.valueAt(p,105)-.06956521739130417)<1e-12);
});
