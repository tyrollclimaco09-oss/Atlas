# ATLAS NBA Game Sense — Four-Season Cross-Phase Historical Transfer Check

**Research freeze:** 2026-10-23. **Classification:** retrospective, shadow, first real historical transfer pilot, NOT statistical calibration or sportsbook edge. The current 2026–27 first 16 games are later by calendar than all historical reference games but evaluation used archived retrospective outcomes; no genuinely witnessed live prediction is claimed.

## Fixed historic sample

Two opening-night nationally broadcast games for each of the four completed 2022–23, 2023–24, 2024–25, and 2025–26 NBA seasons. Exactly two selected games from the Jan 15, 2023/2024/2025/2026 Basketball-Reference daily index per corresponding season; selection was first two listed on the index, **not an asserted kickoff-order sample**. This is 16 non-random games split 8 opening and 8 January. Source is actual Basketball-Reference game play-by-play pages, obtained as postgame rendered markdown. All 16 accepted after scoring identity validation; 1 two-overtime opening game and 1 one-overtime January game preserved; only regulation Q1–Q4 contribute to half-to-half comparisons. We cannot infer league-wide rates from this selection.

### Versioned source receipts

- [Four-season opening-night eight-game PBP archive](https://github.com/tyrollclimaco09-oss/Atlas/blob/7b4d58aacadba6127d744c4fbe6d94dd04cd5460/docs/research/ATLAS_NBA_2022_2025_OPENING_NIGHT_PBP_PILOT_20261023_V1.json), Git blob `2687c7b49c121b7b7d2c36a00b54e0967173b269`. Eight accepted, 34 regulation/OT periods, 102 score/point checks.
- [Same four seasons, January 15 eight-game PBP control](https://github.com/tyrollclimaco09-oss/Atlas/blob/83264f0a4b00a9de5314ce65e4351c378ff4aa79/docs/research/ATLAS_NBA_2022_2025_JAN15_MIDSEASON_PBP_CONTROL_20261023_V1.json), Git blob `553b3bda293d773f35a3ee3a017f9c957960fda0`. Eight accepted, 33 regulation/OT periods, 99 score/point checks.
- [Later 2026 opening 16-game score universe](https://github.com/tyrollclimaco09-oss/Atlas/blob/032d7a2f1a1653d14a7620c753fe242267494814/docs/research/ATLAS_NBA_OPENING_16_GAME_SCORE_REGIME_20261023.json), Git blob `c8e0d2ee1610e4c9f45d40464d85b6d511ccef5e`, separate from older-year training/reference.
- All figures were recomputed from versioned source records; however raw historical HTML/JSON bytes and source use-rights are NOT independently archived or approved. No released `shufinskiy/nba_data` binary files ingested. This pilot relies on web-rendered pages, which need an independent provider parity audit before promotion.

## Observed cross-phase deltas (H2 regulation total minus H1 total)

| Season | Opening game 1 | Opening game 2 | January selected game 1 | January selected game 2 |
|---|---:|---:|---:|---:|
| 2022–23 | -9 | +10 | +18 | +8 |
| 2023–24 | -8 | -2 | +2 | +24 |
| 2024–25 | -17 | +19 | -12 | +2 |
| 2025–26 | -8 | +10 | +26 | -25 |

- Opening n=8, mean delta `-0.625`, 3/8 H2-higher; estimated team possession half average H1 `48.775` → H2 `46.058`.
- January n=8, mean delta `+5.375`, 6/8 H2-higher; estimated team possession half average H1 `50.443` → H2 `47.4`.
- Estimate is `FGA − ORB + TOV + 0.44 × FTA` averaged over both teams. Not a true possession-by-possession reconstruction. Overtime never included in 24-minute H2, which would artificially inflate apparent pace and totals.
- This samples exactly two opening games per season and two **index-first** January games—not representative random teams or fixed competitive difficulty. No significance, no structural causal inference, no historical market odds.

## Minimal earlier-to-later model tournament

**Target:** Regulation second-half combined points. **At halftime:** base estimate `pred_H2 = observed_H1`. An earlier-year adjustment estimates `H2 minus H1` by a fixed arithmetic average of a previous-year same-phase cohort. No model fitted to the later holdout outcomes, but retrospective feature extraction and experiment selection happened after the games; therefore **NOT a prospective proof**.

| Test | Training earlier seasons | Target holdout | Baseline MAE | Adjusted MAE | Verdict |
|---|---|---|---:|---:|---|
| October phase | 2022–23 to 2024–25 opening nights, 6 games; trained offset -1.167 | 2025–26 2 opening games | 9.0 | 9.0 | NO IMPROVEMENT |
| January phase | 2022–23 to 2024–25 Jan15, 6 games; trained offset +7 | 2025–26 Jan15 2 games | 25.5 | 25.5 | NO IMPROVEMENT |
| All eight older openers | four completed historical seasons; learned offset -0.625 | Oct20–22 2026 16 games | 11.8125 | 11.65625 | Tiny descriptive improvement; selection mismatch |
| All eight older openers | same | Oct20 2026 3 games | 16.0 | 16.2083 | WORSENED on first-day subcohort |

**Interpretation:** A naive average phase adjustment showed ZERO benefit in either 2025–26 holdout (only two cases apiece), mixed effects in the 2026 subgroups, and is not robust. Do not promote historical season-phase alone, fit on later-season results, or call 0.156 MAE a meaningful win. This is a valuable negative result.

## Game Sense conclusions and next falsification

1. **Season phase is a model CONDITION, not an automatic boost.** NBA official league trends across 2022–25 indicate early-season offensive rating was below full-season despite higher early pace, but this n=16 player/game source experiment does not prove transferable phase adjustment. Historical official reference: https://www.nba.com/news/10-numbers-know-first-10-days-2025-26 .
2. **Overtime must have separate source state.** Oct2025 HOU@OKC 2OT and Jan2024 MIA@BRK OT preserved in denominator. Do not use overtime final score to score a regulation-half projection.
3. **Comeback requires individual deficit timing, not just margin.** Peer-reviewed 2024 study DOI 10.1016/j.ajsep.2024.10.011 found ~7% recoveries among *first-half games that reached 20 behind*, a different cohort than teams down 20 at halftime. Do not anchor current-game probabilities to that unconditional historical frequency. https://www.sciencedirect.com/science/article/pii/S2667239124000285
4. **Better prospective model tournament needed:** score+time / previous known season-strength baseline first; add inferred remaining possessions and pace, then turnover/FT/OREB, then lineup/defender assignments only with genuine matching tracking. Separate half total, leader comeback probabilities and player statline joint forecasts; negative result and all abstentions retained. Big under thesis requires model likelihood plus executable exact-book line/odds/rules before Human Final Gate.
5. **Next historical acquisition:** genuine all-games 2022–25 (and earlier) chronological source ingest, provider row-level verification, rights checks, exact possession-level parsing, reproducible source bytes and independent frozen audit. Current 16 historical games merely PROOF-OF-INGESTION, not full all-season Gravity Chamber.

**Stop line:** HISTORICAL_PBP_SAMPLES_16/16_VALIDATED_SCORING / ONE_REGULATION_AND_TWO_OT_HANDLING_GATES_FROM_SOURCES / REGIME_TRANSFER_UNPROVEN / NO_EXACT_POSSESSION_MODEL / NO_CALIBRATED_PROBABILITIES / NO_PRICE_OR_PROFITABILITY / ARC_III_0_OF_15_FORMAL_SIGNOFFS / HUMAN_FINAL_GATE_UNCHANGED.
