'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const c=require('node:crypto');
const bridge=require('../slate-sources.js');
const DAY='2026-10-29',NOW=Date.parse('2026-10-30T00:00:00Z'),CID='bf74ff8e-2fbd-49cf-af50-0c3c4b43281a';
const game={id:CID,league:'NBA',event_date:DAY,away_team:'Cleveland Cavaliers',home_team:'Atlanta Hawks',start_time:'2026-10-30T00:00:00Z',reconciliation_status:'pending'};
const odds={contract:'ATLAS_DK_FIRST_SHADOW_V1',primary_book:'draftkings',execution_authority:false,approved_bet:null,
 expected_value:null,observed_at:'2026-10-29T23:59:45Z',events:[{canonical_event_id:CID,
 away_team:game.away_team,home_team:game.home_team,commence_time:'2026-10-30T00:10:00Z',
 market_last_update:{h2h:'2026-10-29T23:59:25Z'},
 primary_quotes:[['h2h','home',null,-118],['h2h','away',null,-102]]}]};
const envelope={ok:true,mode:'slate_sources',contract:'ATLAS_SLATE_SOURCES_READ_V1',slate_date:DAY,league:'NBA',
 execution_authority:false,human_final_gate_required:true,paid_api_requests:0,
 source_states:{draftkings:'FRESH_RESEARCH',flaim:'NO_SNAPSHOT',slate2:'CANONICAL_READ_ONLY'},
 canonical_events:[game],slate_candidates:[],odds_report:odds,flaim_packet:null};
const fetcher=(body=envelope,status=200)=>async()=>({status,ok:status>=200&&status<300,json:async()=>body});
const base={slateDate:DAY,league:'NBA',now:NOW,
 getSessionHeaders:async()=>({Authorization:'Bearer existing-operator-session',apikey:'public-browser-key'})};
