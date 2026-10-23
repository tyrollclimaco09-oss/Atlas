# ATLAS / Game Sense — Historical Reference Arc + Complete Opening PBP Source-Event Repair

Checkpoint date 2026-10-23 America/Chicago. **READ-ONLY SHADOW RESEARCH; NO MODEL/EV/BETTING AUTHORITY.** This document extends, not replaces, the 16-game 2026 opening scoreboard cohort. Relevant sources: NBA.com, 2024 scientific paper, Basketball-Reference league aggregates, public Github archive, and versioned internal ATLAS research documents. Original retrospective freeze and all earlier checkpoints remain unchanged.

## Major evidence advance: 16/16 play-by-play event counts reconcile

- Starting universe: 16 NBA October 20–22, 2026 games, each retained; source score archive Git blob c8e0d2ee1610e4c9f45d40464d85b6d511ccef5e.
- First strict extraction V1 (blob 5a835a742f07699799b7e4b6fefb7ae719725c14) accepted 9 and rejected 7 on point-conservation although quarter-end scores matched. The seven failures were caused by leaving out **technical and flagrant foul free throws**, not seven invalid game records. Original rejected history is preserved.
- Repaired V2 at docs/research/ATLAS_NBA_OPENING16_PBP_PERIOD_EVENTS_20261023_V2.json, Git blob ee83617990f03b1c9a2ae2608db4431693c16973, commit 804730eba52c29770b41e312e3f110e5636b7889. **16/16 accepted, 0 rejected, 128 team-quarter point-conservation identities and 64 quarter-end score checks.** The parser observed 19 special-type free throw attempt events in the transcribed V2. Do not mislabel these as 19 makes.
- The parsed source is per-game Basketball-Reference Play-by-Play web-extraction text with original URLs in V2, not independently mirrored raw HTTP response bytes. This is a real retrospectively sourced event ledger, **NOT official NBA-CDN multi-provider parity for all 16**. Team rebounds and non-counting heave actions may require additional event taxonomy. True possessions, player five-man lineup states, and tracking defender assignments are not proven.
- Grounded contrast: CLE@PHI first-half turnovers CLE6/PHI15 -> second half CLE15/PHI2; DEN@OKC DEN9/OKC6 -> DEN13/OKC6; BOS@DET BOS9/DET9 -> BOS5/DET8. Still cannot assign causality or claim all turnovers yielded immediate points.

## Multi-decade historical comeback prior: rarity and TIME matter

