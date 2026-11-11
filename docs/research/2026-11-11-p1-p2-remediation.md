# ATLAS P1–P2 remediation — 2026-11-11 (SHADOW)

## Scope and immutable operational evidence

This review stacks on PR #38 and changes no production software, provider controls, models or wagers. Connected Supabase was queried SELECT-only; ChatGPT task scheduling was modified explicitly for the existing PULSE pair.

### P1-1: Record-to-forecast feedback

- The original source-linked Buffalo result is **recorded**, but it lacks independent pregame provider/event/period/settlement identity attestation. The existing evidence gate properly produces `HOLD_NO_MODEL_CALIBRATION`.
- New `recorded-result-research.mjs` generates an **unverified provisional Brier diagnostic** only when original candidate/event/prediction IDs, source-linked compatibility, unique observation/baseline, true frozen timestamps and independent-input flags match. It never adds evidence-gate case samples or forecasts to training, and returns no ROI. Errors, duplicates or leaking feature times produce HOLD and null arithmetic.
- The CLI retains `forecast_metrics: null` and `pricing_metrics: null` for this real export, and adds a separate `recorded_result_research_diagnostics` section. A poor or good provisional result is **not** authenticated predictive evidence.
- A later official final-score recap can corroborate the result, but **cannot retroactively prove a pregame market identity**; original timestamps are never backfilled.
- Remaining hard dependency: an operator-authorized source-authenticated pregame event/selection/rules receipt and independently verified official binary outcome receipt, followed by chronological holdout; actual venue quote is a *separate* pricing lane. The current one-case cohort is not statistically sufficient.

### P1-2: PULSE delivery

| Task | Before | After |
| --- | --- | --- |
| Opening PULSE, 08:00 America/Chicago | flexible_schedule; Nov 11 completed 08:27 CT | exact_schedule, enabled, daily 08:00 |
| Closing PULSE, 19:00 America/Chicago | flexible_schedule; Nov 10 completed | exact_schedule, enabled, daily 19:00 |

Readback after updates confirmed both new modes and upcoming schedule. Does not prove perfect on-time dispatch, external app delivery, or that a missed notification will be retried. Observe subsequent runs and check `recorded_status` and delivery independently. No prompts or recurrence rules changed.

### P2-1: GitHub CI runtime hardening

Pinned actions were resolved directly from their upstream repositories:
- `actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803` (v6)
- `actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38` (v6)

Both use a Node 24 action runtime, avoiding the old Node20-action deprecation path. The project tests still use Node 22. Checkout no longer persists its token in the workspace; setup-node skips auto package caching. The action run and logs on this PR are the actual compatibility proof; do not assume that pin replacement alone is CI-green.

### P2-2: Supabase index/RLS advisory triage

- 20 unindexed-FK advisor findings are informational. Read-only `pg_stat_user_tables` on inspected listed tables (including `bets`, `final_gate_checks`, `atlas_forensics_receipts_v1` and `atlas_learning_eligibility_receipts_v2`) shows **zero live tuples**, so mass index creation is not a justified performance optimization. Postgres may scan small/empty relations by design.
- Sampled no-policy RLS tables have RLS enabled, **zero policies**, and **no table-level SELECT grant** for `anon` or `authenticated`; `service_role` has SELECT. This is consistent with intentional service-only isolation, **not** evidence of a public data leak. No automatic policies were created.
- Index work remains conditional on measured high-volume queries, actual EXPLAIN plans and observed latency. If workloads develop, propose narrowly targeted indexes in a separate reviewed migration, not 20 speculative indexes now.
- Supabase advisors: https://supabase.com/docs/guides/observability/advisors
- RLS no-policy advisory: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- FK index advisory: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys

## Verification ledger

- Completed: direct GitHub branch edits; read-only Supabase project/table/grant/statistics queries; automation update/readback; upstream SHA verification.
- CI verified on PR #39 at head `ead21e2d62a1663135abab69c51074f8b2a476a8`: [GitHub Actions run 43039665614](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/43039665614) passed 284/284 tests, 0 failures/skips and 3,000/3,000 synthetic fault checks; patch-note step green, with no earlier Node20 runtime deprecation warning in the job log. Recheck the next doc-only head to confirm status remains green.
- Still unverified: any authenticated end-to-end real operator-site request, official quote availability, prospective calibration, automated nightly source-to-result ingestion, delivery notifications.
- Writes to Supabase: **none**. Paid odds calls: **none**. Real or paper wager transactions: **none**. Website deployment: **none**.

**Verdict:** PULSE timing configuration and code-level diagnostics/CI hardening can be implemented safely today. P1 *live* forecasting closure cannot be certified from missing historical source proofs, and P2 informational database advisories should not be “fixed” by unnecessary schema writes.
