import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ ok: false, endpoint_ok: true, error: "GET required" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase
    .from("atlas_db_health_read_model_v1")
    .select("*")
    .single();

  if (error) {
    return new Response(JSON.stringify({
      ok: false,
      endpoint_ok: true,
      system: "ATLAS",
      check: "core-health-v7",
      timestamp: new Date().toISOString(),
      health_state: "DEGRADED",
      check_complete: false,
      query_failures: ["DB_HEALTH_READ_MODEL_QUERY_FAILED"],
      probe_budget: { database_calls_per_request: 1 },
      human_gate_required: true,
      automatic_parameter_promotion: false,
    }), { status: 503, headers: { "content-type": "application/json" } });
  }

  // No market observation, invalid/future clock or invalid DB metrics must never be green.
  const latest = data?.latest_market_snapshot_at ?? null;
  const now = Date.now();
  const snapshotMs = latest ? new Date(latest).getTime() : NaN;
  const ageMs = now - snapshotMs;
  const ageMinutes = Number.isFinite(snapshotMs) && ageMs >= -60_000
    ? Math.round(Math.max(0, ageMs) / 60_000) : null;
  const freshness = ageMinutes === null ? "UNKNOWN"
    : ageMinutes <= 30 ? "HEALTHY" : ageMinutes <= 120 ? "DEGRADED" : "STALE";
  const dbMetricsValid = Number.isSafeInteger(data.total_connections) &&
    data.total_connections >= 0 && Number.isSafeInteger(data.max_connections) &&
    data.max_connections > 0;
  const dbPressure = dbMetricsValid ? data.total_connections / data.max_connections : null;
  const healthState = freshness === "STALE" ? "STALE"
    : freshness !== "HEALTHY" || !dbMetricsValid || dbPressure >= 0.8
      ? "DEGRADED" : "HEALTHY";

  return new Response(JSON.stringify({
    ok: true,
    endpoint_ok: true,
    system: "ATLAS",
    check: "core-health-v7",
    timestamp: new Date().toISOString(),
    health_state: healthState,
    check_complete: true,
    query_failures: [],
    probe_budget: { database_calls_per_request: 1, previous: 4, original: 17 },
    database: {
      bytes: data.database_bytes,
      total_connections: data.total_connections,
      active_connections: data.active_connections,
      idle_in_transaction_connections: data.idle_in_transaction_connections,
      max_connections: data.max_connections,
      pressure_ratio: dbPressure,
    },
    market_ingestion: {
      latest_snapshot_at: latest,
      age_minutes: ageMinutes,
      freshness,
      freshness_scope: "GLOBAL_MARKET_SNAPSHOTS_ONLY",
      multisport_complete: false,
      latest_ingestion_status: data.latest_ingestion_status,
    },
    proof_counts: {
      bets: data.bets,
      outcomes: data.outcomes,
      decisions: data.decisions,
      oracle_independence_pass: data.oracle_independence_pass,
      execution_price_bindings: data.execution_price_bindings,
      kairos_act: data.kairos_act,
      sentinel_validity_pass: data.sentinel_validity_pass,
      tactician_risk_pass: data.tactician_risk_pass,
      trace_pass: data.trace_pass,
      final_gate_pass: data.final_gate_pass,
      calibration_samples: data.calibration_samples,
    },
    release: data.active_release,
    calibrator_evolution: {
      stage: data.calibrator_evolution_stage,
      operator_approved: data.calibrator_operator_approved,
    },
    human_gate_required: true,
    production_execution_authority: false,
    automatic_parameter_promotion: false,
  }), { headers: { "content-type": "application/json" } });
});
