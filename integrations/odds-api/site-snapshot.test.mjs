import test from "node:test";
import assert from "node:assert/strict";
import {makeSiteSnapshot,PROVIDER_ID} from "./site-snapshot.mjs";
const t="2026-10-29T23:22:24.000Z",cid="bf74ff8e-2fbd-49cf-af50-0c3c4b43281a",pid="b123d92eb8046e43fabf95a33a676634";
const receipt={contract:"ATLAS_DK_FIRST_SHADOW_V1",execution_authority:false,observed_at:t,primary_book:"draftkings",raw_sha256:"abc",
 credits_remaining:455,totals:{events_seen:1,events_with_dk:1,accepted_dk_quotes:1,price_comparisons:1,quarantined_quotes:0},
 events:[{provider_event_id:pid,away_team:"Cleveland Cavaliers",home_team:"Atlanta Hawks",commence_time:"2026-10-30T00:10:00Z",
 dk_status:"DK_REFERENCE_AVAILABLE",primary_quotes:[{market:"h2h",player:null,selection:"Atlanta Hawks",line:null,american_odds:-118,
 market_last_update:"2026-10-29T23:22:19.000Z",status:"VALID_REFERENCE"}],
 price_disagreements:[{market:"h2h",player:null,selection:"Atlanta Hawks",line:null,draftkings_odds:-118,best_comparator_book:"betmgm",best_comparator_odds:-125,dk_price_advantage_pp:1.2}],
 quarantined:[]} ]};
const events=[{id:cid,league:"NBA",away_team:"Cleveland Cavaliers",home_team:"Atlanta Hawks",start_time:"2026-10-30T00:00:00Z",reconciliation_status:"pending"}];
const bindings=[{provider_id:PROVIDER_ID,provider_event_id:pid,event_id:cid}];
test("works for linked but pending canonical identity, zero approved bets",()=>{
 const o=makeSiteSnapshot({receipt,events,bindings});
 assert.equal(o.events[0].canonical_event_id,cid);assert.equal(o.events[0].identity_status,"LINKED_PENDING");
 assert.equal(o.execution_authority,false);assert.equal(o.approved_bet,null);assert.equal(o.expected_value,null);
 assert.equal(o.events[0].primary_quotes[0].odds,-118);
 assert.equal(o.events[0].primary_quotes[0].executable_price_verified,false);
});
test("verified canonical status can be represented, but never executable",()=>{
 const o=makeSiteSnapshot({receipt,events:[{...events[0],reconciliation_status:"reconciled"}],bindings});
 assert.equal(o.events[0].identity_status,"RECONCILED");assert.equal(o.execution_authority,false);
});
test("unmapped remains unmapped, never random UUID",()=>{
 const o=makeSiteSnapshot({receipt,events,bindings:[]});
 assert.equal(o.events[0].identity_status,"UNMAPPED");assert.equal(o.events[0].canonical_event_id,null);
});
test("secret and untrusted raw provider payload are not copied",()=>{
 const dirty={...receipt,api_key:"secret-leak-example",events:receipt.events.map(e=>({...e,raw_payload:{token:"hidden"}}))};
 const o=makeSiteSnapshot({receipt:dirty,events,bindings});
 assert(!JSON.stringify(o).includes("secret-leak-example"));assert(!JSON.stringify(o).includes("hidden"));
});
test("stale market timestamps rejected on publication",()=>{
 const stale={...receipt,events:receipt.events.map(e=>({...e,primary_quotes:e.primary_quotes.map(q=>({...q,market_last_update:"2026-10-29T21:10:00Z"}))}))};
 assert.throws(()=>makeSiteSnapshot({receipt:stale,events,bindings}),/SNAPSHOT_CONTAINS_INVALID_DK_QUOTE/);
});
test("wrong provider authority or contract rejected",()=>{
 assert.throws(()=>makeSiteSnapshot({receipt:{...receipt,execution_authority:true},events,bindings}),/SOURCE_CONTRACT_INVALID/);
 assert.throws(()=>makeSiteSnapshot({receipt:{...receipt,contract:"UNKNOWN"},events,bindings}),/SOURCE_CONTRACT_INVALID/);
});
