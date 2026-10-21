'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditEnvelope,implied,fairAmerican}=require('./nba-scenario-price-envelope.shadow.cjs');
const fs=require('node:fs'),path=require('node:path');
const archive=JSON.parse(fs.readFileSync(path.join(__dirname,'../../docs/evidence/nba-20261021-sharpe-coupled-game-proof.json'),'utf8'));
function packet(american=113){
 return {
  identity:{event_id:'20261021-CHA-BKN',player_key:'dayron-sharpe',starts_at:'2026-10-21T23:30:00Z'},
  market:{stat:'rebounds',operator:'AT_LEAST',threshold:9,units:'COUNT',settlement:'NO_PUSH'},
  scenarios:archive.case_summaries.map(x=>({name:x.scenario,n:12000,
    hit_frequency:x.model_frequency,calibrated:false,probability_source:'SCENARIO_ASSUMPTION'})),
  quote:{source:'THIRD_PARTY_REFERENCE',status:'REFERENCE_ONLY',provider:'Third-party market reference',
    event_id:'20261021-CHA-BKN',player_key:'dayron-sharpe',stat:'rebounds',operator:'AT_LEAST',
    threshold:9,settlement:'NO_PUSH',american_odds:american,captured_at:'2026-10-21T18:00:00Z'},
  as_of:'2026-10-21T18:05:00Z'
 };
}
test('actual four-scenario archived model envelope crosses +113 break-even',()=>{
 const o=auditEnvelope(packet());
 assert.equal(o.shadow_outcome,'DISAGREEMENT_ACROSS_SCENARIOS');
 assert.equal(o.epistemic_envelope.min,0.353);
 assert.equal(o.epistemic_envelope.max,0.6538);
 assert.equal(o.epistemic_envelope.zero_margin_american_odds_worst_assumed_scenario,184);
 assert.equal(o.epistemic_envelope.scenarios.length,4);
 assert.equal(o.independent_fair_probability,null);
 assert.equal(o.expected_value,null);
 assert.equal(o.approved_bet,null);
 assert.equal(o.execution_authority,false);
 assert.equal(o.reference_quote.price_executable,false);
});
test('even a hypothetical generous price is not evidence of real betting profit',()=>{
 const o=auditEnvelope(packet(200));
 assert.equal(o.shadow_outcome,'ALL_ASSUMED_SCENARIOS_CLEAR_REFERENCE_PRICE');
 assert.equal(o.approved_bet,null);
 assert.equal(o.expected_value,null);
 assert.ok(o.unproven.includes('PROSPECTIVE_CALIBRATION'));
 assert.ok(o.unproven.includes('EXECUTABLE_PRICE'));
});
test('worse reference price fails all assumed cases',()=>{
 const o=auditEnvelope(packet(-220));
 assert.equal(o.shadow_outcome,'NONE_OF_ASSUMED_SCENARIOS_CLEAR_REFERENCE_PRICE');
});
test('implied price arithmetic uses American odds and never roundtrip markets',()=>{
 assert.ok(Math.abs(implied(113)-100/213)<1e-12);
 assert.ok(Math.abs(implied(-133)-133/233)<1e-12);
 assert.equal(fairAmerican(.353),184);
 assert.equal(fairAmerican(.5),-100);
});
test('reject missing scenario and copied creator echo as independent world',()=>{
 const a=packet();a.scenarios.pop();
 assert.throws(()=>auditEnvelope(a),/SCENARIO_COVERAGE_INCOMPLETE/);
 const b=packet();b.scenarios[3].name='STARTER';
 assert.throws(()=>auditEnvelope(b),/SCENARIO_UNTRUSTED/);
});
test('reject invented account executable proof, even from same trusted source',()=>{
 const a=packet();a.quote.status='ACCOUNT_VERIFIED';a.quote.source='ACCOUNT_EXECUTABLE';
 assert.throws(()=>auditEnvelope(a),/QUOTE_IDENTITY_UNRESOLVED/);
});
test('reject odds and mismatched selection identity',()=>{
 const a=packet();a.quote.threshold=10;
 assert.throws(()=>auditEnvelope(a),/QUOTE_IDENTITY_UNRESOLVED/);
 const b=packet();b.quote.american_odds=-35;
 assert.throws(()=>auditEnvelope(b),/QUOTE_ODDS_INVALID/);
 const c=packet();c.market.operator='AT_MOST';
 assert.throws(()=>auditEnvelope(c),/EXACT_MARKET_REQUIRED/);
});
test('reject stale quotes and quotes after cutoff or tipoff',()=>{
 const a=packet();a.quote.captured_at='2026-10-21T17:00:00Z';
 assert.throws(()=>auditEnvelope(a),/QUOTE_STALE_OR_CHRONOLOGY/);
 const b=packet();b.quote.captured_at='2026-10-21T18:06:00Z';
 assert.throws(()=>auditEnvelope(b),/QUOTE_STALE_OR_CHRONOLOGY/);
 const c=packet();c.as_of='2026-10-21T23:31:00Z';
 assert.throws(()=>auditEnvelope(c),/QUOTE_STALE_OR_CHRONOLOGY/);
});
test('reject missing source provenance and odds-era contamination',()=>{
 const a=packet();a.scenarios[0].calibrated=true;
 assert.throws(()=>auditEnvelope(a),/SCENARIO_UNTRUSTED/);
 const b=packet();b.scenarios[0].hit_frequency=1.7;
 assert.throws(()=>auditEnvelope(b),/SCENARIO_UNTRUSTED/);
 const c=packet();c.quote.source='LIVE_SPORTSBOOK';
 assert.throws(()=>auditEnvelope(c),/QUOTE_IDENTITY_UNRESOLVED/);
});
