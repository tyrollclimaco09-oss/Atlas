import test from 'node:test';
import assert from 'node:assert/strict';
import {americanToDecimal,binarySettlementEV,settlementStateEV,
 betaCDF,betaQuantile,betaBinomialResearch,scenarioProbability,
 compareQualifiedQuotes,doubleDependenceResearch,annotateExistingOpportunityResults,PART2_SHADOW_CONTRACT}
 from './part2-shadow-math.mjs';
const close=(x,y,tol=1e-9)=>assert(Math.abs(x-y)<=tol,`${x} != ${y}`);
const quote=(decimal_odds)=>({contract_id:'NBA:CASE1:AST6+:FULL',decimal_odds,
 exact_contract_match:true,rules_match:true,availability_status:'AVAILABLE_VERIFIED',
 observed_at:'2026-11-12T12:00:00Z'});
const prior={prior_alpha:1,prior_beta:1,successes:12,trials:20,
 decimal_odds:1.90,minimum_ev:.02,max_shortfall:.05};
const engine={contract:'ATLAS_OPPORTUNITY_VALUE_V1', ranked:[{case_key:'CASE1',blockers:['MISSING_OR_INCOMPARABLE_NATIVE_BOOK_PRICE'],stage:'HOLD_UNQUALIFIED',paper_stake_cap:0,real_money_wagered:0},{case_key:'CASE2',blockers:[],stage:'SHADOW_HUMAN_REVIEW_ONLY',paper_stake_cap:1}],summary:{hold:1,qualified_for_shadow_human_review:1},production_authority:false};

test('convert American +150 and -110, reject malformed prices',()=>{
 close(americanToDecimal(150),2.5);close(americanToDecimal(-110),1.9090909090909092);
 for(const x of [0,-90,90,1.5,Infinity,NaN])assert.throws(()=>americanToDecimal(x));
});
test('no push expected return equals pD-1',()=>close(binarySettlementEV({win_probability:.6,loss_probability:.4,decimal_odds:1.9}).expected_net_per_unit,.14));
test('push changes expected return and denominator must reconcile',()=>{
 const e=binarySettlementEV({win_probability:.5,loss_probability:.3,push_probability:.2,decimal_odds:1.9});
 close(e.expected_net_per_unit,.15);assert.equal(e.execution_authorized,false);
 assert.throws(()=>binarySettlementEV({win_probability:.6,loss_probability:.3,push_probability:.2,decimal_odds:1.9}));
});
test('arbitrary settlement state EV',()=>{
 close(settlementStateEV([{probability:.4,net_return_per_unit:2},{probability:.2,net_return_per_unit:0},{probability:.4,net_return_per_unit:-1}]).expected_net_per_unit,.4);
 assert.throws(()=>settlementStateEV([{probability:.8,net_return_per_unit:2},{probability:.4,net_return_per_unit:-1}]));
});
test('Beta CDF closed forms',()=>{
 close(betaCDF(.3,1,1),.3,1e-12);
 close(betaCDF(.3,2,1),.09,1e-12);
 close(betaCDF(.3,1,2),.51,1e-12);
 close(betaQuantile(.05,1,1),.05,1e-12);
});
test('Beta credible intervals and one-sided lower bound match scientific reference',()=>{
 const e=betaBinomialResearch(prior);
 close(e.posterior_alpha,13);close(e.posterior_beta,9);
 close(e.mean_probability,13/22,1e-12);
 close(e.posterior_interval_95[0],.3843543903786459,1e-7);
 close(e.posterior_interval_95[1],.78180314,1e-7);
 close(e.posterior_shortfall_probability,.2976942963273737,1e-10);
 close(e.minimum_qualifying_decimal_odds,2.4449,5e-4);
 assert.equal(e.execution_authorized,false);
});
test('shortfall probability decreases with better qualified price, not model skill',()=>{
 const low=betaBinomialResearch(prior),high=betaBinomialResearch({...prior,decimal_odds:2.2});
 assert(high.posterior_shortfall_probability<low.posterior_shortfall_probability);
 assert.equal(high.evidence_eligible_for_review,false);
});
test('no source attestation cannot become approved even with good posterior',()=>{
 const r=betaBinomialResearch({...prior,prior_alpha:300,prior_beta:200});
 assert.equal(r.research_review_status,'HOLD_EVIDENCE_NOT_ATTESTED');
 assert.equal(r.execution_authorized,false);
});
test('caller flags alone cannot authorize execution or promotion',()=>{
 const r=betaBinomialResearch({...prior,cohort_status:'FROZEN_EXCHANGEABLE_HELDOUT',source_grade:'VERIFIED_CURRENT_OBSERVATION'});
 assert.equal(r.execution_authorized,false);assert.equal(r.production_authority,false);
});
test('reject invalid priors, counts, and arbitrary policy thresholds',()=>{
 for(const p of [{prior_alpha:0},{trials:-1},{successes:21},{minimum_ev:-1},{max_shortfall:1},{decimal_odds:1},{trials:1.5}])
  assert.throws(()=>betaBinomialResearch({...prior,...p}));
});
test('unknown scenario weights emit range without fabricated posterior',()=>{
 const r=scenarioProbability({scenarios:[{conditional_probability:.4},{conditional_probability:.7}]});
 assert.equal(r.estimated_probability,null);assert.deepEqual(r.probability_range,[.4,.7]);
});
test('even weighted scenario probabilities remain sensitivity without attestation',()=>{
 const s=[{conditional_probability:.4,weight:.25},{conditional_probability:.7,weight:.75}];
 const r=scenarioProbability({scenarios:s});assert.equal(r.estimated_probability,null);
 close(r.hypothetical_weighted_probability,.625);
 const t=scenarioProbability({scenarios:s,probability_weights_attested:true});close(t.estimated_probability,.625);
 assert.equal(t.execution_authorized,false);
});
test('scenario weights must sum to unity',()=>assert.throws(()=>scenarioProbability({scenarios:[{conditional_probability:.4,weight:.5},{conditional_probability:.7,weight:.6}]})));
test('fixed forecast price shopping isolates payout, exact same contract',()=>{
 const r=compareQualifiedQuotes({probability:.6,reference_quote:quote(1.9),shop_quote:quote(2.1),contract_id:'NBA:CASE1:AST6+:FULL'});
 assert.equal(r.status,'CALLER_DECLARED_COMPARISON_UNATTESTED');close(r.fixed_forecast_ev_improvement,.12);
 assert.equal(r.execution_authorized,false);
});
test('incomparable threshold or unknown offer must HOLD',()=>{
 for(const change of [{contract_id:'OTHER'},{availability_status:'UNKNOWN'},{rules_match:false},{exact_contract_match:false}]){
  const r=compareQualifiedQuotes({probability:.6,reference_quote:quote(1.9),shop_quote:{...quote(2.1),...change},contract_id:'NBA:CASE1:AST6+:FULL'});
  assert.equal(r.status,'HOLD_INCOMPARABLE_OR_UNVERIFIED_QUOTES');assert.equal(r.fixed_forecast_ev_improvement,null);
 }
});
test('adapter preserves original HOLD, stage and zero stakes',()=>{
 const out=annotateExistingOpportunityResults(engine,{CASE1:betaBinomialResearch(prior),CASE2:betaBinomialResearch(prior)});
 assert.equal(out.part2_contract,PART2_SHADOW_CONTRACT);
 assert.deepEqual(out.ranked[0].blockers,engine.ranked[0].blockers);
 assert.equal(out.ranked[0].stage,'HOLD_UNQUALIFIED');
 assert.equal(out.ranked[0].paper_stake_cap,0);
 assert.equal(out.ranked[1].stage,'SHADOW_HUMAN_REVIEW_ONLY');
 assert.equal(out.ranked[1].paper_stake_cap,1);
 assert.equal(out.ranked[0].part2_research.execution_authorized,false);
 assert.equal(out.production_authority,false);
 assert.equal(out.execution_authority,false);
 assert.equal(engine.ranked[0].part2_research,undefined);
});
test('missing research case is explicitly HELD without altering engine',()=>{
 const out=annotateExistingOpportunityResults(engine,{});
 assert.equal(out.ranked[0].part2_research.status,'HOLD_NO_PART2_RESEARCH_PACKET');
 assert.equal(out.summary.hold,1);
});
test('malformed existing engine result rejected',()=>assert.throws(()=>annotateExistingOpportunityResults({contract:'OTHER',ranked:[]},{})));

