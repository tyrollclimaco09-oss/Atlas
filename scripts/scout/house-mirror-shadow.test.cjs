'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const H=require('./house-mirror-shadow.cjs');
const copy=x=>JSON.parse(JSON.stringify(x));
const approx=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,a+' != '+b);
function fixture(){
 return {schema_version:H.VERSION,synthetic:true,research_only:true,phase:'PHASE2_MARKET_DEMONSTRATION',
  study_id:'synthetic-house-mirror',event_id:'synthetic-game-a',starts_at:'2026-10-19T20:00:00Z',
  research_frozen_at:'2026-10-18T11:00:00Z',research_receipt_sha256:'a'.repeat(64),
  as_of:'2026-10-18T11:30:00Z',max_quote_age_minutes:30,
  market:{market_id:'synthetic-market-qb',side_a:'Synthetic QB 30+ attempts',
    side_b:'Synthetic QB below 30 attempts',rules_id:'synthetic-two-way-no-push',
    settlement:'TWO_OUTCOME_NO_PUSH'},
  quotes:[
    quote('synthetic-book-one','synthetic-aggregator-x',-110,-110,'2026-10-18T11:20:00Z'),
    quote('synthetic-book-two','synthetic-aggregator-x',-120,110,'2026-10-18T11:25:00Z')
  ]};
}
function quote(book_id,provider_family,american_a,american_b,captured_at){
 return {book_id,provider_family,market_id:'synthetic-market-qb',
  side_a:'Synthetic QB 30+ attempts',side_b:'Synthetic QB below 30 attempts',rules_id:'synthetic-two-way-no-push',
  american_a,american_b,captured_at,origin:'SYNTHETIC_DEMO'};
}
test('proportional de-vig calculations never become a purported independent forecast',()=>{
 const r=H.mirror(fixture());
 assert.equal(r.accepted_quote_count,2);
 assert.equal(r.rejected_quote_count,0);
 const first=r.accepted.find(x=>x.book_id==='synthetic-book-one');
 approx(first.raw_implied_a,110/210);
 approx(first.raw_implied_b,110/210);
 approx(first.hold,1/21);
 approx(first.proportional_no_vig_a,0.5);
 approx(first.proportional_no_vig_b,0.5);
 assert.equal(r.independent_fair_probability,null);
 assert.equal(r.edge,null);
 assert.equal(r.recommended_selection,null);
 assert.equal(r.execution_authority,false);
});
test('two sports books through one provider do not count as independent source families',()=>{
 const r=H.mirror(fixture());
 assert.equal(r.raw_quote_count,2);
 assert.equal(r.quoted_provider_families,1);
 assert.deepEqual(r.provider_overlap,[{provider_family:'synthetic-aggregator-x',book_count:2}]);
 assert.equal(r.warnings.includes('CROSS_PROVIDER_CORRELATION_NOT_PROVEN_ABSENT'),true);
});
test('market identity, stale clocks and anomalous holds are quarantined with full denominators',()=>{
 const f=fixture();
 f.quotes.push({...quote('synthetic-old','synthetic-aggregator-y',-110,-110,'2026-10-18T11:00:00Z'),captured_at:'2026-10-18T10:59:00Z'});
 f.quotes.push({...quote('synthetic-wrong','synthetic-aggregator-y',-110,-110,'2026-10-18T11:20:00Z'),side_a:'Different player'});
 f.quotes.push(quote('synthetic-broken','synthetic-aggregator-z',150,150,'2026-10-18T11:20:00Z'));
 const r=H.mirror(f);
 assert.equal(r.raw_quote_count,5);
 assert.equal(r.accepted_quote_count,2);
 assert.equal(r.rejected_quote_count,3);
 assert.equal(r.excluded.find(x=>x.book_id==='synthetic-old').reasons.includes('MIRROR_QUOTE_CHRONOLOGY'),true);
 assert.equal(r.excluded.find(x=>x.book_id==='synthetic-wrong').reasons.includes('MIRROR_IDENTITY_MISMATCH'),true);
 assert.equal(r.excluded.find(x=>x.book_id==='synthetic-broken').reasons.includes('MIRROR_HOLD_ANOMALY'),true);
});
test('timestamp cutoff, malformed market and extra independent-forecast fields fail closed',()=>{
 const a=fixture();a.as_of='2026-10-20T11:30:00Z';
 assert.throws(()=>H.mirror(a),/MIRROR_TIME/);
 const b=fixture();b.research_frozen_at='2026-10-18T11:31:00Z';
 assert.throws(()=>H.mirror(b),/MIRROR_TIME/);
 const c=fixture();c.market.settlement='PUSHABLE';
 assert.throws(()=>H.mirror(c),/MIRROR_MARKET/);
 const d={...fixture(),oracle_probability:0.68};
 assert.throws(()=>H.mirror(d),/MIRROR_CONTRACT/);
});
test('distinct provider families remain diversity metadata, not magically verified market consensus',()=>{
 const f=fixture();
 f.quotes[1].provider_family='synthetic-aggregator-y';
 const r=H.mirror(f);
 assert.equal(r.quoted_provider_families,2);
 assert.deepEqual(r.provider_overlap,[]);
 assert.equal(r.warnings.includes('CROSS_PROVIDER_CORRELATION_NOT_PROVEN_ABSENT'),true);
 assert.equal(r.price_independent_forecast,'NOT_PROVEN_BY_HASH');
});
test('invalid American odds, missing quotes, and provider duplicates never imply best displayed execution',()=>{
 const a=fixture();a.quotes[0].american_a=-99;
 const r=H.mirror(a);
 assert.equal(r.accepted_quote_count,1);
 assert.equal(r.excluded.find(x=>x.book_id==='synthetic-book-one').reasons.includes('MIRROR_ODDS'),true);
 const b=fixture();b.quotes[0].american_a=-99;b.quotes[1].american_b=-99;
 const empty=H.mirror(b);
 assert.equal(empty.accepted_quote_count,0);
 assert.equal(empty.best_displayed_a,null);
 assert.equal(empty.descriptive_median_no_vig_a,null);
 const c=fixture();c.quotes.push(copy(c.quotes[0]));
 assert.throws(()=>H.mirror(c),/MIRROR_QUOTE_CONTRACT/);
});
test('no source quote or target data can travel backward into the price-blind OI receipt',()=>{
 const O=require('./outcome-intelligence-shadow.cjs');
 const f=fixture();
 const r=H.mirror(f);
 const fake={schema_version:O.VERSION,synthetic:true,research_only:true,phase:'PHASE1_PRICE_INDEPENDENT',
  study_id:'synthetic-invalid',frozen_at:f.research_frozen_at,forecast_cutoff:f.as_of,
  weight_origin:'UNESTIMATED',events:[{event_id:f.event_id,starts_at:f.starts_at}],
  legs:[],worlds:[],price_benchmark:r.descriptive_median_no_vig_a};
 assert.throws(()=>O.freezeWorlds(fake),/WORLD_CONTRACT/);
});
