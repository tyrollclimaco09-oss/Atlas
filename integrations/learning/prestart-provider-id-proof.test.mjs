import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const load=name=>JSON.parse(readFileSync(new URL('./fixtures/'+name,import.meta.url),'utf8'));
const receipt=load('nba-three-provider-prestart-event-links-20261111.json');
const cohort=load('nba-prospective-forecast-freeze-20261111.json');
test('10 authentic archived provider-ID links are unique and exact to original frozen case keys',()=>{
 assert.equal(receipt.contract,'ATLAS_NBA_PRESTART_THREE_PROVIDER_EVENT_ID_CROSSCHECK_V1');
 assert.equal(receipt.game_count,10);
 assert.equal(receipt.games.length,cohort.count);
 assert.equal(receipt.frozen_model_source_git_blob_sha,cohort.source_git_blob_sha);
 assert.equal(receipt.model_prepared_at_utc,cohort.prepared_at_utc);
 const eventKeys=new Set(),nbaIDs=new Set(),espnIDs=new Set();
 for(const row of receipt.games){
  const matches=cohort.predictions.filter(p=>p.canonical_source_event_key===row.event_key&&p.source_provider_competition_id===row.connected_dk_competition_id);
  assert.equal(matches.length,1);
  assert(/^\d{10}$/.test(row.official_nba_game_id));
  assert(/^\d+$/.test(row.espn_event_id));
  assert(!eventKeys.has(row.event_key));eventKeys.add(row.event_key);
  assert(!nbaIDs.has(row.official_nba_game_id));nbaIDs.add(row.official_nba_game_id);
  assert(!espnIDs.has(row.espn_event_id));espnIDs.add(row.espn_event_id);
  assert.equal(row.identity_timestamp_class,'SOURCE_CAPTURED_AFTER_FORECAST_BEFORE_TIP');
  assert.equal(row.score_admitted,false);
 }
});
test('real original future event timing and archive SHA receipts cannot be backdated to model freeze',()=>{
 for(const time of Object.values(receipt.capture_observed_at_utc)){
  assert(Date.parse(time)>Date.parse(cohort.prepared_at_utc));
  assert(Date.parse(time)<Math.min(...cohort.predictions.map(p=>Date.parse(p.event_start_utc))));
 }
 for(const sha of Object.values(receipt.captured_raw_sha256))assert(/^[0-9a-f]{64}$/.test(sha));
 assert.equal(receipt.raw_provider_digital_signature_verified,false);
 assert.equal(receipt.canonical_bookmaker_market_rules_verified,false);
 assert.equal(receipt.model_calibration_authority,false);
 assert.equal(receipt.roi_authority,false);
 assert.equal(receipt.production_authority,false);
});
test('source artifact is explicitly time-limited and no results are joined to the original prediction rows',()=>{
 assert(Number.isSafeInteger(receipt.capture_workflow_run));
 assert(Number.isSafeInteger(receipt.capture_artifact_id));
 assert(Date.parse(receipt.capture_artifact_expires_utc)>Date.parse(receipt.capture_observed_at_utc.nba));
 assert(cohort.predictions.every(p=>p.result===null&&p.official_result_authenticated===false));
 assert.equal(receipt.original_forecast_updated,false);
});
