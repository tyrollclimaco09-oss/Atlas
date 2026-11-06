import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";

// ATLAS Slate V10: existing canonical evidence only. Read-only; cannot bet, approve or create a model.
const allowedOrigin="https://atlas-command-center-operator-t.tyrollclimaco09.chatgpt.site";
const cors={
 "Access-Control-Allow-Origin":allowedOrigin,
 "Access-Control-Allow-Headers":"authorization, apikey, x-atlas-site-token, content-type",
 "Access-Control-Allow-Methods":"GET, OPTIONS",
 "Access-Control-Max-Age":"1800",
 "Vary":"Origin",
 "Cache-Control":"no-store"
};
const expectedNodes=["SCOUT","FILTER_VERIFY","EDGE_THIEF","ORACLE","PRICING","KAIROS","SENTINEL","TACTICIAN","HUMAN_FINAL_GATE","LEDGER","FORENSICS","CALIBRATOR"];
function respond(body:unknown,status=200){return Response.json(body,{status,headers:cors});}
function fail(status:string,mode:string,code=503){return respond({ok:false,mode,status,execution_authority:false,human_final_gate_required:true},code);}
async function hash(s:string){const h=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return Array.from(new Uint8Array(h),b=>b.toString(16).padStart(2,"0")).join("");}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 if(req.method!=="GET")return fail("READ_ONLY_GET_REQUIRED","unknown",405);
 if(req.headers.get("origin") && req.headers.get("origin")!==allowedOrigin)return fail("ORIGIN_FORBIDDEN","unknown",403);
 const supabaseUrl=Deno.env.get("SUPABASE_URL"),serviceKey=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!supabaseUrl||!serviceKey)return fail("SERVER_CONFIG_UNAVAILABLE","unknown");
 const db=createClient(supabaseUrl,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const auth=req.headers.get("authorization")??"";
 const bearer=/^Bearer\s+/i.test(auth)?auth.replace(/^Bearer\s+/i,"").trim():"";
 let authorized=false;
 if(bearer){
  const {data,error}=await db.auth.getUser(bearer);
  authorized=!error && !!data?.user && data.user.is_anonymous!==true && data.user.app_metadata?.atlas_operator===true;
 }
 if(!authorized){
  const token=(req.headers.get("x-atlas-site-token")??"").trim();
  if(token.length<64||token.length>1024)return fail("OPERATOR_AUTH_REQUIRED","unknown",401);
  const {data,error}=await db.from("atlas_site_reader_credentials_v1").select("token_hash").eq("token_hash",await hash(token)).limit(1);
  if(error)return fail("AUTH_SOURCE_UNAVAILABLE","unknown");
  authorized=!!data?.length;
 }
 if(!authorized)return fail("OPERATOR_AUTH_REQUIRED","unknown",401);
 const parsed=new URL(req.url),mode=parsed.searchParams.get("mode")??"slate";
 const common={execution_authority:false,production_authority:false,human_final_gate_required:true,contract:"ATLAS_SLATE_DUO_V10_READ_ONLY",mode};
 if(mode==="slate"){
  const key=parsed.searchParams.get("run_key")??"ATLAS-NBA-20261106-V10-RESEARCH-R1";
  if(!/^ATLAS-[A-Z0-9-]{12,110}$/.test(key))return fail("INVALID_RUN_KEY",mode,400);
  const {data:run,error:e1}=await db.from("atlas_slate_research_runs_v10")
   .select("run_key,slate_date,timezone,league,source_system,source_observed_at,source_reference,event_manifest,event_count,outcome_status,production_authority,real_betting_authority,created_at")
   .eq("run_key",key).maybeSingle();
  if(e1)return fail("SLATE_DB_READ_FAILED",mode);
  if(!run)return respond({ok:true,...common,status:"NO_SLATE_RUN",run:null,stages:[],duo_status:"NO_INDEPENDENT_PROOF",final_gate_status:"BLOCKED"});
  if(run.production_authority!==false||run.real_betting_authority!==false)return fail("SLATE_AUTHORITY_CONTRACT_INVALID",mode);
  const {data:stages,error:e2}=await db.from("atlas_slate_node_receipts_v10")
   .select("receipt_key,node_key,candidate_key,state,evidence_source,evidence_observed_at,decision_cutoff,provenance_label,payload,production_authority,real_betting_authority,created_at")
   .eq("run_key",key).order("created_at",{ascending:false}).limit(250);
  if(e2)return fail("SLATE_STAGE_DB_READ_FAILED",mode);
  const latest=new Map<string,unknown>();
  for(const s of (stages??[])){
   if(s.production_authority!==false||s.real_betting_authority!==false)return fail("NODE_AUTHORITY_INVALID",mode);
   if(!latest.has(s.node_key))latest.set(s.node_key,s);
  }
  const {data:modules,error:moduleError}=await db.from("atlas_cortex_feature_bindings_v1")
   .select("feature_key,owner_node,state,source_pr,production_authority").order("feature_key").limit(30);
  if(moduleError||!Array.isArray(modules)||modules.some(x=>x.production_authority!==false))return fail("RESEARCH_MODULE_REGISTRY_UNAVAILABLE",mode);
  const missing=expectedNodes.filter(n=>!latest.has(n));
  if(missing.length)return fail("NODE_COVERAGE_INCOMPLETE",mode);
  const nodes=expectedNodes.map(n=>latest.get(n));
  const duo=nodes.filter((n:any)=>n.node_key==="ORACLE"||n.node_key==="EDGE_THIEF");
  return respond({ok:true,...common,status:"WATCH_RESEARCH_ONLY",run,nodes,duo_status:duo.every((n:any)=>n.state==="RESEARCH_ONLY")?"RESEARCH_REQUIRES_NATIVE_PROOF":"MISSING_FROZEN_DUO_EVIDENCE",
   final_gate_status:"BLOCKED_UNTIL_NATIVE_GATE_AND_OPERATOR",research_modules:modules,required_nodes:expectedNodes});
 }
 if(mode==="candidate"){
  const candidate=parsed.searchParams.get("candidate_key")??"";
  if(!/^[a-zA-Z0-9_.:-]{8,140}$/.test(candidate))return fail("INVALID_CANDIDATE_KEY",mode,400);
  const {data:spine,error}=await db.from("candidate_spine_trace")
   .select("candidate_key,event_id,state_version,decision_cutoff,truth_label,lifecycle_status,trace_status,oracle_independent,provenance_valid,state_valid,sentinel_valid,final_gate_id,tactician_id,expires_at")
   .eq("candidate_key",candidate).maybeSingle();
  if(error)return fail("CANDIDATE_DB_READ_FAILED",mode);
  if(!spine)return respond({ok:true,...common,status:"NO_NATIVE_CANDIDATE",candidate_key:candidate,duo:{oracle:null,edge_thief:null},final_gate:null});
  const [oracle,edge,kairos,sentinel,risk,gate]=await Promise.all([
   db.from("atlas_oracle_independence_proofs").select("id,proof_status,independent_evidence_groups,decision_cutoff,edge_thief_id,created_at").eq("candidate_key",candidate).order("created_at",{ascending:false}).limit(1),
   db.from("edge_thief_shadow").select("id,attack_class,challenge_status,severity,evidence_cutoff,state_version,created_at").eq("candidate_key",candidate).order("created_at",{ascending:false}).limit(10),
   db.from("atlas_kairos_arbitrations").select("id,actionability,decision_cutoff,execution_price_binding_id,created_at").eq("candidate_key",candidate).order("created_at",{ascending:false}).limit(1),
   db.from("atlas_sentinel_validity_proofs").select("id,proof_status,decision_cutoff,created_at").eq("candidate_key",candidate).order("created_at",{ascending:false}).limit(1),
   db.from("atlas_tactician_risk_proofs").select("id,proof_status,cluster_coverage_status,decision_cutoff,created_at").eq("candidate_key",candidate).order("created_at",{ascending:false}).limit(1),
   db.from("final_gate_checks").select("id,gate_status,checked_at,executable_price_verified,operator_approved_at,execution_receipt_id,decision_cutoff,invariant_status,invariant_failures")
     .eq("id",spine.final_gate_id??"00000000-0000-0000-0000-000000000000").limit(1)
  ]);
  if([oracle,edge,kairos,sentinel,risk,gate].some(x=>x.error))return fail("NATIVE_PROOF_DB_READ_FAILED",mode);
  const oracleRow=oracle.data?.[0]??null;
  const edgeRows=edge.data??[];
  const gateRow=gate.data?.[0]??null;
  const now=Date.now(),cutoff=Date.parse(spine.decision_cutoff??"");
  const freshDeadline=Number.isFinite(cutoff)&&cutoff>=now &&
   (!spine.expires_at||Date.parse(spine.expires_at)>now);
  const duoReady=freshDeadline&&spine.oracle_independent===true&&
   oracleRow?.proof_status==="PASS"&&oracleRow?.independent_evidence_groups>=2&&
   Date.parse(oracleRow?.decision_cutoff??"")===cutoff&&
   edgeRows.length>0&&edgeRows.every(x=>x.state_version===spine.state_version)&&
   edgeRows.every(x=>Number.isFinite(Date.parse(x.evidence_cutoff))&&Date.parse(x.evidence_cutoff)<=cutoff)&&
   edgeRows.every(x=>["CLEARED","RESOLVED","NO_OBJECTION"].includes(x.challenge_status));
  const checkedAt=Date.parse(gateRow?.checked_at??"");
  const gateNative=freshDeadline&&spine.state_valid===true&&spine.provenance_valid===true&&spine.sentinel_valid===true&&!!gateRow&&gateRow.executable_price_verified===true&&
   gateRow.gate_status==="READY_FOR_OPERATOR"&&gateRow.invariant_status==="PASS"&&
   Number.isFinite(checkedAt)&&checkedAt<=now&&now-checkedAt<=300000;
  return respond({ok:true,...common,status:gateNative&&duoReady?"NATIVE_READY_FOR_HUMAN_REVIEW":"WATCH_OR_BLOCKED",
   candidate_key:candidate,
   canonical:{state_version:spine.state_version,decision_cutoff:spine.decision_cutoff,truth_label:spine.truth_label,lifecycle_status:spine.lifecycle_status,provenance_valid:spine.provenance_valid,state_valid:spine.state_valid,expires_at:spine.expires_at},
   duo:{oracle:oracleRow,edge_thief:edgeRows,independent_pair_verified:duoReady},
   kairos:kairos.data?.[0]??null,sentinel:sentinel.data?.[0]??null,tactician:risk.data?.[0]??null,
   final_gate:{state:gateRow?.gate_status??"MISSING",executable_price_verified:gateRow?.executable_price_verified===true,operator_approval_recorded:!!gateRow?.operator_approved_at,execution_receipt_present:!!gateRow?.execution_receipt_id},
   approval_and_execution_performed_by_this_route:false});
 }
 return fail("UNKNOWN_MODE",mode,400);
});