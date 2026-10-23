# ATLAS Game Sense — Turnover Timing Replication and Honest Pressure-Feature Ablation

**Checkpoint:** 2026-10-23. **Status:** retrospective source-linked EVENT CHRONOLOGY and earlier-date model ablation; no official NBA possession custody, no trained defender matchup model, no calibrated market EV, no production promotion. This advances existing SCOUT, FILTER/VERIFY, Game Sense, ORACLE, EDGE THIEF, and CALIBRATOR — not a new canonical node.

## Evidence, immutable blobs and checks

- [2026 October complete 16-game turnover event adjacency](https://github.com/tyrollclimaco09-oss/Atlas/blob/85c0e57b47f89af69f389c83b0c757656e5f9f71/docs/research/ATLAS_NBA_16GAME_TURNOVER_SCORE_ADJACENCY_20261023_V1.json), Git blob `cbef2dcffa79bd68acd055c5c18bc616ab8b92ca`, 16 accepted, 0 rejected. Exactly 540 turnover action strings classified. Their per-game/half sums were separately cross-checked against the previously read-back October 2026 PBP-v2 dataset blob `ee83617990f03b1c9a2ae2608db4431693c16973`; **0 count discrepancies**. All four quarter cumulative score endpoints match archived independent scoreboard counts in each game.
- [January 15, 2025 complete 11-game independent-date replication](https://github.com/tyrollclimaco09-oss/Atlas/blob/fd724435dfe680b2240b9043d750d5da40006339/docs/research/ATLAS_NBA_20250115_11GAME_TURNOVER_QUICKSCORE_REPLICATION_V1.json), Git blob `4abd65860e22c27a95613d4b679d65390556f0c9`, 11 accepted, 0 rejected, including correct OT period scoreboard handling. Events in OT excluded from regulation denominator; all 302 regulation turnovers independently match the previously saved January BRef full-date event counts, blob `4b75ff1c4836373318d120c0031af72d50db3e73`.
- [Earlier-only model feature ablation](https://github.com/tyrollclimaco09-oss/Atlas/blob/b078cc2f04baea6bcfc3ae5068af3dc0ef013d63/docs/research/ATLAS_GAMESENSE_2025_TO_2026_HALFTIME_PRESSURE_ABLATION_V1.json), Git blob `89daa2345c1dfc07333246194de316304dcbd09e`. Eleven January 2025 training examples vs sixteen October 2026 held-out-later-date examples. All half features are from H1 only; outcome is regulation H2 combined score. Ridge candidates tested via train-only leave-one-game-out. **The selected model was the historical mean alone**, not a turnover/FGA/FTA/estimated-possession regression. The plain prior MAE on later sample ~10.3409; pressure/pace ridge example MAE ~10.8699. A simple score-only ridge example measured 10.3265 on later test, but lost training selection and must not be promoted by cherry-picking later labels.

## What SCOUT actually measured

At EVERY native BRef `Turnover by` play-by-play row, flag `steal by` vs **NO STEAL MARKED** (do NOT relabel the latter 'dead-ball turnover'). In the same period, scan forward while elapsed game clock is at most 10, 15 or 24 seconds. Count a hit if the *opponent* next registers a positive score increase before either the original turnover team scores or the opponent commits another turnover. A foul or technical free throw may score with no game-clock movement, thus this is ONLY an event-adjacency proxy, not true possession ownership, fast-break/transition points, or the NBA's official 'points off turnovers'. Source is postgame BRef-rendered markdown via connected reader; raw provider response bytes and independent NBA CDN reconciliation unavailable. Every source quarter scoreboard was matched against previously archived scores.

| Calendar cohort | Steal-marked turnovers | Opp score first ≤15 seconds | Hit rate | Unmarked turnovers | Opp score first ≤15 seconds | Hit rate |
|---|---:|---:|---:|---:|---:|---:|
| October 20–22, 2026, all 16 games | 306 | 163 | **53.27%** | 234 | 72 | **30.77%** |
| January 15, 2025, all 11 games (regulation) | 174 | 102 | **58.62%** | 128 | 29 | **22.66%** |
| BOTH 27 games combined (descriptive only) | 480 | 265 | **55.21%** | 362 | 101 | **27.90%** |

Within October's 16 games, 15 had a higher steal-marked conditional hit rate, 1 had a lower rate. All event rows were treated with the same frozen algorithm over these dates; separate-year replication shows directional consistency, but both data sets came from the SAME external site/reader, not two independent providers or preregistered future observations. Same-day games share common environment and games are not independent possessions; pooled row-based confidence and any causal claim would be misleading.

### Sensitivity to game-clock threshold

| Window | October steal | October unmarked | January steal | January unmarked |
|---|---:|---:|---:|---:|
| 10 sec | 146/306 (47.71%) | 32/234 (13.68%) | 91/174 (52.30%) | 11/128 (8.59%) |
| 15 sec | 163/306 (53.27%) | 72/234 (30.77%) | 102/174 (58.62%) | 29/128 (22.66%) |
| 24 sec | 183/306 (59.80%) | 100/234 (42.74%) | 111/174 (63.79%) | 50/128 (39.06%) |

The gap decreases for wider clocks, consistent with (but not proof of) faster scoring near a steal. Steal-labelled TO may correspond to live-ball opportunities, but turnovers are not experimental treatments: defenses, lineup and clock, and referee/scorekeeping rules cause differences. Crucially **none of the post-TO future scoring may be used as a feature for a forecast made at or before that turnover**. For genuine halftime research, only first-half observed-event summaries may be consumed for forecasting H2.

## Important negative: aggregate first-half pressure proxies did NOT beat the prior

Training-only leave-one-game-out tested nine preplanned families: intercept-only, half points, estimated possessions, turnover count, pace+FTA, pace+TO+FTA, volume+eFG, score+pace, and all six; ridge penalties 1/10/100 for nonempty models. Single Jan15 day leaves just 11 games; selection and calibration from it can overfit. Best train LOO MAE **9.6727** was intercept-only prior; nearest possession-only with ridge 100 had 9.7679, TO-only ridge100 had 9.7688; pace+pressure was lower ranked. The selected simple prior evaluated with MAE 10.3409 on later 16 games; predefined three-variable pace+pressure ridge10 gave 10.8699. DO NOT select another model solely from its 2026 test MAE (score-only ridge10 yielded ~10.3265 but wasn't chosen historically). This evidence doesn't say pressure is useless; it shows coarse aggregate counts without possession context aren't yet sufficient.

## Actual node improvements and next earned experiment

**SCOUT/FILTER:** preserve steal-marked vs unmarked event type; 10/15/24 game-clock next-score adjacency can annotate historical scripts but is not official points-off-turnovers. Keep overtime, quarter and scoring identity, as-of receipt clock, provider provenance and missing events. Read `pbpstats` documentation for possession-ownership and on-floor source; direct official NBA CDN JSON could not be fetched by our available reader, so raw possession/lineup identity remains BLOCKED rather than guessed.

**GAME SENSE / OUTCOME INTELLIGENCE:** compare opportunity loss against conversion/FT rebounds and *speed* of the scoring response. This can distinguish 'lost-ball counterattack' from a low-opportunity scoring drought, subject to actual event order and lineup data. Build both total-score scripts and player counting opportunity paths; nothing implies particular defender Ausar guarded specific shooter.

**ORACLE:** candidate next H1 feature = steal-marked turnover frequency and prior-scoring adjacency among already-occurred first-half turnovers, combined with prior-season/team-conditioned transition defense, expected remaining possessions, fouling and verified minutes. Test in multiple earlier complete dates (not one January day), train historically and score only future unseen game/date clusters. Separate H2 points, end-Q3 Q4 points and comeback outcome calibration. Use original simple 2025 prior and latest-rate as two baselines.

**EDGE THIEF/CALIBRATOR:** deny classification of unmarked turnovers as dead ball, deny points-off-TO claims, prohibit outcomes-after-cutoff leakage; require actual provider custody, score/clock/order corrections and game date grouping. Frame 'regression toward mean' baseline properly and keep prospective abstentions/missing packets. Test probability calibration, MAE, interval coverage and rare-comeback bins with uncertainty. No EV forecast merely because quick-score rates differ historically.

**Release status:** EVENT_TIMING_REPLICATED_DESCRIPTIVELY / 27_COMPLETE_GAMES_SOURCE_SCORE_VALIDATED / 2025_TOTAL_TO_AND_2026_TO_PARITY_VALIDATED / HALFTIME_AGGREGATE_ABLATION_FAILED_TO_BEAT_PRIOR / NO_CAUSAL_MATCHUP / RAW_NBA_PROVIDER_BLOCKED / NO_BETTING_AUTHORITY / ARC_III_ZERO_OF_15_FORMAL_PASS_CLOSURES.
