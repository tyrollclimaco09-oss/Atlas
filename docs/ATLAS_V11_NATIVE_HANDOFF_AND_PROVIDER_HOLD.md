# ATLAS V11 — Native Slate Handoff and Provider Truth (November 6, 2026)

**Status:** implemented in the existing research backend, not a production bet execution system.

## Objective and scope
Preserve the established SCOUT → FILTER/VERIFY → EDGE THIEF + ORACLE → PRICING → KAIROS → SENTINEL → TACTICIAN → HUMAN FINAL GATE → LEDGER → FORENSICS → CALIBRATOR chain. Do not replace native candidate intake with fake price packets just to get green readiness. Do not modify historical forecasts.

### First execution: nine real Friday NBA games
- Parent run: `ATLAS-NBA-20261106-V10-RESEARCH-R1`, schedule from connected sports-data results (not a sportsbook account or quote).
- All **nine games** were registered with the existing `atlas_birth_runtime_event_state` guarded RPC, using observed source timestamp, exact game start, full NBA team names, and stable `NBA:YYYY-MM-DD:AWAY@HOME` identities.
- All nine have canonical event IDs and version-one state snapshots with cutoff at scheduled tipoff, while explicitly recording lineup verified=false, executable price verified=false, model calibrated=false.
- Replaying the WAS@ATL birth returned `idempotent=true`, identical event and state, no duplication.
- Existing `atlas_test_candidate_birth_bridge_v1()` returned PASS and confirmed **zero persistent synthetic test rows**, while exercising real event, scout, candidate, versioning and rollback mechanics.
- There are **zero native market candidates, zero execution-grade price records, zero qualifying independent ORACLE proofs, and zero ready Final Gates for these nine games**. V10's nine frozen uncalibrated score hypotheses and EDGE THIEF countercases remain research-only.

### Real database upgrade
- Applied migration `20261106080213_atlas_v11_slate_native_handoff_read_only.sql`, creating `atlas_slate_native_handoff_v11`.
- Applied migration `20261106080442_atlas_v11_handoff_canonical_key_normalization.sql`, matching full-name canonical events to the slate's abbreviated team labels by stable game key, exact time, date and sport.
- Both SQL scripts are committed **verbatim from Supabase migration history**.
- The view is `security_invoker=true`, with direct SELECT revoked from `public,anon,authenticated`; service_role SELECT only.
- Each game exposes canonical event presence, live native candidate count, independent Oracle proof count, resolved Edge Thief count, execution-grade quote count, ready Final Gate count, and exact outstanding gaps. It can never approve/execute a bet.
- A sanitized nine-game handoff snapshot is frozen at `docs/fixtures/ATLAS_NOV06_V11_NATIVE_HANDOFF_PUBLIC.json`.

### Deployed read-only API upgrade
- `atlas-slate-duo-v10` Edge Function now supports `mode=handoff&run_key=...`.
- API reports `RESEARCH_HANDOFF_AUDIT_ONLY` and `NO_BET_AUTHORITY_FROM_HANDOFF`, including event-by-event blockers, without writes.
- Still GET-only, JWT verification enabled, operator-auth guarded, no new provider calls, no production state transitions.
- Actual published-site operator-origin HTTP request remains **unverified**. Source parity and isolated local tests do not prove actual operator login behavior.

### Provider ingest audit — crucial
- Existing `market_snapshots` has **532** historical records; most recently retrieved **2026-08-10 00:16:42 UTC**. **Zero** execution-grade records.
- `atlas-odds-ingest` v20 and `atlas-odds-smoke` v19 show ACTIVE as deploy states but their code is explicitly disabled/returns 410 on POST, with no upstream provider requests. Both were intentionally retired October 22, 2026 for quota and evidence integrity.
- Do **not** reenable old code or trigger paid credits. The next provider path must support explicit quota accounting, request boundaries, refusal on missing/future/stale timestamps, actual book/selection/threshold/settlement matching, independent market-price provenance, and manual promotion.
- User-supplied final DK executable price is still a Final Gate source when it arrives, but not a prerequisite for broad SCOUT/public research.

### Tested and preserved
- One source of truth: native `events`, `state_snapshots`, `atlas_intake_prospective_candidate_v1`, `candidate_spine_trace`, native proof tables, existing Final Gate guards.
- The original candidate intake **requires at least one actual evidence item and scout market/price context**. We did NOT fabricate any of those to birth new candidate rows.
- V11 identity and handoff suite: 30 static/offline checks; CI required for exact head.
- Separate Supabase acceptance: 9/9 canonical event/state birth, match in handoff view, idempotent replay, view security role checks and original candidate-birth rollback test.
- No wagers, no model promotion, no private sportsbook receipts stored in GitHub, no live site changes.

## Next native proof step
1. Retrieve eligible NBA/NFL injury/availability evidence from primary sources with independent observation clocks.
2. Rebuild a reviewed quota-controlled market connector (not retired odds handler); cache+prove prices but never imply account fillability.
3. Freeze market-specific independent distributions, document ORACLE evidence groups and EDGE THIEF countercase.
4. Invoke existing native candidate intake only when the exact market and provenance can be legitimately supplied; then verify actual native receipt IDs, canonical state version and non-executable WATCH lifecycle.
5. Compare downstream Pricing/Kairos/Sentinel/Tactician proofs and Final Gate in chronological order, with manually approved execution only.
6. Grade the November 6 frozen forecast **after** results official, preserving misses and independent countercases.
