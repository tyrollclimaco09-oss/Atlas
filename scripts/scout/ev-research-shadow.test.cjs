'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const EV = require('./ev-research-shadow.cjs');
const clone = x => JSON.parse(JSON.stringify(x));
const approx = (a,b) => assert.ok(Math.abs(a-b) < 1e-9, a + ' != ' + b);

function input() {
  return {
    schema_version: EV.VERSION,
    synthetic: true, research_only: true,
    mirror_input: {
      schema_version:'atlas.house-mirror.shadow.v1',
      synthetic:true, research_only:true, phase:'PHASE2_MARKET_DEMONSTRATION',
      study_id:'synthetic-ev-test',event_id:'synthetic-game',
      starts_at:'2026-10-25T17:00:00Z',
      research_frozen_at:'2026-10-22T06:00:00Z',
      research_receipt_sha256:'a'.repeat(64),
      as_of:'2026-10-22T06:30:00Z',max_quote_age_minutes:30,
      market:{market_id:'synthetic-qb-attempts',side_a:'Synthetic QB 30+ attempts',
        side_b:'Synthetic QB fewer than 30 attempts',rules_id:'synthetic-no-push',
        settlement:'TWO_OUTCOME_NO_PUSH'},
      quotes:[{book_id:'synthetic-dk',provider_family:'synthetic-fam-x',
        market_id:'synthetic-qb-attempts',side_a:'Synthetic QB 30+ attempts',
        side_b:'Synthetic QB fewer than 30 attempts',rules_id:'synthetic-no-push',
        american_a:-110,american_b:-110,captured_at:'2026-10-22T06:20:00Z',
        origin:'SYNTHETIC_DEMO'}]
    },
    target_book_id:'synthetic-dk',target_side:'a',
    probability_scenarios:{low:0.45,center:0.60,high:0.65}
  };
}

test('reuses ATLAS pricing and HM-01: hypothetical p=60% at -110 yields +14.545% ROI, not +10%',()=>{
 const r=EV.evaluate(input());
 approx(r.descriptive_market_no_vig_probability,0.5);
 approx(r.break_even_probability,110/210);
 approx(r.scenarios.center.assumed_probability_minus_market_no_vig,0.1);
 approx(r.scenarios.center.expected_roi_at_quote,(0.6*(1+100/110))-1);
 assert.notEqual(r.scenarios.center.expected_roi_at_quote,
    r.scenarios.center.assumed_probability_minus_market_no_vig);
 assert.equal(r.independent_fair_probability,null);
 assert.equal(r.verified_ev,null);
 assert.equal(r.recommended_selection,null);
 assert.equal(r.execution_authority,false);
 assert.equal(r.api_calls,0);
});

test('market probability advantage can coexist with NEGATIVE expected ROI',()=>{
 const a=input();a.probability_scenarios={low:0.50,center:0.51,high:0.53};
 const r=EV.evaluate(a);
 assert.ok(r.scenarios.center.assumed_probability_minus_market_no_vig>0);
 assert.ok(r.scenarios.center.expected_roi_at_quote<0);
});

test('price never becomes better when probability is lower; output is frozen',()=>{
 const r=EV.evaluate(input());
 assert.ok(r.scenarios.low.expected_roi_at_quote<r.scenarios.center.expected_roi_at_quote);
 assert.ok(r.scenarios.high.expected_roi_at_quote>r.scenarios.center.expected_roi_at_quote);
 assert.ok(Object.isFrozen(r)&&Object.isFrozen(r.scenarios.center));
 assert.equal(r.provider_independence,'UNVERIFIED');
});

test('different target side uses actual matched quote and complement market benchmark',()=>{
 const a=input();a.target_side='b';
 a.mirror_input.quotes[0].american_a=-140;
 a.mirror_input.quotes[0].american_b=+115;
 const r=EV.evaluate(a);
 assert.equal(r.target_american_odds,115);
 approx(r.break_even_probability,100/215);
 approx(r.descriptive_market_no_vig_probability,
   (100/215)/((100/215)+(140/240)));
});

test('synthetic contract forbids arbitrary fields, live odds, invalid assumptions',()=>{
 const a=input();a.real_odds=true;
 assert.throws(()=>EV.evaluate(a),/EV_SHADOW_CONTRACT/);
 const b=input();b.synthetic=false;
 assert.throws(()=>EV.evaluate(b),/EV_SHADOW_CONTRACT/);
 const c=input();c.probability_scenarios.center=1.0;
 assert.throws(()=>EV.evaluate(c),/EV_SHADOW_SCENARIOS/);
 const d=input();d.probability_scenarios.low=0.8;
 assert.throws(()=>EV.evaluate(d),/EV_SHADOW_SCENARIOS/);
 const e=input();e.mirror_input.quotes[0].origin='API_PROVIDER_LIVE';
 assert.throws(()=>EV.evaluate(e),/MIRROR_QUOTE_CONTRACT/);
});

test('stale/missing/mismatched bookmaker quotes are rejected by HM-01',()=>{
 const stale=input();
 stale.mirror_input.quotes[0].captured_at='2026-10-22T06:00:00Z';
 stale.mirror_input.max_quote_age_minutes=20;
 assert.throws(()=>EV.evaluate(stale),/EV_SHADOW_NO_VERIFIED_QUOTE/);
 const missing=input();missing.target_book_id='synthetic-another-book';
 assert.throws(()=>EV.evaluate(missing),/EV_SHADOW_NO_VERIFIED_QUOTE/);
 const changed=input();changed.mirror_input.quotes[0].side_a='Synthetic different player';
 assert.throws(()=>EV.evaluate(changed),/EV_SHADOW_NO_VERIFIED_QUOTE/);
});

test('assumption changes cannot mutate stored input or pretend calibrated results',()=>{
 const a=input();const raw=clone(a);
 const r=EV.evaluate(a);
 assert.deepEqual(a,raw);
 assert.equal(r.classification,'CONDITIONAL_HYPOTHETICAL_MATH_ONLY');
 assert.ok(r.warnings.includes('SCENARIOS_ARE_ASSUMPTIONS_NOT_CALIBRATED_FORECASTS'));
});
