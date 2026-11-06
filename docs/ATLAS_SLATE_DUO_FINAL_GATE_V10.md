# ATLAS V10 — Integrated Slate Run, DUO, Final Gate and Learning Loop

**Created:** 2026-11-05 America/Chicago. **Status:** research-only persistent backend, no autonomous bets.

## Preserved canonical chain
SCOUT → FILTER/VERIFY → **EDGE THIEF + ORACLE (independent duo)** → PRICING → KAIROS → SENTINEL → TACTICIAN → **HUMAN FINAL GATE** → LEDGER → FORENSICS → CALIBRATOR.

V9 original research features (pivot gate, pricing/market intelligence, discovery guard, Feature Lab, Value Cortex, EDGE DNA and V8 Integration Arena) remain in the existing SHADOW feature registry and are surfaced in V10 API as *registered research modules, not automatically run predictors*.

## Real next-slate research freeze
- Run key: ATLAS-NBA-20261106-V10-RESEARCH-R1
- Slate date: November 6, 2026, America/Chicago.
- Source: connected sports-results schedule, observed 2026-11-06T04:00:03Z.
- Nine upcoming NBA games. Not a sportsbook odds feed.
- Twelve node receipts, with missing evidence visible, source timestamps, no model probability or executable offer invented.
- The Final Gate node is BLOCKED; postgame LEDGER/FORENSICS/CALIBRATOR are POSTGAME_PENDING. No bet placed and no paper ticket fabricated.

## Database changes
- Applied migration **20261106040123_atlas_slate_duo_evidence_spine_v10.sql**: append-only slate runs and node evidence receipts, RLS locked from anon/auth, no production/betting authority.
- Applied migration **20261106040320_atlas_final_gate_execution_price_fail_closed_v10.sql**:
  1. Adds `atlas_final_gate_quote_is_verified_v10(uuid,timestamptz)`: requires matched exact execution-grade market snapshot, real source evidence, healthy/open market, matching rule profiles, and a fresh quote.
  2. Adds defense-in-depth trigger on `final_gate_checks`: prevents READY_FOR_OPERATOR / approved / executed statuses without verified price; human approval and execution receipt required for later lifecycle.
  3. Updates the existing canonical `atlas_prepare_final_gate_v2` to call this guard. The old `VERIFY != BLOCK` condition no longer passes, and `executable_price_verified` is no longer blindly true.
- Database tests: synthetic READY_FOR_OPERATOR with no real binding was rejected; nullable quote evaluates false; both migrations recorded; 9-game slate has exactly 12 node receipts.

## Actual runtime
- New isolated JWT-verified, GET-only `atlas-slate-duo-v10` Edge Function.
- `mode=slate&run_key=...`: returns persisted schedule, all 12 stages, and V9 research-module registry. A missing node returns an explicit error.
- `mode=candidate&candidate_key=...`: reads the existing *native* spine, EDGE THIEF challenges, independent ORACLE proof, KAIROS, SENTINEL, TACTICIAN, and native Final Gate. No cloned approval engine.
- Operator authentication required. The route cannot create or approve bets and never writes provider data.
- API can only claim READY_FOR_OPERATOR_REVIEW when a native gate exists, has a fresh checked timestamp and executable-price evidence, and the independent duo has resolved all challenges.
- Unanswered proof stays WATCH/BLOCKED. Public repository contains no personal betting balances or secrets.

## Scientific/evidence boundaries
- A connected schedule is not a verified roster or odds price.
- A passing synthetic test proves the calculations' contract, not actual forecast accuracy.
- No independent probabilities, official roster confirmations, executable account prices, or live site/origin proof were produced by this integration.
- Earlier frozen research predictions and paper cards are preserved unmodified.
- All production promotions and actual wagers remain behind the human Final Gate.

## Acceptance gates before claiming fully integrated
1. GitHub fresh CI on exact V10 commit.
2. Supabase readback of migrated functions, RLS restrictions and all 12 receipts.
3. JWT-authenticated HTTP response under actual operator session, including unauthorized access rejection.
4. Real slate sources and independent pre-tip ORACLE + EDGE THIEF evidence; never use a post-tip re-forecast as pre-tip truth.
5. Exact sportsbook price/source/market/settlement identity with freshness and human operator sign-off.
6. Prospective NBA/NFL held-out calibration, CLV and portfolio tests with no retroactive mutation.
7. Published Command Center parity is separate and explicitly not required for V10 backend to be deployed.

## Key links
- V9 backend upstream PR #34
- V10 migrations and contract tests in this review PR
- Previous research PRs #29–33
