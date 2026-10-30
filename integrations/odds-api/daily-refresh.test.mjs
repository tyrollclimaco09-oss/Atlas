import test from "node:test";
import assert from "node:assert/strict";
import {authorized,normalizeDK,refresh} from "../../api/dk-refresh.js";
const now="2026-10-29T23:59:47.562Z";
const event={id:"b123d92eb8046e43fabf95a33a676634",away_team:"Cleveland Cavaliers",home_team:"Atlanta Hawks",commence_time:"2026-10-30T00:10:00Z",bookmakers:[{key:"draftkings",markets:[{key:"h2h",last_update:"2026-10-29T23:59:20Z",outcomes:[{name:"Atlanta Hawks",price:-118},{name:"Cleveland Cavaliers",price:-102}]}]}]};
const mapped=[{provider_event_id:event.id,event_id:"bf74ff8e-2fbd-49cf-af50-0c3c4b43281a"}];
const canonical=[{id:mapped[0].event_id,league:"NBA",away_team:event.away_team,home_team:event.home_team,start_time:"2026-10-30T00:00:00Z",reconciliation_status:"pending"}];
const env={SUPABASE_URL:"https://project.supabase.co",SUPABASE_SERVICE_ROLE_KEY:"service-private",THE_ODDS_API_KEY:"private-odds-key"};
function mock({existingLock=false,lastRemaining=454,feed=[event],duplicate=false}={}){
 const calls=[],response=(status,data,h={})=>({status,ok:status>=200&&status<300,headers:{get:k=>h[k]??null},json:async()=>data});
 return {calls,fetchImpl:async(url,opts={})=>{
   const u=String(url);calls.push({url:u.split("?")[0],method:opts.method||"GET"});
   if(u.includes("api.the-odds-api.com/v4/sports/?"))return response(200,[{key:"basketball_nba"}],{"x-requests-last":"0","x-requests-remaining":String(lastRemaining)});
   if(u.includes("api.the-odds-api.com"))return response(200,feed,{"x-requests-last":"3","x-requests-remaining":"451"});
   if(u.endsWith("/rest/v1/atlas_site_research_reports_v1")&&opts.method==="POST"){
     const row=JSON.parse(opts.body);
     if(row.delivery_key?.startsWith("atlas-dk-refresh-lock-"))return response(201,existingLock?[]:[{id:"lock"}]);
     return response(201,null);
   }
   if(u.includes("atlas_site_research_reports_v1?")&&opts.method==="PATCH")return response(204,null);
   if(u.includes("atlas_site_research_reports_v1?"))return response(200,[{delivery_key:"atlas-dk-refresh-lock-2026-10-28",body:JSON.stringify({remaining:lastRemaining,at:"2026-10-28T23:00:00Z"})}]);
   if(u.includes("provider_events?"))return response(200,mapped);
   if(u.includes("events?"))return response(200,canonical);
   throw Error("UNEXPECTED_URL_"+u.split("?")[0]);
 }};
}
test("cron bearer secret is mandatory, sufficiently long and exact",()=>{
 const secret="test-only-secret-with-at-least-32-characters";
 assert.equal(authorized("Bearer "+secret,secret),true);
 assert.equal(authorized("Bearer "+secret+"x",secret),false);
 assert.equal(authorized("Bearer "+secret,"short"),false);
 assert.equal(authorized("Bearer nope",undefined),false);
});
test("live market normalization is DK-only with pending canonical identity",()=>{
 const packet=normalizeDK([event],mapped,canonical,now);
 assert.equal(packet.events.length,1);assert.equal(packet.events[0].canonical_event_id,canonical[0].id);
 assert.equal(packet.events[0].identity_status,"LINKED_PENDING");
 assert.equal(packet.events[0].primary_quotes.length,2);
 assert.equal(packet.execution_authority,false);assert.equal(packet.approved_bet,null);
 assert.equal(packet.expected_value,null);assert.equal(packet.executable_price_verified,false);
});
test("without exact canonical teams no linked event is invented",()=>{
 const mismatch=normalizeDK([event],mapped,[{...canonical[0],home_team:"Other"}],now);
 assert.equal(mismatch.events[0].identity_status,"CONFLICT");
 assert.equal(mismatch.events[0].canonical_event_id,null);
});
test("duplicate market/side/line are excluded instead of picking favorable price",()=>{
 const e={...event,bookmakers:[{key:"draftkings",markets:[{key:"h2h",last_update:"2026-10-29T23:59:20Z",outcomes:[{name:"Atlanta Hawks",price:-118},{name:"Atlanta Hawks",price:-130}]}]}]};
 const x=normalizeDK([e],mapped,canonical,now);
 assert.equal(x.events[0].primary_quotes.length,0);
 assert(x.events[0].quarantined_count>0);
});
test("stale timestamp quarantines all outcomes without silently repairing",()=>{
 const e={...event,bookmakers:[{key:"draftkings",markets:[{key:"h2h",last_update:"2026-10-29T21:00:00Z",outcomes:[{name:"Atlanta Hawks",price:-118}]}]}]};
 const x=normalizeDK([e],mapped,canonical,now);
 assert.equal(x.events[0].primary_quotes.length,0);assert(x.events[0].quarantined_count>0);
});
test("one successful refresh reserves day, charges three credits and freezes research",async()=>{
 const m=mock();const out=await refresh({env,fetchImpl:m.fetchImpl,now});
 assert.equal(out.status,"SUCCESS");assert.equal(out.credits_spent,3);assert.equal(out.credits_remaining,451);
 assert.equal(out.events,1);assert.equal(out.quotes,2);assert.equal(out.linked,1);
 assert.equal(m.calls.filter(x=>x.url.includes("api.the-odds-api.com")).length,2);
 assert.equal(m.calls.filter(x=>x.url.endsWith("/sports/")).length,1);
 assert.equal(m.calls.filter(x=>x.method==="PATCH").length,1);
});
test("second run within same day never contacts the paid provider",async()=>{
 const m=mock({existingLock:true});const out=await refresh({env,fetchImpl:m.fetchImpl,now});
 assert.equal(out.status,"ALREADY_ATTEMPTED_TODAY");assert.equal(out.charged,0);
 assert.equal(m.calls.some(x=>x.url.includes("/basketball_nba/odds/")),false);
});
test("last known budget below reserve prevents a paid request",async()=>{
 const m=mock({lastRemaining:102});const out=await refresh({env,fetchImpl:m.fetchImpl,now});
 assert.equal(out.status,"QUOTA_RESERVE_BLOCKED");
 assert.equal(m.calls.some(x=>x.url.includes("/basketball_nba/odds/")),false);
});
test("missing protected runtime keys fails before any provider call",async()=>{
 const m=mock();await assert.rejects(()=>refresh({env:{},fetchImpl:m.fetchImpl,now}),/INTERNAL_ENV_NOT_CONFIGURED/);
 assert.equal(m.calls.length,0);
});
