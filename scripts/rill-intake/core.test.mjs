import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSignal } from "./core.mjs";
const now="2026-10-21T17:20:00.000Z";
const base={source_url:"https://www.reddit.com/r/sportsbook/comments/abcd/nba/",handle:"r/sportsbook",claim:"Player minutes may rise with short bench rotations.",sport:"NBA",market:"3PM OVER",line:2.5,odds:-108};
function fail(overrides,message){assert.throws(()=>normalizeSignal({...base,...overrides},now),new RegExp(message));}
test("normalize retains observed-vs-released distinction",()=>{
 const r=normalizeSignal(base,now);
 assert.equal(r.released_at,now);assert.equal(r.release_time_trust,"OBSERVED_AT_ONLY");
 assert.equal(r.production_influence,false);assert.equal(r.role,"DISCOVERY_ONLY");
 assert.equal(r.verification_state,"UNVERIFIED");assert.equal(r.executable_price_verified,false);
});
test("reported timestamp explicitly unverified",()=>{
 const r=normalizeSignal({...base,released_at:"2026-10-20T19:00:00-05:00"},now);
 assert.equal(r.released_at,"2026-10-21T00:00:00.000Z");
 assert.equal(r.release_time_trust,"OPERATOR_ASSERTED_UNVERIFIED");
});
test("normalized URL strips trackers",()=>{
 const r=normalizeSignal({...base,source_url:base.source_url+"?utm_medium=paid#highlight"},now);
 assert.equal(r.source_url,base.source_url.replace(/\/$/,""));
});
test("echoes share same claimed original source",()=>{
 const root="https://www.reddit.com/r/sportsbook/comments/abcd/nba/";
 const x=normalizeSignal({...base,source_url:"https://x.com/observer/status/123",handle:"observer",original_url:root},now);
 assert.equal(x.root_url,normalizeSignal(base,now).root_url);
 assert.equal(x.origin_assertion,"OPERATOR_ASSERTED_UNVERIFIED");
});
test("distinct creator identity not falsely merged",()=>{
 const x=normalizeSignal({...base,handle:"user2"},now);
 assert.notEqual(x.source_key,normalizeSignal(base,now).source_key);
});
test("unsupported host rejected",()=>fail({source_url:"https://reddit.com.evil.net/r/sportsbook"},"UNSUPPORTED_SOURCE_URL"));
test("non-HTTPS rejected",()=>fail({source_url:"http://www.reddit.com/r/sportsbook/comments/a/"},"HTTPS_SOURCE_REQUIRED"));
test("embedded credentials rejected",()=>fail({source_url:"https://user:pass@reddit.com/comments/123"},"HTTPS_SOURCE_REQUIRED"));
test("root-only URL rejected",()=>fail({source_url:"https://www.reddit.com/"},"UNSUPPORTED_SOURCE_URL"));
test("missing claim rejected",()=>fail({claim:"BUY IT"},"CLAIM_LENGTH_INVALID"));
test("unsupported sport rejected",()=>fail({sport:"CASINO"},"SPORT_INVALID"));
test("future release time rejected",()=>fail({released_at:"2026-10-23T00:00:00Z"},"RELEASE_TIME_INVALID"));
test("timestamp without zone rejected",()=>fail({released_at:"2026-10-20T19:00:00"},"RELEASE_TIME_ZONE_REQUIRED"));
test("invalid odds rejected",()=>fail({odds:-55},"ODDS_INVALID"));
test("injected production flags cannot affect normalized role",()=>{
 const r=normalizeSignal({...base,production_influence:true,production_authority:true,role:"BET",verification_state:"VERIFIED"},now);
 assert.equal(r.production_influence,false);
 assert.equal(r.production_authority,false);
 assert.equal(r.role,"DISCOVERY_ONLY");
});
test("unrecognized original source rejected",()=>fail({original_url:"https://localhost/admin"},"UNSUPPORTED_SOURCE_URL"));
