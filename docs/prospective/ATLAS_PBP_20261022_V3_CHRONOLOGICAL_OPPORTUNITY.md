# ATLAS | October 22, 2026 | NBA Play-by-Play V3 Chronological Opportunity Audit

**Authority:** REVIEW_ONLY_SHADOW. No Golden Slate, no production code/schema/price/Final Gate change. No wagers or new bankroll exposure.

## What was done

- Reconciled public Basketball-Reference quarter-by-quarter play descriptions and final scores for **43 NBA games on April 8, 9, 10, 12** (all displayed games on those days), and reused **14 opening-weekend games on Oct 20–21** from the frozen V2 audit. **57 games total.**
- Retrospectively reconstructed, for each game, top two Q1–Q3 field-goal attempt players per team, chosen **without Q4 information**; target is their combined Q4 FGA. The score differential at end Q3 is the feature, **not known pregame**.
- Maintained one observation **per GAME** rather than pseudoreplicating two team rows. PBP source URLs are supplied in user-visible downloadable shadow research pack under `game_source_manifest.csv`. No third-party raw event dump copied to repository.
- Trained models in **strict earlier-day→later-day chronological expanding windows**, not random event-level train/test shuffle.
- Selected a two-hinge saturating-ridge variant based on the April 12 held-out day, then evaluated Oct 20–21 (14 games). All of this is **retrospective researcher-selected evidence**, not a true frozen-before-tipoff forward test.
- 13 focused parsing, as-of, score-reconciliation, no-Q4-selection and temporal-integrity tests passed. Deterministic code and paired game outcomes available in downloadable pack.

## Measured results (lower MAE better)

| Evaluation date | Games | Prior mean baseline MAE, Q4 FGA | April-selected V3 MAE |
| --- | ---: | ---: | ---: |
| April 12 | 15 | 4.860 | 4.436 |
| October 20 | 3 | 7.134 | 6.106 |
| October 21 | 11 | 7.043 | 6.552 |
| **October both** | **14** | **7.062** | **6.456** |

**October paired reduction: 0.606 attempts per game, 8.58% relative MAE**, improving 9 of 14 games. A 10,000 game-paired bootstrap had improvement range **-0.347 to +1.509** (descriptive uncertainty, includes zero). Cannot call this statistically established skill.

**Important contrary subgroup result:** for games at **20+ lead after Q3** (n=5), mean MAE was baseline **5.676** versus upgraded **5.679**, *not an improvement*. Most October aggregate gain came from closer games. Therefore **the blowout-risk feature is NOT validated as a standalone predictive enhancement**; a credible model needs real substitution/minutes dynamics, not score alone.

**Secondary post-hoc low-Q4-opportunity classifier:** exactly two such October events in 14 games; tiny Brier improvement October, **worse April 12**. Block model promotion.

## NFL status

2026 nflverse season-wide parquet/CSV.GZ release is verified to exist but **binary was not retrieved/ingested** in this environment (GitHub release binary inaccessible). The V2 12-game Patriots/Bears text-proxy audit (1,988 total textual entries) remains merely descriptive. Do not manufacture NFL player-target probabilities or validated snap counts from that data. Existing V2 fail-closed local-file nflverse reader can be used when authorized file bytes are available. Reference: https://github.com/nflverse/nflverse-data/releases/tag/pbp

## Deployment blockers remain

- Incomplete representative training/validation history; April 2026 is last games of prior season and includes extreme rest/rotation behavior, different from October rosters.
- No verified populated NBA/NFL PBP database ingest and no official live feed parity.
- No player-specific game-path distributions calibrated against prospectively frozen lines and player outcomes.
- No authenticated DraftKings executable combined/single quotes, so no independent +EV/CLV proof, no justified parlay pricing.
- Social narratives are discovery/adversarial inputs only; they receive no performance weight without prospective validation.

## Canonical next proof gate

1. Acquire authentic, legally usable event source bytes and compare 2026 NFL data and NBA provider parity; immutable source fingerprint and as-of timeline.
2. Build true possession/lineup (NBA) and play/drive/route/target (NFL) distributions in existing ORACLE/Game Sense. No separate architecture node.
3. Freeze unchanged baseline and upgraded **independent probabilistic forecasts** before future games. Score on identical held-out labels by date/week/game with Brier/log-loss, counting-stat coverage and uncertainty; require improvement outside the current researcher-selected sample.
4. Preserve SCOUT candidate continuity and pair joint outcomes, but do not claim value until an actual matching sportsbook offer is captured and Final Gate is explicitly approved by the human.

**Verdict:** `RESEARCH_ADVANCED | GAME_OPPORTUNITY_CHRONOLOGY_VERIFIED | SMALL_RETROSPECTIVE_IMPROVEMENT | NO_STATISTICAL_PROOF | NO_PRODUCTION_PROMOTION`

Prior checkpoint: `docs/prospective/ATLAS_PBP_OCT20_21_CHRONOLOGICAL_FALSIFICATION_V2.md`.
