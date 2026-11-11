/**
 * Exhaustive combinatorial stress test of a frozen 10-game slate.
 * Every one of 2^10 binary outcome patterns is enumerated without assuming
 * equal real-world probability, independence, outcomes or market prices.
 * This is algebraic sensitivity, NEVER a simulation of real results.
 */
import {validateProspectiveFreeze} from './prospective-source-freeze.mjs';
import {verifyRecordControl} from './record-control-challenger.mjs';
export const WORLDS_CONTRACT='ATLAS_NBA_OUTCOME_PATTERN_STRESS_V1';
export function stressFrozenOutcomePatterns({source,cohort,sourceBlobSha,challenger}={}){
 validateProspectiveFreeze(source,cohort,sourceBlobSha);
 verifyRecordControl(source,cohort,sourceBlobSha,challenger);
 const n=cohort.predictions.length;
 if(n!==10)throw Error('STRESS_EXPECTS_EXACT_TEN_CASE_COHORT');
 const ordered=cohort.predictions.map(p=>{
  const r=challenger.cases.find(c=>c.canonical_source_event_key===p.canonical_source_event_key);
  if(!r)throw Error('STRESS_RIVAL_MISSING');
  return {p:p.model_probability_home,r:r.probability_home,b:p.frozen_baseline_probability_home};
 });
 const stats={ppg_better_neutral:0,record_better_neutral:0,ppg_better_record:0,
  ppg_worse_neutral:0,record_worse_neutral:0,
  min_ppg_minus_neutral:Infinity,max_ppg_minus_neutral:-Infinity,
  min_ppg_minus_record:Infinity,max_ppg_minus_record:-Infinity};
 for(let mask=0;mask<(1<<n);mask++){
  let pb=0,rb=0,nb=0;
  for(let j=0;j<n;j++){
   const y=(mask>>j)&1,{p,r,b}=ordered[j];
   pb+=(p-y)**2;rb+=(r-y)**2;nb+=(b-y)**2;
  }
  pb/=n;rb/=n;nb/=n;
  // Avoid classifying floating-point roundoff as a strict win.
  const cmp=(x,y)=>x<y-1e-12?-1:x>y+1e-12?1:0;
  const pbn=cmp(pb,nb),rbn=cmp(rb,nb),pbr=cmp(pb,rb);
  if(pbn<0)stats.ppg_better_neutral++;
  if(pbn>0)stats.ppg_worse_neutral++;
  if(rbn<0)stats.record_better_neutral++;
  if(rbn>0)stats.record_worse_neutral++;
  if(pbr<0)stats.ppg_better_record++;
  stats.min_ppg_minus_neutral=Math.min(stats.min_ppg_minus_neutral,pb-nb);
  stats.max_ppg_minus_neutral=Math.max(stats.max_ppg_minus_neutral,pb-nb);
  stats.min_ppg_minus_record=Math.min(stats.min_ppg_minus_record,pb-rb);
  stats.max_ppg_minus_record=Math.max(stats.max_ppg_minus_record,pb-rb);
 }
 const round=x=>Number(x.toFixed(12));
 return {contract:WORLDS_CONTRACT,mode:'EXHAUSTIVE_HYPOTHETICAL_OUTCOMES_NOT_PREDICTED',
  game_count:n,patterns_considered:1<<n,
  ...Object.fromEntries(Object.entries(stats).map(([k,v])=>[k,Number.isInteger(v)?v:round(v)])),
  interpreted_probability:null,empirical_sample_count:0,selection_strategy:null,
  warning:'Every logically possible outcome is evaluated. Pattern counts are NOT odds, likelihood, historical accuracy, calibrated EV, or a Monte Carlo result.',
  no_bets:true,model_calibration_authority:false,production_authority:false};
}
