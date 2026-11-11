import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {readSourceWithBlob} from './prospective-source-freeze.mjs';
import {createRecordControl,verifyRecordControl,recordProbability} from './record-control-challenger.mjs';
import {evaluateProspectivePostgame,EVAL_CONTRACT,EVIDENCE_CONTRACT} from './prospective-postgame-evaluator.mjs';

const base=new URL('./fixtures/',import.meta.url);
const sPath=fileURLToPath(new URL('nba-connected-prestart-20261111.json',base));
const cPath=fileURLToPath(new URL('nba-prospective-forecast-freeze-20261111.json',base));
const rPath=fileURLToPath(new URL('nba-record-challenger-freeze-20261111.json',base));
const cli=fileURLToPath(new URL('score-prospective-nba-cli.mjs',import.meta.url));
const {snapshot:source,source_git_blob_sha:sourceBlobSha}=readSourceWithBlob(sPath);
const cohort=JSON.parse(readFileSync(cPath,'utf8'));
const challenger=JSON.parse(readFileSync(rPath,'utf8'));
const run=observations=>evaluateProspectivePostgame({source,cohort,sourceBlobSha,challenger,observations});
function fixture(p,homeScore=111,awayScore=105){
 const common={
 contract:EVIDENCE_CONTRACT,
 canonical_source_event_key:p.canonical_source_event_key,
 home_team:p.home_team,away_team:p.away_team,
 home_score:homeScore,away_score:awayScore,
 game_status:'Final',observed_at:'2026-11-13T00:00:00Z',
 evidence_excerpt:'TEST FIXTURE ONLY: synthetic final score representation',
 upstream_chain_id:'distinct-test-origin',
 };
 const dk={...common,origin:'CONNECTED_DK_SCORES',receipt_id:'test-dk-'+p.source_provider_competition_id,
  provider_competition_id:p.source_provider_competition_id,
  home_team_id:p.source_home_team_id,away_team_id:p.source_away_team_id,
  source_uri:'connected-draftkings:competition/'+p.source_provider_competition_id,
  capture_sha256:'a'.repeat(64),upstream_chain_id:'test-dk'};
 const nba={...common,origin:'NBA_OFFICIAL_PUBLIC_PAGE',receipt_id:'test-nba-'+p.source_provider_competition_id,
  provider_competition_id:null,source_uri:'https://www.nba.com/game/fixture-'+p.source_provider_competition_id,
  capture_sha256:'b'.repeat(64),upstream_chain_id:'test-nba'};
 return [dk,nba];
}
test('separate record-only challenger was frozen before all 10 games',()=>{
 const v=verifyRecordControl(source,cohort,sourceBlobSha,challenger);
 assert.equal(v.status,'RECORD_CONTROL_FROZEN_MATCH');
 assert.equal(v.cases,10);
 assert(Date.parse(challenger.challenger_frozen_at)<Math.min(...cohort.predictions.map(x=>Date.parse(x.event_start_utc))));
 assert.equal(challenger.model.odds_or_market_prices_used,false);
 assert.equal(challenger.model.calibrated,false);
});
test('challenger is pure input-driven and reproducible without result data',()=>{
 assert.deepEqual(createRecordControl(source,cohort,sourceBlobSha,{frozenAt:challenger.challenger_frozen_at}),challenger);
 assert.equal(recordProbability('3-8','4-7'),0.457487071);
});
test('mutating record, hidden model weight, or adding results cannot rewrite frozen challenger',()=>{
 for(const mutate of [x=>x.cases[0].source_home_record='7-4',x=>x.model.weight=1,x=>x.results=[0],x=>x.cases[0].probability_home=0.95]){
  const changed=structuredClone(challenger);mutate(changed);
  assert.throws(()=>verifyRecordControl(source,cohort,sourceBlobSha,changed),/RECORD_CONTROL_DRIFT_OR_FORGERY/);
 }
});
test('one-day backfilled model must never pretend to have been frozen pregame',()=>{
 assert.throws(()=>createRecordControl(source,cohort,sourceBlobSha,{frozenAt:'2026-11-12T04:00:00Z'}),/RECORD_CONTROL_NOT_PRESTART/);
});
test('without aftergame observations, all 10 cases are HOLD and no metric exists',()=>{
 const r=run([]);
 assert.equal(r.contract,EVAL_CONTRACT);
 assert.equal(r.frozen_case_count,10);
 assert.equal(r.provisional_scored_count,0);
 assert.equal(r.held_count,10);
 assert.equal(r.paired_metrics,null);
 assert(r.per_case.every(x=>x.status==='HOLD_INCOMPLETE_OR_CONFLICTED_RESULT'));
 assert.equal(r.official_calibration_sample_count,0);
});
test('two agreeing synthetic-source records exercise Brier and log-loss for three frozen arms',()=>{
 const r=run(cohort.predictions.flatMap(p=>fixture(p)));
 assert.equal(r.provisional_scored_count,10);
 assert.equal(r.full_cohort_crosschecked,true);
 assert.equal(r.paired_metrics.neutral_mean_brier,0.25);
 assert(Math.abs(r.paired_metrics.neutral_mean_log_loss-Math.log(2))<1e-10);
 assert.notEqual(r.paired_metrics.ppg18_mean_brier,null);
 assert.notEqual(r.paired_metrics.record_control_mean_brier,null);
 assert.equal(r.official_calibration_sample_count,0);
 assert.equal(r.real_betting_authority,false);
 assert.equal(r.paired_metrics.warning,'SINGLE_DAY_SAMPLE_NOT_CALIBRATION');
 assert(r.per_case.every(x=>!x.verified_official_source && !x.model_calibration_eligible));
});
test('partial source records do not silently shrink the cohort count',()=>{
 const r=run(fixture(cohort.predictions[0]));
 assert.equal(r.frozen_case_count,10);
 assert.equal(r.provisional_scored_count,1);
 assert.equal(r.held_count,9);
 assert.equal(r.full_cohort_crosschecked,false);
 assert.equal(r.paired_metrics.warning,'PARTIAL_SELECTIVE_SAMPLE_NOT_COMPLETE_COHORT');
});
test('single connected score source never becomes official proof by itself',()=>{
 const r=run([fixture(cohort.predictions[0])[0]]);
 assert.equal(r.provisional_scored_count,0);
 assert(r.per_case[0].blockers.includes('MISSING_OR_DUPLICATE_NBA_FINAL'));
});
test('two nominally different sources with mismatched final scores HOLD',()=>{
 const obs=fixture(cohort.predictions[0]);obs[1].away_score=114;
 const r=run(obs);assert.equal(r.provisional_scored_count,0);
 assert(r.per_case[0].blockers.includes('SOURCES_DISAGREE_ON_FINAL'));
});
test('provider event ID and team IDs must match frozen originals',()=>{
 const obs=fixture(cohort.predictions[0]);obs[0].provider_competition_id=999;
 assert(run(obs).per_case[0].blockers.includes('NATIVE_PROVIDER_IDENTITY_MISMATCH'));
 const obs2=fixture(cohort.predictions[0]);obs2[0].home_team_id=666;
 assert(run(obs2).per_case[0].blockers.includes('NATIVE_PROVIDER_IDENTITY_MISMATCH'));
});
test('official-looking URL alone is never sufficient to score unsupported result',()=>{
 const obs=fixture(cohort.predictions[0]);obs[0].game_status='Live';
 assert(run(obs).per_case[0].blockers.includes('GAME_NOT_FINAL'));
 const onlyURL=fixture(cohort.predictions[0]);onlyURL[1].evidence_excerpt='';
 assert(run(onlyURL).per_case[0].blockers.includes('SOURCE_CAPTURE_EVIDENCE_MISSING'));
 assert.equal(run(onlyURL).official_calibration_sample_count,0);
});
test('duplicate source reports cause HOLD, not preference for latest winner',()=>{
 const obs=fixture(cohort.predictions[0]);obs.push({...obs[0],receipt_id:'test-duplicate',home_score:55,away_score:101});
 assert(run(obs).per_case[0].blockers.includes('MISSING_OR_DUPLICATE_DK_FINAL'));
});
test('prestart or implausibly early Final evidence is rejected',()=>{
 const obs=fixture(cohort.predictions[0]);obs[1].observed_at=cohort.predictions[0].event_start_utc;
 assert(run(obs).per_case[0].blockers.includes('NOT_POST_START_FINAL_OBSERVATION'));
});
test('a suspended match, tie or missing score is NOT graded as a loss',()=>{
 const p=cohort.predictions[0];
 for(const mutate of [o=>o[0].game_status='Suspended',o=>o[0].home_score=105,o=>o[0].home_score=null]){
  const obs=fixture(p);mutate(obs);
  assert.equal(run(obs).per_case[0].status,'HOLD_INCOMPLETE_OR_CONFLICTED_RESULT');
 }
});
test('duplicated receipt, unknown case and shared upstream chain fail closed',()=>{
 const p=cohort.predictions[0],obs=fixture(p);
 const d=structuredClone(obs);d[1].receipt_id=d[0].receipt_id;
 assert.throws(()=>run(d),/POSTGAME_DUPLICATE_RECEIPT_ID/);
 const u=structuredClone(obs);u[1].canonical_source_event_key='NBA:2026-11-11:UNKNOWN';
 assert.throws(()=>run(u),/POSTGAME_UNKNOWN_EVENT_REJECTED/);
 const same=structuredClone(obs);same[1].upstream_chain_id='test-dk';
 assert(run(same).per_case[0].blockers.includes('SHARED_UPSTREAM_CHAIN_DECLARED'));
});
test('a forged/modified pregame forecast cannot be graded',()=>{
 const changed=structuredClone(cohort);changed.predictions[0].model_probability_home=0.99;
 assert.throws(()=>evaluateProspectivePostgame({source,cohort:changed,sourceBlobSha,challenger,observations:[]}),/PROSPECTIVE_FREEZE_DRIFT_OR_REWRITE/);
});
test('missing source and invalid payload reject instead of zero-report success',()=>{
 assert.throws(()=>run(null),/POSTGAME_OBSERVATIONS_INVALID/);
 assert.throws(()=>run(Array(201).fill({})),/POSTGAME_OBSERVATIONS_INVALID/);
});
test('real CLI without outcome claims returns 10 HOLD and no selected metrics',()=>{
 const r=spawnSync(process.execPath,[cli],{input:JSON.stringify({observations:[]}),encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
 const report=JSON.parse(r.stdout);
 assert.equal(report.state,'NO_ADMISSIBLE_RESULTS');
 assert.equal(report.paired_metrics,null);
 assert.equal(report.held_count,10);
 assert.equal(report.official_calibration_sample_count,0);
 assert.equal(report.original_forecasts_unchanged,true);
});
test('CLI with synthetic test claims reports only provisional research and zero authority',()=>{
 const r=spawnSync(process.execPath,[cli],{input:JSON.stringify({observations:fixture(cohort.predictions[0])}),encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
 const o=JSON.parse(r.stdout);
 assert.equal(o.provisional_scored_count,1);
 assert.equal(o.official_calibration_sample_count,0);
 assert.equal(o.production_authority,false);
 assert.equal(o.pricing_roi_authority,false);
});
