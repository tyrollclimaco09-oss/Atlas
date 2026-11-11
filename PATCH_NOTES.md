# ATLAS patch notes


## 2026-11-11 — P1/P2 operational fixes: recorded-result safety, PULSE timing, CI runtime

**Status:** SHADOW review branch stacked on PR #38. NOT merged, model-promoted, or deployed.

- P1 learning: Add a separate recorded-result research diagnostic. It computes *provisional* Brier arithmetic for the source-linked Buffalo result using the genuinely frozen model and baseline, but reports zero calibration-eligible samples. It never upgrades a recorded result into an authenticated official outcome, changes the canonical evidence-gate disposition, invents exact market identity, or reports return/ROI. Add seven source-shape/fault regressions and expose the read-only result in the existing CLI.
- P1 automation: Via connected task controls, changed Opening and Closing PULSE from flexible to exact schedule without changing their daily 08:00/19:00 America/Chicago cadence or prompts. Opening's November 11 run completed at 08:27 local before the change; future punctuality and notification delivery remain to be observed.
- P2 CI: Replace SHA-pinned Node20-runtime checkout/setup-node actions with current independently resolved SHA pins for v6 Node24-runtime actions. Retain application Node 22, disable checkout credential persistence and automatic package cache.
- P2 DB: Read-only advisor/statistics review indicates the reported unindexed FK candidates on the inspected tables have zero stored rows; adding 20 speculative indexes would create write/maintenance overhead without measured speedup. Existing RLS-without-policy findings may be deliberately service-only. No index, RLS policy, permission, schema, or ingestion-control change.
- Source evidence: 532 historical market snapshots still have no canonical-market/overtime/venue execution hashes, so original-order pregame identity is not repairable with later replay. Source-linked outcome remains not source-authenticated for scoring.
- Verification: GitHub Actions [run 43039665614](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/43039665614) on PR #39 head `ead21e2d62a1663135abab69c51074f8b2a476a8` completed successfully: **284 tests passed, zero failed/skipped**, all **3,000 synthetic fault checks passed**, and the patch-note check succeeded. Its log has no former Node20-runtime deprecation warning. This is an offline CI proof, not live forecasting accuracy. Supabase inspection was read-only. No paid provider calls, wager, paper debit, service deployment, or model training occurred.
- Remaining: independent event/market identity and official outcome attestation, ongoing chronological cohorts, actual source-linked native quotes, live authenticated operator frontend parity, scheduler delivery proof. See [P1/P2 remediation report](docs/research/2026-11-11-p1-p2-remediation.md).

## 2026-11-11 — Real-source priority audit and sensitivity diagnostics

**Status:** SHADOW, draft review only.

- Fresh SELECT-only Supabase checks confirm 532 old snapshots with no period/rules/canonical-market metadata; intake disabled and zero paid budget. Re-exported the real frozen cohort: one recorded result, missing qualified identity/outcome/native quote evidence unchanged.
- Retrieved the official recap and corroborated the stored score. Did not invent pregame identity attestations or rewrite frozen records.
- Added scanner probability cushions and +/-1/3/6 pp EV sensitivity, explicitly uncalibrated. Added reference source IDs, unverified-upstream status and event-grouped unique candidate counts; monetary exposure and joint probability remain null.
- Local verification: **277 tests passed, zero failed/skipped; full eight-condition simulation and all 3,000 fault checks passed**. GitHub CI is verified separately in the PR record. Commands: `node --test integrations/learning/*.test.mjs scripts/research/*.test.cjs`; `node scripts/research/scanner-simulation.cjs`.
- Remaining blockers and source-check scope: [priority report](docs/research/2026-11-11-priority-pass.md). No collection controls, database data, paid credits, schedules, deployments, stakes or wagers changed.

## 2026-11-11 — Scanner simulation and batch-performance follow-up

**Status:** SHADOW follow-up to draft PR #38. No merge, deployment, live collection or wager.

### What changed and why

- Reproduced three order-dependent defects: reference-list reordering bypassed decision deduplication; reversed but equivalent outcome pairs were falsely held; reference observation IDs were misaligned with sorted book names. Added failing regressions, then fixed set hashing, quote equivalence and evidence ordering. A follow-up regression also enforces locale-independent identifier order.
- Replaced per-record full-snapshot parsing/hashing with a scan-local prepared gate and observation index. Actual retained-byte, original-record, duplicate-ID and source checks remain; there is no global or caller-trusted evidence cache.
- Added a deterministic simulation runner, assumptions/results report, numeric artifact and full GitHub CI simulation step. The R&D priorities are recorded in [the simulation report](docs/research/2026-11-11-scanner-simulation.md).

### Verification actually performed

