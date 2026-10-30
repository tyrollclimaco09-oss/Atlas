/**
 * ATLAS Fork Arsenal: import read-only fork observations into a shadow SCOUT
 * evidence lane without rewriting canonical candidates or betting authority.
 *
 * Important: the schema enforces source boundaries but cannot authenticate a
 * fork or certify that its underlying vendor/feed actually supplied a record.
 */
export const CONTRACT="ATLAS_FORK_SCOUT_EVIDENCE_V1";
export const MAX_OBSERVATIONS=250;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowed={
 "nba_api":{
   TEAM_IDENTITY:{sport:"NBA",maxAgeMs:365*86400000,scope:"IDENTITY_REFERENCE"},
   PLAYER_GAME_LOG:{sport:"NBA",maxAgeMs:365*86400000,scope:"HISTORICAL_PLAYER_STATS"}
 },
 "sports-skills":{
   NBA_SCOREBOARD:{sport:"NBA",maxAgeMs:15*60000,scope:"SCOREBOARD_REFERENCE"},
   NBA_BOX_SCORE:{sport:"NBA",maxAgeMs:15*60000,scope:"IN_GAME_STATS_REFERENCE"},
   NBA_PLAY_BY_PLAY:{sport:"NBA",maxAgeMs:15*60000,scope:"PBP_REFERENCE"},
   NFL_SCOREBOARD:{sport:"NFL",maxAgeMs:15*60000,scope:"SCOREBOARD_REFERENCE"}
 },
 "nflreadpy":{
   NFL_HISTORICAL_PBP:{sport:"NFL",maxAgeMs:3*365*86400000,scope:"HISTORICAL_PBP"}
 },
 "mcp-sports-hub":{
   SCOREBOARD_CROSSCHECK:{sport:"NBA",maxAgeMs:15*60000,scope:"SECONDARY_UNCONFIRMED"}
 },
 "public-espn-api":{
   SCOREBOARD_CROSSCHECK:{sport:"NBA",maxAgeMs:15*60000,scope:"SECONDARY_UNCONFIRMED"}
 }
};
const claimsByKind={
 TEAM_IDENTITY:["team_id","team_name","abbreviation"],
 PLAYER_GAME_LOG:["player_id","minutes","points","rebounds","assists","fga","fg3a","fta"],
 NBA_SCOREBOARD:["home_score","away_score","period","game_status"],
 NBA_BOX_SCORE:["player_id","minutes","points","rebounds","assists","fg3a","fta"],
 NBA_PLAY_BY_PLAY:["play_count","period","clock_text"],
 NFL_SCOREBOARD:["home_score","away_score","period","game_status"],
 NFL_HISTORICAL_PBP:["season","week","play_count","mean_epa"],
 SCOREBOARD_CROSSCHECK:["home_score","away_score","game_status"]
};
const numeric=new Set(["team_id","player_id","minutes","points","rebounds","assists","fga","fg3a","fta",
  "home_score","away_score","period","play_count","season","week","mean_epa"]);
const unsigned=new Set(["team_id","player_id","minutes","points","rebounds","assists","fga","fg3a","fta",
  "home_score","away_score","period","play_count","week"]);
const textFields=new Set(["team_name","abbreviation","game_status","clock_text"]);
const iso=s=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(s)&&Number.isFinite(Date.parse(s));
const clean=s=>typeof s==="string"&&s.trim().length>0&&s.length<=120&&!/[\u0000-\u001f<>]/.test(s)?s.trim():null;
const refuse=reason=>({admitted:false,reason,execution_authority:false});

