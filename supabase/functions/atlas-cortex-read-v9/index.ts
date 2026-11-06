import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";

// ATLAS Cortex V9: authenticated, READ-ONLY, no price intake, no bets.
const allowedOrigin = "https://atlas-command-center-operator-t.tyrollclimaco09.chatgpt.site";
const cors = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, apikey, x-atlas-site-token, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "1800",
  "Vary": "Origin"
};
const headers = { ...cors, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
function respond(body: unknown, status=200) { return Response.json(body, {status,headers}); }
async function sha256(s: string) {
  const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));
  return Array.from(new Uint8Array(hash), b=>b.toString(16).padStart(2,"0")).join("");
}
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok",{headers});
  if (req.method !== "GET") return respond({ok:false,error:"READ_ONLY_GET_REQUIRED"},405);
  const origin=req.headers.get("origin");
  if (origin && origin !== allowedOrigin) return respond({ok:false,error:"ORIGIN_NOT_ALLOWED"},403);
  const url=Deno.env.get("SUPABASE_URL"),secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !secret) return respond({ok:false,status:"SERVER_CONFIG_UNAVAILABLE",execution_authority:false},503);
  const db=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
  const authorization=req.headers.get("authorization") ?? "";
  const bearer=/^Bearer\s+/i.test(authorization)?authorization.replace(/^Bearer\s+/i,"").trim():"";
  let authorized=false;
  if (bearer) {
    const {data,error}=await db.auth.getUser(bearer);
    authorized=!error && !!data?.user && data.user.is_anonymous!==true && data.user.app_metadata?.atlas_operator===true;
  }
  if(!authorized) {
    const token=(req.headers.get("x-atlas-site-token")??"").trim();
    if(token.length<64 || token.length>1024) return respond({ok:false,error:"OPERATOR_AUTH_REQUIRED"},401);
    const {data,error}=await db.from("atlas_site_reader_credentials_v1")
      .select("token_hash").eq("token_hash",await sha256(token)).limit(1);
    if(error) return respond({ok:false,status:"OPERATOR_AUTH_CHECK_UNAVAILABLE",execution_authority:false},503);
    authorized=!!data?.length;
  }
  if(!authorized) return respond({ok:false,error:"OPERATOR_AUTH_REQUIRED"},401);
  const mode=new URL(req.url).searchParams.get("mode")??"manifest";
  const common={execution_authority:false,production_authority:false,human_final_gate_required:true,scope:"ATLAS_CORTEX_V9_LAB",mode};
  if(mode==="manifest") {
    const {data,error}=await db.from("atlas_cortex_feature_bindings_v1")
      .select("feature_key,feature_version,owner_node,source_pr,source_commit_sha,source_path,test_path,state,evidence_label,production_authority")
      .order("feature_key",{ascending:true}).limit(30);
    if(error) return respond({ok:false,...common,status:"DB_READ_FAILED"},503);
    if(!Array.isArray(data)||data.some(x=>x.production_authority!==false))return respond({ok:false,...common,status:"CONTRACT_INVALID"},503);
    return respond({ok:true,...common,status:"READ_ONLY_MANIFEST",modules:data});
  }
  if(mode==="receipts") {
    const {data,error}=await db.from("atlas_cortex_release_receipts_v1")
      .select("receipt_key,integration_version,node_key,evidence_type,evidence_status,evidence_scope,source_reference,observed_at,created_at,production_authority")
      .order("created_at",{ascending:false}).limit(25);
    if(error) return respond({ok:false,...common,status:"DB_READ_FAILED"},503);
    if(!Array.isArray(data)||data.some(x=>x.production_authority!==false))return respond({ok:false,...common,status:"CONTRACT_INVALID"},503);
    return respond({ok:true,...common,status:"READ_ONLY_RECEIPTS",receipts:data});
  }
  if(mode==="health") {
    const {count,error}=await db.from("atlas_cortex_feature_bindings_v1").select("feature_key",{head:true,count:"exact"});
    if(error||count===null)return respond({ok:false,...common,status:"DB_READ_FAILED"},503);
    return respond({ok:true,...common,status:"DB_REACHABLE_RESEARCH_ONLY",registered_module_count:count,book_account_price_verified:false,validated_prediction_model:false,live_origin_verified:false});
  }
  return respond({ok:false,...common,error:"UNKNOWN_MODE"},400);
});