'use strict';
// Conditional synthetic experiments only. No historical NBA results, fitted
// probabilities, provider calls, persistent paper ledger or execution authority.
const {performance}=require('node:perf_hooks');
const {scanOfflineReferencePacket:scan}=require('./market-reference-scanner.cjs');
const {packet,quotes,replaceQuotes}=require('./fixtures/reference-snapshot.cjs');

const EXPERIMENT_VERSION='ATLAS_SCANNER_SIMULATION_V1';
const SCENARIOS=Object.freeze([
 {id:'accurate_references',sharedBias:0,outlierBias:0},
 {id:'one_outlier_reference',sharedBias:0,outlierBias:.12},
 {id:'shared_reference_bias_6pp',sharedBias:.06,outlierBias:0},
 {id:'stale_target_20pct',sharedBias:0,outlierBias:0,staleEvery:5},
 {id:'missing_reference_20pct',sharedBias:0,outlierBias:0,missingEvery:5},
 {id:'shared_bias_correlated_outcomes',sharedBias:.06,outlierBias:0,correlated:true},
 // Added as explicit follow-up controls after inspecting the initial six
 // scenarios. These are diagnostic, not untouched confirmatory evidence.
 {id:'no_edge_control',sharedBias:0,outlierBias:0,targetEdge:-.02,phase:'follow_up_negative_control'},
 {id:'shared_bias_no_edge_control',sharedBias:.06,outlierBias:0,targetEdge:-.02,phase:'follow_up_negative_control'}
]);
function rng(seed){
 let state=seed>>>0;
 return ()=>{state=(state+0x6D2B79F5)>>>0;let t=state;
  t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);
  return ((t^(t>>>14))>>>0)/4294967296;};
}
const clip=p=>Math.max(.08,Math.min(.92,p));
function oddsFromImplied(q){
 if(!Number.isFinite(q)||q<=0||q>=1)throw Error('SIMULATION_IMPLIED_PROBABILITY_INVALID');
 return q>=.5?-Math.max(100,Math.round(100*q/(1-q))):Math.max(100,Math.round(100*(1-q)/q));
}
const decimal=a=>a>0?1+a/100:1-100/a;
function buildScenario(scenario,{events=500,seed=20261111}={}){
 if(!Number.isInteger(events)||events<1||events>5000)throw Error('SIMULATION_EVENT_COUNT_INVALID');
 const random=rng(seed),p=packet(),templates=quotes(p),truth=[],rows=[];
 const offeredEdges=[-.04,-.015,0,.025,.05,.08];
 p.cohortId='SYNTHETIC_SIM_'+scenario.id;
 for(let i=0;i<events;i++){
  const trueA=.2+.6*random(),targetQ=trueA/(1+(scenario.targetEdge??offeredEdges[i%offeredEdges.length]));
  const noise=Array.from({length:3},()=>.012*(random()-.5));
  truth.push({eventId:'SYNTHETIC_EVENT_'+i,trueA});
  for(let b=0;b<4;b++){
   if(b===3&&scenario.missingEvery&&i%scenario.missingEvery===0)continue;
   const q=structuredClone(templates[b]);q.eventId=truth[i].eventId;q.observationId=`sim-${i}-${b}`;
   const refP=clip(trueA+(scenario.sharedBias||0)+(b===1?(scenario.outlierBias||0):0)+(noise[b-1]||0));
   const impliedA=b===0?targetQ:refP*1.04,impliedB=b===0?1.04-targetQ:(1-refP)*1.04;
   q.outcomes[0].americanOdds=oddsFromImplied(impliedA);
   q.outcomes[1].americanOdds=oddsFromImplied(impliedB);
   if(b===0&&scenario.staleEvery&&i%scenario.staleEvery===0)q.sourceObservedAtUtc='2026-11-11T17:50:00Z';
   rows.push(q);
  }
 }
 return {packet:replaceQuotes(p,rows),truth};
}
function quantile(values,p){
 if(!values.length)return null;
 const a=[...values].sort((x,y)=>x-y),at=(a.length-1)*p,l=Math.floor(at);
 return a[l]+(a[Math.ceil(at)]-a[l])*(at-l);
}
const mean=xs=>xs.length?xs.reduce((s,x)=>s+x,0)/xs.length:null;
function summarizePaths(selected,truth,{worlds=250,seed=9102,correlated=false}={}){
 if(!Number.isInteger(worlds)||worlds<1||worlds>2000)throw Error('SIMULATION_WORLD_COUNT_INVALID');
 const chosen=new Map();
 for(const s of selected){if(!chosen.has(s.event_id))chosen.set(s.event_id,[]);chosen.get(s.event_id).push(s);}
 const rois=[],drawdowns=[];
 for(let world=0;world<worlds;world++){
  // Same uniforms across scenarios give paired comparisons. Correlation is a
  // specified alternative world: 35% of ten-event blocks share one uniform.
  const random=rng((seed+Math.imul(world+1,2654435761))>>>0);let pnl=0,peak=0,dd=0,common=0,shared=false;
  for(let i=0;i<truth.length;i++){
   if(i%10===0){shared=random()<.35;common=random();}
   const independent=random(),u=correlated&&shared?common:independent,winA=u<truth[i].trueA;
   let eventPnl=0;
   for(const s of chosen.get(truth[i].eventId)||[]){
    const win=s.participant_id==='TEAM:A'?winA:!winA;
    eventPnl+=win?decimal(s.offered_american_odds)-1:-1;
   }
   pnl+=eventPnl;peak=Math.max(peak,pnl);dd=Math.max(dd,peak-pnl);
  }
  if(selected.length)rois.push(pnl/selected.length);
  drawdowns.push(dd);
 }
 return {worlds,stake_unit:1,starting_bankroll_assumed:false,
  losing_path_fraction:rois.length?rois.filter(x=>x<0).length/rois.length:null,
  roi_p05:quantile(rois,.05),roi_median:quantile(rois,.5),roi_p95:quantile(rois,.95),
  drawdown_units_median:quantile(drawdowns,.5),drawdown_units_p95:quantile(drawdowns,.95)};
}
function evaluateScenario(spec,options={}){
 const {packet:p,truth}=buildScenario(spec,options),t=performance.now(),result=scan(p),scanMs=performance.now()-t;
 const lookup=new Map(truth.map(x=>[x.eventId,x.trueA]));
 const oracleEV=result.signals.map(s=>{const a=lookup.get(s.event_id),prob=s.participant_id==='TEAM:A'?a:1-a;
  return prob*decimal(s.offered_american_odds)-1;});
 const forecasts=result.comparisons.filter(s=>s.participant_id==='TEAM:A');
 const expectedBrier=mean(forecasts.map(s=>{const t=lookup.get(s.event_id),p=s.reference_probability;return t*(1-p)**2+(1-t)*p**2;}));
 const expectedLogLoss=mean(forecasts.map(s=>{const t=lookup.get(s.event_id),p=s.reference_probability;return -t*Math.log(p)-(1-t)*Math.log(1-p);}));
 return {id:spec.id,assumptions:spec,events:truth.length,observations:quotes(p).length,scan_ms:scanMs,
  scan_status:result.status,run_quality:result.run_quality,complete_reference_markets:result.counts.complete_reference_markets,
  signals:result.signals.length,mean_estimated_ev:mean(result.signals.map(s=>s.market_reference_ev)),
  oracle_expected_roi:mean(oracleEV),nonpositive_oracle_ev_count:oracleEV.filter(x=>x<=0).length,
  nonpositive_oracle_ev_fraction:oracleEV.length?oracleEV.filter(x=>x<=0).length/oracleEV.length:null,
  forecast_events:forecasts.length,oracle_expected_brier:expectedBrier,oracle_expected_log_loss:expectedLogLoss,
  rejected_observations:result.rejected_observations.length,reference_holds:result.reference_holds.length,
  outcome_paths:summarizePaths(result.signals,truth,{worlds:options.worlds??250,seed:(options.seed??20261111)^0x19ab,correlated:spec.correlated===true}),
  synthetic_only:true,empirical_performance_eligible:false};
}
function runFaultSweep(repetitions=200){
 if(!Number.isInteger(repetitions)||repetitions<1||repetitions>2000)throw Error('SIMULATION_REPETITIONS_INVALID');
 const cases=[
  ['stale', (q,p,i)=>q[0].sourceObservedAtUtc=new Date(Date.parse(p.asOfUtc)-(301+i)*1000).toISOString()],
  ['future', (q,p,i)=>q[0].sourceObservedAtUtc=new Date(Date.parse(p.asOfUtc)+(6+i)*1000).toISOString()],
  ['missing_reference',q=>q.pop()],
  ['duplicate_book',q=>q[3].book='reference_a'],
  ['wrong_period',q=>q[0].period='regulation'],
  ['wrong_rules',q=>q[0].settlementRuleId='unregistered'],
  ['wrong_product',q=>q[0].product='draftkings_pick6'],
  ['missing_side',q=>q[0].outcomes.pop()],
  ['source_permission',(_q,p)=>p.sourceRegistry[0].usageReview='pending'],
  ['closed_target',q=>q.push({...structuredClone(q[0]),observationId:'closure',marketStatus:'CLOSED',sourceObservedAtUtc:'2026-11-11T17:59:34Z'})],
  ['tampered_hash',()=>{},p=>p.snapshots[0].rawSha256='0'.repeat(64)],
  ['duplicate_snapshot',()=>{},p=>p.snapshots.push(structuredClone(p.snapshots[0]))]
 ];
 const results=[];
 const variant=i=>{
  const p=packet(),q=quotes(p);
  for(const row of q){row.eventId='SYNTHETIC_STRESS_'+i;row.observationId+='_'+i;
   row.outcomes[0].americanOdds=row.book==='draftkings'?105+i%9:-120-i%5;}
  return replaceQuotes(p,q);
 };
 for(const [id,mutate,after]of cases){
  let failures=0;
  for(let i=0;i<repetitions;i++){const p=variant(i),q=quotes(p);mutate(q,p,i);replaceQuotes(p,q);if(after)after(p);
   const r=scan(p);if(r.signals.length||r.production_authority||r.paper_ledger_mutated)failures++;}
  results.push({id,checks:repetitions,failures});
 }
 for(const id of ['reordered_reference_replay','equivalent_outcome_order','aligned_reference_evidence']){
  let failures=0;
  for(let i=0;i<repetitions;i++){
   const p=variant(i),q=quotes(p),first=scan(p);
   if(id==='reordered_reference_replay'){
    p.priorDecisionIds=first.signals.map(s=>s.decision_id);p.policy.referenceBooks.reverse();
    if(scan(p).signals.length)failures++;
   }else if(id==='equivalent_outcome_order'){
    q.push({...structuredClone(q[0]),observationId:'order-'+i,outcomes:[...q[0].outcomes].reverse()});
    if(scan(replaceQuotes(p,q)).signals.length!==1)failures++;
   }else{
    const r=scan(replaceQuotes(p,[q[0],q[3],q[1],q[2]])),s=r.signals[0];
    if(!s||s.reference_observation_ids.join('|')!==q.slice(1).map(x=>x.observationId).join('|'))failures++;
   }
  }
  results.push({id,checks:repetitions,failures});
 }
 return {cases:results,checks:results.reduce((s,x)=>s+x.checks,0),failures:results.reduce((s,x)=>s+x.failures,0)};
}
function benchmark({events=250,repeats=3}={}){
 const p=packet(),base=quotes(p);replaceQuotes(p,Array.from({length:events},(_,i)=>base.map(q=>({...q,eventId:'SYNTHETIC_'+i,observationId:q.observationId+'_'+i}))).flat());
 const timings=[];let signals;
 for(let i=0;i<repeats;i++){const t=performance.now(),r=scan(p);timings.push(performance.now()-t);signals=r.signals.length;}
 return {events,observations:events*4,samples_ms:timings,median_ms:quantile(timings,.5),signals};
}
function runSimulation(options={}){
 return {contract:EXPERIMENT_VERSION,seed:options.seed??20261111,events_per_scenario:options.events??500,
  worlds_per_scenario:options.worlds??250,classification:'SYNTHETIC_CONDITIONAL_EXPERIMENT',
  empirical_performance_eligible:false,network_requests:0,paid_credits_consumed:0,paper_ledger_mutated:false,
  assumptions:{true_probability_range:[.2,.8],reference_overround:.04,reference_noise_range:[-.006,.006],
   target_overround:.04,target_A_edge_cycle:[-.04,-.015,0,.025,.05,.08],
   rounding:'nearest integer American odds',reference_method:'three book proportional no-vig median',
   selection_policy:'unchanged 3% market-reference EV cutoff',
   follow_up_controls:'two no-edge controls added after the initial six-scenario run; not confirmatory',
   outcome_dependence:'independent except the explicitly correlated scenario; paired uniforms reused across scenarios',
   intervals:'5th/95th percentiles across simulated outcome paths, not confidence intervals on a real strategy',
   drawdown:'unit-stake event-level cumulative net P/L; no stake sizing or bankroll depletion rule'},
  scenarios:SCENARIOS.map(s=>evaluateScenario(s,options)),fault_sweep:runFaultSweep(options.repetitions??200),benchmark:benchmark()};
}
if(require.main===module){
 if(process.argv.length!==2){process.stderr.write('Usage: node scripts/research/scanner-simulation.cjs\n');process.exitCode=2;}
 else process.stdout.write(JSON.stringify(runSimulation(),null,2)+'\n');
}
module.exports={EXPERIMENT_VERSION,SCENARIOS,rng,oddsFromImplied,buildScenario,quantile,summarizePaths,evaluateScenario,runFaultSweep,benchmark,runSimulation};