- The original 255 tests passed before edits. Updated suite: **270 passed, zero failed/skipped**, using `node --test integrations/learning/*.test.mjs scripts/research/*.test.cjs` on Node v24.22.1.
- `node scripts/research/scanner-simulation.cjs`: **500 synthetic events x 250 paths x eight conditions**, plus **3,000 varied fault/invariance checks with zero failures**. Paired draws are reused across conditions; these are not independent real-game observations.
- The first six conditions were followed by two exploratory no-edge controls. With shared reference bias, one control shows **+11.84% estimated EV versus -2.00% expected return under the simulation's known probabilities**. This demonstrates a failure mode, not ATLAS performance on actual odds.
- In the accurate-reference condition, expected return is +6.14% by construction, yet 23.6% of paths lose. The specified correlation stress increases drawdown while preserving expected return. No threshold was optimized against these returns.
- Same 250-event / 1,000-record workload, three timing samples: median **3.034 s → 0.0222 s**, about 137x locally, with the same 250 signals. Hardware/JIT/GC affect timing; raw samples are retained.
- Retained real export replay remains one recorded outcome, zero admitted official outcomes/identities/native quotes and `HOLD_NO_MODEL_CALIBRATION`, with null forecast/pricing metrics. This was a fixture replay, not a fresh live-service audit.

### Limits and next action

- Simulated truth, prices, source declarations and dependence are imposed assumptions. The results do not establish sports forecasting skill, real source accuracy, executable prices or profitability.
- Reference-list canonicalization preserves existing already-sorted policy IDs. Previously persisted IDs from unsorted policies need an explicit compatibility review; historical records are not rewritten.
- The scanner still has no vendor-native feed, source authenticator or persistent paper/settlement writer. Pick6 entry EV remains unsupported. No dependencies, paid API calls, database writes, schedules, bankroll changes or real-money actions were added.
- Next priorities: source/reference accuracy on a prospective paired sample; genuine missing evidence for the frozen learning case; probability sensitivity and grouped-exposure evaluation. Review this patch and its separately verified GitHub CI before any deployment or collection.

## 2026-11-11 — Learning replay and offline DraftKings reference scanner

**Status:** SHADOW implementation for review. Not merged, deployed, or connected to live ingestion. No wagers or entries submitted.

### What changed

- Learning export V2 now includes the stored prediction ID and the original source-linked recorded outcome separately from authenticated outcomes.
- Added a versioned compatibility audit for the inspected Buffalo-moneyline legacy receipt. It exposes the result and original provenance without inventing source, identity, model or price verification.
- Extended price identity to include product, sport, participant, event start, period, overtime treatment and settlement-rule version.
- Added an offline NBA full-game moneyline scanner and CLI. It reuses existing odds/de-vig/EV arithmetic, excludes the target from distinct reference books, checks source capability/timing/rules and retained evidence, preserves validation receipts, and distinguishes operational failures from a complete zero-signal run.
- Later closed, suspended, unknown or unusable observations suppress older quotes. Duplicate snapshots and ambiguous same-time claims are held.
- Repeat scans preserve price observations while suppressing duplicate decision IDs. Outputs are labeled market-reference EV, remain venue-unverified, create no paper entries and carry no empirical-performance authority.
- Added separate Pick6 structural selection/entry contracts. Exact entry EV remains on HOLD because authenticated source/rules, payout and joint-outcome adapters are not implemented.
- Added repository instructions and a GitHub PR check requiring patch notes for future implementation changes.

### Why

The earlier export omitted a recorded result because its receipt shape differed from the authenticated outcome contract. The old quote key also grouped different periods/rules. Initial scanner regressions additionally exposed stale-open-price fallback, duplicate snapshot and malformed-registry problems; those are now covered and corrected.

### Verification actually performed

- Unchanged PR #37 baseline: 156/156 offline tests passed before edits.
- Updated combined suite: **255 tests passed, zero failed/skipped** on Node v24.22.1 using:

  `node --test integrations/learning/*.test.mjs scripts/research/*.test.cjs`

- Executed updated SELECT-only export against the existing Supabase case. Replay shows **one recorded outcome**, zero admitted official outcomes, zero admitted identities and zero native quotes. It correctly remains `HOLD_NO_MODEL_CALIBRATION`; forecast/price metrics remain null.
- Offline synthetic demo reproduces reference probability 0.5217391304 and estimated market-reference EV 0.0695652174 for the hypothetical +105 example, with three other books. Five validation receipts are returned as not persisted. This is arithmetic/contract evidence, not a real offer or profitable strategy.
- The 30 inherited pricing assertions are now counted individually by `node:test`; they are not 30 new model-validation results.
- GitHub CI is a separate check on the published review revision; local passes alone do not certify it.

### Remaining limits and next action

- No vendor-native parser, provider calls, source authentication service, database writer, deployment, scheduled job, model retraining, stake change, accepted quote or real-money execution was added.
- The normalized snapshot contract and configuration registries must be supplied and independently validated before empirical source research. Retained bytes/hash correspondence does not prove origin or factual truth.
- The recorded outcome stays unqualified until the genuine missing evidence is supplied; frozen forecasts and old receipts were preserved.
- Pick6 source collection, jurisdiction-specific rules, actual contest payouts and joint valuation remain unverified/unsupported.
- Review the scoped branch and CI, then separately authorize any live capture or deployment. Human Final Gate remains mandatory for real wagers.

### Source lineage

Learning base: PR #37, `d485ee0f825d8cf9e8031ee63f1fdc82c4529fc7`.

Reused pricing helpers/tests: PR #36, `ab4badaa58f23f5aa387745dc6f5be78bd658f20`.

### Hyperagent MCP lead

The supplied `https://hyperagent.com/api/mcp` endpoint is documented by Hyperagent for OAuth client connections. Documentation was inspected; no connection, agent run or external delegation was performed. It is not a dependency of this patch.
