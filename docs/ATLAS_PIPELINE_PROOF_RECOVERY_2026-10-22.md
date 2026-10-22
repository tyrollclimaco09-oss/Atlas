# ATLAS / Source-to-Proof Reconciliation — 2026-10-22
Status: connected Supabase + Vercel + GitHub read-only audit, SHADOW-only code. No sportsbook calls, no deployment, no Supabase writes, no betting execution.

## Grounded state
- Supabase: 258 tables and 442 views. Nine ACTIVE functions. A healthy database is not an operating data pipeline.
- Legacy odds lane: 1 ingestion run and 11 ingestion records; 532 market snapshots, most recent Aug 10 UTC.
- Parallel automation research lane: 316 runs, 313 PERSISTED_VERIFIED with production_authority=false; 624 source claims. TEMPORAL_DATA_LOG generated 285 runs / 524 claims, Opening Brief 23 runs / 78 claims. These are persisted research summaries/claims, NOT proven independent real statistics feeds.
- Feed liveness: 0 atlas_feed_heartbeats_v1 rows and empty atlas_feed_health_v1. Operational state MANUAL_ONLY.
- Oracle: 3 verified datasets, 5 validation rows on HOLD, 0 validated models.
- Calibrator: 21 bets/21 outcomes in older tables, but 0 oracle independence proofs and 0 calibration memberships; stage WAIT_FIRST_CAUSAL_OUTCOME.
- Existing execution ingress health: eight receipts, five matched and three partial (two missing identity, one pending canonicalization).
- Release R3: 12 pass, 5 fail, 4 await genuine samples. RED/BLOCKED. Nine critical function hash drifts (no missing objects, 196 matches). Verify each change against pinned manifest; DO NOT silently refreeze.
- Vercel: atlas_x_vercel has configured production Supabase env keys and GitHub-triggered READY previews; Vercel->Supabase authenticated runtime response NOT verified. The private-status project also has READY deployment.
- Cost/security risk: deployed atlas-odds-smoke has verify_jwt=false and publishable-key handler that fetches three paid-market types; atlas-odds-ingest requires JWT service role but can also fetch three market types. Need explicit spend gate/preflight, one-market quota ceiling, allowlisted caller, and safe error-handling before invoking. DO NOT call either for curiosity. No claim of proven exploit.
- Supabase advisers: 81 RLS-on/no-policy notices, 20 unindexed FKs, 211 unused indexes (INFO); no bulk grants or deletes.

## Required chain, without creating a second ATLAS
SCOUT source observation and publisher time -> FILTER/VERIFY identity and provenance -> price-blind ORACLE features/model version -> externally timestamped pregame FREEZE + DK quote -> later independent OFFICIAL OUTCOME -> FORENSICS Brier/log-loss -> CALIBRATOR only when separately admitted. Odds/no-vig pricing alone cannot establish a predictive edge.

## Proof campaign (order matters)
1. P0 Protect quota: review, restrict or disable legacy odds smoke/ingest endpoints before any next paid request. Preserve manual-only quota discipline.
2. P0 Reconcile two partial execution identities and one pending canonicalization; prove one source claim against an original external upstream record and canonical event ID, do not fabricate missing provenance.
3. P0 Prove a single FREE, noncritical feed heartbeat with hash, observed time, TTL, auth and a negative/failure case using existing atlas_feed_heartbeats_v1; UNKNOWN is not HEALTHY.
4. P0 Create THREE real prospective non-wagering forecast packets: independent sports stats, frozen probability/model+feature manifest and timestamped price/screenshot BEFORE tipoff, externally attested commit or append-only DB receipt, official result join AFTER game, plus one rejected stale case. Three only establish pipeline, not profitability.
5. P1 Train an independent price-blind baseline with chronological holdout and compare Brier/log-loss with naive and market benchmarks. No future features or model promotions.
6. P1 Adjudicate nine function definition drifts and five release failures, then reevaluate frozen baseline with human approval; do not rubber-stamp green.
7. P1 Verify protected Vercel preview endpoint -> Supabase least-privilege read with 200 authorized / 401-403 unauthorized, exact deployment SHA and correct preview env. READY is not runtime parity.

