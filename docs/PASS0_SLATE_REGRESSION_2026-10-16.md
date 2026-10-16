# ATLAS Pass 0 — Slate regression diagnosis and repair register (2026-10-16)

Status: REVIEW ONLY. No deployment, no live feed, no betting execution, no fresh test execution. Base: `510e22c7a4c9259ec4e1f7b651cd21ac6cb9df9b`.

## Directly verified from preserved source

- `command-center/slate-engine.js` newRun defaulted `limit:3`; the generated research handoff used remaining candidate slots as a hard batch cap. `importResearch` rejects a research import when candidate count exceeds `run.limit` and rejects any packet larger than eight.
- `command-center/slate.js` disables adding a candidate at `run.limit`; restore rejects >8 candidates and restricts restored limits to 3/5/8. Its display calls these candidates a shortlist.
- `command-center/index.html` explicitly said new slates start with a three-candidate shortlist.
- `slate-engine.js` Final Gate requires `expression==='Single'`; its research prompt explicitly says to propose singles and keep parlays in research. `slate.js` shows Single/SGP/Parlay expression options, but this is not permission for parlay execution.
- Historical SCOUT opportunity, GS-01 workload, and Arc II construction research are offline/shadow work. No verified live Game Sense predictor or joint distribution integration was observed.
- Browser drafts are not the canonical Ledger; original Sites ↔ review source ↔ Supabase parity remains unverified.

## Changes in this branch

1. Default review workspace capacity increased from 3 to 8 in `slate-engine.js`. This is a **bounded interim mitigation**, not the requested uncapped research registry.
2. Generated research handoff explicitly requests broad discovery, Team DNA, Game Sense, Outcome Intelligence, intuition as testable hypotheses, role/rotation and adversarial analysis. It distinguishes research universe from packet transport capacity.
3. New-slate help text now correctly describes the eight-slot workspace and its limitations.

## Remaining high-priority repair (not implemented by this patch)

- Decouple `discovery_registry`, `research_packet_batch`, `active_review_workspace` and `ranked_shortlist` without deleting or rewriting historical candidates.
- Preserve complete census including PASS/WATCH/INVESTIGATE/ABSTAIN, provenance, immutable forecast revisions, candidate identity and exact event/selection/market/threshold.
- Extend versioned research-only construction records for singles, doubles, alternate lines, SGP, SGPx, triples, round robins, Pick6 where relevant, and settlement truth tables. Do not weaken singles-only Human Final Gate.
- Restore old draft compatibility and avoid accidental truncation from `history.slice(-300)`; preserve full append-only external evidence when authorized.
- Verify source/production parity, auth, concurrency, expiry, RLS, signer isolation and 18 inherited release gates independently.
- Preregister prospective baseline versus ORACLE/Game Sense/intuition ablations and evaluate all eligible cases including abstentions and missed opportunities. No claim of predictive lift before real results.
- Inspect and recover original Arc II Passes 1–4, especially Team DNA, and original release-gate registry. Historical descriptions are not implementation evidence.

## Required acceptance before promotion

1. Run all frontend, SCOUT, GS-01, source-contract and research replay suites in an authorized checkout. Record commands, exact versions, failures and full denominators. No invented green status.
2. New slate default is eight, research prompt preserves Game Sense/Outcome Intelligence and includes no false claim of an executable parlay model.
3. Legacy 3/5/8 drafts restore without loss; invalid imports do not partially mutate a slate; duplicate exact candidates are rejected; expired events cannot be transferred.
4. Human Final Gate still blocks non-singles, stale prices, missing source evidence, missing review, and identity mismatch.
5. Do not deploy or merge solely because these text-level changes were accepted. This review patch has not been run through tests in this session.

## Priority

P0: regression prevention, evidence custody, source ownership, human Final Gate.
P1: durable unlimited discovery registry, scenario/pairing research bridge, full board.
P2: prospective model calibration and measured opportunity lift.

Doctrine: preserve existing owners, truth over ego, knowledge over greed, no silent production promotion.
