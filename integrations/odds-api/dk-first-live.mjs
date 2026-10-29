/**
 * ATLAS DK-FIRST LIVE SHADOW: opt-in, bounded, server-side, zero production writes.
 * Never embed, log or commit the THE_ODDS_API_KEY. Only --live can spend quota.
 */
import { buildDraftKingsFeed } from "./dk-first.mjs";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
const API="https://api.the-odds-api.com/v4";
const MAX_CREDITS=5;
const MIN_REMAINING=100;
const argv=process.argv.slice(2);
const live=argv.includes("--live");
const outputIndex=argv.indexOf("--output");
const outputPath=outputIndex>=0?argv[outputIndex+1]:null;
function headerNumber(headers,name){
  const raw=headers.get(name),n=Number(raw);
  return raw!==null&&Number.isFinite(n)?n:null;
}
async function request(path,options,key){
  const url=new URL(API+path);
  url.searchParams.set("apiKey",key);
  for(const [k,v] of Object.entries(options))url.searchParams.set(k,v);
  let response;
  try{response=await fetch(url,{signal:AbortSignal.timeout(12000)});}
  catch{throw Error("PROVIDER_NETWORK_ERROR");}
  if(!response.ok)throw Error("PROVIDER_HTTP_"+response.status);
  let data;
  try{data=await response.json();}catch{throw Error("PROVIDER_JSON_INVALID");}
  const usage={
    cost:headerNumber(response.headers,"x-requests-last"),
    remaining:headerNumber(response.headers,"x-requests-remaining"),
    used:headerNumber(response.headers,"x-requests-used")
  };
  if(usage.cost===null||usage.remaining===null)throw Error("QUOTA_HEADERS_REQUIRED");
  return {data,usage};
}
async function main(){
  if(!live){
    console.log(JSON.stringify({mode:"DRY_RUN",live_requests:0,contract:"ATLAS_DK_FIRST_SHADOW_V1",max_credits:MAX_CREDITS}));
    return;
  }
  const key=process.env.THE_ODDS_API_KEY;
  if(typeof key!=="string"||key.length<10)throw Error("SERVER_SIDE_ODDS_KEY_REQUIRED");
  const beganAt=new Date().toISOString();
  const first=await request("/sports/basketball_nba/odds/",{
    bookmakers:"draftkings,betmgm,fanduel",markets:"h2h,spreads,totals",oddsFormat:"american"
  },key);
  if(!Array.isArray(first.data))throw Error("FEATURED_RESPONSE_INVALID");
  if(first.usage.cost>3||first.usage.remaining<MIN_REMAINING+2)throw Error("QUOTA_GUARD_AFTER_FEATURED");
  const now=Date.now();
  const selected=first.data.filter(e=>Date.parse(e.commence_time)>now&&e.bookmakers?.some(b=>b.key==="draftkings"))
    .sort((a,b)=>Date.parse(a.commence_time)-Date.parse(b.commence_time))[0];
  let second=null;
  if(selected){
    second=await request("/sports/basketball_nba/events/"+encodeURIComponent(selected.id)+"/odds/",{
      bookmakers:"draftkings",markets:"player_points_alternate,player_threes_alternate",oddsFormat:"american"
    },key);
    if(second.usage.cost>2)throw Error("QUOTA_GUARD_AFTER_EVENT");
  }
  const spent=first.usage.cost+(second?.usage.cost||0);
  if(spent>MAX_CREDITS)throw Error("QUOTA_LIMIT_EXCEEDED");
  const receipt={
    run_type:"LIVE_PROVIDER_READ_ONLY",started_at:beganAt,completed_at:new Date().toISOString(),
    provider:"THE_ODDS_API_V4",credits_spent:spent,
    credits_remaining:second?.usage.remaining??first.usage.remaining,
    request_count:1+Number(Boolean(second)),production_writes:0,betting_actions:0,
    raw_sha256:createHash("sha256").update(JSON.stringify([first.data,second?.data??null])).digest("hex"),
    ...buildDraftKingsFeed({featured:first.data,eventPayloads:second?[second.data]:[],observedAt:new Date().toISOString()})
  };
  if(outputPath)await writeFile(outputPath,JSON.stringify(receipt,null,2)+"\n",{flag:"wx",mode:0o600});
  console.log(JSON.stringify({
    status:"SUCCESS",contract:receipt.contract,observed_at:receipt.observed_at,
    credits_spent:spent,credits_remaining:receipt.credits_remaining,requests:receipt.request_count,
    totals:receipt.totals,first_event:receipt.events[0]?{
      away:receipt.events[0].away_team,home:receipt.events[0].home_team,
      dk_status:receipt.events[0].dk_status
    }:null,output_file_created:Boolean(outputPath),production_writes:0,betting_actions:0
  }));
}
main().catch(e=>{console.error(JSON.stringify({status:"FAILED_CLOSED",code:e.message,betting_actions:0}));process.exitCode=1;});
