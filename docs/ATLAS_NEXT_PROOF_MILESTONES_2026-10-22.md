# ATLAS — Next proof milestone: NBA first, NFL second
**Date:** October 22, 2026 · **Status:** REVIEW / SHADOW · zero betting authority · source-scoped, evidence-first

## Binding scope

The user explicitly requests **one sport at a time: NBA then NFL**. Do not merge model distributions, player IDs, datasets, acceptance counts, or prospective packets across leagues. Reuse existing ATLAS code, Supabase ledgers, and human Final Gate. No new APIs, paid odds calls, cron loops, Vercel promotion or mass synthetic simulations.

## NBA — P0: recover and independently replay Q4 play-by-play V3

### Existing reported work vs verified repo coverage

- A prior Oct 22 conversation checkpoint cited **54** NBA games (40 April 8–12 and 14 October 20–21). A later **V3 report** expanded that to **57** (43 April and 14 October). These are different checkpoints, not conflicting totals for a frozen same-version cohort. Preserve the distinction until original manifests and commits are recovered.
- The V3 report described a **Q4 combined FGA target**: the four players chosen solely from Q1–Q3 FGA (two per team), with fourth-quarter FGA summed after the game. It was **NOT** a player-prop or moneyline probability.
- Retrospective October holdout results were **reported** as baseline MAE **7.062**, V3 **6.456**, 9/14 games improved. Confidence interval includes no improvement. These numbers are **NOT independently replayed here** and may not be reused as evidence of live EV.
- The original report listed `game_source_manifest.csv`, `chronological_v3.py`, `robustness_v3.py`, `benching_risk_v3.py`. Current GitHub research branch's **recursive tree (271 paths)** contains **none** of those filenames or any 57-game V3 row-level replay data. Project/Library search did not recover executable copies; a Drive title search returned only an older ATLAS recovery document. This is a **reproducibility blocker**, not proof those originals never existed.
- Existing repo `scripts/scout/opportunity-shadow.cjs` and `docs/ARCII_NBA_PROSPECTIVE_PILOT.md` already prescribe price-blind prediction, explicit abstention, chronological freeze and game-balanced evaluation; **reuse** rather than rebuild.
- The newer one-game postgame source proof is distinct: October 21 ESPN event `401909834`, **19 player rows, 538 PBP IDs**, Supabase `evidence_snapshots` ID `74af21a2-b637-4ab4-834c-6110b52a5fb8`. It is source availability proof only. The Oct 22 Cleveland–Philadelphia 50% pregame reference is also distinct.

### Acceptance criteria to earn NBA replay VERIFIED

1. Recover the original 57-row source manifest and runnable, version-pinned V3 scripts OR independently recreate a labeled dataset with explicit source URLs and per-game hashes, marking it a **new version**, not a V3 replay.
2. Audit all **57** actual game IDs, **43 earlier / 14 October**, chronology, player selection without Q4 leakage, missing/DNP/garbage-time/OT rules and shot-attempt labeling.
3. Execute the predeclared date-rolling splits: Apr 8→9, Apr 8–9→10, Apr 8–10→12, April→Oct 20, April+Oct 20→21. No tuning on held-out October labels, no retroactive sample changes.
4. Reproduce per-game model and baseline predictions, MAE and game-balanced uncertainty. Quantify 9/14 as a descriptive count, not a win probability or proof of +EV.
5. Preserve runnable inputs, code version, source hashes and any mismatches, then complete a **separate genuinely pregame** NBA opportunity forecast before checking its postgame result. The Oct 22 unpriced 50% record does not count as V3 validation.

**If source code/manifest remain absent:** mark `NBA_V3_REPLAY=BLOCKED_MISSING_PRIMARY_ARTIFACTS`. Continue only with a transparently **new** replay using legally usable, time-attributed sources and new experiment ID. Never print the reported MAE as verified.

## NFL — P1: event-level completeness and independent PBP verification

Start **after NBA pass disposition**; separate evidence and no NBA code imports into NFL parsing.

- Existing corrected evidence: Oct 18, 2026 **Week 6** ESPN event `401872996`; 22 player stat rows, 20 completed drives and 186 distinct drive-play IDs; Supabase additive correction `e5e3f656-ffc6-4c67-9391-ad7b8e299a99`.
- Two independent Week 6 values already corroborated: **C.J. Stroud 34 passing attempts**; **Woody Marks 15 rushes** (ESPN and nflverse, GitHub run `39836988809`). This does not establish player-level PBP completeness.
- nflverse `stats_player_week_2026.csv.gz` observed with Weeks **1–6** only. **Week 7 is unavailable in that release** at that observation time; never infer live-week values from older rows.
- Next collect a bounded Week 6 nflverse `play_by_play_2026` slice keyed by independently checked `game_id` and match the ESPN drive play universe. Classify incomplete/ambiguous: canceled plays, kneels, sacks, scrambles, penalties, duplicate IDs and missing drives. Compare parsed passing attempts/rushes/targets to both box score and nflverse aggregate.
- Exit with explicit `MATCH / PARTIAL / CONFLICT / UNKNOWN` and sampled discrepancies. No synthetic row padding, no “186 plays = all snaps” assertion.
- Then preregister a future NFL **QB passing attempts** forecast with independent model and unambiguous event/player/market/line ID before kickoff; freeze the COMPLETE research census, not a handpicked result.

## Shared backend reality bridge — P2 (after both sports)

- Validate authorized Vercel → Supabase runtime request and unauthorized denial; preview env and access boundaries are currently unproven.
- Reuse existing `evidence_snapshots`, `atlas_prospective_prediction_freeze_v1`, `atlas_feed_heartbeats_v1`, `opportunity-shadow`, source normalizers and operational guard views. Do not create new canonical schema without comparison.
- First successful *non-wagering* source→candidate→freeze→independent official result→FORENSICS receipt must be complete **and externally timestamped**. Three coherent packets demonstrate the pipeline only, not calibrated profitability.
- RC9 manifest matched 205/205 on Oct 22 but active release remains `HOLD_NO_ACTIVE_RUNTIME_CANDIDATE`. Avoid retired R3 drift distraction or silent authority promotion.
- Older paid-provider smoke/ingest functions remain JWT-protected and retired pending a truly quota-gated replacement. **0 new paid odds credits.**

## Immediate gate assessment

| Deliverable | State |
| --- | --- |
| NBA V3 report and metrics | REPORTED_RETROSPECTIVE; missing primary executable/replay bundle from current repo |
| NBA one-game stat/PBP source | VERIFIED_AS_SOURCE_EXTRACT; not model evidence |
| NBA real prospective 50% benchmark | FROZEN_UNPRICED_UNVALIDATED |
| NFL Week 6 paired player stats (two fields) | VERIFIED_NARROW |
| NFL full-play cross-provider completeness | NOT_PROVEN |
| End-to-end canonical runtime → official result | BLOCKED |
| Production model / automatic execution | NOT_AUTHORIZED |

**Doctrine:** quality over quantity; knowledge over greed. No approval or production promotion implied by this plan.
