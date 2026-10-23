# ATLAS Game Sense — Half-Life, Comeback Feasibility and Score-Regime Trajectories

**Research date:** October 23, 2026, America/Chicago. Review-only retrospective analysis of ALL 16 NBA Oct20–22 regular-season games; the 16-game quarter line archive and independent-derived-half baseline are two DISTINCT VERSIONED artifacts, not proof of player or market predictive skill.

## Evidence and reproducibility

- Source quarter scores: docs/research/ATLAS_NBA_OPENING_16_GAME_SCORE_REGIME_20261023.json; Git blob c8e0d2ee1610e4c9f45d40464d85b6d511ccef5e. Individual first-layer game autopsies: docs/research/ATLAS_NBA_OPENING_16_GAME_FORENSICS_20261023.md.
- Derived fixed-formula arithmetic: docs/research/ATLAS_NBA_GAME_SENSE_16_HALFTIME_FEASIBILITY_V1.json; Git blob 81f5fb587750eeb67d1f6496828bd17a53e25333. Every game included, including blowouts, stable-control and misleading recovery games.
- Official source corroboration: https://www.nba.com/game/bos-vs-det-0022600001 plus NBA 23-0 recap https://www.nba.com/news/5-takeaways-pistons-use-23-0-run-to-storm-back-for-season-opening-win-over-celtics . The Celtics team recap https://www.nba.com/celtics/news/game-recap-20261020-keys-bosdet reports Detroit 62–27 over a 17-minute stretch and 37 second-half points combined for Javonte Green and Duncan Robinson. NBA https://www.nba.com/watch/video/game-recap-sixers-114-cavaliers-106 verifies the exceptional 29-point maximum in-game PHI comeback; separate halftime deficit was 24.
- Source hazards: NBA page https://www.nba.com/game/bos-vs-det-0022600001/box-score has in some web fetches rendered PRE-game/all-DNP, while the NBA game summary and alternate final box view show 121–113 result. This is a page/cache rendering discrepancy; do not trust a web-visible box without explicit gameStatus=3, matching game/team IDs, full period PBP and nonzero reconciled real attempts. No independent source bytes/timestamp for that page captured here.

## Finding 1: 6 halftime leader reversals are NOT interchangeable

Regulation win feasibility from halftime: if trailer down D points, needs at least (D+1) NET points over remaining 24 regulation minutes. This is arithmetic, not an estimated chance. A future validated model will also require remaining possessions, injuries, foul endgame and market constraints.

| Game | Halftime deficit | Required H2 net points | Required net/min | Observed H2 net | Changeover by | H2 combined-points change |
|---|---:|---:|---:|---:|---|---:|
| BOS@DET | 13 | 14 | 0.58 | 21 | Q4 | +28 |
| PHI@NYK | 4 | 5 | 0.21 | 10 | Q3_OR_EARLIER | -18 |
| MIL@WAS | 5 | 6 | 0.25 | 17 | Q4 | +30 |
| IND@NOP | 10 | 11 | 0.46 | 13 | Q4 | -1 |
| CLE@PHI | 24 | 25 | 1.04 | 32 | Q4 | -8 |
| DEN@OKC | 4 | 5 | 0.21 | 16 | Q3_OR_EARLIER | -4 |

Of these six eventual full-game reversals, 4 finished Q3 STILL behind and only flipped the winner in Q4: Detroit vs BOS (down 6 after Q3, then +14 Q4), Washington vs MIL (down 3, +15 Q4), Indiana vs NOP (down 6, +9 Q4), Philadelphia vs CLE (down 8, +16 Q4). The other two first finished a quarter in front by Q3 (PHI over NYK, OKC over DEN). No claim about exact FIRST in-quarter lead change—only quarter-end state.

## Finding 2: comeback pressure is not the same as scoring-total pressure

