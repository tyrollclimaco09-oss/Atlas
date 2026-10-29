import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {buildDraftKingsFeed,impliedProbability} from "./dk-first.mjs";
const NOW="2026-10-29T23:20:00.000Z",TIP="2026-10-30T00:10:00.000Z",UPDATE="2026-10-29T23:19:30.000Z";
const o=(name,price,point,description)=>({name,price,...(point===undefined?{}:{point}),...(description?{description}:{})});
const m=(key,outcomes,last_update=UPDATE)=>({key,outcomes,last_update});
const b=(key,markets=[])=>({key,markets});
const e=(bookmakers,overrides={})=>({id:"nba-e1",sport_key:"basketball_nba",commence_time:TIP,away_team:"Cleveland Cavaliers",home_team:"Atlanta Hawks",bookmakers,...overrides});
const f=(bookmakers,more={})=>buildDraftKingsFeed({featured:[e(bookmakers)],observedAt:NOW,...more});
const DK=b("draftkings",[m("h2h",[o("Atlanta Hawks",-118),o("Cleveland Cavaliers",-102)])]);
const MGM=b("betmgm",[m("h2h",[o("Atlanta Hawks",-115),o("Cleveland Cavaliers",-105)])]);
const FD=b("fanduel",[m("h2h",[o("Atlanta Hawks",-116),o("Cleveland Cavaliers",-102)])]);
test("always DK first and authority false",()=>{
 const x=f([FD,MGM,DK]);assert.equal(x.primary_book,"draftkings");assert.equal(x.events[0].primary_quotes.length,2);
 assert(x.events[0].primary_quotes.every(q=>q.bookmaker==="draftkings"&&q.executable_price_verified===false));
 assert.equal(x.execution_authority,false);assert.equal(x.approved_bet,null);
 assert.equal(x.expected_value,null);assert.equal(x.requires_event_id_reconciliation,true);
});
test("missing DK never silently substitutes MGM or FD",()=>{
 const x=f([MGM,FD]);assert.equal(x.events[0].dk_status,"DK_UNAVAILABLE");
 assert.equal(x.events[0].primary_quotes.length,0);assert.equal(x.events[0].comparator_quotes.length,4);
});
test("compares identical player market and line only",()=>{
 const x=f([b("draftkings",[m("player_points",[o("Over",106,19.5,"Jalen Johnson")])]),
 b("betmgm",[m("player_points",[o("Over",-120,19.5,"Jalen Johnson"),o("Over",-110,20.5,"Jalen Johnson"),o("Over",-110,19.5,"Other Player")])])]);
 assert.equal(x.events[0].price_disagreements.length,1);
 assert.equal(x.events[0].price_disagreements[0].draftkings_odds,106);
 assert.equal(x.events[0].price_disagreements[0].best_comparator_odds,-120);
 assert(x.events[0].price_disagreements[0].dk_price_advantage_pp>0);
 assert.equal(x.events[0].price_disagreements[0].expected_value,null);
});
test("conflicting duplicate DK quotes quarantined, never preferred",()=>{
 const x=f([b("draftkings",[m("player_points_alternate",[o("Over",-600,4.5,"Jaylon Tyson"),o("Over",-580,4.5,"Jaylon Tyson")])]),
 b("fanduel",[m("player_points_alternate",[o("Over",-610,4.5,"Jaylon Tyson")])])]);
 assert.equal(x.events[0].primary_quotes.length,0);assert.equal(x.events[0].quarantined.length,2);
 assert(x.events[0].quarantined.every(q=>q.status==="CONFLICTING_DUPLICATE"));
 assert.equal(x.events[0].price_disagreements.length,0);
});
test("identical duplicate quotes quarantined",()=>{
 const x=f([b("draftkings",[m("h2h",[o("Atlanta Hawks",-118),o("Atlanta Hawks",-118)])])]);
 assert.equal(x.events[0].primary_quotes.length,0);
 assert(x.events[0].quarantined.every(q=>q.status==="DUPLICATE_QUOTE"));
});
test("missing market timestamp quarantined",()=>{
 const x=f([b("draftkings",[m("h2h",[o("Atlanta Hawks",-118)],null)])]);
 assert.equal(x.events[0].quarantined[0].status,"MISSING_MARKET_TIMESTAMP");
});
test("stale market timestamp quarantined",()=>{
 const x=f([b("draftkings",[m("h2h",[o("Atlanta Hawks",-118)],"2026-10-29T22:00:00Z")])]);
 assert.equal(x.events[0].quarantined[0].status,"STALE_MARKET");
});
test("future timestamp quarantined",()=>{
 const x=f([b("draftkings",[m("h2h",[o("Atlanta Hawks",-118)],"2026-10-30T03:00:00Z")])]);
 assert.equal(x.events[0].quarantined[0].status,"FUTURE_TIMESTAMP");
});
test("past fixtures cannot enter upcoming market board",()=>{
 const x=buildDraftKingsFeed({featured:[e([DK],{commence_time:"2026-10-29T20:00:00Z"})],observedAt:NOW});
 assert.equal(x.events.length,0);
});
test("unsupported bookmakers and market keys ignored",()=>{
 const x=f([DK,b("otherbook",[m("h2h",[o("Atlanta Hawks",300)])]),b("draftkings",[m("player_first_basket",[o("Jalen Johnson",140)])])]);
 assert.equal(x.events[0].primary_quotes.length,2);
});
test("orphan provider event props cannot join known event",()=>{
 const x=f([DK],{eventPayloads:[e([b("draftkings",[m("player_threes_alternate",[o("Over",106,1.5,"Jalen Johnson")])])],{id:"unknown-id"})]});
 assert.equal(x.events[0].primary_quotes.length,2);
});
test("matching event alternate lines join the DK board",()=>{
 const x=f([DK],{eventPayloads:[e([b("draftkings",[m("player_threes_alternate",[o("Over",106,1.5,"Jalen Johnson")])])])]});
 assert.equal(x.events[0].primary_quotes.length,3);
});
test("invalid odds rejected",()=>{
 assert.throws(()=>impliedProbability(0),/ODDS_INVALID/);
 assert.equal(impliedProbability(100),0.5);
 assert(Math.abs(impliedProbability(-120)-120/220)<1e-9);
 assert.equal(f([b("draftkings",[m("h2h",[o("Atlanta Hawks",77)])])]).events[0].quarantined[0].status,"INVALID_QUOTE");
});
test("no-live default guarantees no external request",()=>{
 const r=spawnSync(process.execPath,[new URL("./dk-first-live.mjs",import.meta.url).pathname],{encoding:"utf8",env:{PATH:process.env.PATH}});
 assert.equal(r.status,0);assert.equal(JSON.parse(r.stdout).live_requests,0);
});
test("live flag without injected secret fails closed",()=>{
 const r=spawnSync(process.execPath,[new URL("./dk-first-live.mjs",import.meta.url).pathname,"--live"],{encoding:"utf8",env:{PATH:process.env.PATH}});
 assert.equal(r.status,1);assert.match(r.stderr,/SERVER_SIDE_ODDS_KEY_REQUIRED/);
});
test("input cannot override decision authority",()=>{
 const x=buildDraftKingsFeed({featured:[e([DK],{approved_bet:true,execution_authority:true,expected_value:999})],observedAt:NOW});
 assert.equal(x.execution_authority,false);assert.equal(x.approved_bet,null);assert.equal(x.expected_value,null);
});
