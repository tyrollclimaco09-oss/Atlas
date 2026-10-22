# ATLAS NBA Timeskip 05 — official versus unofficial play-by-play shot reconciliation

**Audit date:** 2026-10-22 • **Lane:** NBA ONLY • **Game:** 2026-10-21 Atlanta Hawks at Orlando Magic
**Scope:** retrospective single-game source diagnosis, no prospective prediction, no EV, no production authority.

## Identity and provenance

- ESPN game: `401909834`, Atlanta/Orlando, unofficial public scoreboard and PBP.
- Independent NBA schedule exact `gameCode=20261021/ATLORL` yielded NBA game `0022600085`. NBA official CDN PBP and box score both returned the same game ID and teams. [Primary NBA independent fetch run](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39853603584) passed 3 offline tests and real source retrieval.
- NBA official CDN PBP source `https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_0022600085.json` retrieved 629 actions, **175 `isFieldGoal=1` actions**; body SHA-256 `497f7357e7b5121bbf0443869ce92ba04601913ac1ec5aec33cf6dc4bd657161`.
- Independent NBA official per-player FGA = NBA official player box FGA **for both disputed players**. The ESPN-derived FGA totals differ from those.

## Exact two-event delta (one-second clock alignment)

See [verified cross-source run 39855261687](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39855261687), 3/3 offline regression checks + live paired ESPN/NBA response. Every *other* shot from these two players aligns by quarter and game clock within 1.05 seconds. That does not prove all shot semantics in all games.

| Shooter | ESPN ID | NBA ID | ESPN FGA | NBA PBP | NBA box | Unmatched witness |
| --- | --- | --- | ---: | ---: | ---: | --- |
| Dyson Daniels, ATL | 4869342 | 1630700 | 12 | **13** | **13** | **NBA action 606**, Q3 0.1 sec; missed 6-foot driving bank hook, not present in ESPN shot list |
| Jalen Suggs, ORL | 4432165 | 1630591 | 9 | **8** | **8** | **ESPN event 401909834198**, Q1 0.0 sec; missed heave, absent from NBA's marked FGA list |

- The sums can agree while individual player/game-script features disagree. ESPN PBP 175 candidate FGA overall and NBA marked FGA 175 overall **is not sufficient proof** of each player FGA.
- **Source discrepancy localized**, not NBA shot-rule adjudication: NBA official PBP `isFieldGoal=1` does not include the ESPN Suggs heave and does include the Daniels missed hook. The audit cannot prove which underlying real-world clock/rule judgment caused the source difference.
- Observed paired run's NBA body SHA-256 matches the original NBA independent run hash; ESPN body SHA-256 in paired run `430f99c871e13abfb4d4253ac9908d30b3337ce34cdaba3c6ff44c203a1e61ac`. Do not infer historical publication time from request observed time.
- Source behavior/rights not cleared for longitudinal retention or production. No raw vendor content committed. GitHub sanitized logs/7-day artifact provide temporary replay metadata; this durable document records the exact bounded discrepancy.

## Promotion boundaries

- **Verified narrow statement:** this one NBA official CDN response independently corroborates the two players' official 13/8 FGA; exact ESPN-vs-NBA event discrepancy witnesses are identified.
- **Still blocked:** ESPN-derived Q4 player FGA features (do not patch them), full 57-game V3 manifest and chronological replay, independent prospective model validation, bet pricing, and calibrated player-prop probabilities.
- Next: test NBA official shot-event availability and per-team+per-player completeness across a *small preregistered* chronological batch. Version any replacement NBA data source, preserve source time/hashes, and do not assert the original 57-game model reproduced.
