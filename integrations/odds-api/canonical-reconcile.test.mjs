import test from "node:test";
import assert from "node:assert/strict";
import {reconcileCanonical} from "./canonical-reconcile.mjs";
const PROVIDER="3b9f6438-22c9-4ed7-992e-59a54e7bcc11",CID="f9dc5758-bd63-4948-8446-b73de660f1ea";
const PE="b123d92eb8046e43fabf95a33a676634";
const event={id:CID,league:"NBA",away_team:"Cleveland Cavaliers",home_team:"Atlanta Hawks",start_time:"2026-10-30T00:00:00Z",reconciliation_status:"reconciled"};
const packet={events:[{provider_event_id:PE,away_team:event.away_team,home_team:event.home_team,commence_time:"2026-10-30T00:10:00Z",primary_quotes:[{bookmaker:"draftkings",american_odds:-118}]}],execution_authority:false};
const binding={provider_id:PROVIDER,provider_event_id:PE,event_id:CID};
const call=(opts={})=>reconcileCanonical({packet,events:[event],bindings:[binding],providerId:PROVIDER,...opts});
test("exact provider binding + names + 10m start window links canonical UUID",()=>{
 const r=call();assert.equal(r.events[0].canonical_event_id,CID);assert.equal(r.events[0].identity_status,"RECONCILED");assert.equal(r.events[0].tip_delta_minutes,10);
 assert.equal(r.execution_authority,false);assert.equal(r.events[0].canonical_reference_only,true);
});
test("unbound external event is not assigned arbitrary UUID",()=>{
 const r=call({bindings:[]});assert.equal(r.events[0].canonical_event_id,null);assert.equal(r.events[0].identity_status,"UNMAPPED");
});
test("missing canonical event target quarantined as conflict",()=>{
 const r=call({events:[]});assert.equal(r.events[0].identity_status,"CONFLICT");assert.equal(r.events[0].canonical_event_id,null);
});
test("wrong sportsbook provider binding does not match",()=>{
 const r=call({bindings:[{...binding,provider_id:"other"}]});assert.equal(r.events[0].identity_status,"UNMAPPED");
});
test("same team names but swapped home-away is never matched",()=>{
 const r=call({events:[{...event,away_team:event.home_team,home_team:event.away_team}]});assert.equal(r.events[0].identity_status,"CONFLICT");assert.equal(r.events[0].identity_reason,"LEAGUE_OR_TEAM_MISMATCH");
});
test("league non-NBA must not match",()=>assert.equal(call({events:[{...event,league:"WNBA"}]}).events[0].identity_status,"CONFLICT"));
test("time difference >15m is a real conflict",()=>{
 const r=call({events:[{...event,start_time:"2026-10-29T23:00:00Z"}]});
 assert.equal(r.events[0].identity_status,"CONFLICT");assert.equal(r.events[0].identity_reason,"TIP_TIME_MISMATCH");
});
test("pending canonical event is linked but never fully reconciled",()=>{
 const r=call({events:[{...event,reconciliation_status:"pending"}]});
 assert.equal(r.events[0].identity_status,"LINKED_PENDING");assert.equal(r.requires_event_id_reconciliation,true);
});
test("duplicate conflicting provider mappings fail closed",()=>{
 const r=call({bindings:[binding,{...binding,event_id:"35b0b5ca-c76c-4b23-80ce-b92b5d2e3147"}]});
 assert.equal(r.events[0].identity_status,"CONFLICT");assert.equal(r.events[0].canonical_event_id,null);
});
test("unknown time is a conflict, no guess",()=>{
 const r=call({events:[{...event,start_time:null}]});
 assert.equal(r.events[0].identity_status,"CONFLICT");
});
test("preserve every DK quote and null prediction fields",()=>{
 const r=call();assert.deepEqual(r.events[0].primary_quotes,packet.events[0].primary_quotes);
 assert.equal(r.approved_bet,null);assert.equal(r.independent_fair_probability,null);assert.equal(r.expected_value,null);
});
test("invalid input fails instead of repairing",()=>{
 assert.throws(()=>reconcileCanonical({packet:null,providerId:PROVIDER}),/RESEARCH_PACKET_REQUIRED/);
 assert.throws(()=>call({maxTipDeltaMinutes:600}),/TIP_TOLERANCE_INVALID/);
});
