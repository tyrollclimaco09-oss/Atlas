import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";
import { normalizeSignal } from "./core.mjs";

// RILL operator-only evidence ingress. Deployment does NOT enable betting decisions.
const reply=(body,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store","Content-Type":"application/json"}});
async function digest(value){
 const data=new TextEncoder().encode(value);
 return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",data))).map(x=>x.toString(16).padStart(2,"0")).join("");
}
Deno.serve(async (req)=>{
 if(req.method!=="POST")return reply({ok:false,error:"POST_REQUIRED"},405);
 if(req.headers.get("origin"))return reply({ok:false,error:"BROWSER_ORIGIN_BLOCKED"},403);
 const length=Number(req.headers.get("content-length")||0);
 if(length>9000)return reply({ok:false,error:"BODY_TOO_LARGE"},413);
 const bearerHeader=req.headers.get("authorization")||"";
 const bearer=/^Bearer (.+)$/i.exec(bearerHeader)?.[1]?.trim();
 if(!bearer)return reply({ok:false,error:"BEARER_REQUIRED"},401);
 const secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
 const url=Deno.env.get("SUPABASE_URL")||"";
 if(!url||!secret)return reply({ok:false,error:"SERVICE_UNAVAILABLE"},503);
 const client=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const [supplied,expected]=await Promise.all([digest(bearer),digest(secret)]);
 let authorized=supplied===expected;
 if(!authorized){
   const {data,error}=await client.auth.getUser(bearer);
   authorized=!error && !!data?.user && data.user.is_anonymous!==true && data.user.app_metadata?.atlas_operator===true;
 }
 if(!authorized)return reply({ok:false,error:"OPERATOR_REQUIRED"},403);
 let raw;try{
   const text=await req.text();
   if(text.length>9000) return reply({ok:false,error:"BODY_TOO_LARGE"},413);
   raw=JSON.parse(text);
 }catch{return reply({ok:false,error:"JSON_REQUIRED"},400)}
 const mode=raw?.mode;
 if(mode==="list"){
   const limit=Number.isInteger(raw.limit)?raw.limit:10;
   if(limit<1||limit>25)return reply({ok:false,error:"LIMIT_INVALID"},400);
   let query=client.from("atlas_human_signal_releases_v1").select("id,source_key,released_at,captured_at,exact_market,exact_line,exact_odds,message_fingerprint,source_reference,availability_status,metadata,production_influence").order("captured_at",{ascending:false}).limit(limit);
   if(raw.source_key!==undefined){
     if(typeof raw.source_key!=="string"||raw.source_key.length>100)return reply({ok:false,error:"SOURCE_KEY_INVALID"},400);
     query=query.eq("source_key",raw.source_key);
   }
   const {data,error}=await query;
   if(error)return reply({ok:false,error:"LIST_FAILED"},503);
   return reply({ok:true,mode:"SHADOW_LIST",count:data?.length||0,rows:data||[],production_authority:false});
 }
 if(mode!=="preview" && mode!=="persist")return reply({ok:false,error:"MODE_INVALID"},400);
 let signal;try{signal=normalizeSignal(raw,new Date().toISOString())}
 catch(err){return reply({ok:false,error:String(err?.message||"SIGNAL_REJECTED")},422)}
 const fingerprint=await digest(JSON.stringify([signal.source_key,signal.source_url,signal.released_at,signal.claim,signal.market,signal.line,signal.odds]));
 const originHash=await digest(signal.root_url);
 const receipt={ok:true,mode:mode==="preview"?"SHADOW_PREVIEW":"SHADOW_PERSIST",fingerprint,origin_chain_id:originHash,signal,independent_confirmation:false,recorded_win_rate:null,estimated_edge:null,production_authority:false,bet_authority:false,model_weight:0,human_final_gate_required:true};
 if(mode==="preview")return reply(receipt);
 const registry={
   source_key:signal.source_key,display_name:signal.display_name,source_type:signal.source_type,
   sport_scope:[signal.sport],market_scope:signal.market?[signal.market]:[],
   claim_scope:["SOCIAL_BETTING_HYPOTHESIS"],full_history_capture:false,
   factual_accuracy_status:"UNMEASURED",timing_value_status:"UNMEASURED",clv_status:"UNMEASURED",
   allowed_atlas_role:"DISCOVERY_ONLY",status:"SHADOW",production_authority:false
 };
 const {error:registerError}=await client.from("atlas_human_signal_registry_v1").upsert(registry,{onConflict:"source_key",ignoreDuplicates:true});
 if(registerError)return reply({ok:false,error:"SOURCE_REGISTRATION_FAILED"},503);
 const {data:found,error:readError}=await client.from("atlas_human_signal_releases_v1").select("id").eq("message_fingerprint",fingerprint).limit(1);
 if(readError)return reply({ok:false,error:"DUPLICATE_CHECK_FAILED"},503);
 if(found?.length)return reply({...receipt,duplicate:true,release_id:found[0].id,claims_written:0});
 const {data:saved,error:saveError}=await client.from("atlas_human_signal_releases_v1").insert({
   source_key:signal.source_key,released_at:signal.released_at,captured_at:signal.observed_at,
   exact_market:signal.market,exact_line:signal.line,exact_odds:signal.odds,
   message_fingerprint:fingerprint,source_reference:signal.source_url,
   availability_status:"UNKNOWN",production_influence:false,
   metadata:{
     schema:"atlas.rill.operator-intake.v1",claim:signal.claim,sport:signal.sport,
     event_label:signal.event_label,source_type:signal.source_type,
     observed_at:signal.observed_at,root_url:signal.root_url,origin_chain_id:originHash,
     origin_assertion:signal.origin_assertion,release_time_trust:signal.release_time_trust,
     verification_state:"UNVERIFIED",allowed_role:"DISCOVERY_ONLY",
     independent_confirmation:false,pricing_authority:false,execution_authority:false
   }
 }).select("id,source_key,message_fingerprint").single();
 if(saveError)return reply({ok:false,error:"RELEASE_SAVE_FAILED"},503);
 const {data:readback,error:checkError}=await client.from("atlas_human_signal_releases_v1").select("id,message_fingerprint,production_influence").eq("id",saved.id).single();
 if(checkError||readback?.message_fingerprint!==fingerprint || readback?.production_influence!==false)
   return reply({ok:false,error:"PERSISTED_BUT_READBACK_UNVERIFIED",release_id:saved.id},503);
 return reply({...receipt,duplicate:false,release_id:saved.id,readback_verified:true,claims_written:1,
   idempotency:"SEQUENTIAL_BEST_EFFORT;NO_UNIQUE_FINGERPRINT_CONSTRAINT"});
});
