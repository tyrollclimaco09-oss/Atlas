import test from 'node:test';
import assert from 'node:assert/strict';
import {DISTRIBUTION_CONTRACT,compileDistributionLadder as compile} from './distribution-ladder.mjs';
function f(){
 return {contract:DISTRIBUTION_CONTRACT,sport:'NBA',case_key:'DEMO:NBA:TOTAL',
 event_id:'DEMO-EVENT',selection_id:'DEMO-TOTAL',market_family:'total',
 market_period:'FULL',settlement_rule:'INCLUDE_OVERTIME',
 features_observed_at:'2026-11-09T14:00:00Z',
 frozen_at:'2026-11-09T14:01:00Z',event_start_at:'2026-11-10T00:00:00Z',
 source_receipts:[{receipt_id:'DEMO:STATS:1',observed_at:'2026-11-09T13:59:00Z'}],
 model:{model_key:'DEMO-MODEL',version:'0.0.1',family:'normal_integer',
  uses_bookmaker_odds:false,scenarios:[{id:'neutral',weight:1,params:{mean:220,sd:10}}]},
 baseline:{model_key:'DEMO-BASELINE',version:'0.0.1',family:'normal_integer',
  uses_bookmaker_odds:false,scenarios:[{id:'neutral',weight:1,params:{mean:215,sd:10}}]},
 lines:[{line_id:'TOTAL-219.5-OVER',threshold:219.5,side:'over',
  market_period:'FULL',settlement_rule:'INCLUDE_OVERTIME'}]};
}
function g(o={}){return compile({...f(),...o});}
test('pure demonstration distributions compile without claiming calibration',()=>{
 const a=g();assert.equal(a.stage,'SHADOW_UNVALIDATED_RESEARCH');
 assert.equal(a.lines.length,1);assert.equal(a.probability_calibrated,false);
 assert.equal(a.real_money_authority,false);assert.equal(a.exact_bookmaker_price_used,false);
 assert.equal(a.confidence_interval_estimated,false);assert.equal(a.training_outcomes_observed,0);
});
test('model and baseline probabilities are independent and distinct',()=>{
 const a=g().lines[0];
 assert(a.model_probability>a.baseline_probability);
 assert(a.model_probability>.5&&a.model_probability<.55);
});
test('normal-integer threshold over and under sum to one on a half line',()=>{
 const p=f();p.lines.push({...p.lines[0],line_id:'UNDER',side:'under'});
 const a=compile(p).lines;
 assert(Math.abs(a[0].model_probability+a[1].model_probability-1)<1e-7);
 assert.equal(a[0].model_push_probability,0);
});
test('integer lines allow an explicit push instead of fabricating a binary bet',()=>{
 const p=f();p.lines=[{...p.lines[0],threshold:220,line_id:'OVER'},
 {...p.lines[0],threshold:220,line_id:'UNDER',side:'under'}];
 const a=compile(p).lines;
 assert(a[0].model_push_probability>.03&&a[0].model_push_probability<.05);
 assert(Math.abs(a[0].model_probability+a[1].model_probability+a[0].model_push_probability-1)<1e-7);
});
test('alternate over ladder is monotonic across thresholds',()=>{
 const p=f();p.market_family='alternates';
 p.lines=[199.5,209.5,219.5,229.5,239.5].map(x=>({...p.lines[0],threshold:x,line_id:'ALT'+x}));
 const a=compile(p).lines.map(x=>x.model_probability);
 for(let i=1;i<a.length;i++)assert(a[i]<a[i-1]);
});
test('opposite under ladder is monotonic in the other direction',()=>{
 const p=f();p.lines=[199.5,209.5,219.5,229.5].map(x=>({...p.lines[0],threshold:x,line_id:'UND'+x,side:'under'}));
 const a=compile(p).lines.map(x=>x.model_probability);
 for(let i=1;i<a.length;i++)assert(a[i]>a[i-1]);
});
test('binary game probability requires correct selection side',()=>{
 const p=f();p.market_family='moneyline';
 p.model={model_key:'TEAM-TRAIN',version:'0.1',family:'binary',uses_bookmaker_odds:false,
  scenarios:[{id:'base',weight:1,params:{p:.58}}]};
 p.baseline={model_key:'TEAM-BASE',version:'0.1',family:'binary',uses_bookmaker_odds:false,
  scenarios:[{id:'base',weight:1,params:{p:.50}}]};
 p.lines=[{line_id:'YES',side:'yes',market_period:'FULL',settlement_rule:'NO_TIE',threshold:null},
  {line_id:'NO',side:'no',market_period:'FULL',settlement_rule:'NO_TIE',threshold:null}];
 p.settlement_rule='NO_TIE';
 const r=compile(p);
 assert.equal(r.lines[0].model_probability,.58);
 assert.equal(r.lines[1].model_probability,.42);
 assert.equal(r.lines[0].baseline_probability,.5);
});
test('binary NFL tie/push condition requires separate ternary modeling',()=>{
 const p=f();p.market_family='moneyline';
 p.model={model_key:'X',version:'0.1',family:'binary',uses_bookmaker_odds:false,
  scenarios:[{id:'s',weight:1,params:{p:.6}}]};
 p.baseline={...p.model,model_key:'Y'};
 p.lines=[{...p.lines[0],side:'yes',threshold:null,tie_or_void_possible:true}];
 assert(compile(p).lines[0].blockers.includes('BINARY_TIE_VOID_NEEDS_TERNARY_RULES'));
});
test('negative binomial count lines over/under are proper complements',()=>{
 const p=f();p.market_family='three_pointers';p.selection_id='DEMO:PLAYER:3PM';
 p.model={...p.model,family:'negative_binomial',scenarios:[{id:'v',weight:1,params:{mean:3,dispersion:10}}]};
 p.baseline={...p.baseline,family:'negative_binomial',scenarios:[{id:'v',weight:1,params:{mean:2,dispersion:10}}]};
 p.lines=[{...p.lines[0],line_id:'O',threshold:2.5},{...p.lines[0],line_id:'U',threshold:2.5,side:'under'}];
 const a=compile(p).lines;
 assert(Math.abs(a[0].model_probability+a[1].model_probability-1)<1e-7);
});
test('negative binomial whole threshold has proper push mass',()=>{
 const p=f();p.market_family='assists';
 p.model={...p.model,family:'negative_binomial',scenarios:[{id:'v',weight:1,params:{mean:4,dispersion:3}}]};
 p.baseline={...p.baseline,family:'negative_binomial',scenarios:[{id:'v',weight:1,params:{mean:4,dispersion:3}}]};
 p.lines=[{...p.lines[0],line_id:'O',threshold:4},{...p.lines[0],line_id:'U',threshold:4,side:'under'}];
 const a=compile(p).lines;
 assert(a[0].model_push_probability>0);
 assert(Math.abs(a[0].model_probability+a[1].model_probability+a[0].model_push_probability-1)<1e-7);
});
test('negative binomial zero mean is degenerate at zero',()=>{
 const p=f();p.market_family='receptions';
 p.model={...p.model,family:'negative_binomial',scenarios:[{id:'v',weight:1,params:{mean:0,dispersion:10}}]};
 p.baseline={...p.baseline,family:'negative_binomial',scenarios:[{id:'v',weight:1,params:{mean:0,dispersion:10}}]};
 p.lines=[{...p.lines[0],threshold:.5}];assert.equal(compile(p).lines[0].model_probability,0);
});
test('scenario mixture uses frozen weights and surfaces only sensitivity, not a CI',()=>{
 const p=f();
 p.model.scenarios=[
  {id:'tempo_low',weight:.4,params:{mean:200,sd:10}},
  {id:'tempo_high',weight:.6,params:{mean:240,sd:10}}
 ];
 const r=compile(p),a=r.lines[0];
 assert.equal(r.confidence_interval_estimated,false);
 assert(a.model_probability>a.model_scenario_sensitivity_range[0]);
 assert(a.model_probability<a.model_scenario_sensitivity_range[1]);
});
test('scenario weights must sum to one',()=>{
 const p=f();p.model.scenarios[0].weight=.8;
 assert(compile(p).lines[0].blockers.includes('SCENARIO_WEIGHTS_NOT_NORMALIZED'));
});
test('duplicate scenario names are rejected',()=>{
 const p=f();p.model.scenarios.push({...p.model.scenarios[0]});
 assert(compile(p).lines[0].blockers.includes('SCENARIO_IDS_MISSING_OR_DUPLICATE'));
});
test('joint parlay and SGP cannot be priced from scalar outcomes',()=>{
 for(const market_family of ['sgp','sgpx','round_robin','each_quarter_rushing','double_double','pra']){
  const r=g({market_family});
  assert.equal(r.stage,'HOLD_NO_SCIENTIFIC_FORECAST',market_family);
  assert(r.blockers.includes('JOINT_MARKET_REQUIRES_CORRELATED_MODEL'));
 }
});
test('observation after freeze cannot count as prior model feature',()=>{
 const p=f();p.source_receipts[0].observed_at='2026-11-09T15:00:00Z';
 assert(g(p).blockers.includes('PRE_FORECAST_SOURCE_RECEIPTS_MISSING_OR_LATE'));
});
test('missing original evidence receipts prevent forecast admission',()=>{
 const r=g({source_receipts:[]});
 assert(r.blockers.includes('PRE_FORECAST_SOURCE_RECEIPTS_MISSING_OR_LATE'));
});
test('features observed after model freeze trigger a time hold',()=>{
 const r=g({features_observed_at:'2026-11-09T14:15:00Z'});
 assert(r.blockers.includes('POINT_IN_TIME_FORECAST_NOT_ESTABLISHED'));
});
test('forecast frozen after kickoff is not a pregame prediction',()=>{
 const r=g({frozen_at:'2026-11-10T03:00:00Z'});
 assert(r.blockers.includes('POINT_IN_TIME_FORECAST_NOT_ESTABLISHED'));
});
test('bookmaker anchored forecast is rejected even with numerical probabilities',()=>{
 const p=f();p.model.uses_bookmaker_odds=true;
 assert(g(p).blockers.includes('PREMARKET_INDEPENDENCE_UNPROVEN'));
});
test('baseline must have same outcome family',()=>{
 const p=f();p.baseline.family='binary';
 assert(g(p).blockers.includes('PAIRED_MODEL_AND_BASELINE_FAMILY_MISMATCH'));
});
test('missing baseline model ID cannot be patched by fallback estimates',()=>{
 const p=f();p.baseline.model_key='';
 assert(g(p).blockers.includes('PAIRED_MODEL_AND_BASELINE_FAMILY_MISMATCH'));
});
test('mismatched period or settlement rule is individually held',()=>{
 const p=f();p.lines.push({...p.lines[0],line_id:'OTHER',settlement_rule:'REGULATION_ONLY'});
 const r=compile(p);assert.equal(r.lines[0].blockers.length,0);
 assert(r.lines[1].blockers.includes('LINE_PERIOD_OR_RULE_MISMATCH'));
 assert.equal(r.stage,'PARTIAL_LINE_HOLD');
});
test('duplicate offered line IDs are not double-scored',()=>{
 const p=f();p.lines.push({...p.lines[0]});
 const r=compile(p);assert(r.lines[1].blockers.includes('DUPLICATE_OR_MISSING_LINE_KEY'));
});
test('invalid count negative mean is rejected, not silently clipped',()=>{
 const p=f();p.market_family='rebounds';
 p.model={...p.model,family:'negative_binomial',scenarios:[{id:'a',weight:1,params:{mean:-2,dispersion:5}}]};
 p.baseline={...p.baseline,family:'negative_binomial',scenarios:[{id:'a',weight:1,params:{mean:2,dispersion:5}}]};
 assert(compile(p).lines[0].blockers.includes('INVALID_NEGATIVE_BINOMIAL_DISTRIBUTION'));
});
test('absurd count and threshold values fail rather than overflow loops',()=>{
 const p=f();p.lines[0].threshold=5000.5;
 assert(compile(p).lines[0].blockers.includes('LINE_OUTSIDE_FAMILY_DOMAIN_OR_NOT_INTEGER_HALF'));
});
test('a missing canonical event ID halts the whole bundle',()=>{
 assert.throws(()=>g({event_id:''}),/DISTRIBUTION_PACKET_INVALID/);
});
test('market family without a scalar model is rejected',()=>{
 const r=g({market_family:'unverified_first_score'});
 assert(r.blockers.includes('MARKET_FAMILY_UNSUPPORTED'));
});
test('per-market pregame snapshots cannot change baseline source identity',()=>{
 const a=g();assert.equal(a.model_key,'DEMO-MODEL');
 assert.equal(a.baseline_key,'DEMO-BASELINE');assert.equal(a.source_cutoff,'2026-11-09T14:00:00Z');
});

