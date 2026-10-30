import {assembleUnifiedSlate} from "./unified-source-board.mjs";

/**
 * Single read that can power the existing Run the Slate action.
 * Reuses the existing ATLAS authenticated Supabase runtime, not a new UI.
 */
export async function readUnifiedSlate({
  runtimeUrl,sessionHeaders,slateDate,league="NBA",fetchImpl=fetch,now=new Date().toISOString()
}={}){
 if(typeof runtimeUrl!=="string"||!runtimeUrl.startsWith("https://"))throw Error("RUNTIME_URL_INVALID");
 if(!sessionHeaders||typeof sessionHeaders!=="object"||
    !Object.keys(sessionHeaders).some(x=>["authorization","x-atlas-site-token"].includes(x.toLowerCase())))
   throw Error("ATLAS_OPERATOR_SESSION_REQUIRED");
 const url=new URL(runtimeUrl);
 if(url.username||url.password||url.hash||url.search)throw Error("RUNTIME_URL_NOT_CANONICAL");
 url.searchParams.set("mode","slate_sources");
 url.searchParams.set("league",league);
 url.searchParams.set("slate_date",slateDate||"");
 let r;
 try{r=await fetchImpl(url.toString(),{method:"GET",headers:sessionHeaders,cache:"no-store"});}
 catch{return {status:"RUNTIME_UNAVAILABLE",events:[],execution_authority:false}}
 if(r.status===401||r.status===403)return {status:"AUTH_REQUIRED",events:[],execution_authority:false};
 if(!r.ok)return {status:"RUNTIME_UNAVAILABLE",events:[],execution_authority:false};
 let body;
 try{body=await r.json()}catch{return {status:"CONTRACT_REJECTED",events:[],execution_authority:false}}
 if(!body||body.ok!==true||body.mode!=="slate_sources"||body.contract!=="ATLAS_SLATE_SOURCES_READ_V1"||
   body.execution_authority!==false||body.human_final_gate_required!==true||
   body.slate_date!==slateDate||body.league!==league||
   !Array.isArray(body.canonical_events)||!Array.isArray(body.slate_candidates))
   return {status:"CONTRACT_REJECTED",events:[],execution_authority:false};
 let slate;
 try{slate=assembleUnifiedSlate({
   slateDate,league,canonicalEvents:body.canonical_events,candidates:body.slate_candidates,
   oddsReport:body.odds_report||null,flaimPacket:body.flaim_packet||null,now
 })}catch{return {status:"CONTRACT_REJECTED",events:[],execution_authority:false}}
 // Server-side stale suppression remains authoritative.
 const service=body.source_states||{};
 if(service.draftkings!=="FRESH_RESEARCH"&&slate.totals.dk_reference_quotes>0)
   return {status:"CONTRACT_REJECTED",events:[],execution_authority:false};
 if(service.flaim!=="FRESH_RESEARCH"&&slate.totals.fantasy_leads>0)
   return {status:"CONTRACT_REJECTED",events:[],execution_authority:false};
 return {...slate,status:slate.events.length ? "RESEARCH_SLATE_READY" : "EMPTY_SLATE",service_source_states:service,source_sync:"READ_ONLY",
   paid_api_requests:0,execution_authority:false};
}
