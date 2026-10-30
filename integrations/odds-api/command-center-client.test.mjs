import test from "node:test";
import assert from "node:assert/strict";
import {readDraftKingsResearch} from "./command-center-client.mjs";
const time="2026-10-29T23:59:47.562Z";
const data={ok:true,mode:"dk_odds",status:"FRESH_RESEARCH",data_as_of:time,execution_authority:false,human_final_gate_required:true,
 data:{contract:"ATLAS_DK_FIRST_SHADOW_V1",primary_book:"draftkings",execution_authority:false,
 events:[{provider_event_id:"odds-id",canonical_event_id:"bf74ff8e-2fbd-49cf-af50-0c3c4b43281a",identity_status:"LINKED_PENDING",away_team:"Cleveland Cavaliers",home_team:"Atlanta Hawks",commence_time:"2026-10-30T00:10:00Z",primary_quotes:[["h2h","home",null,-118],["spreads","home",-1.5,-105]]}]}};
function fake(body=data,status=200){return async()=>({status,ok:status>=200&&status<300,json:async()=>body});}
const base={runtimeUrl:"https://example.supabase.co/functions/v1/atlas-site-runtime",sessionHeaders:{Authorization:"Bearer existing-session"},now:Date.parse(time)+2000};
test("authorized DK mode returns canonical linked quote and no betting authority",async()=>{
 const x=await readDraftKingsResearch({...base,fetchImpl:fake()});
 assert.equal(x.status,"FRESH_RESEARCH");assert.equal(x.events.length,1);assert.equal(x.events[0].quotes[0].american_odds,-118);
 assert.equal(x.events[0].quotes[1].line,-1.5);assert.equal(x.events[0].identity_status,"LINKED_PENDING");
 assert.equal(x.executable,false);assert.equal(x.events[0].approved_bet,null);assert.equal(x.automatic_provider_requests,0);
});
test("only appends mode and uses existing session headers, no token in URL",async()=>{
 let call;const impl=async(u,opt)=>(call={u,opt},fake()());
 await readDraftKingsResearch({...base,fetchImpl:impl});const url=new URL(call.u);
 assert.equal(url.searchParams.get("mode"),"dk_odds");assert.equal(url.searchParams.get("apiKey"),null);
 assert.equal(call.opt.cache,"no-store");assert.equal(call.opt.headers.Authorization,"Bearer existing-session");
});
test("missing operator session fails before HTTP",async()=>{
 await assert.rejects(()=>readDraftKingsResearch({...base,sessionHeaders:{}}),/EXISTING_OPERATOR_SESSION_REQUIRED/);
});
test("anonymous or forbidden access never exposes quotes",async()=>{
 for(const status of [401,403]){
 const x=await readDraftKingsResearch({...base,fetchImpl:fake({},status)});
 assert.equal(x.status,"AUTH_REQUIRED");assert.equal(x.events.length,0);
 }
});
test("stale data server side or client side never displays live quotes",async()=>{
 const a=await readDraftKingsResearch({...base,fetchImpl:fake({...data,status:"STALE_REFERENCE"})});
 assert.equal(a.status,"STALE_OR_MISSING");assert.equal(a.events.length,0);
 const b=await readDraftKingsResearch({...base,fetchImpl:fake(),now:Date.parse(time)+1000*901});
 assert.equal(b.status,"STALE_OR_MISSING");
});
test("malformed provider contract or authority true is rejected",async()=>{
 const a=await readDraftKingsResearch({...base,fetchImpl:fake({...data,execution_authority:true})});
 assert.equal(a.status,"CONTRACT_REJECTED");
 const b=await readDraftKingsResearch({...base,fetchImpl:fake({...data,data:{...data.data,primary_book:"fanduel"}})});
 assert.equal(b.status,"CONTRACT_REJECTED");
});
