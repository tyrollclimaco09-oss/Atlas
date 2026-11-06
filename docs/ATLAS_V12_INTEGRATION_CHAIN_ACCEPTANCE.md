# 🦾 ATLAS V12 — Integration Chain Acceptance (2026-11-06)

## Truth model
**Result: Research backbone linked. Native market-to-execution NOT READY.** This file is an evidence-first technical handoff; no paid API credits, real bets, model promotion, or live published-site deployment were performed during this pass.

## System map
1. **Connected sports results → SCOUT:** nine Nov 6 NBA games verified, schedule observed before tipoff, game/source identity frozen.
2. **Guarded native event birth:** 9/9 real `events`, each with one immutable pre-tip `state_snapshots` version-one record. Re-running native birth for the same WAS@ATL event returned idempotent=true.
3. **Slate backbone:** 12/12 nodes present in `atlas_slate_node_receipts_v10`; ORACLE/EDGE THIEF research countercases preserved; risk/pricing stages WATCH; HUMAN_FINAL_GATE BLOCKED.
4. **Eight subnodes:** V9/V11 research module registry readback verified, all LAB without production authority.
5. **V11/V12 native handoff:** `atlas_slate_native_handoff_v11` and `atlas_slate_candidate_coherence_v12` secured with security_invoker and service_role-only SELECT. V12 prevents fake cross-market convergence by requiring same candidate_key, event_id and state_version for ORACLE, EDGE THIEF, KAIROS, SENTINEL, TACTICIAN, execution binding and native Final Gate; unresolved challenges veto it.
6. **Native candidate market proof:** 0 native candidates for this slate; 0 coherent duo candidates; 0 execution-grade quotes; 0 ready Final Gates. Never create a dummy book quote to cross this boundary.
7. **Human Final Gate:** the V10 SQL function and live trigger fail closed on missing/stale/mismatched execution-price proof; explicit human approval remains mandatory. Negative guard test passed.
8. **LEDGER → FORENSICS → CALIBRATOR:** Nov 5 V8 forecasts retained unchanged, both official outcomes graded against frozen pre-tip scores. Winners 2/2, home-team baseline also 2/2; margin MAE 13.6, total MAE 13.3, per-team score MAE 7.5. Not a statistically validated model; no quoted odds, actual ROI, Brier, CLV or fair probabilities.
9. **Unified runtime:** `atlas-slate-duo-v10` Edge Function **version 6**, ACTIVE, verify_jwt=true, bytes match GitHub; read-only modes `slate`, `handoff`, `candidate`, `integration`. The latter composes actual native slate, node statuses, coherent candidate evidence, research modules and postgame receipt with zero execution authority. Operator authenticated HTTP response under the actual published site origin remains **unverified**.
10. **CI:** 37 V12 integration-smoke assertions plus prior V10/V11 suites, all green at exact branch head before this documentation change. Repeat on final head.

## Critical blockers (do not hide)
**AUTH/P0:** Direct Supabase aggregate read as of 2026-11-06 08:43 UTC: 0 operator-eligible Auth users with `app_metadata.atlas_operator=true`; 0 records in `atlas_site_reader_credentials_v1`. Both existing `atlas-site-runtime` and new Slate/DUO bridge use those same operator checks. Green CI and ACTIVE Edge deployment cannot establish an authenticated operator path. Never disable JWT verification, add a public bypass, invent an operator identity, or commit a secret.

**PRICING/P0:** 532 old `market_snapshots`, newest from Aug 10, 2026 UTC, 0 execution-grade. Both deployed legacy odds-ingest and smoke functions deliberately return disabled 410. Reintroduce only a separately reviewed, quota-controlled market connector with exact event/book/market/selection/threshold/settlement and quote timestamps; no paid provider calls without explicit approval.

**FORECAST/P1:** 9 game-score hypotheses are uncalibrated, not premarket independent fair-price probabilities. Native ORACLE and EDGE THIEF proofs cannot be marked PASS based solely on regression tests.

**SITE/P1:** recovered-source frontend PR #35 has green CI but actual published editable ChatGPT Sites parity has not been tested or modified.

## Acceptance evidence
- Frozen sample: `docs/fixtures/ATLAS_V12_LIVE_INTEGRATION_DB_SNAPSHOT.json`.
- Public frozen score sample: `docs/fixtures/ATLAS_NOV06_V10_ORACLE_EDGE_THIEF_FROZEN_PAPER.json`.
- V11 native handoff sample: `docs/fixtures/ATLAS_NOV06_V11_NATIVE_HANDOFF_PUBLIC.json`.
- Prior postgame grade: `docs/fixtures/ATLAS_NOV05_V8_POSTGAME_OFFICIAL_GRADE.json`.
- SQL migrations: V10 fail-closed Final Gate, V11 guarded handoff, V12 coherent candidate view.
- GitHub branch: `research/atlas-slate-duo-finalgate-v10`; draft PR #36, stacked on draft PR #34.
- All public-safe code and fixture assertions: `scripts/research/integration-smoke-v12.test.cjs`.

## Next proof steps (in sequence)
1. **Secure operator enrollment by the actual operator/admin**, via a supported Supabase Auth admin flow or secure server-side hashed credential flow; require both authenticated allowed and unauthorized rejected requests. No API keys or tokens in public GitHub/chat.
2. Call actual `GET mode=integration` from the published site-origin with the real operator session; capture HTTP 200 contract, source timestamp, cache policy and audit trail. Recheck jwt/auth failure mode.
3. Review/restore quota-limited odds ingestion, or collect timestamped public market discovery references while keeping final DK account-executable quote separately gated.
4. Freeze a **specific, market-priced** prospective candidate (sport/game/market/side/line/book/settlement). Invoke existing native intake with honest evidence; no invented fields.
5. Run independent ORACLE plus EDGE THIEF on the exact same candidate and state; resolve challenges before pricing/KAIROS/SENTINEL/TACTICIAN proof accumulation.
6. Only then exercise Human Final Gate; no automated wagers; grade official postgame outputs and compare to frozen control models.

**Meaning of status:** A 9/9 green native event board and 12/12 node receipts mean *research coverage*. They do not mean model readiness, sports-market availability, account-executable quotes, or betting authority.
