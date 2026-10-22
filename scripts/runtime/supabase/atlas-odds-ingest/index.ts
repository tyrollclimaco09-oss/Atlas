import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ATLAS P0 HOLD (2026-10-22): legacy provider handler retired.
// NO upstream request, quota spend, database mutation, secrets, or betting authority.
// Restoration requires a separately verified quota-gated implementation and release approval.
Deno.serve((request: Request) => {
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };
  if (request.method !== "POST")
    return Response.json({ok:false,code:"POST_REQUIRED",execution_authority:false}, {status:405,headers});
  return Response.json({
    ok:false,code:"LEGACY_ODDS_INGEST_DISABLED",
    quota_spend_authorized:false,external_api_calls:0,execution_authority:false,
    next_action:"USE_REVIEWED_QUOTA_GATED_CONNECTOR"
  }, {status:410,headers});
});
