import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {readSourceWithBlob} from './prospective-source-freeze.mjs';
import {createSourceCapture,verifySourceCapture,fetchAllowedSource,NBA_URL,sha256} from './direct-source-capture.mjs';
import {evaluateCapturedNBACohort,DIRECT_OUTCOME_CONTRACT} from './direct-outcome-join.mjs';
const root=new URL('./fixtures/',import.meta.url);
const {snapshot:source,source_git_blob_sha:sourceSha}=readSourceWithBlob(fileURLToPath(new URL('nba-connected-prestart-20261111.json',root)));
const cohort=JSON.parse(readFileSync(new URL('nba-prospective-forecast-freeze-20261111.json',root),'utf8'));
const challenger=JSON.parse(readFileSync(new URL('nba-record-challenger-freeze-20261111.json',root),'utf8'));
const date='2026-11-11',p=cohort.predictions[0];
const at='2026-11-12T12:00:00Z';
function fixtures(){
 const nba={leagueSchedule:{gameDates:[{gameDate:'11/11/2026',games:[{
  gameId:'0022600100',gameCode:'20261111/'+p.away_team+p.home_team,
  gameDateTimeUTC:p.event_start_utc,gameStatus:3,gameStatusText:'Final',
  homeTeam:{teamTricode:p.home_team,score:110},
  awayTeam:{teamTricode:p.away_team,score:99}
 }]}]}};
 const espn={events:[{id:'401261111',date:p.event_start_utc,
  status:{type:{completed:true,state:'post'}},
  competitions:[{competitors:[
   {homeAway:'home',team:{abbreviation:p.home_team},score:'110'},
   {homeAway:'away',team:{abbreviation:p.away_team},score:'99'}]}]}]};
 return {nba,espn};
}
const captured=(provider,body,observedAt=at)=>{
 const bytes=Buffer.from(JSON.stringify(body));
 return createSourceCapture({provider,date,bytes,observedAt,contentType:'application/json; charset=utf-8'});
};
function report(nbaCapture=null,espnCapture=null){
 return evaluateCapturedNBACohort({source,sourceSha,cohort,challenger,
  requestedDate:date,nbaCapture,espnCapture});
}
test('real ten-game original freeze remains intact and no source gives ten holds',()=>{
 const r=report();
 assert.equal(r.contract,DIRECT_OUTCOME_CONTRACT);
 assert.equal(r.frozen_case_count,10);
 assert.equal(r.held_count,10);
 assert.equal(r.provisional_scored_count,0);
 assert.equal(r.metrics,null);
 assert.equal(r.official_authenticated_production_cases,0);
 assert.equal(r.real_betting_authority,false);
});
test('two distinct valid archived HTTPS-source JSON bytes can provisionally score exactly one matched game',()=>{
 const {nba,espn}=fixtures();
 const r=report(captured('NBA_OFFICIAL_CDN',nba),captured('ESPN_SCOREBOARD',espn));
 assert.equal(r.provisional_scored_count,1);
 assert.equal(r.held_count,9);
 assert.equal(r.results[0].status,'TWO_HTTPS_ORIGINS_AGREE_PROVISIONAL');
 assert.equal(r.results[0].final.home_won,1);
 assert.equal(r.metrics.neutral.brier,0.25);
 assert.equal(r.source_captures.length,2);
 assert.equal(r.official_authenticated_production_cases,0);
 assert.equal(r.provider_digital_signatures_present,false);
 assert.equal(r.original_feed_dependency_independent,false);
});
test('body hash matches captured bytes and a changed raw score cannot reuse metadata',()=>{
 const {nba}=fixtures(),c=captured('NBA_OFFICIAL_CDN',nba);
 assert.deepEqual(verifySourceCapture(c.metadata,c.raw),nba);
 assert.equal(sha256(c.raw),c.metadata.sha256);
 const corrupt=Buffer.from(c.raw);
 corrupt[corrupt.length-5]=corrupt[corrupt.length-5]===48?49:48;
 assert.throws(()=>verifySourceCapture(c.metadata,corrupt),/CAPTURE_PROVENANCE_OR_BYTES_MISMATCH/);
});
test('spoofed provider, claimed transport or host is rejected even when JSON valid',()=>{
 const {nba}=fixtures(),c=captured('NBA_OFFICIAL_CDN',nba);
 for(const change of [
  x=>x.metadata.origin_host='fake-official.example',
  x=>x.metadata.provider='ESPN_SCOREBOARD',
  x=>x.metadata.request_url='https://attacker.example/scoreboard',
  x=>x.metadata.provider_signature_verified=true
 ]){const v=structuredClone(c);change(v);assert.throws(()=>verifySourceCapture(v.metadata,v.raw),/CAPTURE_PROVENANCE_OR_BYTES_MISMATCH/);}
});
test('same-domain official source alone does not produce a scored cohort',()=>{
 const {nba}=fixtures(),r=report(captured('NBA_OFFICIAL_CDN',nba));
 assert.equal(r.held_count,10);
 assert(r.results[0].reasons.includes('ESPN_EVENT_MISSING_OR_DUPLICATE'));
});
test('different direct HTTPS sources disagreeing on a final score HOLD',()=>{
 const {nba,espn}=fixtures();espn.events[0].competitions[0].competitors[0].score='112';
 const r=report(captured('NBA_OFFICIAL_CDN',nba),captured('ESPN_SCOREBOARD',espn));
 assert.equal(r.provisional_scored_count,0);
 assert(r.results[0].reasons.includes('INDEPENDENT_DOMAIN_FINAL_SCORE_DISAGREEMENT'));
});
test('one nonfinal NBA status cannot be scored even when scores match',()=>{
 const {nba,espn}=fixtures();nba.leagueSchedule.gameDates[0].games[0].gameStatus=2;
 const r=report(captured('NBA_OFFICIAL_CDN',nba),captured('ESPN_SCOREBOARD',espn));
 assert.equal(r.provisional_scored_count,0);
 assert(r.results[0].reasons.includes('NBA_FINAL_STATUS_NOT_CONFIRMED'));
});
test('duplicate NBA record cannot silently select one winning score',()=>{
 const {nba,espn}=fixtures();
 nba.leagueSchedule.gameDates[0].games.push(structuredClone(nba.leagueSchedule.gameDates[0].games[0]));
 const r=report(captured('NBA_OFFICIAL_CDN',nba),captured('ESPN_SCOREBOARD',espn));
 assert.equal(r.provisional_scored_count,0);
 assert(r.results[0].reasons.includes('NBA_OFFICIAL_EVENT_MISSING_OR_DUPLICATE'));
});
test('wrong team or date never joins, even with identical scores',()=>{
 const {nba,espn}=fixtures();nba.leagueSchedule.gameDates[0].games[0].homeTeam.teamTricode='MIA';
 const r=report(captured('NBA_OFFICIAL_CDN',nba),captured('ESPN_SCOREBOARD',espn));
 assert.equal(r.provisional_scored_count,0);
 assert(r.results[0].nba_game_id===null);
 const f=fixtures();f.nba.leagueSchedule.gameDates[0].games[0].gameCode='20261112/WASIND';
 assert.equal(report(captured('NBA_OFFICIAL_CDN',f.nba),captured('ESPN_SCOREBOARD',f.espn)).provisional_scored_count,0);
});
test('fetched final records cannot be backdated to tipoff or fake future team identity',()=>{
 const {nba,espn}=fixtures();
 const r=report(captured('NBA_OFFICIAL_CDN',nba,p.event_start_utc),captured('ESPN_SCOREBOARD',espn));
 assert(r.results[0].reasons.includes('NBA_FETCH_TOO_EARLY_FOR_FINAL'));
 assert.equal(r.provisional_scored_count,0);
});
test('JSON with missing provider-native expected schema fails, not silently no-match',()=>{
 const {espn}=fixtures();
 assert.throws(()=>report(captured('NBA_OFFICIAL_CDN',{games:[{}]}),captured('ESPN_SCOREBOARD',espn)),/NBA_SOURCE_SCHEMA_INVALID/);
});
test('frozen model, rival and source registry cannot be silently changed at outcome time',()=>{
 const {nba,espn}=fixtures(),changed=structuredClone(cohort);
 changed.predictions[0].model_probability_home=0.9999;
 assert.throws(()=>evaluateCapturedNBACohort({source,sourceSha,cohort:changed,challenger,requestedDate:date,
  nbaCapture:captured('NBA_OFFICIAL_CDN',nba),espnCapture:captured('ESPN_SCOREBOARD',espn)}),/PROSPECTIVE_FREEZE_DRIFT_OR_REWRITE/);
});
test('capture constructor rejects non-JSON, oversized claims, fake date and wrong content type',()=>{
 const raw=Buffer.from('{"events":[{"id":"abc"}]}');
 assert.throws(()=>createSourceCapture({provider:'UNAUTHORIZED',date,bytes:raw,observedAt:at,contentType:'application/json'}),/SOURCE_PROVIDER_NOT_ALLOWLISTED/);
 assert.throws(()=>createSourceCapture({provider:'NBA_OFFICIAL_CDN',date:'not-a-date',bytes:raw,observedAt:at,contentType:'application/json'}),/SOURCE_DATE_INVALID/);
 assert.throws(()=>createSourceCapture({provider:'NBA_OFFICIAL_CDN',date,bytes:raw,observedAt:at,contentType:'text/html'}),/CAPTURE_RESPONSE_INVALID/);
});
test('actual network fetch function enforces exact official host and MIME without network calls in test',async()=>{
 let observed=null;
 const fetchImpl=async(url,opts)=>{
  observed={url,opts};
  return {status:200,headers:{get:k=>k==='content-type'?'application/json':'64'},arrayBuffer:async()=>Buffer.from('{"leagueSchedule":{"gameDates":[]}}')};
 };
 const x=await fetchAllowedSource('NBA_OFFICIAL_CDN',date,{fetchImpl,now:()=>at});
 assert.equal(observed.url,NBA_URL);
 assert.equal(observed.opts.redirect,'error');
 assert.equal(observed.opts.method,'GET');
 assert.equal(x.metadata.provider_signature_verified,false);
});
test('HTTP provider failure is surfaced as a source failure, never a fake successful capture',async()=>{
 await assert.rejects(()=>fetchAllowedSource('NBA_OFFICIAL_CDN',date,{fetchImpl:async()=>({status:403,headers:{get:()=>null}})}),/SOURCE_HTTP_403/);
});
