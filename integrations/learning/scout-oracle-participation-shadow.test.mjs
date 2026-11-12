import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {forecastAssistDistribution,PARTICIPATION_CONTRACT} from './scout-oracle-participation-shadow.mjs';
import {compileDistributionLadder} from './distribution-ladder.mjs';

const hash=s=>createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
function fixture(){
 const rows=Array.from({length:12},(_,i)=>({
  event_id:`history-${i}`,player_id:'NBA-PLAYER-1',team_id:'NBA-TEAM-A',
  event_start_at:`2026-10-${String(i+1).padStart(2,'0')}T23:00:00Z`,
  final_at:`2026-10-${String(i+2).padStart(2,'0')}T01:00:00Z`,
  minutes:32,assists:5
 }));
 const raw_json=JSON.stringify({contract:'ATLAS_NORMALIZED_NBA_ASSIST_BOX_OBSERVATIONS_V1',
  player_id:'NBA-PLAYER-1',game_scope:'NBA_REGULATION_PLUS_OVERTIME',rows});
 const packet={contract:PARTICIPATION_CONTRACT,case_key:'SYNTHETIC-20261112-1',sport:'NBA',
 event_id:'event-NEW',player_id:'NBA-PLAYER-1',team_id:'NBA-TEAM-A',target_stat:'assists',
 market_period:'FULL',settlement_rule:'REGULATION_AND_OT',
 event_start_at:'2026-11-13T00:00:00Z',feature_cutoff:'2026-11-12T20:00:00Z',
 frozen_at:'2026-11-12T20:01:00Z',model_uses_bookmaker_odds:false,
 availability_status:'AVAILABLE',prior:{alpha:2,beta_minutes:10},
 scenarios:[{id:'LOW',minutes:20,weight:0.2},{id:'NORMAL',minutes:32,weight:0.6},{id:'HIGH',minutes:40,weight:0.2}],
 lines:[4,6,8,10],source_receipts:[{
  receipt_id:'normalized-box-hash',source_name:'SIMULATED_EXTRACT',
  source_reference:'synthetic://boxes/12',observed_at:'2026-11-12T19:59:00Z',
  raw_json,raw_sha256:hash(raw_json)
 }]};
 return packet;
}
const check=(mutation,code)=>{const p=fixture();mutation(p);const r=forecastAssistDistribution(p);
 assert.equal(r.stage,'HOLD_UNQUALIFIED_PARTICIPATION');assert(r.blockers.includes(code),JSON.stringify(r.blockers));
 assert.equal(r.execution_authority,false);};

