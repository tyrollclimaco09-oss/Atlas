// ATLAS Cortex V9: read-only interface; the operator session comes from the real site.
export const ALLOWED_MODES=Object.freeze(["manifest","receipts","health"]);
export function validateCortexResponse(r,mode){
  if(!r||typeof r!=="object"||r.ok!==true||r.execution_authority!==false||
     r.production_authority!==false||r.human_final_gate_required!==true||
     r.scope!=="ATLAS_CORTEX_V9_LAB"||r.mode!==mode)throw new Error("ATLAS_CONTRACT_MISMATCH");
  if(mode==="manifest"&&(!Array.isArray(r.modules)||r.modules.some(x=>x.production_authority!==false||!x.feature_key||!x.owner_node)))throw new Error("ATLAS_MANIFEST_INVALID");
  if(mode==="receipts"&&(!Array.isArray(r.receipts)||r.receipts.some(x=>x.production_authority!==false)))throw new Error("ATLAS_RECEIPTS_INVALID");
  if(mode==="health"&&(!Number.isInteger(r.registered_module_count)||r.registered_module_count<0||
     r.live_origin_verified!==false||r.book_account_price_verified!==false))throw new Error("ATLAS_HEALTH_INVALID");
  return r;
}
export async function fetchCortexRead({endpoint,mode="manifest",operatorJwt,siteToken,apikey,fetchImpl=fetch,signal}){
  if(!ALLOWED_MODES.includes(mode))throw new Error("ATLAS_MODE_INVALID");
  const u=new URL(endpoint);
  if(u.protocol!=="https:"&&u.hostname!=="localhost")throw new Error("ATLAS_SECURE_ENDPOINT_REQUIRED");
  if(!u.pathname.endsWith("/atlas-cortex-read-v9"))throw new Error("ATLAS_ENDPOINT_MISMATCH");
  if(!operatorJwt&&!siteToken)throw new Error("ATLAS_OPERATOR_SESSION_REQUIRED");
  u.searchParams.set("mode",mode);
  const headers={"Accept":"application/json"};
  if(operatorJwt)headers.Authorization=`Bearer ${operatorJwt}`;
  if(siteToken)headers["x-atlas-site-token"]=siteToken;
  if(apikey)headers.apikey=apikey;
  const res=await fetchImpl(u.toString(),{method:"GET",headers,cache:"no-store",signal});
  if(!res.ok)throw new Error(`ATLAS_BRIDGE_HTTP_${res.status}`);
  return validateCortexResponse(await res.json(),mode);
}