# ATLAS patch notes

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
