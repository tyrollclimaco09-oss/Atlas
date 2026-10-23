# ATLAS — Full-Historical-Date vs Cherry-Picked Two-Game Baseline (Jan 15, 2025)

Date of postgame research: 2026-10-23. This is the FIRST full historic calendar-day PBP event audit beyond the two selected January games. It is NOT a multi-season census or prospectively frozen prediction.

Source: Basketball-Reference Jan 15, 2025 day listing (all 11 matchups), full date game-by-game transformed play-by-play event sources. Original date score archive blob a7ab4b3d5646899f91c23a1184ba09da3c464543, PBP 11-of-11 event/scoring audit Git blob 4b75ff1c4836373318d120c0031af72d50db3e73. Both independently fetched from GitHub after initial write. Score index source URL https://www.basketball-reference.com/boxscores/?month=1&day=15&year=2025 ; URLs for all individual PBP pages retained in JSON.

11 games, 45 periods including 1 overtime; all 90 team-period points and 45 cumulative-score end checks reconciled with index, no exclusions. PBP free-throw classifier covers normal/technical/flagrant FTs. Original raw HTML bytes are NOT preserved and independent NBA-CDN box/parity source blocked; actual possessions and on-floor guard matchups NOT established.

## Sample-selection contamination exposed

Previous pilot deliberately used the first TWO games on this date: ATL@CHI combined H2-H1 -12, HOU@DEN +2. Their 2-game mean was **-5 points** and H2=H1 MAE **7 points**. The FULL 11 games average H2-H1 **+1.909 points**, and the same trivial H2=H1 baseline MAE **11.727 points**. Those directional/MAE contrasts are factual about this date, not statistical evidence that the real NBA changed. Sampling only two happened to understate the date's halftime-to-final scoring volatility.

The eleven-game sample includes 3 regulation halftime-lead eventual reversals, 5 lower-scoring second halves and 6 higher-scoring second halves. All-team per-event turnovers summed 166 across H1 and 136 across H2 (not exact possession difference). Combined H2 scoring compared with H1 is not explained causally by turnover counts alone.

| Game | Combined H1 | Combined H2 | H2-H1 |
|---|---:|---:|---:|
| Atlanta@CHI | 108 | 96 | -12 |
| Houston@DEN | 117 | 119 | +2 |
| Brooklyn@LAC | 93 | 100 | +7 |
| Miami@LAL | 120 | 105 | -15 |
| Orlando@MIL | 103 | 112 | +9 |
| Golden State@MIN | 97 | 134 | +37 |
| Dallas@NOP | 124 | 111 | -13 |
| New York@PHI | 107 | 111 | +4 |
| Memphis@SAS | 114 | 130 | +16 |
| Boston@TOR | 108 | 99 | -9 |
| Charlotte@UTA | 117 | 112 | -5 |

## Strongest follow-up question for Game Sense

Can previous-game rolling team strength, verified player availability, exact lineup substitution, and turnover/FTA/OREB information known AS OF HALFTIME explain which games' second-half totals moved without overfitting? Do a COMPLETE date-game split and later-season unseen test, not event-row random CV or two TV games. Conditional schedule/season phase alone previously failed 2025–26 tiny holdouts.

Next true possession milestone: run an independent provider/source-compatible possession parser on at least CLE@PHI/DEN@OKC and this full historic date; check fixture source custody, event sequence/order corrections and five-man lineup minutes with exact code+data hashes. Existing pbpstats docs support possession and lineup methods but official CDN direct fetch returned inaccessible in this session. Until source is independently ingested: FALSE to claim real possession boundaries, defender assignments or market edge.

Model and capper adoption remain gated by earlier-known features, proper held-out probability calibration, verified named-book line/odds and human Final Gate; no live bets, paid API, deployed code or formal Arc III pass signoff.
