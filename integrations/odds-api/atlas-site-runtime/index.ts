import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";

const allowedOrigin = "https://atlas-command-center-operator-t.tyrollclimaco09.chatgpt.site";
const cors = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-atlas-site-token",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Vary": "Origin",
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: cors });
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET") return json({ ok: false, error: "GET required" }, 405);

  const origin = req.headers.get("origin");
  if (origin && origin !== allowedOrigin) return json({ ok: false, error: "origin not allowed" }, 403);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  // Auth-verified named operator, or legacy hashed site credential.
  // Neither route grants betting execution authority.
  const authorization = req.headers.get("authorization") ?? "";
  const bearer = authorization.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7).trim() : "";
  let authorized = false;

  if (bearer) {
    const { data: identity, error: identityError } = await supabase.auth.getUser(bearer);
    authorized = !identityError && !!identity?.user &&
      identity.user.is_anonymous !== true &&
      identity.user.app_metadata?.atlas_operator === true;
  }

  if (!authorized) {
    const token = (req.headers.get("x-atlas-site-token") ?? "").trim();
    if (token.length < 64) return json({ ok: false, error: "ATLAS operator session or site credential required" }, 401);
    const tokenHash = await sha256Hex(token);
    const { data: credentials, error: credentialError } = await supabase
      .from("atlas_site_reader_credentials_v1")
      .select("token_hash")
      .eq("token_hash", tokenHash)
      .limit(1);
    if (credentialError) return json({ ok: false, stage: "credential_check", error: credentialError.message }, 500);
    if (!credentials?.length) return json({ ok: false, error: "unauthorized site credential" }, 401);
  }

  const url = new URL(req.url);
  const mode = (url.searchParams.get("mode") ?? "board").toLowerCase();

  // ATLAS DraftKings-first research read mode; no provider calls, writes or betting authority.
  // All requests pass the existing operator/site authentication above before this branch.
  if (mode === "dk_odds") {
    const { data: reports, error: reportError } = await supabase
      .from("atlas_site_research_reports_v1")
      .select("delivery_key,title,body,created_at,slate_date,truth_label")
      .like("delivery_key", "atlas-dk-odds-shadow-%")
      .order("created_at", { ascending: false })
      .limit(1);
    if (reportError) return json({ ok: false, mode, status: "READ_FAILED", execution_authority: false }, 503);
    const report = reports?.[0];
    if (!report) return json({
      ok: true, mode, status: "NO_SNAPSHOT", primary_book: "draftkings",
      execution_authority: false, human_final_gate_required: true, data: null
    });
    if (report.truth_label !== "RESEARCH_ONLY" || typeof report.body !== "string" || report.body.length > 80000) {
      return json({ ok: false, mode, status: "SNAPSHOT_CONTRACT_INVALID", execution_authority: false }, 503);
    }
    let frozen: Record<string, unknown>;
    try { frozen = JSON.parse(report.body); } catch {
      return json({ ok: false, mode, status: "SNAPSHOT_JSON_INVALID", execution_authority: false }, 503);
    }
    if (!frozen || frozen.contract !== "ATLAS_DK_FIRST_SHADOW_V1" ||
        frozen.primary_book !== "draftkings" || frozen.execution_authority !== false ||
        !Array.isArray(frozen.events) || frozen.approved_bet !== null ||
        frozen.expected_value !== null) {
      return json({ ok: false, mode, status: "SNAPSHOT_CONTRACT_INVALID", execution_authority: false }, 503);
    }
    const observed = Date.parse(String(frozen.observed_at ?? ""));
    const ageSeconds = Math.floor((Date.now() - observed) / 1000);
    const fresh = Number.isFinite(observed) && ageSeconds >= -60 && ageSeconds <= 900;
    // Never replay stale numbers as actionable current odds.
    return json({
      ok: true, mode, status: fresh ? "FRESH_RESEARCH" : "STALE_REFERENCE",
      provider: "THE_ODDS_API_V4", primary_book: "draftkings",
      secondary_book: "betmgm", data_as_of: frozen.observed_at,
      age_seconds: Number.isFinite(ageSeconds) ? ageSeconds : null,
      snapshot_delivery_key: report.delivery_key,
      human_final_gate_required: true, execution_authority: false,
      executable_price_verified: false,
      data: fresh ? frozen : null,
      stale_summary: fresh ? null : { events_seen: Array.isArray(frozen.events) ? frozen.events.length : 0,
        refresh_required: true, last_observed_at: frozen.observed_at }
    });
  }

  if (mode === "board") {
    const { data, error } = await supabase.from("atlas_operator_command_board_v5")
      .select("candidate_key,sport,league,away_team,home_team,lifecycle_status,truth_label,next_action,expires_at,expiry_status,missing_information_status,root_thesis_tags,cluster_ids,primary_failure_path,contract_status,blocker_codes,trace_status,updated_at,queue_priority,queue")
      .order("queue_priority", { ascending: true }).order("updated_at", { ascending: false }).limit(100);
    if (error) return json({ ok: false, stage: "board", error: error.message }, 500);
    return json({ ok: true, mode, human_final_gate_required: true, execution_authority: false, data });
  }

  if (mode === "candidate") {
    const candidateKey = (url.searchParams.get("candidate_key") ?? "").trim();
    if (!candidateKey) return json({ ok: false, error: "candidate_key required" }, 400);
    const { data, error } = await supabase.from("atlas_unified_decision_packet_v1")
      .select("candidate_key,event_id,event_canonical_key,sport,league,event_date,start_time,away_team,home_team,state_version,lifecycle_status,trace_status,truth_label,decision_cutoff,next_action,expires_at,expiry_trigger,why_not_bet,root_thesis_tags,cluster_ids,unresolved_information_flags,primary_failure_path,oracle_independent,sentinel_valid,provenance_valid,state_valid,decision_type,oracle_probability,fair_price,edge_thief_objections,decision_sentinel_status,tactician_plan,final_decision,decision_rationale,gate_status,final_gate_checked_at,market_state_valid,final_gate_sentinel_valid,final_gate_provenance_valid,exposure_valid,executable_price_verified,execution_price_binding_id,execution_receipt_id,stop_price,approved_stake,invariant_status,invariant_failures,bet_status,result,closing_odds,clv,profit_loss,post_bet_grade,lesson,settled_at,evidence_lineage_rows,independent_evidence_groups,packet_version_count,contract_status,blocker_codes,official_source_gate_status,expiry_status,missing_information_status")
      .eq("candidate_key", candidateKey).limit(1);
    if (error) return json({ ok: false, stage: "candidate", error: error.message }, 500);
    return json({ ok: true, mode, human_final_gate_required: true, execution_authority: false, data: data?.[0] ?? null });
  }

  if (mode === "reassessment") {
    const { data, error } = await supabase.from("atlas_reassessment_queue_v1")
      .select("change_impact_id,candidate_key,event_id,state_version,dependency_type,dependency_key,affected_assumption,root_tag,cluster_id,impact_severity,reassessment_deadline,lifecycle_status,next_action,queue_priority,metadata,created_at")
      .order("queue_priority", { ascending: true }).order("created_at", { ascending: false }).limit(100);
    if (error) return json({ ok: false, stage: "reassessment", error: error.message }, 500);
    return json({ ok: true, mode, data });
  }

  if (mode === "alerts") {
    const { data, error } = await supabase.from("atlas_alert_queue_v1")
      .select("alert_id,alert_type,severity,candidate_key,event_id,first_seen_at,last_seen_at,occurrence_count,payload,status,default_action,escalation_state")
      .eq("operator_visible", true).order("last_seen_at", { ascending: false }).limit(100);
    if (error) return json({ ok: false, stage: "alerts", error: error.message }, 500);
    return json({ ok: true, mode, data });
  }

  if (mode === "slate2") {
    const candidateKey = (url.searchParams.get("candidate_key") ?? "").trim();
    let query = supabase.from("atlas_slate_run_v2_1_refined_surface").select("*").limit(candidateKey ? 1 : 100);
    if (candidateKey) query = query.eq("candidate_key", candidateKey);
    const { data, error } = await query;
    if (error) return json({ ok: false, stage: "slate2", error: error.message }, 500);
    return json({ ok: true, mode, phase: "HARDENED_SLATE_RUN_GH01_V2_2", human_final_gate_required: true, execution_authority: false, data: candidateKey ? (data?.[0] ?? null) : data });
  }

  if (mode === "memory") {
    const candidateKey = (url.searchParams.get("candidate_key") ?? "").trim();
    if (!candidateKey) return json({ ok: false, error: "candidate_key required" }, 400);
    const { data, error } = await supabase.from("atlas_reusable_context_v2")
      .select("*").eq("candidate_key", candidateKey).order("observed_at", { ascending: false }).limit(100);
    if (error) return json({ ok: false, stage: "memory", error: error.message }, 500);
    return json({ ok: true, mode, production_authority: false, data });
  }

  if (mode === "data") {
    const [pipeline, utilization, debt, ingest] = await Promise.all([
      supabase.from("atlas_data_pipeline_health_v1").select("*").order("capability", { ascending: true }),
      supabase.from("atlas_data_utilization_health_v3").select("*").order("datum_type", { ascending: true }),
      supabase.from("atlas_automation_pipeline_debt_v1").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("atlas_automation_ingest_runs_v1")
        .select("id,automation_key,run_key,observed_at,slate_date,candidate_key,source_claims_written,negative_discoveries_written,root_factors_written,fingerprints_written,expressions_written,finite_resource_audits_written,deferred_candidate_items,persistence_status,linked_at,created_at")
        .order("created_at", { ascending: false }).limit(50),
    ]);
    const firstError = pipeline.error ?? utilization.error ?? debt.error ?? ingest.error;
    if (firstError) return json({ ok: false, stage: "data", error: firstError.message }, 500);
    return json({
      ok: true,
      mode,
      production_authority: false,
      truth_model: { ingested: "verified persistence", available: "reusable memory exists", used: "verified usage receipt" },
      pipeline: pipeline.data,
      utilization: utilization.data,
      pipeline_debt: debt.data,
      latest_ingest_runs: ingest.data,
    });
  }

  if (mode === "capabilities") {
    const { data, error } = await supabase.from("atlas_slate_run_v2_capability_health")
      .select("*").order("node", { ascending: true }).order("capability", { ascending: true });
    if (error) return json({ ok: false, stage: "capabilities", error: error.message }, 500);
    return json({ ok: true, mode, production_authority: false, note: "utilization/telemetry only; zero rows means dormant, not broken", data });
  }

  if (mode === "health") {
    const [intake, integration, frozenIntegration, production, slate2, pipeline, utilization, debt, githubIntegration, diagnostics, sportAdapters, bullshit] = await Promise.all([
      supabase.from("atlas_runtime_intake_alignment_v1").select("*").limit(10),
      supabase.from("atlas_integration_readiness_live_v1").select("*").limit(10),
      supabase.from("atlas_integration_readiness_current_v1").select("*").limit(10),
      supabase.from("atlas_production_readiness_surface").select("*").limit(10),
      supabase.from("atlas_slate_run_v2_capability_health").select("*"),
      supabase.from("atlas_data_pipeline_health_v1").select("*"),
      supabase.from("atlas_data_utilization_health_v3").select("*"),
      supabase.from("atlas_automation_pipeline_debt_v1").select("*").limit(100),
      supabase.from("atlas_gh01_integration_health_v1").select("*").order("sort_order", { ascending: true }),
      supabase.from("atlas_system_diagnostics_v1").select("*").limit(10),
      supabase.from("atlas_sport_adapter_live_health_v1").select("*").order("league", { ascending: true }),
      supabase.from("atlas_bullshit_detector_v2").select("*").order("severity", { ascending: false }),
    ]);
    const firstError = intake.error ?? integration.error ?? frozenIntegration.error ?? production.error ?? slate2.error ?? pipeline.error ?? utilization.error ?? debt.error ?? githubIntegration.error ?? diagnostics.error ?? sportAdapters.error ?? bullshit.error;
    if (firstError) return json({ ok: false, stage: "health", error: firstError.message }, 500);
    return json({
      ok: true,
      mode,
      human_final_gate_required: true,
      execution_authority: false,
      runtime_intake: intake.data,
      integration: integration.data,
      frozen_integration_legacy_diagnostic: frozenIntegration.data,
      production_readiness: production.data,
      slate2_capabilities: slate2.data,
      data_pipeline: pipeline.data,
      data_utilization: utilization.data,
      data_pipeline_debt: debt.data,
      github_integration: githubIntegration.data,
      diagnostics: diagnostics.data,
      sport_adapter_health: sportAdapters.data,
      bullshit_detector: bullshit.data,
    });
  }

  return json({ ok: false, error: "unsupported mode", allowed_modes: ["board", "candidate", "reassessment", "alerts", "slate2", "memory", "data", "capabilities", "health", "dk_odds"] }, 400);
});
