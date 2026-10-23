# ATLAS Game Sense — Halftime Pressure Forensics, CLE at PHI

2026-10-23 | RETROSPECTIVE RECONCILIATION | No prospective halftime freeze | No causal inference, odds validation, or betting authority

## Source and authority

- NBA game: Cleveland at Philadelphia October 22, 2026, ID 0022600006; NBA.com game locator https://www.nba.com/game/cle-vs-phi-0022600006
- Halftime source: search-index half-time snapshot at https://video.thescore.com/nba/event/2462627 with CLE 69 / PHI 45, halftime shooting/turnover counts. IMPORTANT: source is mutable (direct open later showed final); this search-index snapshot is not a cryptographically timestamped halftime witness and is not evidence that Atlas knew the numbers at halftime.
- Final source: the same theScore URL on direct open showed final CLE 106 PHI 114, team turnovers CLE 21 PHI 17; published Reddit postgame thread https://www.reddit.com/r/sixers/comments/1xd1aj6/postgame_thread_the_philadelphia_76ers_defeat_the/ gave the same final FG/3P/FT/points but PHI turnovers 16. Retain CONFLICT, do not secretly select one.
- Cleveland account https://www.fearthesword.com/cavs-scores-results/53339/cavs-forfeit-29-point-lead-fall-to-sixers-114-106 described first-half 15 PHI turnovers and one second-half; separate AP and Philly accounts report 14 first-half. Exact period turnovers not independently established.
- theScore final displays closing total 237.5 without independently confirmed DraftKings price, time or book-specific rule. Another variant displayed 233.5 as current quote. These are different unsupported time states. No claim of historical playable value or EV.

## Quarter and halftime scoreboard arithmetic (points)

| Team | Q1 | Q2 | H1 | Q3 | Q4 | H2 | Final |
|---|---:|---:|---:|---:|---:|---:|---:|
| CLE | 35 | 34 | 69 | 21 | 16 | 37 | 106 |
| PHI | 18 | 27 | 45 | 37 | 32 | 69 | 114 |

PHI trailed 24 at halftime, needing at least +25 net second-half points for a regulation win. Actual H2 PHI +32 net; final PHI +8. First-half PHI margin -24 versus second-half +32 gives +56 change in half-specific scoring margin (not a 56-point comeback). PHI offense +24 from H1 to H2, CLE offense -32. Combined game scoring H1 114, H2 106: comeback did NOT require higher combined second-half scoring.

## Derived halftime shot/FT breakdown (all four rows satisfy points = 2*FGM + 3PM + FTM)

| Team/Half | FG | 3P | FT | eFG% | Field-goal points | Free-throw points | Score |
|---|---|---|---|---:|---:|---:|---:|
| CLE H1 | 25/49 | 5/15 | 14/17 | 56.122% | 55 | 14 | 69 |
| CLE H2 | 14/38 | 2/14 | 7/11 | 39.474% | 30 | 7 | 37 |
| PHI H1 | 18/44 | 4/15 | 5/8 | 45.455% | 40 | 5 | 45 |
| PHI H2 | 24/48 | 3/13 | 18/22 | 53.125% | 51 | 18 | 69 |

Exact +56 half-margin shift decomposes by changes in scoring CHANNELS: PHI +11 field-goal points, PHI +13 free-throw points; CLE -25 field-goal points, CLE -7 free-throw points. These signed differences sum to 56. The field-goal points-per-attempt versus FGA-volume symmetric accounting identity further gives PHI +3.943 (attempt-volume component) plus +7.057 (conversion component) = +11 FG points; CLE -10.516 (attempt-volume) plus -14.484 (conversion) = -25 FG points. These are accounting decompositions, NEVER causal effects of defense.

FGA PHI 44->48; CLE 49->38. FTA PHI 8->22; CLE 17->11. eFG% PHI 45.455->53.125, CLE 56.122->39.474. The half-period turnover sources disagree on PHI first half 14 versus 15 and final 16 versus 17; if H1=15 and final=16..17, H2 is 1..2. CLE H1 6, final 21 -> H2 15, subject to same-source validation. Possession counts, lineup/defender assignments, play call adjustments and causal mechanisms remain UNKNOWN.

## Validation and stop lines

- Local isolated arithmetic/provenance-fixture tests: 18 of 18 PASSED on manually transcribed source numbers. This is NOT a test of the staged NBA CDN halftime extraction script, which remains not run after CI workflow creation was blocked; do not imply authenticated PBP/box parity in the two-case study.
- Contested PHI turnover counts are not adjudicated, nor was a witnessed Q2/halftime source freeze captured by Atlas. Selected comeback is biased anecdote and cannot train a probabilistic model.
- Do not say 14 fewer turnovers directly equals 14 more possessions; offensive rebounds, fouls, FTA and game pace alter possession accounting.
- No actual guarded shooter assignment can be deduced from box/ordinary PBP. Ausar Thompson matchup research must use possession-level guard assignment and deterring shot attempts, not only defended FG%.
- Final total 220 is not proof of profitable under. Need independently sourced contemporaneous sportsbook quote, price, rules, and price-blind calibrated distribution before calling EV.

## Next experiment

Pre-register complete consecutive-day NBA census and actual *live halftime* point-in-time packets with identical game cutoffs, score, TO with category alignment, opponent offense/defense, verified possession counts, shot location/quality and minutes where available. Compare forecasted H2 team points, remaining combined points and comeback win probabilities versus simple earlier-frozen score/clock baseline on later games, preserving unscored/late/missing cases. No market line anchoring until independent distribution tested; player totals and unders researched symmetrically.

Verdict: ARITHMETIC_RECONCILED / SOURCE_TURNOVER_CONFLICT / HALF_SOURCE_NOT_PROSPECTIVELY_WITNESSED / NO_CAUSALITY / NO_EDGE / REVIEW_ONLY.
