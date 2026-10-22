# ATLAS NFL Timeskip 05 — independent nflverse PBP census and opponent correction

**Audit date:** 2026-10-22 • **Lane:** NFL ONLY • **Actual Week 6 game:** Houston Texans at **Jacksonville Jaguars**, 2026-10-18 (London).
**Correction:** ESPN team ID `30` = Jacksonville (JAX), `34` = Houston (HOU). Any prior *New England* opponent label on event `401872996` is **WRONG**. The old historical receipts are not deleted or rewritten.

## Identity and proven source coverage

- ESPN game `401872996` maps to `HOU @ JAX` with source `boxscore.teams` abbreviations validated, not guessed from team IDs. [NFL.com official 2026 Week 6 calendar](https://www.nfl.com/schedules/2026/by-week/reg-6) and [Jaguars Oct 14 preview](https://www.jaguars.com/news/where-to-watch-texans-vs-jaguars-week-6-of-2026-nfl-season) independently identify the opponent and date.
- nflverse PBP exact `game_id=2026_06_HOU_JAX`, `season=2026`, `week=6`, `home=JAX`, `away=HOU`. [Verified matched-game run 39855261656](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39855261656) has successful offline identity test + real two-source census. nflverse compressed 2026 PBP SHA-256 `a6ddee607edda2d530bc65fd869c0eb2f8019ea0d962b020e039dae52c840399`.
- **nflverse:** 178 distinct PBP rows: 75 pass-attempt indicators, 52 rush-attempt indicators, 78 dropbacks, 3 QB scrambles, 18 `no_play` rows, 12 penalty flags. Possession `HOU=81`, `JAX=87`, `unknown=10`. Zero player/team values outside this game's known abbreviations and no duplicate IDs. Some `UNKNOWN` possession rows are expected research cases, not assumed offensive plays.
- **ESPN:** 186 play/event rows in 20 drives, including quarter/status/administrative events; 41 `Pass Reception`, 25 `Pass Incompletion`, 51 `Rush` event-type rows (one penalized/turnover excluded in earlier conservative 116-candidate rule). Source `play.team.id` absent; `play.start.team.id` is a field-position context, not guaranteed actor.
- **Eight-row count difference is unexplained**, not eight verified missing snaps. No exact ESPN↔nflverse event ID correspondence, play clock pairing, passer/rusher/receiver identity links, complete player-target model or completeness certification has been established.
- The original separate 2026 Week 6 **aggregate player-stats** check matched C.J. Stroud 34 pass attempts and Woody Marks 15 carries from two providers. The event/team identity now aligns with the independent PBP census. That does not validate the 178 PBP actors.

## Regression and no-claim boundaries

- The **initial** PBP attempt searched for `2026_06_HOU_NE` and found nothing; the release did include `2026_06_HOU_JAX`. A *wrong game key* was the problem, not source week unavailability.
- The team-validation checker also contained a stale allowed-team `NE` and was corrected to `JAX/HOU`. New offline test explicitly rejects an ESPN `NE` home abbreviation.
- Passes: [paired-source final run 39855261656](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39855261656) and [earlier source-consistent 116-candidate run](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39852360645). These prove discrete source parsing contracts, not prediction value.
- **Next:** a conservatively timestamped, player-and-play actor matching algorithm that reconciles source-specific administrative events and explicitly records unmatched plays/sacks/scrambles/penalties. Do not infer missing plays by subtracting 178 from 186.
- ZERO new paid sportsbook odds calls, zero DB writes, no production or Calibrator approval.

### Additional verified game-level attempt parity

[Run 39856084383](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39856084383) compared explicit ESPN source event types with nflverse's binary attempt flags on the same Houston–Jacksonville Week 6 game:

- ESPN passing = 41 Pass Reception + 25 Pass Incompletion + 7 Passing Touchdown + 2 Pass Interception Return = **75**, nflverse = **75**.
- ESPN rushing = 51 Rush + 1 Rushing Touchdown = **52**, nflverse = **52**.
- Scope: **GAME_LEVEL_EVENT_CATEGORY_TOTALS_ONLY_NOT_PLAYER_OR_PLAY_ID_PARITY**. No actor identities, exact ESPN/nflverse play IDs, or snap completeness were established. The 178 vs 186 row difference remains.