test('double with unknown correlation HOLDS while showing rigorous bounds',()=>{
 const r=doubleDependenceResearch({p_first:.6,p_second:.7,combined_decimal_odds:3});
 close(r.possible_joint_probability_range[0],.3);
 close(r.possible_joint_probability_range[1],.6);
 close(r.independent_reference_joint_probability,.42);
 assert.equal(r.conditional_joint_probability,null);
 assert.equal(r.decision,'HOLD_UNKNOWN_DEPENDENCE');
});
test('double with conditional dependence keeps research-only and preserves negative EV',()=>{
 const r=doubleDependenceResearch({p_first:.6,p_second:.7,p_second_given_first:.55,
  combined_decimal_odds:2.8,conditional_dependence_attested:true});
 close(r.conditional_joint_probability,.33);
 close(r.conditional_joint_ev_per_unit,-.076);
 assert.equal(r.decision,'RESEARCH_ONLY_DEPENDENCE_INPUT');
 assert.equal(r.execution_authorized,false);
});
test('double cannot accept contradictory conditional probabilities',()=>{
 assert.throws(()=>doubleDependenceResearch({p_first:.8,p_second:.4,p_second_given_first:.9,combined_decimal_odds:2.0}));
});
test('double with no exact combined price refuses EV claim',()=>{
 const r=doubleDependenceResearch({p_first:.6,p_second:.7,p_second_given_first:.5});
 assert.equal(r.decision,'HOLD_NO_EXACT_COMBINED_PRICE');
 assert.equal(r.conditional_joint_ev_per_unit,null);
});