Peer-reviewed open access article, *NBA game progression of extreme score shifts and comeback analysis: A team resilience perspective* (Asian Journal of Sport and Exercise Psychology, 2024; DOI 10.1016/j.ajsep.2024.10.011, https://www.sciencedirect.com/science/article/pii/S2667239124000285) examined **3,942 games reaching a 20-point deficit during the first half** between 1997–98 and 2021–22. It reports only **about 7%** eventual winning comebacks in that specifically conditioned historical group, with deficits reached earlier tending to be more recoverable. Important: 7% is NOT P(win | 20 down at halftime), NOT the unconditional comeback frequency, and NOT transferable as-is to 2026–27 or a hypothetical DraftKings price. It is prior evidence for stratification and a rare-event calibration challenge.

Historical model features to register separately: first time deficit reaches -10, -15, -20 or -25; half maximum deficit; score margin at Q1/halftime/Q3; seconds and expected possessions remaining at first crossing; offensive and defensive team quality known before tip; player availability at actual clock. Do not substitute max in-game deficit for halftime deficit. Once teams tie, the cited paper found no inherent positive momentum for the formerly trailing side; do not infer a one-way hot-hand boost from equalizing.

## Older NBA seasons show *season-phase nonstationarity*

Official NBA article by John Schuhmann, updated 2025-10-31, https://www.nba.com/news/10-numbers-know-first-10-days-2025-26, table through Oct30 2025. It documents early-10-day regular-season offense and pace versus full season for three prior completed seasons. Quote statistics below are from one coherent NBA analysis; do not combine methodological point estimates from other providers indiscriminately.

| Season | First 10d offensive rating | Full-season offensive rating | First 10d pace | Full-season pace |
|---|---:|---:|---:|---:|
| 2022–23 | 111.6 | 114.1 | 100.6 | 99.8 |
| 2023–24 | 110.3 | 114.5 | 101.1 | 99.2 |
| 2024–25 | 111.9 | 113.7 | 100.5 | 99.6 |
| 2025–26 (only early observation in that article) | 114.3 | unreported there | 101.9 | unreported there |

In EACH of the three complete historical comparison seasons pace DECREASED (0.8–1.9 poss/team per 48 min), while offense per 100 possessions INCREASED (+1.8 to +4.2 using displayed rounded columns; article rounds 2023–24 change as +4.3). This means opening-day pace or shot conversion should not be projected uncritically into mid/late season. The article also notes early-2025/26 foul/free throw volatility from officiating emphasis. These observations do not prove the same evolution in 2026–27; need holdout season checks.

Feature design: event-time calibrated possession rate and scoring-efficiency rate as **separate latent channels**; conditional recent form by season-phase (opening first ~10 days vs midseason vs post-break vs playoffs), lineups and explicit rule-era change point. Train earlier seasons only; a current season's end-of-season league average cannot enter an earlier pregame or halftime prediction.

## Within Oct 2026 source-led mechanistic contrast (not forecast skill)

Using 16 complete event-ledger games and the rough accounting estimator **FGA − ORB + TOV + 0.44 FTA** averaged over both teams in each half (NOT official exact possession sequences):

- MIL@WAS combined 107 H1 -> 137 H2 points while estimated possessions/team fell about 50.7 -> 47.9 per half. Total points per estimated team possession rose from ~2.11 to ~2.86. Large total increases can reflect scoring efficiency/FT effects without increased pace. This ratio is total combined points per one team's approximate possessions, NOT offense points per individual team possession.
- BOS@DET combined 103 -> 131; estimated possessions/team ~47.7 -> 49.5, combined-score per estimated team possession ~2.16 -> 2.65; both opportunity and efficiency changes warrant checking.
- CLE@PHI combined 114 -> 106; ~53.0 -> 50.3 estimated possessions/team, combined points per estimated team possession ~2.15 -> 2.11. Team turnover swings were large; cannot infer defender causality from aggregate counts.
- DEN@OKC combined 92 -> 88; ~45.8 -> 42.6 estimated possessions/team, score-per-estimated-possession remained similar. Shot opportunity loss and lower total can coexist with reasonably steady conversion proxy.

These are NOT causal decompositions; FGA, ORB, FTA and turnovers are interdependent, and correlations with the constructed efficiency metric are mathematically coupled to scoring. Do not use in-sample correlations as predictive validation. Retrospective historical venue/time changes also must be controlled.

## Viable historical source pipeline identified but not yet ingested

Public GitHub repository https://github.com/shufinskiy/nba_data reports historical play-by-play sources since 1996–97 and matchup data since 2017–18; verified GitHub directory includes `cdnnba_2023.tar.xz`, `cdnnba_2024.tar.xz`, `cdnnba_2025.tar.xz`, `matchups_2023.tar.xz` through `matchups_2025.tar.xz` and season-level PBP files. The repository is marked Apache-2.0, but **check terms of any upstream redistributed NBA-derived material separately** before publishing/rehosting. Source files are NOT downloaded or schema/revision-validated in this pass. GitHub directory existence does NOT imply row-level coverage, legal entitlement for redistribution or runtime integration. The 2025 suffix is only an archive name; require actual game dates from bytes before mapping to a season.

Planned proof cohort: train/normalize chronological 2022–23 through 2024–25 and earlier if quality warrants; hold back 2025–26 as separately graded later testing; freeze 2026–27 opening period for live prospective evaluation. Do not cross-leak trades, known full-season assists, team strength, matchup season average, injuries or final starter counts into an earlier prediction. Preserve all season/date games and rejected rows; do not cherry-pick memorable comebacks.

## What Game Sense must ask before any under, player prop or comeback probability

1. WHEN: when and how deficit arose; how many expected possessions and seconds left? Distinguish early 20-point in-game deficit from 20-point *halftime* deficit.
2. WHY: pace, turnovers (live-ball vs dead-ball), shot selection and NBA expected FG quality, FT/fouling, offensive boards/second chances, bench/minutes/rebound-chance distribution.
3. MATCHUP: identify real defensive assignment and matchup possessions, calculate earlier-only shooter baseline FGA per possession and NBA DET FACTOR ratio, use DFG% and xFG% only for attempted shots and distinguish shot **deterrence** from difficult misses. Official sources: https://www.nba.com/stats/help/glossary and https://www.nba.com/news/intro-to-expected-field-goal-percentage . No unverified named Ausar assignment or under promotion.
4. PROJECTION: score + time -> posterior distribution of remaining team possessions and efficiency -> joint team total/margin distribution; condition each player minutes and attempts/potential assists/rebounds on lineup, usage conservation, foul trouble, game scripts and verified defense. Include uncertainty, abstentions and multiple mutually exclusive narratives.
5. PRICE: only after out-of-time scoring tests and actual live book odds, bet rules and quote times separately verify a price-blind model vs market; final human approval. Do not call any line safe.

## Calibration tournament and hard gates

A: score + clock + season/era prior; B: A + first-deficit timing; C: B + real turnover/FT/ORB opportunity and shot-quality features; D: C + real player minutes/defensive assignments with missingness abstentions. Score rate targets (remaining total, P(win), Q4 FGA and attempts/assists) on later dates/seasons only. Calibration loss, MAE, interval coverage, rare-deficit conditional Brier/log loss and sharpness; require model to beat simpler prior in confidence-bounded out-of-time tests. Preserve all losses and the 2026-27 first 16 games as untouched prospective/retrospective benchmark case depending on original event-time receipts.

**Stop line:** V2 source-event score parity 16/16 PROVEN, but 16/16 raw source custody and NBA-CDN box parity NOT PROVEN, true possessions / five-man lineups / specific defender matchups NOT PROVEN, public historical archive DATA NOT INGESTED, future calibration NOT PROVEN, executable DK odds/EV NONE. ARC III 0/15 FORMALLY CLOSED. End-of-pass MasterSave appends to incremental ledger only; original frozen Oct18 docs remain untouched.