## Offline code delivered
scripts/proof/freeze-shadow.cjs requires event IDs, two-outcome NBA/WNBA moneyline, independent source hashes and timestamps, quote timestamp, forecast cutoff, pregame frozen time, and correct outcome chronology. Produces immutable content SHA-256 and Brier/log loss with theoretical quote ROI. Always states UNATTESTED, model UNVALIDATED, calibrator INELIGIBLE, execution DISABLED. Hash is not a trusted creation-time receipt. Synthetic tests must never be claimed to demonstrate real profitable EV.

Authority: no main/review-branch changes; isolated odds research branch only.

## Verified P0 engineering pass: deployed October 22, 2026

Three existing cost-bearing Supabase functions were intentionally **retired/fail-closed**, not replaced with a production odds ingestion service:

| Edge Function | Previous version / JWT | Current version / JWT | Readback |
| --- | --- | --- | --- |
| `atlas-odds-smoke` | v18 / verify_jwt=false | **v19 / true** | exact tested source match; no fetch or secret handling |
| `atlas-odds-ingest` | v19 / true | **v20 / true** | exact tested source match; no fetch or secret handling |
| `atlas-therundown-smoke` | v13 / false | **v14 / true** | exact tested source match; no fetch or secret handling |

All respond 410 to an authorized POST rather than spending paid API credits, and have no external network request in their deployed code. Unauthorized runtime requests were **not** tested end-to-end; precise management readback of verify_jwt=true is verified. This intentionally disables the former MLB bookmaker ingestion endpoint. Restore only from independently verified, reviewed code after quota controls and a rollback plan exist. Prior deployed source versions are not represented as locally verified rollback artifacts.

**Health guard:** `atlas-core-health` v18 -> **v19** (verify_jwt=true unchanged). Deployed source matches `scripts/runtime/supabase/atlas-core-health/index.ts`. It now maps invalid, future, and unknown market freshness or invalid DB metrics to non-green state. It retains single-database-read behavior. This is a code/readback verification, not a successful authenticated runtime HTTP integration test.

Source of truth: `scripts/runtime/supabase/` on this research branch. Tests: CI 39824578968 (34/34 PASS); CI 39825088498 (35/35 PASS after TheRundown guard). No live odds calls or database mutations were used to test the guards. Supabase projects and Edge Functions were modified; GitHub main/review release branches were not.

**Post-deployment checks:** R3 remains RED/BLOCKED with 5 failed and 4 awaiting real samples; schema drift guard still FAIL with 9 critical differences; calibration still WAIT_FIRST_CAUSAL_OUTCOME and zero admissible outcomes. No forced green, hash re-baselining or autonomous execution.

**Drift provenance:** `atlas_century_nov_plus_calibration_r3_schema_drift_audit_v1` compares current definitions with immutable `atlas_release_object_manifest_v1` release `ATLAS_CENTURY_NOV_PLUS_CALIBRATION_R3_2026_09_18`. The changed nine are existing public guard FUNCTION bodies; do not assume they are regressions or restore the old definitions without side-by-side semantic/security review. Current function security attributes show the nine queried guards use security_invoker and pinned search paths. The five failing R3 assertions are: `R305_SCHEMA`, `R306_HEALTH`, `R309_HUMAN_AUTHORITY`, `R312_CURRENT_READINESS`, `R314_R3_LIFECYCLE_STATE`. Some are downstream consequences; investigate cause rather than treating them as independent patches.

**Vercel cost caveat:** `atlas_x_vercel` auto-created READY **preview** deployments for these research commits (e.g. dpl_3Aa3oBcNWicTW4J73ZVxcoLX1aDT and dpl_GgLbNim21Fes8zpHPcA1GSrD2P2e). No production promotion was performed. Scope/ignore preview builds from backend-only research commits in a separate, reviewed Vercel configuration pass; don't change production policy blindly.

**Remaining priority:** one actual non-paid source -> timestamped normalizer -> permitted existing Supabase evidence record -> verified readback + heartbeat -> prospective externally timestamped model forecast -> independent official result -> statistically honest Forensics admission. Vercel-to-Supabase authenticated runtime parity is still UNKNOWN. Provider spend remains locked until approval and a tested, capped replacement.
