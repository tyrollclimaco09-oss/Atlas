import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessEventCrosswalk,CROSSWALK_CONTRACT} from './event-source-crosswalk.mjs';
const source=JSON.parse(readFileSync(new URL('./fixtures/buf-min-provider-event-20261109.json',import.meta.url),'utf8'));
const fx=()=>structuredClone(source);
const run=p=>assessEventCrosswalk(p);
test('actual provider event and canonical schedule match but are not an authenticated DB binding',()=>{
  const p=fx(),v=run(p);
  assert.equal(v.contract,CROSSWALK_CONTRACT);
  assert.equal(v.stage,'MATCHED_SHADOW_CROSSWALK_NOT_REGISTERED');
  assert.equal(v.source_match,true);
  assert.equal(v.source_clock_delta_seconds,0);
  assert.equal(v.eligible_for_original_pregame_forecast_evidence,false);
  assert.equal(v.source_observed_after_original_forecast,true);
  assert.equal(v.provider_event_id,'974116');
  assert.equal(v.record_provider_event_authorized,false);
  assert.equal(v.model_promotion,false);
  assert.equal(v.verified_native_book_quote,false);
});
test('canonical key and internal UUID must exist',()=>{
  const p=fx();p.canonical.event_id=null;
  assert(run(p).errors.includes('MISSING_CANONICAL_EVENT_IDENTITY'));
});
test('provider game id is required rather than guessed',()=>{
  const p=fx();p.provider_event.competitionId=0;
  assert(run(p).errors.includes('PROVIDER_EVENT_OR_LEAGUE_MISMATCH'));
});
test('wrong league cannot pass because matchup happens to have similar names',()=>{
  const p=fx();p.provider_event.league='NBA';
  assert(run(p).errors.includes('PROVIDER_EVENT_OR_LEAGUE_MISMATCH'));
});
test('kickoff time shifted by 15 minutes fails closed',()=>{
  const p=fx();p.provider_event.startDateTimeUtc='2026-11-10T01:30:00Z';
  assert(run(p).errors.includes('START_TIME_MISMATCH'));
});
test('two-minute tolerance passes with source discrepancy retained',()=>{
  const p=fx();p.provider_event.startDateTimeUtc='2026-11-10T01:17:00Z';
  const r=run(p);assert.equal(r.source_match,true);assert.equal(r.source_clock_delta_seconds,120);
});
test('capture made after kickoff cannot be presented as original pregame evidence',()=>{
  const p=fx();p.source_capture.capture_observed_at='2026-11-10T01:16:00Z';
  assert(run(p).errors.includes('SOURCE_NOT_CAPTURED_BEFORE_START'));
});
test('home-away inversion cannot be treated as same event identity',()=>{
  const p=fx();p.provider_event.teams.forEach(t=>{t.isHomeTeam=!t.isHomeTeam});
  assert(run(p).errors.includes('HOME_AWAY_OR_TEAM_MATCHUP_MISMATCH'));
});
test('wrong team id cannot be substituted even when abbreviation matches',()=>{
  const p=fx();p.provider_event.teams[0].teamId=999999;
  assert(run(p).errors.includes('UNMATCHED_PROVIDER_TEAM_ID'));
});
test('duplicate team configs cannot establish independent identities',()=>{
  const p=fx();p.team_configurations.push({...p.team_configurations[0]});
  assert(run(p).errors.includes('DUPLICATE_TEAM_CONFIG'));
});
test('two home teams are invalid',()=>{
  const p=fx();p.provider_event.teams[1].isHomeTeam=true;
  assert(run(p).errors.includes('HOME_AWAY_OR_TEAM_MATCHUP_MISMATCH'));
});
test('three teams is invalid for ordinary head-to-head sports event',()=>{
  const p=fx();p.provider_event.teams.push({teamAbbreviation:'CHI',teamId:18530,isHomeTeam:false});
  assert(run(p).errors.includes('INCOMPLETE_HOME_AWAY_TEAMS'));
});
test('fake connected-tool claim is rejected',()=>{
  const p=fx();p.source_capture.kind='UNVERIFIED_WEB_PAGE';
  assert(run(p).errors.includes('UNATTESTED_OR_MISSING_SOURCE_CAPTURE'));
});
test('missing capture timestamp rejects alleged live source',()=>{
  const p=fx();p.source_capture.capture_observed_at=null;
  assert(run(p).errors.includes('UNATTESTED_OR_MISSING_SOURCE_CAPTURE'));
});
test('invalid provider registration assertion cannot create a provider ID',()=>{
  const p=fx();p.provider_id_registered=true;
  assert(run(p).errors.includes('PROVIDER_REGISTRATION_CLAIM_UNSUPPORTED'));
});
test('unknown provider-binding state is not silently assumed to be zero',()=>{
  const p=fx();delete p.provider_binding_count;
  assert(run(p).errors.includes('UNVERIFIED_PROVIDER_BINDING_COUNT'));
});
test('even registered provider and matching event cannot certify official market without attestation',()=>{
  const p=fx();p.provider_id_registered=true;
  p.provider_id='00000000-0000-4000-8000-000000000001';
  p.provider_event_record_id='00000000-0000-4000-8000-000000000002';
  p.provider_binding_count=1;
  const r=run(p);
  assert.equal(r.stage,'MATCHED_REGISTERED_SOURCE_NEEDS_OFFICIAL_ATTESTATION');
  assert.equal(r.record_provider_event_authorized,false);
  assert.equal(r.requires_official_market_identity,true);
  assert.equal(r.requires_official_outcome,true);
});
test('model learning still blocks forged official results or unknown market IDs',()=>{
  const r=run(fx());assert.equal(r.model_promotion,false);
  assert.equal(r.actual_money_wagered,false);
  assert.equal(r.production_authority,false);
});
test('schema with missing teams cannot be trusted',()=>{
  const p=fx();p.provider_event.teams=[];
  assert(run(p).errors.includes('INCOMPLETE_HOME_AWAY_TEAMS'));
});
test('bad input fails rather than silently matching',()=>{
  assert.throws(()=>run({contract:'BAD'}),/PACKET_INVALID/);
});

test('source captured after a prediction must never retroactively validate that frozen model',()=>{
 const p=fx();
 const z=run(p);
 assert.equal(z.source_match,true);
 assert.equal(z.source_observed_after_original_forecast,true);
 assert.equal(z.eligible_for_original_pregame_forecast_evidence,false);
 assert.equal(z.model_promotion,false);
});
test('source observed before a separately frozen later prediction can support only that later decision',()=>{
 const p=fx();p.prediction_frozen_at='2026-11-09T19:00:00Z';
 const z=run(p);assert.equal(z.source_match,true);
 assert.equal(z.eligible_for_original_pregame_forecast_evidence,true);
 assert.equal(z.source_observed_after_original_forecast,false);
 assert.equal(z.record_provider_event_authorized,false);
});
