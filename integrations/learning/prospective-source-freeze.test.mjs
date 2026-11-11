import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {readSourceWithBlob,freezePregameSource,validateProspectiveFreeze,COHORT_CONTRACT,
 MODEL_KEY,BASELINE_KEY} from './prospective-source-freeze.mjs';
const sourcePath=fileURLToPath(new URL('./fixtures/nba-connected-prestart-20261111.json',import.meta.url));
const manifestPath=fileURLToPath(new URL('./fixtures/nba-prospective-forecast-freeze-20261111.json',import.meta.url));
const {snapshot,source_git_blob_sha}=readSourceWithBlob(sourcePath);
const manifest=()=>JSON.parse(readFileSync(manifestPath,'utf8'));
const input=()=>structuredClone(snapshot);
const prepare=s=>freezePregameSource(s,{preparedAt:manifest().prepared_at_utc,sourceBlobSha:source_git_blob_sha});
test('real connected provider snapshot is bound to exact immutable GitHub source blob',()=>{
  assert.equal(source_git_blob_sha,manifest().source_git_blob_sha);
  assert.match(source_git_blob_sha,/^[0-9a-f]{40}$/);
  assert.equal(snapshot.games.length,10);
  assert.equal(snapshot.provider_executable_quote,false);
});
test('all ten genuinely prospective forecasts reconcile with source, source time and formula',()=>{
 const m=manifest(),r=validateProspectiveFreeze(snapshot,m,source_git_blob_sha);
 assert.equal(r.status,'FROZEN_SOURCE_ARITHMETIC_MATCH');
 assert.equal(r.cases,10);
 assert.equal(r.results_admitted,0);
 assert.equal(m.contract,COHORT_CONTRACT);
 assert.equal(m.model.key,MODEL_KEY);
 assert.equal(m.baseline.key,BASELINE_KEY);
 assert(m.predictions.every(x=>Date.parse(x.event_start_utc)>Date.parse(m.prepared_at_utc)));
 assert(m.predictions.every(x=>x.bookmaker_price===null&&x.result===null));
});
test('test rerun does not re-freeze with current clock and does not edit original predictions',()=>{
 const f=prepare(input()),m=manifest();
 assert.deepEqual(f,m);
 assert(f.predictions.every(x=>x.forecast_prepared_at===m.prepared_at_utc));
});
test('recorded case IDs exactly match connected provider team/game ID and home-away direction',()=>{
 const m=manifest();
 assert.equal(new Set(m.predictions.map(x=>x.canonical_source_event_key)).size,10);
 assert.equal(m.predictions[0].canonical_source_event_key,'NBA:2026-11-11:WAS@IND');
 assert.equal(m.predictions[0].source_provider_competition_id,1025962);
 assert.equal(m.predictions[0].home_team,'IND');
 assert.equal(m.predictions[0].away_team,'WAS');
});
test('changing reported team PPG invalidates the original frozen model output',()=>{
 const s=input();s.games[0].points_per_game.home+=1;
 assert.throws(()=>validateProspectiveFreeze(s,manifest(),source_git_blob_sha),/PROSPECTIVE_FREEZE_DRIFT/);
});
test('modifying a frozen probability, baseline or source identity is detected',()=>{
 for(const field of ['model_probability_home','frozen_baseline_probability_home','source_provider_competition_id']){
  const m=manifest();m.predictions[1][field]=field==='source_provider_competition_id'?88:0.8;
  assert.throws(()=>validateProspectiveFreeze(input(),m,source_git_blob_sha),/PROSPECTIVE_FREEZE_DRIFT/);
 }
});
test('future result insertion is explicitly different from the immutable pregame freeze',()=>{
 const m=manifest();m.predictions[1].result=1;
 assert.throws(()=>validateProspectiveFreeze(input(),m,source_git_blob_sha),/PROSPECTIVE_FREEZE_DRIFT/);
});
test('duplicate provider event ID cannot be double-counted as independent game',()=>{
 const s=input();s.games[1].provider_competition_id=s.games[0].provider_competition_id;
 assert.throws(()=>prepare(s),/PROSPECTIVE_GAME_INVALID/);
});
test('duplicate team matchup cannot inflate sample size',()=>{
 const s=input();s.games[1].teams=structuredClone(s.games[0].teams);
 assert.throws(()=>prepare(s),/PROSPECTIVE_MATCHUP_DUPLICATED/);
});
test('home-away identity must resolve uniquely',()=>{
 const s=input();s.games[0].teams[1].home=true;
 assert.throws(()=>prepare(s),/PROSPECTIVE_TEAM_IDENTITY_INVALID/);
});
test('late source, late forecast or live game cannot be backdated',()=>{
 for(const mode of ['source','forecast','live']){
  const s=input(),opts={preparedAt:manifest().prepared_at_utc,sourceBlobSha:source_git_blob_sha};
  if(mode==='source')s.source_generated_at_utc='2026-11-12T04:00:00Z';
  if(mode==='forecast')opts.preparedAt='2026-11-12T04:00:00Z';
  if(mode==='live')s.games[0].status='Live';
  assert.throws(()=>freezePregameSource(s,opts),/PROSPECTIVE_SOURCE_CONTRACT_INVALID|PROSPECTIVE_GAME_INVALID/);
 }
});
test('false provider signature claim, claim of accepted prices or official outcome rejected',()=>{
 for(const field of ['mode','provider_executable_quote','official_outcome_authenticated']){
  const s=input();s[field]=field==='mode'?'LIVE_EXECUTABLE':true;
  assert.throws(()=>prepare(s),/PROSPECTIVE_SOURCE_CONTRACT_INVALID/);
 }
});
test('changed Git blob, switched model or fabricated price cannot pass',()=>{
 const m=manifest();m.source_git_blob_sha='f'.repeat(40);
 assert.throws(()=>validateProspectiveFreeze(snapshot,m,source_git_blob_sha),/PROSPECTIVE_FREEZE_INTEGRITY_INVALID/);
 const model=manifest();model.model.scale_ppg=4;
 assert.throws(()=>validateProspectiveFreeze(snapshot,model,source_git_blob_sha),/PROSPECTIVE_FREEZE_DRIFT/);
 const priced=manifest();priced.predictions[0].bookmaker_price=-150;
 assert.throws(()=>validateProspectiveFreeze(snapshot,priced,source_git_blob_sha),/PROSPECTIVE_FREEZE_DRIFT/);
});
test('JSON property ordering is not treated as a data mutation',()=>{
 const m=manifest(),ordered=JSON.parse(JSON.stringify(m,(k,v)=>v));
 ordered.predictions=ordered.predictions.map(p=>Object.fromEntries(Object.entries(p).reverse()));
 assert.equal(validateProspectiveFreeze(snapshot,ordered,source_git_blob_sha).cases,10);
});
test('every output has no live authority, no stakes, and no admitted official outcome',()=>{
 const m=manifest();
 assert.equal(m.no_bets,true);
 assert.equal(m.production_authority,false);
 assert.equal(m.automatic_model_promotion,false);
 assert.equal(m.model.odds_or_market_prices_used,false);
 assert.equal(m.model.calibrated,false);
 assert(m.predictions.every(p=>p.official_result_authenticated===false&&p.real_betting_authority===false&&p.financial_return===null&&p.forecast_skill_eligible===false));
});
