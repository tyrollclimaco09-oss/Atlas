import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createSourceCapture,verifySourceCapture,fetchAllowedSource,parseNBAWebHTML} from './direct-source-capture.mjs';
import {nbaWebGames,evaluateCapturedNBACohort} from './direct-outcome-join.mjs';
import {readSourceWithBlob} from './prospective-source-freeze.mjs';
const root=new URL('./fixtures/',import.meta.url);
const {snapshot:source,source_git_blob_sha:sourceSha}=readSourceWithBlob(fileURLToPath(new URL('nba-connected-prestart-20261111.json',root)));
const cohort=JSON.parse(readFileSync(new URL('nba-prospective-forecast-freeze-20261111.json',root),'utf8'));
const challenger=JSON.parse(readFileSync(new URL('nba-record-challenger-freeze-20261111.json',root),'utf8'));
const officialEvidence={
 capture_date:'2026-11-10',
 raw_archive_run:43060708584,
 raw_original_sha256:'bf091956cb755ed9ab2731a707dcbea2f188d38d0450381dc0dd585742982500',
 note:'Fixture models actual Nov 10 observed cardData fields from raw archived HTML; this compact fixture is a reconstructed test wrapper, NOT raw original bytes.'
};
const known=[
 ['0022600211','MIL','NYK',85,117,'2026-11-11T00:30:00Z'],
 ['0022600212','BOS','PHI',123,101,'2026-11-11T01:00:00Z'],
 ['0022600213','LAC','PHX',110,133,'2026-11-11T02:00:00Z'],
 ['0022600214','MIA','UTA',115,109,'2026-11-11T02:00:00Z'],
 ['0022600215','ORL','SAC',107,100,'2026-11-11T03:00:00Z'],
 ['0022600216','OKC','POR',103,123,'2026-11-11T04:00:00Z']
];
const data=(date,games)=>({query:{date},props:{pageProps:{hasError:false,gameCardFeed:{modules:[{cards:games.map(g=>({cardData:g}))}]}}}});
const card=(id,away,home,away_score,home_score,time,status=3)=>({
 gameId:id,gameTimeUtc:time,gameStatus:status,gameStatusText:status===3?'Final':'Live',
 homeTeam:{teamTricode:home,score:home_score},awayTeam:{teamTricode:away,score:away_score}
});
const html=val=>Buffer.from('<!DOCTYPE html><html><head></head><body><script id="__NEXT_DATA__" type="application/json">'+JSON.stringify(val)+'</script></body></html>');
const capture=(val,date='2026-11-10',observedAt='2026-11-11T12:00:00Z')=>
 createSourceCapture({provider:'NBA_OFFICIAL_WEB',date,bytes:html(val),observedAt,contentType:'text/html; charset=utf-8'});
