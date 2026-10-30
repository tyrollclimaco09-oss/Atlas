import test from "node:test";
import assert from "node:assert/strict";
import {assembleUnifiedSlate,CONTRACT} from "./unified-source-board.mjs";
const NOW="2026-10-30T00:00:00.000Z",DATE="2026-10-29";
const CID="bf74ff8e-2fbd-49cf-af50-0c3c4b43281a",EID="b123d92eb8046e43fabf95a33a676634";
const canonical={id:CID,event_date:DATE,league:"NBA",away_team:"Cleveland Cavaliers",home_team:"Atlanta Hawks",
  start_time:"2026-10-30T00:00:00Z",reconciliation_status:"pending",provider_event_id:EID};
const oddsEvent={provider_event_id:EID,canonical_event_id:CID,away_team:canonical.away_team,home_team:canonical.home_team,
  commence_time:"2026-10-30T00:10:00Z",identity_status:"LINKED_PENDING",
  market_last_update:{h2h:"2026-10-29T23:59:25Z",totals:"2026-10-29T23:59:22Z"},
  primary_quotes:[["h2h","home",null,-118],["h2h","away",null,-102],["totals","Over",237.5,-112]]};
const oddsReport={delivery_key:"atlas-dk-odds-shadow-demo",truth_label:"RESEARCH_ONLY",body:JSON.stringify({
 contract:"ATLAS_DK_FIRST_SHADOW_V1",primary_book:"draftkings",execution_authority:false,approved_bet:null,expected_value:null,
 observed_at:"2026-10-29T23:59:40Z",events:[oddsEvent]})};
const base=(x={})=>assembleUnifiedSlate({slateDate:DATE,canonicalEvents:[canonical],oddsReport,now:NOW,...x});
const candidate={candidate_key:"SHADOW:fixture",league:"NBA",event_id:CID,contract_status:"DEGRADED",
 blocker_codes:["NO_OFFICIAL_INJURY"],lifecycle_status:"WATCH",source_claim_count:0};
const signal={contract:"ATLAS_FLAIM_SCOUT_SHADOW_V1",status:"FANTASY_SIGNAL_ONLY",execution_authority:false,
 player:"Sample Player",professional_team:"Atlanta Hawks",
 source:{system:"FLAIM_FANTASY",signal_kind:"fantasy_add",observed_at:"2026-10-29T23:45:00Z"},
 verification:{professional_fact_verified:false}};
const flaim={contract:"ATLAS_FLAIM_SCOUT_SHADOW_V1",observed_at:"2026-10-29T23:50:00Z",
 execution_authority:false,approved_bet:null,status:"FANTASY_LEADS_UNVERIFIED",scout_leads:[signal]};