test('negative point-spread margins are valid in normal integer distribution',()=>{
 const p=f();p.market_family='spread';p.selection_id='DEMO:HOME_MARGIN';
 p.model.scenarios[0].params={mean:-3,sd:7};p.baseline.scenarios[0].params={mean:-5,sd:7};
 p.lines=[{...p.lines[0],line_id:'COVER_NEG_6.5',threshold:-6.5,side:'over'}];
 const r=compile(p);
 assert.equal(r.stage,'SHADOW_UNVALIDATED_RESEARCH');
 assert(r.lines[0].model_probability>.6);
 assert.equal(r.lines[0].model_push_probability,0);
});
test('count distributions reject negative thresholds, even when margin models accept them',()=>{
 const p=f();p.market_family='three_pointers';
 p.model={...p.model,family:'negative_binomial',scenarios:[{id:'base',weight:1,params:{mean:3,dispersion:5}}]};
 p.baseline={...p.baseline,family:'negative_binomial',scenarios:[{id:'base',weight:1,params:{mean:2,dispersion:5}}]};
 p.lines=[{...p.lines[0],threshold:-.5}];
 assert(compile(p).lines[0].blockers.includes('LINE_OUTSIDE_FAMILY_DOMAIN_OR_NOT_INTEGER_HALF'));
});
test('negative spread whole line has separate push mass',()=>{
 const p=f();p.market_family='spread';
 p.model.scenarios[0].params={mean:-3,sd:7};p.baseline.scenarios[0].params={mean:-3,sd:7};
 p.lines=[{...p.lines[0],line_id:'O',threshold:-3,side:'over'},
  {...p.lines[0],line_id:'U',threshold:-3,side:'under'}];
 const r=compile(p);
 assert(Math.abs(r.lines[0].model_probability+r.lines[1].model_probability+
  r.lines[0].model_push_probability-1)<1e-7);
});

