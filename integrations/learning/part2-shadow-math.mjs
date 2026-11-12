/**
 * ATLAS Part 2 quantitative adjunct -- LAB/SHADOW only.
 * Intended for integrations/learning beside opportunity-value-engine.mjs.
 * This is not an evidence attestor, forecasting model, quote collector or wager gate.
 * The preserved ATLAS engine remains the decision authority. This module adds
 * explicit non-promoting research diagnostics for verified upstream packets.
 */
export const PART2_SHADOW_CONTRACT='ATLAS_PART2_SHADOW_MATH_V1';
const finite=x=>typeof x==='number' && Number.isFinite(x);
const probability=x=>finite(x)&&x>=0&&x<=1;
const positive=x=>finite(x)&&x>0;
function assert(cond, code){if(!cond) throw Error(code)}
const rounding=(x,decimals=10)=>Math.round((x+Number.EPSILON)*10**decimals)/10**decimals;

export function americanToDecimal(american){
 assert(Number.isInteger(american)&&american!==0&&Math.abs(american)>=100,'AMERICAN_ODDS_INVALID');
 return american>0?1+american/100:1+100/Math.abs(american);
}

/** For a binary bet with refund on push. Stakes are per unit. */
export function binarySettlementEV({win_probability,loss_probability,push_probability=0,decimal_odds}){
 assert(probability(win_probability)&&probability(loss_probability)&&probability(push_probability), 'SETTLEMENT_PROBABILITY_INVALID');
 assert(Math.abs(win_probability+loss_probability+push_probability-1)<1e-9,'SETTLEMENT_PROBABILITIES_DO_NOT_SUM_TO_ONE');
 assert(finite(decimal_odds)&&decimal_odds>1,'DECIMAL_ODDS_INVALID');
 return {expected_net_per_unit:win_probability*(decimal_odds-1)-loss_probability,
         break_even_win_probability_conditional_no_push:1/decimal_odds,
         fee_and_rule_scope:'NO_FEES_AND_PUSH_FULL_REFUND',execution_authorized:false};
}

/** General finite settlement-state payoff with net returns in stake units. */
export function settlementStateEV(states){
 assert(Array.isArray(states)&&states.length>=2,'SETTLEMENT_STATES_INVALID');
 let total=0,ev=0;
 for(const s of states){
  assert(probability(s?.probability)&&finite(s?.net_return_per_unit),'SETTLEMENT_STATE_INVALID');
  total+=s.probability;ev+=s.probability*s.net_return_per_unit;
 }
 assert(Math.abs(total-1)<1e-9,'SETTLEMENT_PROBABILITIES_DO_NOT_SUM_TO_ONE');
 return {expected_net_per_unit:ev,execution_authorized:false};
}

// Lanczos logarithmic gamma and NR regularized incomplete beta (Numerical Recipes).
// Compare against a pinned SciPy reference before using for any decision research.
function logGamma(z){
 assert(z>0&&finite(z),'BETA_PARAMETER_INVALID');
 const c=[0.99999999999980993,676.5203681218851,-1259.1392167224028,
 771.32342877765313,-176.61502916214059,12.507343278686905,
 -0.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];
 if(z<.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-logGamma(1-z);
 const x=z-1;let t=c[0];for(let i=1;i<c.length;i++)t+=c[i]/(x+i);
 return .5*Math.log(2*Math.PI)+(x+.5)*Math.log(x+7.5)-(x+7.5)+Math.log(t);
}
function betaContinuedFraction(a,b,x){
 const MAX=400, EPS=3e-14, FPMIN=1e-290;
 let qab=a+b,qap=a+1,qam=a-1,c=1,d=1-qab*x/qap;
 if(Math.abs(d)<FPMIN)d=FPMIN;d=1/d;let h=d;
 for(let m=1;m<=MAX;m++){
  const m2=2*m;
  let aa=m*(b-m)*x/((qam+m2)*(a+m2));
  d=1+aa*d;if(Math.abs(d)<FPMIN)d=FPMIN;
  c=1+aa/c;if(Math.abs(c)<FPMIN)c=FPMIN;
  d=1/d;h*=d*c;
  aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));
  d=1+aa*d;if(Math.abs(d)<FPMIN)d=FPMIN;
  c=1+aa/c;if(Math.abs(c)<FPMIN)c=FPMIN;
  d=1/d;const del=d*c;h*=del;
  if(Math.abs(del-1)<=EPS)return h;
 }
 throw Error('BETA_CDF_DID_NOT_CONVERGE');
}
export function betaCDF(x,a,b){
 assert(positive(a)&&positive(b)&&probability(x),'BETA_CDF_INPUT_INVALID');
 if(x===0)return 0;if(x===1)return 1;
 const t=Math.exp(logGamma(a+b)-logGamma(a)-logGamma(b)+a*Math.log(x)+b*Math.log1p(-x));
 const v=x<(a+1)/(a+b+2)?t*betaContinuedFraction(a,b,x)/a:
  1-t*betaContinuedFraction(b,a,1-x)/b;
 return Math.max(0,Math.min(1,v));
}
export function betaQuantile(q,a,b){
 assert(positive(a)&&positive(b)&&probability(q),'BETA_QUANTILE_INPUT_INVALID');
 if(q===0)return 0;if(q===1)return 1;
 let lo=0,hi=1;
 for(let i=0;i<100;i++){
  const mid=(lo+hi)/2, p=betaCDF(mid,a,b);
  if(p>=q)hi=mid;else lo=mid;
  if(hi-lo<5e-15)break;
 }
 return (lo+hi)/2;
}

