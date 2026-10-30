import test from "node:test";
import assert from "node:assert/strict";
import {readUnifiedSlate} from "./unified-slate-client.mjs";
const DATE="2026-10-29",NOW="2026-10-30T00:00:00Z";
const CID="bf74ff8e-2fbd-49cf-af50-0c3c4b43281a";
const canonical={id:CID,event_date:DATE,league:"NBA",away_team:"Cleveland Cavaliers",home_team:"Atlanta Hawks",start_time:NOW,reconciliation_status:"pending"};
const packet={contract:"ATLAS_DK_FIRST_SHADOW_V1",primary_book:"draftkings",execution_authority:false,approved_bet:null,expected_value:null,
 observed_at:"2026-10-29T23:59:40Z",events:[{provider_event_id:"b123d92eb8046e43fabf95a33a676634",canonical_event_id:CID,
 away_team:canonical.away_team,home_team:canonical.home_team,commence_time:"2026-10-30T00:10:00Z",
 primary_quotes:[["h2h","home",null,-118,"2026-10-29T23:59:20Z"]]}]};
const response={ok:true,mode:"slate_sources",contract:"ATLAS_SLATE_SOURCES_READ_V1",slate_date:DATE,league:"NBA",
 execution_authority:false,human_final_gate_required:true,source_states:{draftkings:"FRESH_RESEARCH",flaim:"NO_SNAPSHOT",slate2:"CANONICAL_READ_ONLY"},
 canonical_events:[canonical],slate_candidates:[],odds_report:packet,flaim_packet:null};
const base={runtimeUrl:"https://atlas.supabase.co/functions/v1/atlas-site-runtime",sessionHeaders:{Authorization:"Bearer existing-operator-session"},
 slateDate:DATE,now:NOW};
const mock=(body=response,status=200)=>async()=>({status,ok:status>=200&&status<300,json:async()=>body});
test("one authenticated source read assembles one DK-priced canonical slate game",async()=>{
 const x=await readUnifiedSlate({...base,fetchImpl:mock()});
 assert.equal(x.status,"RESEARCH_SLATE_READY");assert.equal(x.events.length,1);
 assert.equal(x.totals.dk_reference_quotes,1);assert.equal(x.events[0].canonical_event_id,CID);
 assert.equal(x.events[0].prices[0].american_odds,-118);
 assert.equal(x.execution_authority,false);assert.equal(x.approved_bet,null);assert.equal(x.paid_api_requests,0);
});
test("all queries are scoped by slate date/league and authenticated existing runtime",async()=>{
 let captured;const f=async(url,opts)=>(captured={url,opts},mock()());
 await readUnifiedSlate({...base,fetchImpl:f});
 const u=new URL(captured.url);
 assert.equal(u.searchParams.get("mode"),"slate_sources");
 assert.equal(u.searchParams.get("slate_date"),DATE);
 assert.equal(u.searchParams.get("league"),"NBA");
 assert.equal(u.searchParams.get("apiKey"),null);
 assert.equal(captured.opts.cache,"no-store");
 assert.equal(captured.opts.headers.Authorization,"Bearer existing-operator-session");
});
test("no connected Flaim data does not block DK prices",async()=>{
 const x=await readUnifiedSlate({...base,fetchImpl:mock()});
 assert.equal(x.source_states.flaim,"NO_FLAIM_PACKET");
 assert.equal(x.totals.dk_reference_quotes,1);
});
test("missing operator identity cannot request data",async()=>{
 await assert.rejects(()=>readUnifiedSlate({...base,sessionHeaders:{},fetchImpl:mock()}),/ATLAS_OPERATOR_SESSION_REQUIRED/);
});
test("unauthorized site reader never returns slate",async()=>{
 const x=await readUnifiedSlate({...base,fetchImpl:mock({},401)});
 assert.equal(x.status,"AUTH_REQUIRED");assert.equal(x.events.length,0);
});
test("requesting stale DK status but receiving quotes is rejected",async()=>{
 const bad={...response,source_states:{...response.source_states,draftkings:"STALE_REFERENCE"}};
 const x=await readUnifiedSlate({...base,fetchImpl:mock(bad)});
 assert.equal(x.status,"CONTRACT_REJECTED");
});
test("reported stale snapshot with no data allows research-only, no odds",async()=>{
 const x=await readUnifiedSlate({...base,fetchImpl:mock({...response,source_states:{...response.source_states,draftkings:"STALE_REFERENCE"},odds_report:null})});
 assert.equal(x.status,"RESEARCH_SLATE_READY");assert.equal(x.totals.dk_reference_quotes,0);
 assert.equal(x.service_source_states.draftkings,"STALE_REFERENCE");
});
test("malformed runtime authority fails closed",async()=>{
 const x=await readUnifiedSlate({...base,fetchImpl:mock({...response,execution_authority:true})});
 assert.equal(x.status,"CONTRACT_REJECTED");
});
test("disagreeing response date/league cannot contaminate slate",async()=>{
 for(const body of [{...response,slate_date:"2026-10-28"},{...response,league:"NFL"}]){
 const x=await readUnifiedSlate({...base,fetchImpl:mock(body)});assert.equal(x.status,"CONTRACT_REJECTED");
 }
});
test("no tokens in host URL",async()=>{
 await assert.rejects(()=>readUnifiedSlate({...base,runtimeUrl:"https://abc.supabase.co/foo?key=secret",fetchImpl:mock()}),/RUNTIME_URL_NOT_CANONICAL/);
});

test("genuinely empty slate is labeled EMPTY_SLATE, not ready with invented events",async()=>{
 const x=await readUnifiedSlate({...base,fetchImpl:mock({...response,canonical_events:[],slate_candidates:[],odds_report:null,
   source_states:{...response.source_states,draftkings:"NO_SNAPSHOT"}})});
 assert.equal(x.status,"EMPTY_SLATE");assert.equal(x.events.length,0);assert.equal(x.totals.dk_reference_quotes,0);
});
