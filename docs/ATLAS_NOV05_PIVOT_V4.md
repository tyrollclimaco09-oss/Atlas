# ATLAS 🦾 — November 5, 2026 Calibration-to-Pivot V4 (Research / SHADOW)

**Status:** Proposal / draft-review implementation only. **No production deployment, autonomous wagering, model promotion, or original-forecast mutation.**

## Why the pivot is necessary

- Original Nov 3 frozen forecast on the 14 Nov 4 NBA finals: 7/14 winner calls, Brier 0.229708, margin MAE 9.393 points, totals MAE 9.25 points. Fourteen games are not a calibrated/ROI proof.
- Later independent SHADOW baseline: 8/14 directional calls but worse margin MAE 9.736. Do **not** pretend it replaces the original after seeing outcomes.
- Twenty-two frozen paper-card definitions across three overlapping research batches: 4 complete threshold hits, 18 with misses or unresolved legs. These are **not independent experiments**, nor real sportsbook payouts.
- Maxey 20+ lost at 19, Brandon Miller 15+ lost at 10; repeated appearances created common failure roots across parlays. Jayson Tatum DNP and Jalen Johnson OUT were roster/DNP research issues, not automatically sportsbook-voided wagers.
- Actual DraftKings Nov 4: CLE ML +136 $2.00 lost; BKN +3.5 -105 $1.50 returned $2.92; combined double $0.70 lost. Total staked $4.20, returned $2.92, net −$1.28, reconciled balance $13.50. Shared CLE-linked exposure **$2.70**; BKN-linked exposure **$2.20**.

## Change in operating doctrine

1. **Pick the day type after scouting.** NBA and NFL primary. Choose ML/props/spreads/totals/mixed or real pass from evidence, without a fixed 3-single/1-parlay quota. Paper research continues on pass days.
2. **Freeze independent forecast first.** Before consulting odds, save event identity, source/effective/observed timestamps, prediction distribution, uncertainty, model version, and strongest counterargument. A missing defensible fair probability remains null.
3. **Roster integrity.** OUT/DNP blocks new executable candidates; UNKNOWN/QUESTIONABLE remain WATCH. Paper freezes are immutable and DNP/void claims require separate book settlement authority.
4. **Exact account price check.** To make an executable-price claim match book, event, market, side, threshold, availability and freshness. Public DraftKings or BetMGM aggregator prices are research observations, never accepted account quotes. Quote age of 15 minutes in prototype is an experimental configurable check, not a certified standard.
5. **Probability validation.** Market discrepancy or a correct winner is not proof of +EV. Compare against market-only and independent temporal baselines. Research-only probabilities do not get promoted via one good slate.
6. **Repeated-exposure graph.** Count every actual double/parlay stake toward *each* dependent selection and event. Show concentration warnings on shared risks; the prototype uses >15% bankroll per repeated selection or >20% total slate as **advisory research thresholds**, not approved hard blocks.
7. **HYDRA retains 2/4/8/12/20-leg paper builds**, but tracks source quotes, shared failure roots, leg uniqueness, game correlation, frozen availability, original outcomes and valid DNP states. No calculated hypothetical payout without genuine quote receipts.
8. **Final Gate remains human.** A read-only gate result never authorizes, places or settles a real bet.

ATLAS pipeline: SCOUT → FILTER/VERIFY → EDGE THIEF + ORACLE → PRICING → KAIROS → SENTINEL → TACTICIAN → HUMAN FINAL GATE → LEDGER → FORENSICS → CALIBRATOR.

## Nov 5 decision context

Connected DraftKings sports-data schedule: Jacksonville @ Baltimore NFL Thursday 7:15 PM Central, Orlando @ Phoenix NBA 8:00 PM Central, Miami @ Golden State NBA 9:00 PM Central. Only two NBA games and one NFL game today. The NFL quarterback injury situation has prompted material repricing; an injured favorite/underdog narrative alone does not prove price value. Classify this as **thin / news-sensitive / paper-first**, with selective live opportunities only after line, availability and fair-probability proof.

Latest operator screenshot shows DraftKings $13.50. No automatic stake allocation or new real wagers.

## Offline executable review harness

- `node scripts/research/pivot-gate.test.cjs`
- Research implementation: `scripts/research/pivot-gate.cjs`.
- 29/29 local offline tests passed on November 5, covering price equality, quote freshness, event identity, roster and DNP, point-in-time prediction freeze, invalid totals, paper grading, and correlated exposure using the real Nov 4 stake structure.
- Zero live odds/provider calls and no paid credits used by the test itself.
- **Not wired to production:** source logic passing does not establish current backend, browser session, published frontend, or CI proof.

## Acceptance gates for future promotion

1. Read-only backend contract parity audit, including outstanding Command Center/roster PR work.
2. Correctly sourced official team/player identity and availability, including no auto-void assumption.
3. Prospective pre-market freeze and future separated outcome scoring; compare against strong market-only controls, Brier, log loss, margin/total MAE, interval coverage and actual CLV where quoted.
4. Correlated-risk tests and exact DraftKings account offer readback; no synthetic prices or invented independent fair probabilities.
5. Explicit human authorization for any deployment or production model change; none granted by this review PR.

## Provenance

Frozen pretip Nov4 forecast SHA-256 `43fb8d3126f175817ac91d3b54c6585d7207c275cf3709e53d5b98c56b64c1b2`. HYDRA Nov3 research freeze SHA-256 `40b1f124a5e0e8a2a5287a6595661bf9ce15827d8b4d2d51f48fe992b9f83bc3`.

Corresponding ATLAS Library files: `ATLAS_2026-11-04_PROSPECTIVE_TEST_REPORT.md`, `ATLAS_NOV04_12_PAPER_CARDS_READABLE.md`, `ATLAS_NOV04_HYDRA_PAPER_RECEIPT.md`, and `ATLAS_NOV04_POSTGAME_CALIBRATION.md`. Current game schedule observed through connected DraftKings sports-data; official NFL injury source: https://www.nfl.com/injuries/ ; NBA projected injury/lineup reference: https://www.fantasypros.com/nba/lineups/2026-11-05/.

This file is a non-mutating proposal; it must not be presented as a tested live integration.