test('original site uses one fixed protected ATLAS endpoint',()=>{
 assert.equal(bridge.ENDPOINT,'https://lhliqbbooproqtslmgqi.supabase.co/functions/v1/atlas-site-runtime');
});
test('one authenticated source read gets two fresh DraftKings references',async()=>{
 const x=await bridge.read({...base,transport:fetcher()});
 assert.equal(x.status,'RESEARCH_ONLY');assert.equal(x.counts.canonical_events,1);
 assert.equal(x.counts.dk_quotes,2);assert.equal(x.events[0].identity_status,'CANONICAL_PENDING');
 assert.equal(x.events[0].dk_quotes[0].american_odds,-118);
 assert.equal(x.execution_authority,false);assert.equal(x.approved_bet,null);
});
test('provider and client do not perform paid refresh on page load',async()=>{
 let opts,u;const mock=async(url,options)=>(opts=options,u=url,fetcher()());
 await bridge.read({...base,transport:mock});
 assert.equal(opts.method,'GET');assert.equal(opts.cache,'no-store');
 assert.equal(opts.headers.Authorization,'Bearer existing-operator-session');
 assert.equal(new URL(u).searchParams.get('mode'),'slate_sources');
 assert.equal(new URL(u).searchParams.get('slate_date'),DAY);
 assert.equal(new URL(u).searchParams.get('apiKey'),null);
 assert.equal(new URL(u).searchParams.get('token'),null);
});
test('no credentials is blocked before network',async()=>{
 let calls=0;
 const x=await bridge.read({...base,getSessionHeaders:null,transport:()=>{calls++}});
 assert.equal(x.status,'OPERATOR_CONNECTION_REQUIRED');assert.equal(calls,0);
});
test('unauthorized response contains zero quotes',async()=>{
 const x=await bridge.read({...base,transport:fetcher({},401)});
 assert.equal(x.status,'UNAUTHORIZED');assert.equal(x.events.length,0);
});
test('invalid date and unsupported sport are not fetched',async()=>{
 let n=0;const t=()=>{n++};
 for(const opts of [{slateDate:'2026-02-30'},{league:'WNBA'}]){
  const x=await bridge.read({...base,...opts,transport:t});
  assert.equal(x.status,'INVALID_SCOPE');
 }
 assert.equal(n,0);
});
test('live source unavailable cannot be mistaken for real slate',async()=>{
 const x=await bridge.read({...base,transport:fetcher({},503)});
 assert.equal(x.status,'SOURCE_UNAVAILABLE');
});
test('degraded stale report never renders quote references',async()=>{
 const x=bridge.normalize({...envelope,source_states:{...envelope.source_states,draftkings:'STALE_REFERENCE'},odds_report:null},{slateDate:DAY,league:'NBA',now:NOW});
 assert.equal(x.counts.dk_quotes,0);assert.equal(x.events.length,1);
});
test('locally expired report is discarded even if server labels it current',()=>{
 const stale={...odds,observed_at:'2026-10-29T20:00:00Z'};
 const x=bridge.normalize({...envelope,odds_report:stale},{slateDate:DAY,league:'NBA',now:NOW});
 assert.equal(x.source_states.draftkings,'STALE_OR_INVALID_CLIENT');assert.equal(x.counts.dk_quotes,0);
});
test('old quote within new report excluded on market-level timestamp',()=>{
 const copy=JSON.parse(JSON.stringify(odds));
 copy.events[0].market_last_update.h2h='2026-10-29T21:00:00Z';
 const x=bridge.normalize({...envelope,odds_report:copy},{slateDate:DAY,league:'NBA',now:NOW});
 assert.equal(x.counts.dk_quotes,0);
});
test('market conflict quarantines both values for that identity',()=>{
 const copy=JSON.parse(JSON.stringify(odds));
 copy.events[0].primary_quotes.push(['h2h','home',null,-121]);
 const x=bridge.normalize({...envelope,odds_report:copy},{slateDate:DAY,league:'NBA',now:NOW});
 assert.equal(x.counts.dk_quotes,1);assert(x.events[0].dk_quotes.every(q=>q.selection!=='home'));
});
test('unknown event ID cannot adopt an unrelated canonical game',()=>{
 const copy=JSON.parse(JSON.stringify(odds));copy.events[0].canonical_event_id=null;
 const x=bridge.normalize({...envelope,odds_report:copy},{slateDate:DAY,league:'NBA',now:NOW});
 assert.equal(x.counts.dk_quotes,0);
});
test('incorrect teams and >15 minute tip offsets are never joined',()=>{
 for(const patch of [{home_team:'Boston Celtics'},{commence_time:'2026-10-30T02:00:00Z'}]){
  const copy=JSON.parse(JSON.stringify(odds));Object.assign(copy.events[0],patch);
  const x=bridge.normalize({...envelope,odds_report:copy},{slateDate:DAY,league:'NBA',now:NOW});
  assert.equal(x.counts.dk_quotes,0);
 }
});
test('cannot falsify the Final Gate with a server payload',()=>{
 const x=bridge.normalize({...envelope,execution_authority:true},{slateDate:DAY,league:'NBA',now:NOW});
 assert.equal(x.status,'CONTRACT_REJECTED');
});
test('empty actual slate stays empty and never invents players',()=>{
 const x=bridge.normalize({...envelope,canonical_events:[],slate_candidates:[],odds_report:null,source_states:{draftkings:'NO_SNAPSHOT',flaim:'NO_SNAPSHOT'}},{slateDate:DAY,league:'NBA',now:NOW});
 assert.equal(x.status,'RESEARCH_ONLY');assert.equal(x.events.length,0);assert.equal(x.counts.dk_quotes,0);
});
test('candidate count uses real canonical event UUID, not name-only match',()=>{
 const incoming={...envelope,slate_candidates:[{candidate_key:'SHADOW:a',event_id:CID,league:'NBA'},{candidate_key:'SHADOW:b',event_id:'bogus',league:'NBA'}]};
 const x=bridge.normalize(incoming,{slateDate:DAY,league:'NBA',now:NOW});
 assert.equal(x.counts.native_candidates,1);
});
test('no localStorage, sessionStorage or credential persistence in new adapter',()=>{
 const code=fs.readFileSync(path.resolve(__dirname,'../slate-sources.js'),'utf8');
 assert.equal(/\blocalStorage\b|\bsessionStorage\b|document\.cookie/.test(code),false);
 assert.equal(code.includes('getSessionHeaders'),true);
 assert.equal(code.includes('innerHTML'),false);
});
test('original five served JS/CSS files match original recorded hashes',()=>{
 const provenance=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../SOURCE_PROVENANCE.json'),'utf8'));
 const files=provenance.files.filter(f=>f.recoveredFile!=='index.html');
 assert.equal(files.length,5);
 for(const file of files){
  const bytes=fs.readFileSync(path.resolve(__dirname,'..',file.recoveredFile));
  const hash=c.createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash,file.originalSha256,file.recoveredFile+' changed unexpectedly');
 }
});
test('original run slate button stays present and read-only UI panel has unique ids',()=>{
 const html=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
 assert(html.includes('id="continue-slate"'));assert(html.includes('id="slate-source-refresh"'));
 assert.equal((html.match(/id="slate-sources"/g)||[]).length,1);
 assert.equal((html.match(/src="slate-sources.js"/g)||[]).length,1);
 assert(html.includes('id="canonical-resume"'));
});

