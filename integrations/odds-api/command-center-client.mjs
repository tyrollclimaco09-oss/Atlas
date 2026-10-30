/**
 * Adapter for the EXISTING ATLAS Command Center frontend (source recovery: issue #8).
 * No separate dashboard, no The Odds API key, no autonomous refresh/paid calls.
 * The caller supplies existing authenticated session headers.
 */
export async function readDraftKingsResearch({runtimeUrl,sessionHeaders,fetchImpl=fetch,now=Date.now()}){
  if(typeof runtimeUrl!=="string"||!runtimeUrl.startsWith("https://"))throw Error("RUNTIME_URL_INVALID");
  if(!sessionHeaders||typeof sessionHeaders!=="object"||
    !Object.keys(sessionHeaders).some(k=>["authorization","x-atlas-site-token"].includes(k.toLowerCase())))
    throw Error("EXISTING_OPERATOR_SESSION_REQUIRED");
  const target=new URL(runtimeUrl);
  target.searchParams.set("mode","dk_odds");
  const r=await fetchImpl(target.toString(),{method:"GET",headers:sessionHeaders,cache:"no-store"});
  if(r.status===401||r.status===403)return {status:"AUTH_REQUIRED",events:[],executable:false};
  if(!r.ok)return {status:"RUNTIME_UNAVAILABLE",events:[],executable:false};
  const body=await r.json();
  if(!body||body.ok!==true||body.execution_authority!==false||body.human_final_gate_required!==true)
    return {status:"CONTRACT_REJECTED",events:[],executable:false};
  const ts=Date.parse(body.data_as_of);
  const age=now-ts;
  if(body.status!=="FRESH_RESEARCH"||!Number.isFinite(ts)||age>900000||age< -60000)
    return {status:"STALE_OR_MISSING",events:[],as_of:body.data_as_of||null,executable:false};
  const packet=body.data;
  if(!packet||packet.contract!=="ATLAS_DK_FIRST_SHADOW_V1"||packet.primary_book!=="draftkings"||
    packet.execution_authority!==false||!Array.isArray(packet.events))
    return {status:"CONTRACT_REJECTED",events:[],executable:false};
  const events=packet.events.map(e=>({
    provider_event_id:e.provider_event_id,canonical_event_id:e.canonical_event_id||null,
    identity_status:e.identity_status,away_team:e.away_team,home_team:e.home_team,
    commence_time:e.commence_time,primary_book:"DraftKings",
    quotes:(e.primary_quotes||[]).map(q=>Array.isArray(q)
      ?{market:q[0],side:q[1],line:q[2],american_odds:q[3]}
      :{market:q.m,side:q.s,line:q.l,american_odds:q.o}),
    executable_price_verified:false,approved_bet:null
  }));
  return {status:"FRESH_RESEARCH",as_of:body.data_as_of,events,executable:false,
    human_final_gate_required:true,automatic_provider_requests:0};
}
