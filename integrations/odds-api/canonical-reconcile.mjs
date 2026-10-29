/**
 * ATLAS provider → canonical event identity, fail-closed; no database mutation.
 * Exact provider binding is necessary, team/league/start-time agreement is also necessary.
 * Unbound candidates may be suggested but never assigned a canonical UUID.
 */
const NBA_TEAM_ALIASES=new Map([
  ["la clippers","los angeles clippers"],["portland trailblazers","portland trail blazers"],
  ["new orleans","new orleans pelicans"],["ny knicks","new york knicks"],
]);
const team=x=>{let s=String(x||"").trim().toLowerCase().replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ");return NBA_TEAM_ALIASES.get(s)||s};
const league=x=>String(x||"").toUpperCase()==="NBA"?"NBA":null;
const isUuid=s=>typeof s==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const delta=(a,b)=>Math.abs(Date.parse(a)-Date.parse(b))/60000;
export function reconcileCanonical({packet,events=[],bindings=[],providerId,maxTipDeltaMinutes=15}){
 if(!packet||!Array.isArray(packet.events))throw Error("RESEARCH_PACKET_REQUIRED");
 if(!Array.isArray(events)||!Array.isArray(bindings)||typeof providerId!=="string")throw Error("RECONCILIATION_INPUT_INVALID");
 if(!Number.isFinite(maxTipDeltaMinutes)||maxTipDeltaMinutes<=0||maxTipDeltaMinutes>60)throw Error("TIP_TOLERANCE_INVALID");
 const byId=new Map(),byProvider=new Map(),conflicts=new Set();
 for(const e of events){
   if(isUuid(e.id))byId.set(e.id,e);
 }
 for(const b of bindings){
  if(b.provider_id!==providerId||typeof b.provider_event_id!=="string")continue;
  const p=b.provider_event_id,existing=byProvider.get(p);
  if(existing&&existing.event_id!==b.event_id)conflicts.add(p);
  else byProvider.set(p,b);
 }
 const out=packet.events.map(e=>{
  const base={...e,canonical_event_id:null,identity_status:"UNMAPPED",identity_reason:"NO_APPROVED_PROVIDER_BINDING",canonical_reference_only:true};
  if(conflicts.has(e.provider_event_id))return {...base,identity_status:"CONFLICT",identity_reason:"MULTIPLE_PROVIDER_BINDINGS"};
  const binding=byProvider.get(e.provider_event_id);
  if(!binding)return base;
  const stored=byId.get(binding.event_id);
  if(!stored)return {...base,identity_status:"CONFLICT",identity_reason:"BINDING_TARGET_MISSING"};
  if(league(stored.league)!=="NBA"||team(stored.away_team)!==team(e.away_team)||team(stored.home_team)!==team(e.home_team))
   return {...base,identity_status:"CONFLICT",identity_reason:"LEAGUE_OR_TEAM_MISMATCH"};
  const timeDiff=delta(stored.start_time,e.commence_time);
  if(!Number.isFinite(timeDiff)||timeDiff>maxTipDeltaMinutes)
   return {...base,identity_status:"CONFLICT",identity_reason:"TIP_TIME_MISMATCH",tip_delta_minutes:Number.isFinite(timeDiff)?timeDiff:null};
  const status=String(stored.reconciliation_status||"").toLowerCase();
  return {...base,canonical_event_id:stored.id,identity_status:status==="reconciled"?"RECONCILED":"LINKED_PENDING",
    identity_reason:status==="reconciled"?"PROVIDER_ID_TEAM_AND_START_MATCH":"CANONICAL_EVENT_PENDING_RECONCILIATION",
    tip_delta_minutes:timeDiff,canonical_reference_only:true};
 });
 const counts=out.reduce((x,e)=>(x[e.identity_status]=(x[e.identity_status]||0)+1,x),{});
 return {...packet,requires_event_id_reconciliation:out.some(e=>e.identity_status!=="RECONCILED"),
   identity_summary:{events:out.length,...counts},events:out,
   execution_authority:false,approved_bet:null,expected_value:null,independent_fair_probability:null};
}
