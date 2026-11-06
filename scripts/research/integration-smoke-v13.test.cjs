'use strict';const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../');
const f=JSON.parse(fs.readFileSync(path.join(root,'docs/fixtures/ATLAS_V13_NATIVE_WEB_REFERENCE_HANDOFF.json'),'utf8'));
const {normalizeReference,diagnoseGate}=require('./reference-intake-v13.cjs');
const quote={source_url:f.public_reference.source_url,source_kind:'PUBLIC_THIRD_PARTY_AGGREGATOR',
league:'NBA',event_key:f.native_record.canonical_event_key,event_start_at:'2026-11-07T00:00:00Z',
market:'moneyline',selection:f.public_reference.selection,sportsbook_displayed:f.public_reference.book_displayed,
odds_american:f.public_reference.odds_american,source_quote_at:f.public_reference.asof_utc,observed_at:'2026-11-06T15:40:00Z'};
test('real reference has actual public source',()=>assert.equal(f.public_reference.source_url,'https://agentbets.ai/odds/draftkings/nba/'));
test('real reference source timestamp preserved',()=>assert.equal(f.public_reference.asof_utc,'2026-11-06T15:00:00Z'));
test('actual research reference matches adapter',()=>assert.equal(normalizeReference(quote).american_odds,231));
test('reference itself is not executable',()=>assert.equal(f.public_reference.account_executable,false));
test('exactly two native intake attempts recorded',()=>assert.equal(f.db_counts.intake_attempts,2));
test('first failed attempt remains in evidence',()=>assert.equal(f.db_counts.failed_intakes,1));
test('one native intake success retained',()=>assert.equal(f.db_counts.completed_intakes,1));
test('real native candidate is SCOUTED',()=>assert.equal(f.native_record.lifecycle,'SCOUTED'));
test('candidate not marked point-in-time verified',()=>assert.equal(f.native_record.truth_label,'EXPLORATORY_ONLY'));
test('candidate only has dependent reference evidence',()=>assert.equal(f.native_record.oracle_independence_weight,0));
test('all twelve candidate node phases persisted',()=>assert.equal(f.db_counts.candidate_node_receipts,12));
test('candidate coherence not invented',()=>assert.equal(f.db_counts.coherent_duo_candidates,0));
test('no account-executable quote claimed',()=>assert.equal(f.db_counts.execution_quotes,0));
test('no actual Final Gate row created',()=>assert.equal(f.db_counts.actual_final_gate_rows_for_candidate,0));
test('native Final Gate remains blocked',()=>assert.equal(f.decision.final_gate,'BLOCKED'));
test('no fair price or EV fabricated',()=>{assert.equal(f.decision.independent_fair_probability,null);assert.equal(f.decision.expected_value,null)});
test('no account user faked',()=>assert.equal(f.auth.auth_users,0));
test('no site-reader token faked',()=>assert.equal(f.auth.site_credentials,0));
test('no wager or paid odds provider call',()=>{assert.equal(f.decision.actual_wager,false);assert.equal(f.decision.paid_API_credit_calls,0)});
test('native researched quote still fails gate',()=>{const p=diagnoseGate({truth_label:'EXPLORATORY_ONLY',oracle_independent:false,sentinel_valid:false,tactician_id:null},normalizeReference(quote));assert.equal(p.status,'BLOCKED');assert.equal(p.approved_bet,null)});
