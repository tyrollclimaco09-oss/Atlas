# ATLAS Timeskip 06 — strict NFL play correspondence research

**Date:** 2026-10-22. **Lane:** NFL ONLY. **Game identity:** 2026 Week 6, Houston **at Jacksonville**; ESPN `401872996`, nflverse `2026_06_HOU_JAX`. **Mode:** retrospective shadow, no wagers.

## Predeclared narrow matching protocol

1. **ESPN candidate set:** from 186 drive events, only non-penalty, non-turnover `Pass Reception`, `Pass Incompletion` and `Rush` with source play ID, Q1–Q4, parsable quarter clock, drive team ID matching start-field team ID. This yields 116 (41 receptions + 25 incompletions + 50 rush).
2. **nflverse candidate set:** from the 178 PBP rows for `2026_06_HOU_JAX`, require `posteam in (JAX,HOU)`, one of `pass_attempt=1` or `rush_attempt=1`, Q1–Q4 and valid `quarter_seconds_remaining`, excluding `play_type=no_play`. The source has no `no_play` column; treating it as required was caught and corrected.
3. Generate `(quarter, remaining seconds, offensive team, pass/rush kind)` keys. **Count a correspondence only when each provider has exactly one candidate with that key.** Record missing and ambiguous keys rather than filling gaps. ESPN's source team is only **source-consistent**, not a proven independent player actor identity.

## Results and limitations

[Final GitHub run 39862414581](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39862414581): offline self-test PASS; live source proof PASS.

| Evidence | Observed |
| --- | --- |
| ESPN restricted candidates | **116** |
| nflverse pass/rush candidates | **127** |
| Uniquely matching quarter/clock/team/type keys | **116** |
| Ambiguous shared keys | **0** |
| Restricted ESPN candidates unmatched | **0** |
| Additional unmatched nflverse candidates | **11** |
| ESPN candidate rejections from all 186 event rows | 69 other types + 1 penalty/turnover = **70** |
| nflverse exclusions from 178 rows | 31 non-attempt + 10 `no_play` + 10 unknown possession = **51** |

The 11 additional nflverse rows are **not** verified missing ESPN snaps or errors. The restricted ESPN set excludes touchdowns, interception returns, penalties and administrative events by design. A per-type investigation can account for the 11 later; no causal conclusion now.

- nflverse gzip body SHA-256 `a6ddee607edda2d530bc65fd869c0eb2f8019ea0d962b020e039dae52c840399`, matching prior audit.
- Source scripts `scripts/proof/nfl-week6-clock-event-pair.py` and prior `nfl-week6-independent-pbp.py`.
- **Earned:** all 116 narrowly eligible ESPN source-consistent plays possess a unique counterpart key in independent nflverse data. This is beyond game-level 75/75 pass and 52/52 rush totals.
- **NOT earned:** actor/player IDs, complete snap accounting, exact official provider-native event ID equality, liability for edge calculation, QB player prop calibration, source licensing, or production readiness.
- **Next NFL:** inspect the 11 unmatched nflverse records by type and quarter, handle touchdown/interception/penalty ambiguities, and **separately** audit actual passer/rusher/receiver identifiers against box-score evidence. Refuse automatic player mapping.

## Unmatched 11 — additional same-clock diagnostic

[Run 39863207585](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39863207585) completed the 11-row first-pass diagnostic using ESPN's *existing* 186 event list, matching only quarter and exact remaining second (not athlete identity):

| ESPN neighbor class at the same clock | nflverse-only candidates |
| --- | ---: |
| No ESPN event at that exact second | 5 |
| Timeout | 2 |
| Pass Interception Return | 2 |
| Penalty | 1 |
| Rush | 1 |
| **Total** | **11** |

The source's time stamps may differ between administrative and scoring events, and some excluded ESPN play types differ from nflverse's classification. **Do not claim any of the 11 are verified missing snaps, equal source events, resolved turnovers or recovered athlete actors.** Keep original 116 strict matches unchanged. The run emitted bounded IDs, quarter, clock, type and source SHA; data rights are still unreviewed.