test('mathematical ladder returns 4+, 6+, 8+, 10+ and never execution authority',()=>{
 const p=fixture(),r=forecastAssistDistribution(p);
 assert.equal(r.stage,'SHADOW_UNVALIDATED_RESEARCH_PROBABILITIES');
 assert.equal(r.ladder.lines.length,4);assert.equal(r.ladder.lines[1].threshold,5.5);
 assert.equal(r.ladder.lines[1].model_push_probability,0);
 assert.equal(r.posterior_rate_shape,62);assert.equal(r.posterior_rate_beta_minutes,394);
 assert.equal(r.source_authenticated,false);assert.equal(r.confidence_calibrated,false);
 assert.equal(r.execution_authority,false);assert.equal(r.production_authority,false);
 assert(r.ladder.lines.every(x=>x.stage==='UNVALIDATED_RESEARCH_PROBABILITY'));
 for(let i=1;i<r.ladder.lines.length;i++){
  assert(r.ladder.lines[i].model_probability<=r.ladder.lines[i-1].model_probability);
  assert(r.ladder.lines[i].baseline_probability<=r.ladder.lines[i-1].baseline_probability);
 }
});
test('source SHA256 mismatch -> HOLD',()=>check(p=>p.source_receipts[0].raw_sha256='a'.repeat(64),'SOURCE_SHA256_MISMATCH'));
test('source receipt after cutoff -> HOLD',()=>check(p=>p.source_receipts[0].observed_at='2026-11-12T20:01:00Z','SOURCE_RECEIPT_OBSERVED_AFTER_CUTOFF'));
test('source bytes absent -> HOLD',()=>check(p=>p.source_receipts[0].raw_json=null,'SOURCE_RAW_BYTES_MISSING_OR_LARGE'));
test('source normalized wrong identity -> HOLD',()=>check(p=>{
 const x=JSON.parse(p.source_receipts[0].raw_json);x.player_id='WRONG';p.source_receipts[0].raw_json=JSON.stringify(x);
 p.source_receipts[0].raw_sha256=hash(p.source_receipts[0].raw_json);
},'SOURCE_NORMALIZATION_IDENTITY_OR_SCOPE_MISMATCH'));
test('duplicate game -> HOLD',()=>check(p=>{
 const x=JSON.parse(p.source_receipts[0].raw_json);x.rows[1].event_id=x.rows[0].event_id;
 p.source_receipts[0].raw_json=JSON.stringify(x);p.source_receipts[0].raw_sha256=hash(p.source_receipts[0].raw_json);
},'DUPLICATE_OR_INVALID_HISTORY_GAME'));
test('target game in history -> HOLD',()=>check(p=>{
 const x=JSON.parse(p.source_receipts[0].raw_json);x.rows[0].event_id=p.event_id;
 p.source_receipts[0].raw_json=JSON.stringify(x);p.source_receipts[0].raw_sha256=hash(p.source_receipts[0].raw_json);
},'FORECAST_TARGET_IN_TRAINING_DATA'));
test('historical result after cutoff -> HOLD',()=>check(p=>{
 const x=JSON.parse(p.source_receipts[0].raw_json);x.rows[3].final_at='2026-11-13T02:00:00Z';
 p.source_receipts[0].raw_json=JSON.stringify(x);p.source_receipts[0].raw_sha256=hash(p.source_receipts[0].raw_json);
},'HISTORY_BOX_OBSERVED_AFTER_CUTOFF_OR_NOT_FINAL'));
test('historical wrong team -> HOLD',()=>check(p=>{
 const x=JSON.parse(p.source_receipts[0].raw_json);x.rows[2].team_id='X';
 p.source_receipts[0].raw_json=JSON.stringify(x);p.source_receipts[0].raw_sha256=hash(p.source_receipts[0].raw_json);
},'HISTORY_PLAYER_OR_TEAM_MISMATCH'));
test('forged odds-dependent forecast -> HOLD',()=>check(p=>p.model_uses_bookmaker_odds=true,'PRICE_INDEPENDENCE_NOT_DECLARED'));
test('incorrect contract rules -> HOLD',()=>check(p=>p.settlement_rule='NO_OVERTIME','ASSISTS_CONTRACT_SCOPE_MISMATCH'));
test('unknown availability -> HOLD',()=>check(p=>p.availability_status='QUESTIONABLE','PARTICIPATION_UNAVAILABLE_OR_UNKNOWN'));
test('weights must sum exactly to unity -> HOLD',()=>check(p=>p.scenarios[0].weight=0.3,'PARTICIPATION_WEIGHTS_UNRESOLVED'));
test('invalid scenario minutes -> HOLD',()=>check(p=>p.scenarios[0].minutes=90,'PARTICIPATION_SCENARIO_INVALID'));
test('future freeze -> HOLD',()=>check(p=>p.frozen_at='2026-11-13T03:00:00Z','POINT_IN_TIME_FORECAST_INVALID'));
test('duplicate line -> HOLD',()=>check(p=>p.lines=[6,6],'ASSISTS_LADDER_THRESHOLDS_INVALID'));
test('missing history -> HOLD',()=>check(p=>p.source_receipts=[],'SOURCE_RECEIPTS_MISSING'));
test('no prices, no sport skill, no certified CI or wagering exposed',()=>{
 const r=forecastAssistDistribution(fixture());assert.equal(r.source_authenticated,false);
 assert.equal(r.ladder.probability_calibrated,false);assert.equal(r.ladder.exact_bookmaker_price_used,false);
 assert.equal(r.ladder.expected_profit_calculated,false);assert.equal(r.ladder.real_money_authority,false);
 assert(!('decimal_odds' in r));
});
test('original distribution compiler remains reused, not replaced',()=>{
 assert.equal(typeof compileDistributionLadder,'function');
 const r=forecastAssistDistribution(fixture());assert.equal(r.ladder.contract,'ATLAS_DISTRIBUTION_LADDER_V1');
});
test('tail probability monotone in minutes given positive rate',()=>{
 const base=fixture();const low=fixture();
 low.scenarios=low.scenarios.map(x=>({...x,minutes:x.minutes/2}));
 assert(forecastAssistDistribution(low).model_probability<forecastAssistDistribution(base).model_probability);
});
