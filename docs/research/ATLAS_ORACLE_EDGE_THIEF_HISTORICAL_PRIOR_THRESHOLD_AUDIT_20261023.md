# ATLAS ORACLE + EDGE THIEF — Chronological Historical-Prior Tournament

**Date:** 2026-10-23. **Research status:** chronological retrospective shadow study only. All game outcomes were known when the study was initiated; although the training period precedes testing, these were NOT witnessed live predictions. No bet, executable quote, +EV estimate, model promotion or production integration.

**Immutable numerical record:** [docs/research/ATLAS_ORACLE_2025_DAY_TO_2026_HALFTIME_Q3_PRIOR_TOURNAMENT.json](https://github.com/tyrollclimaco09-oss/Atlas/blob/0d8c39e613c25206c2670a96ad981b6545601b99/docs/research/ATLAS_ORACLE_2025_DAY_TO_2026_HALFTIME_Q3_PRIOR_TOURNAMENT.json); file blob `b39cd261f34558edd59557d346498f91d773dd23`. Historical train source `a7ab4b3d5646899f91c23a1184ba09da3c464543` (all 11 NBA games Jan 15, 2025), separate later-date test source `c8e0d2ee1610e4c9f45d40464d85b6d511ccef5e` (all 16 Oct 20–22, 2026 games). The earlier eleven-game PBP period-scoring reconciliation established 45 period/90 team-period identities, but this particular model uses only the four regulation quarter scores.

## Reproducible rule

Compare `baseline = combined first-half points` (for H2) or `baseline = Q3 combined points` (for Q4) against `candidate = alpha*baseline + (1-alpha)*mean_historical_target`. The alpha candidates were fixed at 0, 0.25, 0.5, 0.75, 1 and selected by leave-one-out MAE on the 11 training games ONLY (ties select smaller alpha). Both selected **alpha=0**, i.e. pure historical means: H2 111.727273, Q4 52.454545. Evaluate on later 2026 cases without training/test outcome mixing. Note entire experiment selection was still retrospective after 2026 finished.

| Metric | Halftime -> H2 | End Q3 -> Q4 |
|---|---:|---:|
| Test cases/dates | 16 / 3 | 16 / 3 |
| Naive equivalent-period MAE | 11.8125 | 10 |
| Historical prior MAE | 10.340909 | 7.130682 |
| Average reduction | 1.471591 | 2.869318 |
| Games prior beat baseline | 11 / 16 | 11 / 16 |
| Train-derived nominal-80% residual band | ±17.3 | ±13.7 |
| Out-of-time band coverage | 11/16 | 15/16 |
| Two-sided exploratory sign-flip p across games | 0.472931 | 0.098389 |
| Two-sided exploratory sign-flip p by calendar date | 0.75 | 0.5 |

**Interpretation:** global MAE improvements are descriptive and not reliable enough for promotion. Game-level sign-flips assume exchangeability, a doubtful assumption under multiple shared-day games. Three calendar-date clusters are too few to estimate uncertainty precisely. CV residual band is optimistic since alpha was picked on the same 11-game data; halftime 11/16 (68.75%) coverage misses nominal 80%, Q4 15/16 (93.75%) may be needlessly wide. A 2025 January day is not a representative whole-league prior for 2026 October.

## Explicit failing cases

- **DEN@OKC**, H2 actual 88; repeat H1=92 (abs error 4); historical prior=111.73 (abs error 23.73). The prior lost by ~19.73 error points. Cannot call a reliable under edge because no independently verified actual defense lineup/possessions or DraftKings odds.
- **BOS@DET**, Q4 actual 64; repeat Q3=67 (abs error 3); historical prior=52.45 (abs error 11.55). The prior failed on an extraordinary late scoring surge.
- **Oct 22 two games**, halftime prior average performance worsened by 8.73 error points per game versus naive baseline. Counterexample stays in the ledger rather than retrospective subset exclusion.

## What ATLAS earns, node by node

**SCOUT/FILTER (P0):** strong source identity, official gameStatus and original raw PBP/box checksum; account for technical/flagrant FT and OT separately, event-order corrections, valid starting five + substitutions and possession ownership. Current BRef transformed source does not prove exact possessions or on-court lineup. External pbpstats documents known out-of-order-event repairs (https://pbpstats.readthedocs.io/en/latest/quickstart.html). The NBA CDN raw JSON fetch attempts in this session failed; do not silently infer or import unavailable exact player defender matchups. P0 SOURCE BRIDGE remains BLOCKED.

**ORACLE / GAME SENSE:** baseline prior is a challenger to beat, not an already-deployed feature. Next build separate possession-volume and points-per-possession forecast channels conditioned on actual as-of margin, foul bonus, turnover types and minutes; maintain distributional coherence with player statline opportunities. Need future complete-date frozen predictions, two or more distinct future evaluated periods (not just three clustered days), and better day-balanced error versus BOTH latest-rate and historical priors.

**EDGE THIEF / CALIBRATOR:** reject postgame actual minutes, post-cutoff absences, stale boxes, shuffled event-row leakage, accidental OT scoring mixed into regulation, and backfit subgroup rules. Pre-register evaluation period, source timestamps, uncertainty target, and abstention coverage BEFORE new games. Interval nominal coverage and rare-script losses must be tested. Do not turn a self-reported source model result into ATLAS-verified improvement.

**PRICING / SENTINEL / KAIROS / TACTICIAN:** betting utility comes only after independent calibrated outcome distributions, truly executable exact DraftKings market/line/odds/rules at known time and a human Final Gate. A lower mean absolute error alone never demonstrates +EV.

**Next precise study:** (1) source-compatible full possession and five-man lineup audit CLE@PHI, DEN@OKC, BOS@DET; (2) more complete earlier-year historical dates to avoid one-day mean prior; (3) truly prospective end-Q3 event-time freeze with current game state and independent odds-later pricing. All 15 formal Arc III approvals remain 0; NFL research separate and all frozen handoffs remain untouched.