test('real frozen BUF-MIN probability is reproduced without odds or official result claims',()=>{
 const p=f();p.sport='NFL';p.case_key='ATLAS-NFL-BUFMIN-20261109-ML-BUF-HEUR-V01';
 p.event_id='bec54821-7bb8-4834-9ba1-1fbfcaf5e6a8';
 p.selection_id='BUF_WIN_RESEARCH_BINARY';p.market_family='moneyline';
 p.market_period='FULL';p.settlement_rule='RESEARCH_BUF_WIN_BOOLEAN_TIE_FALSE';
 p.features_observed_at='2026-11-09T17:57:38.523447Z';
 p.frozen_at='2026-11-09T17:58:11.719081Z';
 p.event_start_at='2026-11-10T01:15:00Z';
 p.source_receipts=[{receipt_id:'ATLAS-NFL-BUFMIN-20261109-INDEPENDENT-INPUTS-V1',
  observed_at:'2026-11-09T17:57:38.523447Z'}];
 p.model={model_key:'NFL_POINT_MIDPOINT_LOGIT8_V0',version:'0.1.0',family:'binary',
  uses_bookmaker_odds:false,scenarios:[{id:'PREGAME_FROZEN_V0',weight:1,
  params:{p:0.4968750406894683}}]};
 p.baseline={model_key:'NO_INFO_NEUTRAL_50_50_V1',version:'1',family:'binary',
  uses_bookmaker_odds:false,scenarios:[{id:'PREGAME_FROZEN_BASELINE',weight:1,params:{p:.5}}]};
 p.lines=[{line_id:'BUF_WIN_RESEARCH_ONLY',side:'yes',threshold:null,
   market_period:'FULL',settlement_rule:p.settlement_rule}];
 const r=compile(p);
 assert.equal(r.stage,'SHADOW_UNVALIDATED_RESEARCH');
 assert.equal(r.lines[0].model_probability,.49687504);
 assert.equal(r.lines[0].baseline_probability,.5);
 assert.equal(r.probability_calibrated,false);
 assert.equal(r.exact_bookmaker_price_used,false);
 assert.equal(r.expected_profit_calculated,false);
 assert.equal(r.real_money_authority,false);
});