const flaimLead={contract:'ATLAS_FLAIM_SCOUT_SHADOW_V1',status:'FANTASY_SIGNAL_ONLY',
 execution_authority:false,player:'Example Player',professional_team:'Atlanta Hawks',
 source:{system:'FLAIM_FANTASY',signal_kind:'fantasy_add',observed_at:'2026-10-29T23:40:00Z'},
 verification:{professional_fact_verified:false}};
const flaimPacket={contract:'ATLAS_FLAIM_SCOUT_SHADOW_V1',status:'FANTASY_LEADS_UNVERIFIED',
 execution_authority:false,approved_bet:null,observed_at:'2026-10-29T23:50:00Z',scout_leads:[flaimLead]};
const withFlaim=(packet=flaimPacket)=>({...envelope,
 source_states:{...envelope.source_states,flaim:'FRESH_RESEARCH'},flaim_packet:packet});
test('live Flaim fantasy signal joins exact team as lead only',()=>{
 const x=bridge.normalize(withFlaim(),{slateDate:DAY,league:'NBA',now:NOW});
 assert.equal(x.counts.fantasy_leads,1);
 assert.equal(x.events[0].fantasy_leads[0].player,'Example Player');
 assert.equal(x.events[0].fantasy_leads[0].professional_status_verified,false);
 assert.equal(x.events[0].fantasy_leads[0].independent_official_source_required,true);
 assert.equal(x.approved_bet,null);
});
test('a source-claimed verified pro injury cannot be laundered through Flaim',()=>{
 const packet={...flaimPacket,scout_leads:[{...flaimLead,verification:{professional_fact_verified:true}}]};
 const x=bridge.normalize(withFlaim(packet),{slateDate:DAY,league:'NBA',now:NOW});
 assert.equal(x.counts.fantasy_leads,0);assert.equal(x.counts.dk_quotes,2);
});
test('mismatched pro team cannot join by a fantasy signal',()=>{
 const packet={...flaimPacket,scout_leads:[{...flaimLead,professional_team:'Other Team'}]};
 const x=bridge.normalize(withFlaim(packet),{slateDate:DAY,league:'NBA',now:NOW});
 assert.equal(x.counts.fantasy_leads,0);
});
test('stale fantasy packet cannot block current DK prices',()=>{
 const packet={...flaimPacket,observed_at:'2026-10-25T23:50:00Z'};
 const x=bridge.normalize(withFlaim(packet),{slateDate:DAY,league:'NBA',now:NOW});
 assert.equal(x.counts.fantasy_leads,0);
 assert.equal(x.counts.dk_quotes,2);
 assert.equal(x.source_states.flaim,'INVALID_OR_STALE_CLIENT');
});
test('sensitive private fantasy fields never leave normalized data',()=>{
 const dirty={...flaimPacket,raw_owner_secret:'should_never_copy',scout_leads:[{...flaimLead,owner_name:'private_person',
  credentials:'private_credential',private_note:'private_note'}]};
 const x=bridge.normalize(withFlaim(dirty),{slateDate:DAY,league:'NBA',now:NOW});
 const out=JSON.stringify(x);
 assert.equal(x.counts.fantasy_leads,1);
 assert(!out.includes('private_person'));assert(!out.includes('private_credential'));assert(!out.includes('should_never_copy'));
});
test('replayed duplicate fantasy lead is shown once only',()=>{
 const packet={...flaimPacket,scout_leads:[flaimLead,flaimLead]};
 const x=bridge.normalize(withFlaim(packet),{slateDate:DAY,league:'NBA',now:NOW});
 assert.equal(x.counts.fantasy_leads,1);
});