/**
 * This is a RATE model, not an NBA participant or proposition model.
 * Exchangeability, group construction and frozen training status must be checked
 * by an existing evidence authority. Both numerical and provenance flags are
 * returned separately so a caller cannot conflate the former with the latter.
 */
export function betaBinomialResearch({prior_alpha,prior_beta,successes,trials,
 decimal_odds,minimum_ev=0.02,max_shortfall=0.05,
 cohort_status='UNVERIFIED',source_grade='UNVERIFIED'}){
 assert(positive(prior_alpha)&&positive(prior_beta),'PRIOR_INVALID');
 assert(Number.isSafeInteger(successes)&&Number.isSafeInteger(trials)&&
  trials>=0&&successes>=0&&successes<=trials,'COUNTS_INVALID');
 assert(finite(decimal_odds)&&decimal_odds>1,'DECIMAL_ODDS_INVALID');
 assert(finite(minimum_ev)&&minimum_ev>=0&&probability(max_shortfall)&&
  max_shortfall>0&&max_shortfall<1,'POLICY_INVALID');
 const a=prior_alpha+successes,b=prior_beta+trials-successes;
 const mean=a/(a+b),pRequired=(1+minimum_ev)/decimal_odds;
 const shortfall=pRequired>=1?1:betaCDF(pRequired,a,b);
 const lower=betaQuantile(max_shortfall,a,b);
 const lowerEV=decimal_odds*lower-1;
 const expShortfall=(1+minimum_ev)*shortfall-
  decimal_odds*mean*betaCDF(Math.min(1,pRequired),a+1,b);
 const policyPass=lowerEV>=minimum_ev;
 const eligible=cohort_status==='FROZEN_EXCHANGEABLE_HELDOUT'&&source_grade==='VERIFIED_CURRENT_OBSERVATION';
 return {contract:PART2_SHADOW_CONTRACT,posterior_alpha:a,posterior_beta:b,
  mean_probability:mean,posterior_interval_95:[betaQuantile(.025,a,b),betaQuantile(.975,a,b)],
  mean_ev:decimal_odds*mean-1,posterior_shortfall_probability:shortfall,
  one_sided_lower_ev_bound:lowerEV,minimum_qualifying_decimal_odds:(1+minimum_ev)/lower,
  expected_ev_deficiency:Math.max(0,expShortfall),
  statistical_screen_passed:policyPass,caller_declared_evidence_eligibility:eligible,evidence_eligible_for_review:false,
  research_review_status:eligible?(policyPass?'SCREEN_PASS_CALLER_CLAIM_ONLY':'SCREEN_FAIL'):'HOLD_EVIDENCE_NOT_ATTESTED',
  limitations:['Beta-binomial assumes comparable exchangeable trials',
   'Source grades are caller claims; must be independently attested',
   'Posterior parameter uncertainty omits hyperprior uncertainty',
   'Quote availability, contract equivalence and model skill NOT established'],
  execution_authorized:false,production_authority:false};
}

/** A scenario with unknown weights is sensitivity-only; no invented posterior. */
export function scenarioProbability({scenarios,probability_weights_attested=false}){
 assert(Array.isArray(scenarios)&&scenarios.length>=2,'SCENARIOS_INVALID');
 for(const s of scenarios)assert(probability(s?.conditional_probability),'SCENARIO_PROBABILITY_INVALID');
 const values=scenarios.map(s=>s.conditional_probability);
 const range=[Math.min(...values),Math.max(...values)];
 const weights=scenarios.map(s=>s.weight);
 if(!weights.every(probability)){
  return {status:'SENSITIVITY_ONLY_MISSING_WEIGHTS',probability_range:range,
    estimated_probability:null,execution_authorized:false};
 }
 const sum=weights.reduce((s,x)=>s+x,0);
 assert(Math.abs(sum-1)<1e-9,'SCENARIO_WEIGHTS_DO_NOT_SUM_TO_ONE');
 const estimate=scenarios.reduce((v,s)=>v+s.weight*s.conditional_probability,0);
 return {status:probability_weights_attested?'WEIGHTED_RESEARCH_SCENARIO':'SENSITIVITY_ONLY_UNATTESTED_WEIGHTS',
   probability_range:range,estimated_probability:probability_weights_attested?estimate:null,
   hypothetical_weighted_probability:estimate,execution_authorized:false};
}