test('raw archived official Nov10 sample is traceably represented by six actual source-shape fixture rows',()=>{
 assert.equal(officialEvidence.raw_archive_run,43060708584);
 assert.equal(officialEvidence.raw_original_sha256.length,64);
 const c=capture(data('2026-11-10',known.map(x=>card(...x))));
 const parsed=verifySourceCapture(c.metadata,c.raw);
 const games=nbaWebGames(parsed,'2026-11-10');
 assert.equal(games.length,6);
 assert.equal(games[0].id,'0022600211');
 assert.equal(games[0].away,'MIL');
 assert.equal(games[0].home,'NYK');
 assert.equal(games[0].away_score,85);
 assert.equal(games[0].home_score,117);
 assert.equal(games.at(-1).away,'OKC');
 assert.equal(games.at(-1).home_score,123);
 assert.equal(c.metadata.provider_signature_verified,false);
});
test('official NBA web capture has exact allowlisted www.nba.com date path, real TLS requirement',()=>{
 const c=capture(data('2026-11-10',[card(...known[0])]));
 assert.equal(c.metadata.request_url,'https://www.nba.com/games?date=2026-11-10');
 assert.equal(c.metadata.origin_host,'www.nba.com');
 assert.equal(c.metadata.transport,'HTTPS_TLS_VALIDATED_BY_NODE_FETCH');
 assert.match(c.metadata.sha256,/^[a-f0-9]{64}$/);
});
test('wrong requested date and forged schema reject even if URL looks official',()=>{
 const htmlWrong=html(data('2026-11-09',[card(...known[0])]));
 assert.throws(()=>createSourceCapture({provider:'NBA_OFFICIAL_WEB',date:'2026-11-10',bytes:htmlWrong,
  observedAt:'2026-11-11T12:00:00Z',contentType:'text/html'}),/NBA_WEB_DATE_OR_GAME_FEED_INVALID/);
 assert.throws(()=>parseNBAWebHTML(Buffer.from('<html>official</html>'),'2026-11-10'),/NBA_WEB_NEXT_DATA_MISSING_OR_AMBIGUOUS/);
});
test('reused URL but mutated HTML bytes cannot pass original source hash',()=>{
 const c=capture(data('2026-11-10',[card(...known[0])]));const bytes=Buffer.from(c.raw);
 bytes[bytes.length-15]=bytes[bytes.length-15]===48?49:48;
 assert.throws(()=>verifySourceCapture(c.metadata,bytes),/CAPTURE_PROVENANCE_OR_BYTES_MISMATCH/);
});
test('synthetic Nov11 two-feed result matching can score provisionally but has zero calibration authority',()=>{
 const p=cohort.predictions[0];
 const page=data('2026-11-11',[card('0022600301',p.away_team,p.home_team,99,111,p.event_start_utc)]);
 const n=capture(page,'2026-11-11','2026-11-12T12:00:00Z');
 const e={events:[{id:'4012613301',date:p.event_start_utc,status:{type:{completed:true,state:'post'}},
  competitions:[{competitors:[
   {homeAway:'home',team:{abbreviation:p.home_team},score:'111'},
   {homeAway:'away',team:{abbreviation:p.away_team},score:'99'}]}]}]};
 const ec=createSourceCapture({provider:'ESPN_SCOREBOARD',date:'2026-11-11',bytes:Buffer.from(JSON.stringify(e)),
  observedAt:'2026-11-12T12:01:00Z',contentType:'application/json'});
 const r=evaluateCapturedNBACohort({source,sourceSha,cohort,challenger,requestedDate:'2026-11-11',
  nbaWebCapture:n,espnCapture:ec});
 assert.equal(r.provisional_scored_count,1);
 assert.equal(r.held_count,9);
 assert.equal(r.official_authenticated_production_cases,0);
 assert.equal(r.provider_digital_signatures_present,false);
 assert.equal(r.results[0].final.home_won,1);
});
test('synthetic NBA webpage still upcoming leaves every game held, even when ESPN says final',()=>{
 const p=cohort.predictions[0];
 const page=data('2026-11-11',[card('0022600301',p.away_team,p.home_team,99,111,p.event_start_utc,1)]);
 const n=capture(page,'2026-11-11','2026-11-12T12:00:00Z');
 const e={events:[{id:'4012613301',date:p.event_start_utc,status:{type:{completed:true,state:'post'}},
  competitions:[{competitors:[
   {homeAway:'home',team:{abbreviation:p.home_team},score:'111'},
   {homeAway:'away',team:{abbreviation:p.away_team},score:'99'}]}]}]};
 const ec=createSourceCapture({provider:'ESPN_SCOREBOARD',date:'2026-11-11',bytes:Buffer.from(JSON.stringify(e)),
  observedAt:'2026-11-12T12:01:00Z',contentType:'application/json'});
 const r=evaluateCapturedNBACohort({source,sourceSha,cohort,challenger,requestedDate:'2026-11-11',nbaWebCapture:n,espnCapture:ec});
 assert.equal(r.provisional_scored_count,0);
 assert(r.results[0].reasons.includes('NBA_FINAL_STATUS_NOT_CONFIRMED'));
});
test('only a real exact-date NBA homepage is fetchable by this provider role, no arbitrary URLs',async()=>{
 let called=null;
 await fetchAllowedSource('NBA_OFFICIAL_WEB','2026-11-10',{
  fetchImpl:async(url,o)=>{called={url,o};return {status:200,headers:{get:k=>k==='content-type'?'text/html':'1024'},
    arrayBuffer:async()=>html(data('2026-11-10',[card(...known[0])]))};},
  now:()=> '2026-11-11T12:00:00Z'
 });
 assert.equal(called.url,'https://www.nba.com/games?date=2026-11-10');
 assert.equal(called.o.redirect,'error');
 assert.equal(called.o.headers.Accept,'text/html');
});