test("real DK snapshot and canonical event consolidate without creating duplicate games",()=>{
 const x=base();assert.equal(x.contract,CONTRACT);assert.equal(x.events.length,1);
 assert.equal(x.events[0].canonical_event_id,CID);assert.equal(x.events[0].identity_status,"LINKED_PENDING");
 assert.equal(x.totals.dk_reference_quotes,3);assert.equal(x.source_states.draftkings,"DK_REFERENCE_CURRENT");
 assert.equal(x.events[0].prices[0].book,"DraftKings");
});
test("human Final Gate and null probability stay invariant",()=>{
 const x=base();assert.equal(x.execution_authority,false);assert.equal(x.human_final_gate_required,true);
 assert.equal(x.approved_bet,null);assert.equal(x.expected_value,null);assert.equal(x.independent_fair_probability,null);
 assert.equal(x.executable_price_verified,false);assert.equal(x.paid_api_requests,0);
});
test("stale stored DK report is never presented with current odds",()=>{
 const x=base({now:"2026-10-30T03:00:00Z",includePast:true});
 assert.equal(x.source_states.draftkings,"DK_SNAPSHOT_STALE");
 assert.equal(x.totals.dk_reference_quotes,0);
 assert.equal(x.events[0].research_state,"WATCH_MISSING_FRESH_DK");
});
test("missing DK is watch, not an invented market quote",()=>{
 const x=base({oddsReport:null});
 assert.equal(x.events[0].prices.length,0);assert.equal(x.source_states.draftkings,"NO_DK_SNAPSHOT");
});
test("invalid trusted label blocks provider content",()=>{
 const x=base({oddsReport:{...oddsReport,truth_label:"EXECUTABLE"}});
 assert.equal(x.source_states.draftkings,"DK_SNAPSHOT_INVALID");assert.equal(x.totals.dk_reference_quotes,0);
});
test("price source with execution authority or fair EV is invalid",()=>{
 const v=JSON.parse(oddsReport.body);v.execution_authority=true;
 const x=base({oddsReport:{...oddsReport,body:JSON.stringify(v)}});
 assert.equal(x.source_states.draftkings,"DK_SNAPSHOT_INVALID");
 v.execution_authority=false;v.expected_value=0.2;
 assert.equal(base({oddsReport:{...oddsReport,body:JSON.stringify(v)}}).source_states.draftkings,"DK_SNAPSHOT_INVALID");
});
test("same market side line duplicate is quarantined rather than cherry-picked",()=>{
 const x=JSON.parse(oddsReport.body);x.events[0].primary_quotes.push(["h2h","home",null,-135]);
 const board=base({oddsReport:{...oddsReport,body:JSON.stringify(x)}});
 assert.equal(board.events[0].prices.length,2);
 assert(board.events[0].prices.every(q=>q.selection!=="home"));
});
test("market timestamp missing or stale blocks that quote",()=>{
 const raw=JSON.parse(oddsReport.body);
 raw.events[0].market_last_update.h2h="2026-10-29T20:00:00Z";
 const x=base({oddsReport:{...oddsReport,body:JSON.stringify(raw)}});
 assert.equal(x.totals.dk_reference_quotes,1);assert.equal(x.events[0].prices[0].market,"totals");
});
test("provider event with unknown canonical ID stays research unmapped",()=>{
 const raw=JSON.parse(oddsReport.body);raw.events[0].canonical_event_id=null;
 const x=base({oddsReport:{...oddsReport,body:JSON.stringify(raw)}});
 assert.equal(x.events.length,2);
 assert(x.events.some(e=>e.identity_status==="PROVIDER_UNMAPPED"&&e.canonical_event_id===null&&e.prices.length===3));
 assert(x.events.some(e=>e.canonical_event_id===CID&&e.prices.length===0));
});
test("provider to canonical mismatch cannot borrow the canonical ID",()=>{
 const raw=JSON.parse(oddsReport.body);raw.events[0].home_team="Boston Celtics";
 const x=base({oddsReport:{...oddsReport,body:JSON.stringify(raw)}});
 assert.equal(x.events.filter(e=>e.identity_status==="PROVIDER_UNMAPPED").length,1);
});
test("provider 1-hour start time mismatch is rejected",()=>{
 const raw=JSON.parse(oddsReport.body);raw.events[0].commence_time="2026-10-30T01:00:00Z";
 const x=base({oddsReport:{...oddsReport,body:JSON.stringify(raw)}});
 assert.equal(x.events.filter(e=>e.identity_status==="PROVIDER_UNMAPPED").length,1);
});
test("existing slate2 candidate matches exact verified canonical UUID only",()=>{
 const x=base({candidates:[candidate]});assert.equal(x.totals.candidates_attached,1);
 assert.equal(x.events[0].candidates[0].contract_status,"DEGRADED");
 assert.equal(x.events[0].candidates[0].approved_bet,null);
 assert.equal(x.events[0].candidates[0].provenance_accepted,false);
});
test("unmatched slate candidate retained for investigation, never silently attached",()=>{
 const x=base({candidates:[{...candidate,event_id:"40d74ad1-7fcb-48db-9a70-11cad4a3f05f"}]});
 assert.equal(x.totals.candidates_attached,0);assert.equal(x.totals.unattached_candidates,1);
});
test("other league candidate cannot pollute NBA board",()=>{
 const x=base({candidates:[{...candidate,league:"MLB"}]});assert.equal(x.totals.candidates_attached,0);
});
test("without Flaim packet, only Flaim slot is unavailable; DK still works",()=>{
 const x=base({flaimPacket:null});assert.equal(x.source_states.flaim,"NO_FLAIM_PACKET");
 assert.equal(x.totals.dk_reference_quotes,3);assert.equal(x.totals.fantasy_leads,0);
});
test("Flaim unconnected is a truthful negative source status",()=>{
 const packet={contract:"ATLAS_FLAIM_SCOUT_SHADOW_V1",execution_authority:false,approved_bet:null,status:"BLOCKED_NO_CONNECTED_LEAGUES",scout_leads:[],observed_at:NOW};
 const x=base({flaimPacket:packet});assert.equal(x.source_states.flaim,"FLAIM_LEAGUES_UNCONNECTED");
 assert.equal(x.totals.fantasy_leads,0);
});
test("one fresh Flaim signal is independent research lead, not injury verification",()=>{
 const x=base({flaimPacket:flaim});assert.equal(x.totals.fantasy_leads,1);
 assert.equal(x.events[0].flaim_leads[0].professional_fact_verified,false);
 assert(x.events[0].required_checks.includes("VERIFY_FANTASY_LEAD_WITH_OFFICIAL_REPORT"));
});
test("abbreviated pro team not guessed from unsupported Flaim codes",()=>{
 const raw={...flaim,scout_leads:[{...signal,professional_team:"ATL"}]};
 const x=base({flaimPacket:raw});assert.equal(x.totals.fantasy_leads,0);
});
test("forged confirmed professional fantasy claim is not imported",()=>{
 const raw={...flaim,scout_leads:[{...signal,verification:{professional_fact_verified:true}}]};
 const x=base({flaimPacket:raw});assert.equal(x.totals.fantasy_leads,0);
});
test("Flaim stale observation cannot be replayed",()=>{
 const raw={...flaim,observed_at:"2026-10-25T23:50:00Z"};
 const x=base({flaimPacket:raw});
 assert.equal(x.source_states.flaim,"FLAIM_PACKET_STALE");assert.equal(x.totals.fantasy_leads,0);
});
test("only dated NBA event belongs on requested slate",()=>{
 const x=base({slateDate:"2026-10-30"});assert.equal(x.events.length,0);
});
test("malformed caller inputs fail closed",()=>{
 assert.throws(()=>assembleUnifiedSlate({slateDate:"tomorrow"}),/SLATE_INPUT_INVALID/);
 assert.throws(()=>assembleUnifiedSlate({slateDate:DATE,league:"MLB"}),/SLATE_INPUT_INVALID/);
});
