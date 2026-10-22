# ATLAS Timeskip 06 — preregistered three-game NBA FGA integrity cohort

**Date:** 2026-10-22. **Lane:** NBA ONLY. **Mode:** SHADOW / independent postgame source-quality test, not a betting forecast.

## Fixed cohort and procedure

- Cohort locked in code before source reads: **October 21, 2026** `20261021/ATLORL`, `20261021/CHABKN`, `20261021/GSWLAL`.
- NBA league schedule must resolve each game code to exactly one NBA game ID and correct home/away team codes.
- For each resolved game: download one NBA CDN official play-by-play and one NBA CDN official box score (2 calls per game + one schedule call; no key/odds costs), validate game/team IDs, record source SHA-256 and observed timestamp in a short-retention sanitized CI artifact.
- Compare **EVERY** rostered player with a recorded field-goal-attempt stat against individual `isFieldGoal=1` plays grouped by NBA player ID, and totals by team. Unknown actor IDs, duplicate action IDs, missing official stat fields and identity mismatches are fail-closed. This does not independently certify shot timing or all 57 V3 games.

## Real-source results

[GitHub Actions 39861684656](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39861684656): **4/4 offline contract tests and real three-game run PASS**.

| Game | NBA game ID | Official actions | Marked FGA | Rosters | Player FGA disagreements | Unknown shooters | Team FGA parity |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| ATL @ ORL | `0022600085` | 629 | 175 | 26 | 0 | 0 | ORL 85/85, ATL 90/90 |
| CHA @ BKN | `0022600087` | 591 | 173 | 28 | 0 | 0 | BKN 80/80, CHA 93/93 |
| GSW @ LAL | `0022600005` | 619 | 173 | 26 | 0 | 0 | LAL 81/81, GSW 92/92 |

**Combined:** 3/3 source-integrity gates, 80 rostered players, 521 marked FGA, 1,839 play actions, **0 official PBP-vs-official box per-player FGA disagreements**, 0 missing fields, 0 duplicate action IDs. This is **same provider ecosystem** integrity only; we are not treating NBA box and NBA PBP as wholly independent providers for model calibration. The prior one-game NBA-vs-ESPN trace is separate.

## Proof boundary

- **Earned:** official NBA CDN is a promising source for constructing a *new versioned* Q4 FGA dataset on these 3 games; per-player FGA accounting is consistent within the provider.
- **NOT earned:** original V3 57-game replay, future-game robustness, pre-Q4 cutoffs, injury/rotation/minute handling, source terms/licensing clearance, external data retention rights, calibrated probabilities, positive EV or production eligibility.
- **Next NBA:** add event-time and Q1–Q3-only player-selection tests. Evaluate a *new* chronological historical replay under a new experiment ID with source manifest/point-in-time hashes, preserving V3's unreplayed status. Do not cherry-pick based on this cohort.

Research source: `scripts/proof/nba-three-game-fga-cohort.mjs` and tests. Artifact retained for 7 days via CI; commit only bounded metadata.