/** Fixed-forecast shopping diagnostics only after exact native equivalence. */
export function compareQualifiedQuotes({probability:winProbability,reference_quote,shop_quote,contract_id}){
 assert(probability(winProbability),'FORECAST_PROBABILITY_INVALID');
 const qualified=q=>q&&q.contract_id===contract_id&&q.exact_contract_match===true&&
  q.rules_match===true&&q.availability_status==='AVAILABLE_VERIFIED'&&
  positive(q.decimal_odds)&&q.decimal_odds>1&&typeof q.observed_at==='string'&&
  Number.isFinite(Date.parse(q.observed_at));
 if(!qualified(reference_quote)||!qualified(shop_quote))return {
  status:'HOLD_INCOMPARABLE_OR_UNVERIFIED_QUOTES',fixed_forecast_ev_improvement:null,
  execution_authorized:false};
 const improvement=winProbability*(shop_quote.decimal_odds-reference_quote.decimal_odds);
 return {status:'CALLER_DECLARED_COMPARISON_UNATTESTED',quote_authentication_established:false,fixed_forecast_ev_improvement:improvement,
  reference_ev:winProbability*reference_quote.decimal_odds-1,
  shop_ev:winProbability*shop_quote.decimal_odds-1,
  caveat:'No independent authentication, order acceptance or price availability established by this function',
  execution_authorized:false};
}

/**
 * Doubles need joint probability. Marginal hit rates alone only define bounds.
 * Unknown dependence MUST NOT quietly become independence.
 */
export function doubleDependenceResearch({p_first,p_second,p_second_given_first=null,
 combined_decimal_odds=null,conditional_dependence_attested=false}){
 assert(probability(p_first)&&probability(p_second),'DOUBLE_MARGINAL_PROBABILITY_INVALID');
 const minJoint=Math.max(0,p_first+p_second-1),maxJoint=Math.min(p_first,p_second);
 const hasOdds=finite(combined_decimal_odds)&&combined_decimal_odds>1;
 if(combined_decimal_odds!==null)assert(hasOdds,'DOUBLE_COMBINED_ODDS_INVALID');
 const indepJoint=p_first*p_second;
 const hasConditional=p_second_given_first!==null;
 if(hasConditional)assert(probability(p_second_given_first),'DOUBLE_CONDITIONAL_PROBABILITY_INVALID');
 const joint=hasConditional?p_first*p_second_given_first:null;
 if(hasConditional)assert(joint>=minJoint-1e-10&&joint<=maxJoint+1e-10,'DOUBLE_MARGINALS_CONDITIONAL_CONFLICT');
 return {contract:PART2_SHADOW_CONTRACT,
  independence_is_not_default:true,
  possible_joint_probability_range:[minJoint,maxJoint],
  independent_reference_joint_probability:indepJoint,
  conditional_joint_probability:joint,
  joint_estimate_admissible_for_research:hasConditional&&conditional_dependence_attested,
  conditional_joint_ev_per_unit:joint===null||!hasOdds?null:joint*combined_decimal_odds-1,
  full_ev_range:hasOdds?[minJoint*combined_decimal_odds-1,maxJoint*combined_decimal_odds-1]:null,
  decision:!hasOdds?'HOLD_NO_EXACT_COMBINED_PRICE':
   !hasConditional?'HOLD_UNKNOWN_DEPENDENCE':
   !conditional_dependence_attested?'HOLD_CONDITIONAL_NOT_ATTESTED':'RESEARCH_ONLY_DEPENDENCE_INPUT',
  note:'Actual same-game/SGPx offered payout, void rules, dependence source and availability require separate verification',
  execution_authorized:false,production_authority:false};
}

/**
 * Non-promoting adapter for the *existing* PR #37 Opportunity Value Engine output.
 * Never alters stages, blockers, stakes or any source evidence. Appends a separate
 * Part 2 research note for exact existing case keys; absent packets remain HOLD.
 */
export function annotateExistingOpportunityResults(existingEngineResult,researchByCase={}){
 assert(existingEngineResult?.contract==='ATLAS_OPPORTUNITY_VALUE_V1'&&
  Array.isArray(existingEngineResult?.ranked),'EXISTING_ENGINE_RESULT_INVALID');
 const ranked=existingEngineResult.ranked.map(row=>{
  const caseResearch=Object.hasOwn(researchByCase,row.case_key)?researchByCase[row.case_key]:null;
  return {...row,part2_research:caseResearch?{
    ...caseResearch,execution_authorized:false,production_authority:false,
    note:'Adjunct only: existing source/market/portfolio HOLD and human review decision unchanged'
   }:{status:'HOLD_NO_PART2_RESEARCH_PACKET',execution_authorized:false}};
 });
 return {...existingEngineResult,ranked,production_authority:false,execution_authority:false,
  part2_contract:PART2_SHADOW_CONTRACT,
  integration_note:'Original PR37 stages, market verification, stakes and blockers preserved without escalation'};
}
