/**
 * ATLAS Unified Slate evidence assembler.
 * Read-only presentation layer over existing canonical slate, DraftKings price
 * snapshots, and optional Flaim shadow leads. Not a new candidate database.
 */
export const CONTRACT="ATLAS_UNIFIED_SLATE_SOURCES_V1";
export const ODDS_TTL_MS=15*60*1000;
export const FLAIM_TTL_MS=24*60*60*1000;
const ISO_DATE=/^\d{4}-\d{2}-\d{2}$/;
const uuid=s=>typeof s==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const norm=s=>typeof s==="string"?s.trim().toLowerCase().replace(/[^a-z0-9]/g,""):"";
const parsed=s=>typeof s==="string"?Date.parse(s):NaN;
const current=(stamp,now,ttl)=>Number.isFinite(parsed(stamp))&&parsed(stamp)>=now-ttl&&parsed(stamp)<=now+60000;
const safeNumber=n=>typeof n==="number"&&Number.isFinite(n);
function centralDate(stamp){
 if(!Number.isFinite(parsed(stamp)))return null;
 try{
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(stamp));
  const o=Object.fromEntries(parts.filter(p=>["year","month","day"].includes(p.type)).map(p=>[p.type,p.value]));
  return o.year+"-"+o.month+"-"+o.day;
 }catch{return null}
}
function validResearchOnly(o){
 return o&&typeof o==="object"&&o.contract==="ATLAS_DK_FIRST_SHADOW_V1"&&
  o.primary_book==="draftkings"&&o.execution_authority===false&&
  o.approved_bet===null&&o.expected_value===null&&Array.isArray(o.events);
}
function parseOdds(oddsReport,now){
 if(!oddsReport)return {state:"NO_DK_SNAPSHOT",observed_at:null,events:[]};
 let raw=oddsReport;
 if(typeof oddsReport.body==="string"){
  if(oddsReport.truth_label!=="RESEARCH_ONLY"||oddsReport.body.length>80000)return {state:"DK_SNAPSHOT_INVALID",observed_at:null,events:[]};
  try{raw=JSON.parse(oddsReport.body)}catch{return {state:"DK_SNAPSHOT_INVALID",observed_at:null,events:[]}}
 }
 if(!validResearchOnly(raw))return {state:"DK_SNAPSHOT_INVALID",observed_at:null,events:[]};
 const seenAt=raw.observed_at||null;
 if(!current(seenAt,now,ODDS_TTL_MS))return {state:"DK_SNAPSHOT_STALE",observed_at:seenAt,events:[]};
 return {state:"DK_REFERENCE_CURRENT",observed_at:seenAt,events:raw.events.slice(0,80)};
}
function parseFlaim(flaimPacket,now){
 if(!flaimPacket)return {state:"NO_FLAIM_PACKET",observed_at:null,leads:[]};
 let raw=flaimPacket;
 if(typeof flaimPacket.body==="string"){
  if(flaimPacket.truth_label!=="RESEARCH_ONLY"||flaimPacket.body.length>80000)return {state:"FLAIM_PACKET_INVALID",observed_at:null,leads:[]};
  try{raw=JSON.parse(flaimPacket.body)}catch{return {state:"FLAIM_PACKET_INVALID",observed_at:null,leads:[]}}
 }
 if(!raw||raw.contract!=="ATLAS_FLAIM_SCOUT_SHADOW_V1"||raw.execution_authority!==false||
     raw.approved_bet!==null||!Array.isArray(raw.scout_leads))
  return {state:"FLAIM_PACKET_INVALID",observed_at:null,leads:[]};
 if(raw.status==="BLOCKED_NO_CONNECTED_LEAGUES")return {state:"FLAIM_LEAGUES_UNCONNECTED",observed_at:raw.observed_at||null,leads:[]};
 if(!current(raw.observed_at,now,FLAIM_TTL_MS))return {state:"FLAIM_PACKET_STALE",observed_at:raw.observed_at||null,leads:[]};
 const leads=raw.scout_leads.filter(s=>s&&s.contract==="ATLAS_FLAIM_SCOUT_SHADOW_V1"&&
    s.status==="FANTASY_SIGNAL_ONLY"&&s.execution_authority===false&&s.verification?.professional_fact_verified===false&&
    typeof s.player==="string"&&typeof s.professional_team==="string"&&s.source?.system==="FLAIM_FANTASY"&&
    current(s.source?.observed_at,now,FLAIM_TTL_MS));
 return {state:"FANTASY_LEADS_UNVERIFIED",observed_at:raw.observed_at,leads:leads.slice(0,100)};
}
function quotesFor(e,now){
 let seen=new Map(),arr=[];
 for(const q of Array.isArray(e.primary_quotes)?e.primary_quotes:[]){
  const market=Array.isArray(q)?q[0]:q.m||q.market;
  const side=Array.isArray(q)?q[1]:q.s||q.selection;
  const line=Array.isArray(q)?q[2]:q.l??q.line??null;
  const price=Array.isArray(q)?q[3]:q.o??q.american_odds;
  const quoteAt=Array.isArray(q)?q[4]||e.market_last_update?.[market]:q.t||q.market_last_update||e.market_last_update?.[market];
  if(typeof market!=="string"||typeof side!=="string"||!Number.isInteger(price)||Math.abs(price)<100||
     Math.abs(price)>100000||(line!==null&&!safeNumber(line))||!current(quoteAt,now,ODDS_TTL_MS))continue;
  const key=JSON.stringify([market,side,line]);
  seen.set(key,(seen.get(key)||0)+1);
  arr.push({key,market,selection:side,line,american_odds:price,market_last_update:quoteAt,book:"DraftKings",executable_price_verified:false});
 }
 // Quarantine all repeated identity keys, including identical duplicates. Never select a favorable one.
 return arr.filter(q=>seen.get(q.key)===1).map(({key,...rest})=>rest);
}
export function assembleUnifiedSlate({
 slateDate,league="NBA",canonicalEvents=[],candidates=[],oddsReport=null,flaimPacket=null,
 now=new Date().toISOString(),includePast=false
}={}){
 if(!ISO_DATE.test(slateDate||"")||!Number.isFinite(parsed(now))||
   !Array.isArray(canonicalEvents)||!Array.isArray(candidates)||canonicalEvents.length>250||candidates.length>500||
   !["NBA","NFL"].includes(league))throw Error("SLATE_INPUT_INVALID");
 const timestamp=parsed(now),odds=parseOdds(oddsReport,timestamp),flaim=parseFlaim(flaimPacket,timestamp);
 const eventById=new Map(),result=new Map();
 for(const e of canonicalEvents){
  if(!e||!uuid(e.id)||e.league!==league||e.event_date!==slateDate)continue;
  if(!includePast&&Number.isFinite(parsed(e.start_time))&&parsed(e.start_time)<timestamp-2*3600000)continue;
  if(eventById.has(e.id))continue;
  eventById.set(e.id,e);
  result.set("canonical:"+e.id,{
   event_key:"canonical:"+e.id,canonical_event_id:e.id,provider_event_id:e.provider_event_id||null,
   away_team:e.away_team,home_team:e.home_team,start_time:e.start_time||null,
   identity_status:e.reconciliation_status==="reconciled"?"RECONCILED":"CANONICAL_PENDING",
   prices:[],candidates:[],flaim_leads:[],professional_status_verified:false,
   source_provenance:["ATLAS_CANONICAL_EVENTS"],betting_authority:false
  });
 }
 for(const p of odds.events){
  if(!p||typeof p.provider_event_id!=="string"||typeof p.away_team!=="string"||typeof p.home_team!=="string")continue;
  const date=centralDate(p.commence_time);
  if(date!==slateDate)continue;
  if(!includePast&&parsed(p.commence_time)<timestamp-2*3600000)continue;
  const assertedId=p.canonical_event_id;
  const c=uuid(assertedId)?eventById.get(assertedId):null;
  const exact=!!c&&norm(c.away_team)===norm(p.away_team)&&norm(c.home_team)===norm(p.home_team)&&
    Number.isFinite(parsed(c.start_time))&&Number.isFinite(parsed(p.commence_time))&&
    Math.abs(parsed(c.start_time)-parsed(p.commence_time))<=15*60000;
  const key=exact?"canonical:"+assertedId:"provider:"+p.provider_event_id;
  const quotes=quotesFor(p,timestamp);
  const next={
   event_key:key,canonical_event_id:exact?assertedId:null,provider_event_id:p.provider_event_id,
   away_team:p.away_team,home_team:p.home_team,start_time:p.commence_time,
   identity_status:exact?(c.reconciliation_status==="reconciled"?"RECONCILED":"LINKED_PENDING"):"PROVIDER_UNMAPPED",
   prices:quotes,candidates:[],flaim_leads:[],professional_status_verified:false,
   source_provenance:exact?["ATLAS_CANONICAL_EVENTS","THE_ODDS_API_V4"]:["THE_ODDS_API_V4"],
   betting_authority:false
  };
  if(exact){const existing=result.get(key);if(existing){next.candidates=existing.candidates;}}
  if(result.has(key)&&!exact){continue}
  result.set(key,next);
 }
 const unassignedCandidates=[];
 for(const c of candidates){
  if(!c||c.league!==league||typeof c.candidate_key!=="string")continue;
  const board=uuid(c.event_id)?result.get("canonical:"+c.event_id):null;
  const minimal={
    candidate_key:c.candidate_key,contract_status:c.contract_status||"UNKNOWN",
    blocker_codes:Array.isArray(c.blocker_codes)?c.blocker_codes.slice(0,25):[],
    lifecycle_status:c.lifecycle_status||null,truth_label:c.truth_label||null,
    source_claim_count:Number.isInteger(c.source_claim_count)?c.source_claim_count:null,
    provenance_accepted:false,approved_bet:null
  };
  if(!board){unassignedCandidates.push(minimal);continue}
  board.candidates.push(minimal);
 }
 if(flaim.leads.length){
  const all=[...result.values()];
  for(const s of flaim.leads){
   const fits=all.filter(e=>norm(s.professional_team)===norm(e.away_team)||norm(s.professional_team)===norm(e.home_team));
   // A team can play at most one game in a dated slate; ambiguous matches are never silently resolved.
   if(fits.length!==1)continue;
   fits[0].flaim_leads.push({
    player:s.player,team:s.professional_team,
    fantasy_signal_kind:s.source?.signal_kind,observed_at:s.source?.observed_at,
    professional_fact_verified:false,independent_verification_required:true
   });
  }
 }
 const events=[...result.values()].sort((a,b)=>(parsed(a.start_time)||0)-(parsed(b.start_time)||0)).slice(0,80);
 for(const e of events){
  e.research_state=e.identity_status==="PROVIDER_UNMAPPED"?"WATCH_IDENTITY":
    e.prices.length===0?"WATCH_MISSING_FRESH_DK":
    "SCOUT_PRICE_CONTEXT_ONLY";
  e.required_checks=["OFFICIAL_SCHEDULE_AND_AVAILABILITY","MINUTES_ROLE_AND_MATCHUP","INDEPENDENT_FORECAST","EDGE_THIEF_CHALLENGE","FRESH_FINAL_GATE_QUOTE"];
  if(e.flaim_leads.length)e.required_checks.push("VERIFY_FANTASY_LEAD_WITH_OFFICIAL_REPORT");
 }
 return {
  contract:CONTRACT,mode:"READ_ONLY_RESEARCH",slate_date:slateDate,league,assembled_at:now,
  source_states:{draftkings:odds.state,flaim:flaim.state,canonical_slate:"READ_ONLY"},
  source_times:{draftkings:odds.observed_at,flaim:flaim.observed_at},
  totals:{events:events.length,events_with_fresh_dk:events.filter(e=>e.prices.length>0).length,
    dk_reference_quotes:events.reduce((n,e)=>n+e.prices.length,0),
    canonical_linked:events.filter(e=>e.canonical_event_id).length,
    candidates_attached:events.reduce((n,e)=>n+e.candidates.length,0),
    fantasy_leads:events.reduce((n,e)=>n+e.flaim_leads.length,0),
    unattached_candidates:unassignedCandidates.length},
  events,unassigned_candidates:unassignedCandidates.slice(0,30),
  pipeline_next:["SCOUT","FILTER_VERIFY","ORACLE_EDGE_THIEF","PRICING","KAIROS","SENTINEL","TACTICIAN","HUMAN_FINAL_GATE","LEDGER","FORENSICS"],
  approved_bet:null,expected_value:null,independent_fair_probability:null,
  executable_price_verified:false,execution_authority:false,human_final_gate_required:true,
  production_writes:0,paid_api_requests:0
 };
}