function validClaims(kind,raw){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return null;
 const out={};
 const keys=claimsByKind[kind];
 for(const k of keys){
   if(!(k in raw))continue;
   const v=raw[k];
   if(numeric.has(k)&&typeof v==="number"&&Number.isFinite(v)&&(!unsigned.has(k)||v>=0)&&
      (k!=="player_id"||Number.isInteger(v))&&(k!=="team_id"||Number.isInteger(v))&&
      (!["home_score","away_score","points","rebounds","assists","fga","fg3a","fta","season","week","play_count","period"].includes(k)||Number.isInteger(v)))out[k]=v;
   else if(textFields.has(k)&&clean(v))out[k]=clean(v);
   else return null;
 }
 const required={
  TEAM_IDENTITY:["team_id","team_name","abbreviation"],
  PLAYER_GAME_LOG:["player_id","minutes"],
  NBA_SCOREBOARD:["home_score","away_score","game_status"],
  NBA_BOX_SCORE:["player_id","minutes"],
  NBA_PLAY_BY_PLAY:["play_count","period"],
  NFL_SCOREBOARD:["home_score","away_score","game_status"],
  NFL_HISTORICAL_PBP:["season","week","play_count"],
  SCOREBOARD_CROSSCHECK:["home_score","away_score","game_status"]
 };
 return required[kind].every(k=>k in out)?out:null;
}
export function screenForkObservation(raw,{now=new Date().toISOString()}={}){
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return refuse("INVALID_RECORD");
 const source=clean(raw.source_id),kind=clean(raw.kind),sourceClass=allowed[source]?.[kind];
 if(!sourceClass)return refuse("UNSUPPORTED_SOURCE_KIND");
 if(raw.sport!==sourceClass.sport)return refuse("SPORT_MISMATCH");
 if(!iso(now)||!iso(raw.observed_at)||!iso(raw.source_as_of))return refuse("FROZEN_UTC_TIMESTAMPS_REQUIRED");
 const clock=Date.parse(now),received=Date.parse(raw.observed_at),asof=Date.parse(raw.source_as_of);
 if(received>clock+60000||asof>received+60000||asof>clock+60000)return refuse("FUTURE_INFORMATION");
 if(clock-received>sourceClass.maxAgeMs||received-asof>sourceClass.maxAgeMs)return refuse("EXPIRED_SOURCE_RECORD");
 if(raw.provenance?.claim!=="OPERATOR_SOURCE_OBSERVED"||
    !clean(raw.provenance?.fork_revision)||!clean(raw.provenance?.underlying_feed)||
    !clean(raw.provenance?.capture_reference))return refuse("SOURCE_PROVENANCE_INSUFFICIENT");
 if(raw.raw_payload||raw.credentials||raw.account_token||raw.owner_name||raw.league_id)return refuse("PRIVATE_OR_RAW_FIELDS_DISALLOWED");
 const claims=validClaims(kind,raw.claims);
 if(!claims)return refuse("SCOPED_CLAIMS_INVALID");
 if(kind==="TEAM_IDENTITY"&&raw.canonical_event_id) return refuse("TEAM_INDEX_IS_NOT_AN_EVENT");
 const eventBound=kind!=="TEAM_IDENTITY";
 if(eventBound&&(!UUID.test(raw.canonical_event_id||"")||
    !clean(raw.away_team)||!clean(raw.home_team)||!iso(raw.game_start)))return refuse("CANONICAL_EVENT_IDENTITY_REQUIRED");
 if(eventBound&&["PLAYER_GAME_LOG","NFL_HISTORICAL_PBP"].includes(kind)&&Date.parse(raw.game_start)>clock)
   return refuse("HISTORICAL_FACT_FROM_FUTURE_GAME");
 const output={
  contract:CONTRACT,admitted:true,status:"UNVERIFIED_FORK_SOURCE_CLAIM",
  source_id:source,kind,sport:raw.sport,scope:sourceClass.scope,
  source_observed_at:raw.observed_at,source_as_of:raw.source_as_of,
  source_provenance:{fork_revision:raw.provenance.fork_revision,
   underlying_feed:raw.provenance.underlying_feed,capture_reference:raw.provenance.capture_reference,
   attestation:"OPERATOR_REPORTED_NOT_CRYPTOGRAPHICALLY_VERIFIED"},
  canonical_event_id:eventBound?raw.canonical_event_id:null,
  event_identity:eventBound?{away_team:raw.away_team,home_team:raw.home_team,game_start:raw.game_start}:null,
  claims,professional_status_verified:false,independent_fair_probability:null,
  approved_bet:null,execution_authority:false
 };
 return output;
}
export function attachForkEvidenceToSlate(slate,records,{now=new Date().toISOString()}={}){
 if(!slate||slate.contract!=="ATLAS_UNIFIED_SLATE_SOURCES_V1"||
    slate.execution_authority!==false||!Array.isArray(slate.events)||
    !Array.isArray(records)||records.length>MAX_OBSERVATIONS)
  throw Error("UNIFIED_SLATE_INPUT_INVALID");
 const events=slate.events.map(e=>({...e,fork_source_evidence:[]}));
 const eventMap=new Map(events.filter(e=>UUID.test(e.canonical_event_id||"")).map(e=>[e.canonical_event_id,e]));
 const refused=[],unassigned=[],sourcePairs=new Set();
 let accepted=0;
 for(const raw of records){
  const evidence=screenForkObservation(raw,{now});
  if(!evidence.admitted){refused.push({reason:evidence.reason});continue}
  const identityKey=JSON.stringify([evidence.source_id,evidence.kind,evidence.canonical_event_id,
    evidence.source_observed_at,evidence.source_provenance.capture_reference]);
  if(sourcePairs.has(identityKey)){refused.push({reason:"DUPLICATE_SOURCE_RECEIPT"});continue}
  sourcePairs.add(identityKey);
  if(!evidence.canonical_event_id){unassigned.push({source_id:evidence.source_id,kind:evidence.kind,
    status:"IDENTITY_REFERENCE_ONLY",claims:evidence.claims});accepted++;continue}
  const game=eventMap.get(evidence.canonical_event_id);
  if(!game||game.away_team!==evidence.event_identity.away_team||
     game.home_team!==evidence.event_identity.home_team||
     !iso(game.start_time)||Math.abs(Date.parse(game.start_time)-Date.parse(evidence.event_identity.game_start))>15*60000){
    refused.push({reason:"CANONICAL_EVENT_MISMATCH"});continue}
  game.fork_source_evidence.push(evidence);accepted++;
 }
 return {...slate,contract:"ATLAS_UNIFIED_SLATE_FORK_SHADOW_V1",events,
   fork_arsenal:{scope:"SHADOW_READ_ONLY",accepted,refused:refused.slice(0,50),
     unassigned_identity_references:unassigned.slice(0,50),
     source_authority:"UNVERIFIED_REFERENCE_ONLY",official_approval_count:0},
   approved_bet:null,expected_value:null,independent_fair_probability:null,
   execution_authority:false,human_final_gate_required:true,
   production_writes:0,paid_api_requests:0,betting_actions:0};
}
export function marketReferenceNoVig(americanOdds,{market="h2h"}={}){
 if(!Array.isArray(americanOdds)||americanOdds.length<2||americanOdds.length>3||
   !["h2h","three_way"].includes(market)||americanOdds.length!==(market==="h2h"?2:3))
  throw Error("MARKET_OUTCOME_SET_INVALID");
 const arr=americanOdds.map(x=>{
  if(!Number.isInteger(x)||Math.abs(x)<100||Math.abs(x)>10000)throw Error("AMERICAN_ODDS_INVALID");
  return x>0?100/(x+100):(-x)/(-x+100);
 });
 const overround=arr.reduce((a,b)=>a+b,0);
 if(overround<1||overround>1.5)throw Error("MARKET_OVERROUND_UNUSUAL");
 return {
   contract:"ATLAS_FORK_MARKET_BASELINE_V1",method:"MULTIPLICATIVE_REFERENCE_ONLY",
   market,american_odds:americanOdds.slice(),raw_market_implied_probabilities:arr,
   overround,normalized_market_reference_probabilities:arr.map(p=>p/overround),
   compare_later_with:"tyrollclimaco09-oss/shin",
   independent_fair_probability:null,expected_value:null,
   execution_authority:false,approved_bet:null
 };
}
