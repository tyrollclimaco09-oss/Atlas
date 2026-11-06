'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {MODES,preflightReference}=require('./market-intake-v15.cjs');
const t=Date.parse('2026-11-06T19:50:00Z');
const quote={source_key:'ATLAS_WEB_REFERENCE',source_quote_at:'2026-11-06T19:49:30Z',
observed_at:'2026-11-06T19:49:59Z',event_start_at:'2026-11-07T00:00:00Z',
odds_american:231,source_url:'https://example.invalid/nba/reference',market:'moneyline',selection:'Washington Wizards'};
const call=(x={},opts={})=>preflightReference({...quote,...x},{now:t,...opts});
test('fresh manual public reference remains research-only',()=>assert.equal(call().status,'MANUAL_RESEARCH_REFERENCE_ONLY'));
test('always refuses execution-grade assertion',()=>assert.equal(call().execution_grade,false));
test('always refuses paid-credit consumption',()=>assert.equal(call().paid_credits_consumed,0));
test('does not create independently calibrated probability',()=>assert.equal(call().independent_fair_probability,null));
test('does not invent expected value',()=>assert.equal(call().expected_value,null));
test('does not grant production authority',()=>assert.equal(call().production_authority,false));
test('does not grant betting authority',()=>assert.equal(call().betting_authority,false));
test('cannot make a network request',()=>assert.equal(call().network_request_performed,false));
test('retired The Odds API explicitly blocked',()=>assert.equal(call({source_key:'THE_ODDS_API'}).status,'PAID_CONNECTOR_DISABLED'));
test('unknown source cannot bypass policy',()=>assert.equal(call({source_key:'RANDOM'}).status,'SOURCE_NOT_REGISTERED'));
test('V13 four hour old public reference stale',()=>assert.equal(call({source_quote_at:'2026-11-06T15:00:00Z'}).status,'STALE_PUBLIC_REFERENCE'));
test('source quote after observation invalid',()=>assert.equal(call({source_quote_at:'2026-11-06T20:01:00Z'}).status,'REFERENCE_TIME_INVALID_OR_EXPIRED'));
test('observation after tip invalid',()=>assert.equal(call({observed_at:'2026-11-07T00:01:00Z'}).status,'REFERENCE_TIME_INVALID_OR_EXPIRED'));
test('no source URL invalid',()=>assert.equal(call({source_url:null}).status,'REFERENCE_IDENTITY_INVALID'));
test('HTTP not secure invalid',()=>assert.equal(call({source_url:'http://example.invalid'}).status,'REFERENCE_IDENTITY_INVALID'));
test('empty market invalid',()=>assert.equal(call({market:null}).status,'REFERENCE_IDENTITY_INVALID'));
test('empty selection invalid',()=>assert.equal(call({selection:''}).status,'REFERENCE_IDENTITY_INVALID'));
test('price +99 invalid',()=>assert.equal(call({odds_american:99}).status,'REFERENCE_IDENTITY_INVALID'));
test('negative American price -110 accepted as manual research',()=>assert.equal(call({odds_american:-110}).status,'MANUAL_RESEARCH_REFERENCE_ONLY'));
test('source policies have zero daily paid budget',()=>assert(Object.values(MODES).every(p=>p.paid_credits_per_day===0)));
test('source policies disallow network',()=>assert(Object.values(MODES).every(p=>p.network_calls_enabled===false)));
test('deployed migration disables billable connector',()=>{
const f=fs.readFileSync(path.resolve(__dirname,'../../supabase/migrations/20261106194023_atlas_market_intake_failclosed_v15.sql'),'utf8');
assert.match(f,/'THE_ODDS_API','The Odds API','PAID_ODDS','DISABLED'/);
assert.match(f,/network_calls_enabled=false/);
assert.match(f,/daily_paid_credit_budget=0/);
});
test('deployed amendment rejects SQL nulls explicitly',()=>{
const f=fs.readFileSync(path.resolve(__dirname,'../../supabase/migrations/20261106194124_atlas_market_intake_null_contract_v15.sql'),'utf8');
assert.match(f,/p_market is null/);assert.match(f,/p_source_url is null/);assert.match(f,/p_selection is null/);
});
