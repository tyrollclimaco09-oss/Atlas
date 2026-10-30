import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const catalog=JSON.parse(readFileSync(new URL("./catalog.json",import.meta.url),"utf8"));
test("all cataloged fork entries are explicit repo-to-node research assignments",()=>{
 assert.equal(catalog.contract,"ATLAS_FORK_CAPABILITY_CATALOG_V1");
 assert.equal(catalog.production_promotions,0);assert.equal(catalog.paid_calls_authorized,0);
 assert(catalog.forks.length>=20);
 const ids=catalog.forks.map(f=>f.repo);
 assert.equal(new Set(ids).size,ids.length);
 assert(catalog.forks.every(f=>f.repo.startsWith("tyrollclimaco09-oss/")&&f.upstream.includes("/")&&
  f.node&&f.capability&&f.status&&f.notes&&f.license));
});
test("catalog does not confuse cloned research tools with validated operating sources",()=>{
 assert(catalog.forks.every(f=>!/PRODUCTION_READY|LIVE_VERIFIED|EXECUTABLE_BET/i.test(f.status)));
 assert(catalog.forks.filter(f=>f.status==="SOURCE_CODE_SMOKE_PASSED").length>=2);
});
test("no AGPL multi-agent simulation enters the production Command Center or Final Gate",()=>{
 const x=catalog.forks.find(f=>f.repo.endsWith("/MiroFish"));
 assert.equal(x.license,"AGPL-3.0");
 assert.equal(x.status,"LAB_ONLY_LICENSE_REVIEW");
});
test("scraper and third-party execution projects remain research-only",()=>{
 const x=catalog.forks.find(f=>f.repo.endsWith("/DKscraPy"));
 assert.equal(x.status,"NO_LIVE_INTEGRATION");
 const y=catalog.forks.find(f=>f.repo.endsWith("/sports-betting"));
 assert.match(y.notes,/execution|disabled/i);
});
test("identity and market fair probabilities are not interchangeable sources",()=>{
 const a=catalog.forks.find(f=>f.repo.endsWith("/nba_api"));
 const b=catalog.forks.find(f=>f.repo.endsWith("/shin"));
 assert.equal(a.node,"SCOUT");assert.equal(b.node,"PRICING");
 assert(a.capability.includes("IDENTITY"));assert(b.capability.includes("OVERROUND"));
});
