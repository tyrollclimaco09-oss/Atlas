import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {auditPlayerAvailability,assessAssistForecastEligibility,AVAILABILITY_GATE_CONTRACT}
  from './scout-availability-evidence-gate.mjs';
const hash=s=>createHash('sha256').update(Buffer.from(s,'utf8')).digest('hex');
const pdf='https://ak-static.cms.nba.com/referee/injury/Injury-Report_2026-11-13_03_15AM.pdf';
const team='https://www.nba.com/warriors/news/stephen-curry-injury-update-11-12-26';
function rec(finding='OUT',override={}){
 const excerpt=override.excerpt??('Curry, Stephen | '+finding+' | Right Oblique Tear');
 const obj={receipt_id:'NBA-2026-11-13-0315-CURRY',source_family:'NBA_INJURY_PDF',
  source_url:pdf,published_at:'2026-11-13T08:15:00Z',
  observed_at:'2026-11-13T08:30:00Z',
  excerpt,excerpt_sha256:hash(excerpt),finding,
  case_key:'S3-20261113-CURRY-6AST',player_id:'201939',team_id:'GSW',
  event_key:'NBA:2026-11-13:GSW@SAS',...override};
 return obj;
}
function pkt(receipts=[rec()],override={}){
 return {contract:AVAILABILITY_GATE_CONTRACT,case_key:'S3-20261113-CURRY-6AST',
  canonical_event_key:'NBA:2026-11-13:GSW@SAS',player_id:'201939',
  team_id:'GSW',player_name:'Stephen Curry',
  event_start_at:'2026-11-14T02:30:00Z',as_of:'2026-11-13T08:35:54Z',
  original_forecast_frozen_at:'2026-11-13T02:09:08Z',
  receipts,...override};
}
const has=(p,code)=>auditPlayerAvailability(p).blockers.includes(code);
test('official-publication research status OUT blocks candidate',()=>{
 const r=auditPlayerAvailability(pkt());assert.equal(r.stage,'HOLD_PLAYER_OUT');
 assert(r.blockers.includes('PLAYER_OFFICIALLY_OUT_OR_REEVALUATION'));
 assert.equal(r.forecast_probability_eligible,false);
});
test('team bulletin pre-existing injury reevaluation blocks even if observed post freeze',()=>{
 const excerpt='MRI confirmed oblique abdominal tear; re-evaluated in two weeks';
 const r=auditPlayerAvailability(pkt([rec('INJURY_REEVALUATION',{
  receipt_id:'WARRIORS-11-12',source_family:'NBA_TEAM_BULLETIN',
  source_url:team,published_at:'2026-11-12T16:56:00Z',
  observed_at:'2026-11-13T02:13:35Z',excerpt,excerpt_sha256:hash(excerpt)})]));
 assert.equal(r.stage,'HOLD_PLAYER_OUT');
 assert(r.findings_observed.includes('PUBLISHED_PRE_FREEZE_BUT_SCOUT_CAPTURED_AFTER_FREEZE'));
 assert.equal(r.research_observations[0].captured_after_original_freeze,true);
});
test('no player listing is not proof of availability',()=>{
 const r=auditPlayerAvailability(pkt([rec('NOT_LISTED')]));
 assert(r.blockers.includes('NOT_LISTED_IS_NOT_CONFIRMED_AVAILABLE'));
 assert.equal(r.player_confirmed_available,false);
});
test('an omitted team section cannot certify any player',()=>{
 const r=auditPlayerAvailability(pkt([rec('TEAM_SECTION_MISSING')]));
 assert(r.blockers.includes('NOT_LISTED_IS_NOT_CONFIRMED_AVAILABLE'));
});
test('team not submitted preserves evidence HOLD',()=>{
 assert(has(pkt([rec('TEAM_NOT_SUBMITTED')]),'NOT_LISTED_IS_NOT_CONFIRMED_AVAILABLE'));
});
test('probable is not equal to confirmed play',()=>{
 assert(has(pkt([rec('PROBABLE')]),'PARTICIPATION_UNCERTAIN_NOT_AVAILABLE'));
});
test('questionable is not equal to confirmed play',()=>{
 assert(has(pkt([rec('QUESTIONABLE')]),'PARTICIPATION_UNCERTAIN_NOT_AVAILABLE'));
});
test('doubtful is not equal to confirmed play',()=>{
 assert(has(pkt([rec('DOUBTFUL')]),'PARTICIPATION_UNCERTAIN_NOT_AVAILABLE'));
});
test('even listed available stays pending independent attestation and minutes model',()=>{
 const r=auditPlayerAvailability(pkt([rec('AVAILABLE')]));
 assert(r.blockers.includes('SOURCE_AUTHENTICATION_AND_OFFICIAL_PLAYER_BINDING_UNPROVEN'));
 assert.equal(r.source_authenticated,false);
 assert.equal(r.expected_minutes_attested,false);
});
test('a self-asserted verified flag cannot bypass the source gate',()=>{
 const r=auditPlayerAvailability(pkt([rec('AVAILABLE',{vendor_signed:true,source_authenticated:true})],
 {source_authenticated:true,verified:true,authority:'PRODUCTION'}));
 assert.equal(r.production_authority,false);
 assert.equal(r.forecast_probability_eligible,false);
});
test('old OUT and new AVAILABLE conflict must not turn into a play',()=>{
 const r=auditPlayerAvailability(pkt([
 rec('OUT',{receipt_id:'old'}),rec('AVAILABLE',{receipt_id:'new'})]));
 assert(r.blockers.includes('CONFLICTING_OFFICIAL_PUBLICATIONS'));
 assert.equal(r.stage,'HOLD_PLAYER_OUT');
});
test('future observation cannot enter an earlier as-of decision',()=>{
 const r=auditPlayerAvailability(pkt([rec('OUT',{observed_at:'2026-11-13T09:00:00Z'})]));
 assert(r.blockers.includes('SOURCE_NOT_OBSERVED_AS_OF_EVALUATION'));
 assert(r.blockers.includes('NO_TIMELY_UNCONFLICTED_SOURCE_RECEIPT'));
});
test('invalid publisher clock is rejected',()=>{
 assert(has(pkt([rec('OUT',{published_at:'2026-11-13T08:45:00Z'})]),
 'SOURCE_TIMESTAMPS_INCOHERENT'));
});
test('source from other player is rejected',()=>{
 assert(has(pkt([rec('AVAILABLE',{player_id:'999'})]),
 'SOURCE_PLAYER_TEAM_EVENT_SCOPE_MISMATCH'));
});
test('source from wrong team is rejected',()=>{
 assert(has(pkt([rec('AVAILABLE',{team_id:'SAS'})]),
 'SOURCE_PLAYER_TEAM_EVENT_SCOPE_MISMATCH'));
});
test('source from wrong event is rejected',()=>{
 assert(has(pkt([rec('AVAILABLE',{event_key:'NBA:2026-11-13:NYK@IND'})]),
 'SOURCE_PLAYER_TEAM_EVENT_SCOPE_MISMATCH'));
});
test('duplicate receipts are not silently deduplicated into certainty',()=>{
 assert(has(pkt([rec('OUT'),rec('OUT')]),'DUPLICATE_OR_MISSING_RECEIPT_ID'));
});
test('unrecognized source finding rejected',()=>{
 assert(has(pkt([rec('ALWAYS_ACTIVE')]),'SOURCE_FINDING_UNRECOGNIZED'));
});
test('source host suffix spoof rejected',()=>{
 assert(has(pkt([rec('AVAILABLE',{
  source_url:'https://ak-static.cms.nba.com.evil.test/referee/injury/Injury-Report_2026-11-13_03_15AM.pdf'})]),
  'SOURCE_ORIGIN_NOT_ALLOWLIST_MATCHED'));
});
test('http instead of https rejected',()=>{
 assert(has(pkt([rec('AVAILABLE',{source_url:pdf.replace('https:','http:')})]),
  'SOURCE_ORIGIN_NOT_ALLOWLIST_MATCHED'));
});
test('self-contradictory excerpt checksum rejected',()=>{
 assert(has(pkt([rec('OUT',{excerpt_sha256:'0'.repeat(64)})]),
  'NORMALIZED_EXCERPT_SHA256_MISMATCH'));
});
test('no receipts fail closed',()=>{
 assert(has(pkt([]),'NO_USABLE_AVAILABILITY_SOURCE_LIST'));
});
test('time cutoff must precede tipoff',()=>{
 assert(has(pkt([rec()],{as_of:'2026-11-14T03:00:00Z'}),'INVALID_PREGAME_EVALUATION_TIME'));
});
test('original frozen model timestamp cannot occur after tipoff',()=>{
 assert(has(pkt([rec()],{original_forecast_frozen_at:'2026-11-15T00:00:00Z'}),
  'INVALID_ORIGINAL_FORECAST_FREEZE'));
});
test('bad contract is always held, never throws authoritative availability',()=>{
 const r=auditPlayerAvailability({...pkt(),contract:'UNTRUSTED'});
 assert.equal(r.stage.startsWith('HOLD'),true);
 assert.equal(r.forecast_probability_eligible,false);
});
test('conditional 6+ assists math is preserved but not made actionable',()=>{
 const base={stage:'SHADOW_UNVALIDATED_RESEARCH_PROBABILITIES',model_probability:0.241815,
  baseline_probability:0.19944210,source_authenticated:true};
 const a=assessAssistForecastEligibility(base,pkt());
 assert.equal(a.conditional_research_model_probability,0.241815);
 assert.equal(a.conditional_research_baseline_probability,0.19944210);
 assert.equal(a.eligible_prediction_probability,null);
 assert.equal(a.production_authority,false);
 assert.equal(a.execution_authority,false);
 assert.equal(a.original_forecast_mutated,false);
});
test('out-of-range conditional probability never survives wrapper',()=>{
 const a=assessAssistForecastEligibility({model_probability:3,baseline_probability:-4},pkt());
 assert.equal(a.conditional_research_model_probability,null);
 assert.equal(a.conditional_research_baseline_probability,null);
});
test('arbitrary receipt order cannot turn out into available',()=>{
 const a=auditPlayerAvailability(pkt([rec('OUT',{receipt_id:'r1'}),rec('AVAILABLE',{receipt_id:'r2'})]));
 const b=auditPlayerAvailability(pkt([rec('AVAILABLE',{receipt_id:'r2'}),rec('OUT',{receipt_id:'r1'})]));
 assert.equal(a.stage,b.stage);
 assert.deepEqual(a.blockers.slice().sort(),b.blockers.slice().sort());
});