- Flip with trailing offense EXPANDING and leader SHRINKING: 4 cases (BOS–DET, IND–NOP, CLE–PHI, DEN–OKC).
- Flip with trailing offense itself DECLINING while leader collapses MORE: 1 case (PHI–NYK).
- Flip with trailing offense rising more than an improving leader: 1 case (MIL–WAS).
- 4 of 6 comebacks coincided with H2 points LOWER than H1; the MIL–WAS and BOS–DET flips had H2 combined points HIGHER (+30 and +28 respectively). No inherent UNDER/OVER implication.
- Both half combined scoring sums nearly matched across the full 16 games: 1803 H1 versus 1798 H2, while single-game signed errors range from -19 to +30. A simple zero-parameter retrospective strawman predicts remaining-half total equals first-half total. Its MAE is **11.8125 points**, median absolute error **10**, worst **30**. This is a DESCRIPTIVE in-sample benchmark using a predetermined formula, not evidence of independently witnessed halftime deployment, calibration or a profitable quote.
- Example naive total projections: BOS–DET 103 points H1 would predict 206 final, real 234 (+28); MIL–WAS 107 H1 predicts 214, real 244 (+30); CLE–PHI 114 H1 predicts 228, real 220 (-8). Same 'comeback' label, different direction.

## Finding 3: quarter-end lead trajectories are more informative than H1-final only

Observed quarter boundary lead-state transitions (Q1 leader -> half leader -> after Q3 leader -> final leader): **8 games zero, 5 one, 2 two, 1 three**; these counts EXCLUDE within-quarter swings and ties. 5/16 Q3 leaders ultimately lost by final, a distinct target from the 6/16 halftime leader reversals.

| Reversal-rich game | Q1 -> Half -> Q3 -> Final leader |
|---|---|
| ATL@ORL | ORL -> ATL -> ORL -> ATL |
| MIL@WAS | WAS -> MIL -> MIL -> WAS |
| IND@NOP | IND -> NOP -> NOP -> IND |

An especially important hidden countercase: ATL@ORL winner ATL led at halftime and won the game, yet Orlando retook the lead after Q3; a H1-final-only model completely misses the Q3 swing.

## Finding 4: defensive causality and lineup interactions cannot be reduced to margin

- Detroit's documented 23–0 run and the Celtics-reported 37 second-half points from Javonte Green and Duncan Robinson (37/76 = 48.7% of Detroit H2) suggest a material scoring redistribution into a newly active bench lineup. This is observed scoring and a lineup change, NOT proof the bench change itself caused the entire defensive outcome.
- Defensive assignment example Ausar Thompson vs primary opponent: verify on-court minutes, actual matchup possessions, contested vs deterred attempts, switches, foul danger, turnover/transition consequences and teammate redistribution. NBA glossary Deterrent Factor and Defended FG% quantify distinct things. https://www.nba.com/stats/help/glossary .
- No reliable evidence for individual defender attribution across all 16 current games. A Q4 field-goal drought without actual minutes/assignment cannot be labeled benching or matchup lockdown.

## Falsifiable product modules: shared Game Sense, not fragmented silos

1. `SCORE_CLOCK_FEASIBILITY`: D+1 net scoring requirement divided by estimated remaining possessions and time; issue null/abstain when reliable event clock absent. Never derive comeback probability from D+1 alone.
2. `REMAINING_TOTAL_DISTRIBUTION`: score-now plus conditional expected team A/B remaining points and uncertainty. Compare in real later frozen games to simple same-half-exposure and pregame baselines. H1/H2 totals alone do not identify pace or shot quality.
3. `PLAYER_OPPORTUNITY_MIXTURE`: on-court minutes x touches/chances per possession x attempt/assist/rebound chance x conversion, incorporating defensive matchups only with genuine assignments; conserve team possessions and opportunities and test teammate redistribution.
4. `SENTINEL_EDGE_THIEF`: identify official website state conflicts, hindsight contamination, missing possessions/lineups and deceptive late garbage-time runs. Halt exact-book total/profit claims without frozen line, odds, rules, source timestamp and independent probabilities.

## Next proof (not completed by this report)

Run genuine PBP/box reconciliation for EVERY game (16 denominator retained, report rejections) with period-specific TO/FGA/FTA/ORB, shot clock/pace, lineup substitutions, fouls/turnover-to-points chains. Freeze future actual halftime and end-Q3 scenarios before subsequent PBP; compare predictive loss by out-of-time game-balanced holdouts, preserve missing and negative cases. Only then couple to market price without anchoring. This analysis still has ZERO model calibration / human betting authorization; Arc III formally 0/15 complete.
