'use strict';const test=require('node:test'),assert=require('node:assert/strict');
const {americanImplied,normalizeReference,diagnoseGate}=require('./reference-intake-v13.cjs');
const sample={source_url:'https://agentbets.ai/odds/draftkings/nba/',source_kind:'PUBLIC_THIRD_PARTY_AGGREGATOR',
league:'NBA',event_key:'NBA:2026-11-06:WAS@ATL',event_start_at:'2026-11-07T00:00:00Z',
market:'moneyline',selection:'Washington Wizards',sportsbook_displayed:'DraftKings',
odds_american:231,source_quote_at:'2026-11-06T15:00:00Z',observed_at:'2026-11-06T15:40:00Z'};
test('positive odds conversion',()=>assert.equal(americanImplied(100),.5));
test('negative odds conversion',()=>assert.equal(americanImplied(-200),2/3));
test('reject invalid betting quote',()=>assert.throws(()=>americanImplied(0),/INVALID_AMERICAN_ODDS/));
test('research reference accepted',()=>assert.equal(normalizeReference(sample).research_status,'WATCH'));
test('quote is not account executable',()=>assert.equal(normalizeReference(sample).execution_grade,false));
test('fair model probability never derived from the sportsbook',()=>assert.equal(normalizeReference(sample).independent_fair_probability,null));
test('no EV without independent forecast',()=>assert.equal(normalizeReference(sample).expected_value,null));
test('no odds-feed independence claim',()=>assert.equal(normalizeReference(sample).independence_weight,0));
test('correlation label matches native evidence constraint',()=>assert.equal(normalizeReference(sample).correlation_status,'CORRELATED'));
test('source clock distinguished from observation',()=>assert.equal(normalizeReference(sample).source_age_seconds,2400));
test('reject source in future',()=>assert.throws(()=>normalizeReference({...sample,source_quote_at:'2026-11-06T16:00:00Z'}),/REFERENCE_TIME_INVALID/));
test('reject observation after tipoff',()=>assert.throws(()=>normalizeReference({...sample,observed_at:'2026-11-07T00:01:00Z'}),/REFERENCE_TIME_INVALID/));
test('reject unknown bookmaker',()=>assert.throws(()=>normalizeReference({...sample,sportsbook_displayed:'Other'}),/REFERENCE_IDENTITY_INVALID/));
test('reject wrong market selection',()=>assert.throws(()=>normalizeReference({...sample,selection:'Atlanta Hawks'}),/REFERENCE_IDENTITY_INVALID/));
test('final gate blocked for native exploratory trace',()=>{const r=diagnoseGate({truth_label:'EXPLORATORY_ONLY',oracle_independent:false,sentinel_valid:false,tactician_id:null},normalizeReference(sample));assert.equal(r.status,'BLOCKED');assert.equal(r.approved_bet,null);assert(r.reasons.includes('NO_ACCOUNT_EXECUTABLE_QUOTE'))});
test('even complete research precheck never approves bet',()=>{const r=diagnoseGate({truth_label:'POINT_IN_TIME_VERIFIED',oracle_independent:true,sentinel_valid:true,tactician_id:'synthetic'}, {execution_grade:true,account_quote_verified:true});assert.equal(r.status,'REQUIRES_NATIVE_FINAL_GATE');assert.equal(r.execution_authority,false)});
