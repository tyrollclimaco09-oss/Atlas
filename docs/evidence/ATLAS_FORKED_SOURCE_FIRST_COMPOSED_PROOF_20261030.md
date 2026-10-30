# ATLAS Fork SCOUT — actual composed offline proof
**Recorded 2026-10-30. Research/shadow only.**

## Actual source executions
- GitHub fork tyrollclimaco09-oss/sports-skills at commit 09eb7e8566f48c01d1ea7bf7b4ac62a477d37b19. Called its actual Python canonicalize_nba_event against its own bundled June 14, 2026 historical fixture; declared observed-at 2026-06-14T03:30:00Z and minute start precision.
- GitHub fork tyrollclimaco09-oss/nba_api at commit 0c55451abf707ff2e317058d9f417d48b15aebbe. Loaded bundled static team reference from src/nba_api/stats/library/data.py using stdlib runpy to bypass uninstalled package metadata on Python 3.14. It contained 30 NBA teams.
- Ran ATLAS integrations/forks/canonical-scout.mjs against the **actual** combined fork outputs in an isolated sandbox, not only synthetic fixtures. Python-to-Node observation was held in an ephemeral local file and then deleted. No sports HTTP calls, production DB writes, API credits or wagers.

## Result
- Output state SCOUT_REFERENCE; provider event ID 401859967.
- San Antonio Spurs home static NBA reference ID 1610612759; New York Knicks away static NBA reference ID 1610612752.
- Time interval lower inclusive 2026-06-14T00:30:00Z; upper exclusive 2026-06-14T00:31:00Z; precision minute. No exact point asserted.
- Rights: data_class=open-public, prototype_only=true, commercial_use=false. These restrictions were faithfully retained.
- Critical capability gaps explicitly include event.tracking, event.lineups, event.live_statistics, event.start_time (exact) and participant.player_statistics.
- Raw provider text copied into ATLAS output: false. Origin Machina surrogate event ID is not accepted as an ATLAS canonical UUID.
- canonical_event_id=null, approved_bet=null, execution_authority=false. No fair probability or EV authority.
- 18/18 offline adapter tests passed, 0 failures.

## Caveats
An actual two-fork research bridge was exercised, but the input was an upstream bundled historical test fixture, NOT a current NBA player slate. This is NOT live sports ingestion, historical win-rate validation, permission for public/commercial redistribution, independent official injury verification or wagering authority. The Python forks are not installed on ATLAS production; the Node adapter is on a draft review branch.
Next: verify permitted external sources, temporal and official event identity and current player availability before any production promotion. Retain user Human Final Gate.