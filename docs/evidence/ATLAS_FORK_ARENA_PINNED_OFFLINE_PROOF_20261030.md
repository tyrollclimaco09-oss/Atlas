# ATLAS Fork Arena — Pinned Fork Offline Proof
**Observed:** October 30, 2026. **GitHub workflow:** `ATLAS Fork Arena offline evidence smoke`, run **41106442856**, job **124237394135**. **Result: SUCCESS**.

## What was actually executed
GitHub Actions runner installed from these exact forks (verified by `pip freeze` in the job logs):
- `nba_api @ git+https://github.com/tyrollclimaco09-oss/nba_api.git@0c55451abf707ff2e317058d9f417d48b15aebbe`
- `nflreadpy @ git+https://github.com/tyrollclimaco09-oss/nflreadpy.git@e7e87b2ef626b8672279db25432b1554ee13348a`
- `shin @ git+https://github.com/tyrollclimaco09-oss/shin.git@ae460853fabeca7d512bbf7de8aaa55dc17f3485`

**Observed tests:** 5 passed; 0 failed. Ran 5 tests in 0.409 seconds (package installation occurred before test execution). No sports HTTP requests were made inside the test cases; a socket guard was installed around each offline call. Package installation itself uses GitHub/PyPI network (not sports providers).

| Tested contract | Outcome | Meaning | Not established |
|---|---|---|---|
| `nba_api` BOS team ID | PASS | Offline static lookup returns NBA team ID 1610612738 and Celtics identity | Fresh roster, live game stats or NBA endpoints uptime |
| `nba_api` Jokic ID | PASS | Offline static lookup returns player 203999; accent-insensitive name match | Current injury/usage/availability |
| `nflreadpy` loader interface | PASS | load_pbp, load_player_stats, load_team_stats exist without network calls | Availability, license to redistribute or completeness of downloaded NFL datasets |
| `shin` 3-way reference | PASS | Package gives normalized 3-way implied probability distribution matching documented example | Independent market probability, sports betting EV or fair odds |
| `shin` authority separation | PASS | Research result leaves EV, independent probability, approval null and execution authority false | Model validation or wager approval |

## Provenance and release boundary
- The source commits of **the forked projects are pinned**. Transitive PyPI dependency versions were resolved at job execution; a fully locked dependency graph is still needed before a stable deployment, and the project should add offline fixture hashes for real dataset replays.
- No The Odds API calls, no sportsbook requests, no paid API credits, no real wagering and no ATLAS production DB writes in this job. No production code changed.
- This is an actual read-only **fork integration smoke test**, not end-to-end live SCOUT or a production prediction model.
- The next bounded research packet should compare 20 historical NBA games using official NBA endpoints with source-time / availability logs and license checks; and NFL historical replay with nflreadpy's cached data, chronologically frozen. Separately bring fast-check/MSW to health/odds malformed and DB-read failure tests.
- Do not merge draft PR #21 without review of the exact pinned Git commits and dependency/supply-chain controls.
