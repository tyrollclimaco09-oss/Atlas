# ATLAS Fork Arsenal — verified source-code execution receipt

Date: October 30, 2026 (America/Chicago). `RESEARCH_ONLY` / no approved bets.

## Inventory, provenance and scope

Connected GitHub account `tyrollclimaco09-oss` has **42 repositories**, of which **40 are actual GitHub forks** and two are non-forks (`Atlas`, `Atlas-0.0`). Four carefully selected forks were tested by executing their genuine pinned source; another 20 are represented in the curated capability catalog but NOT code-executed.

| Executed fork | Verified tested source SHA | Outcome | Truth boundary |
|---|---|---|---|
| nba_api | `0c55451abf707ff2e317058d9f417d48b15aebbe` | 30 team index entries; ATL=1610612737, CLE=1610612739, BOS=1610612738, LAL=1610612747 | Actual official-derived static NBA team indexes, **not live NBA data** |
| sports-skills | `09eb7e8566f48c01d1ea7bf7b4ac62a477d37b19` | `shape_rows` sorted 3 synthetic players by numeric minutes and kept correct top 2/player identifiers; 3 total, 2 returned | Actual shaping code, **synthetic stats**; complete API provider not exercised |
| shin | `ae460853fabeca7d512bbf7de8aaa55dc17f3485` | Pinned fork package compiled and its actual `calculate_implied_probabilities` computed 2- and 3-way margin-adjusted probabilities | **Synthetic market quotes**, market-implied references; never fair probabilities |
| nflreadpy | `e7e87b2ef626b8672279db25432b1554ee13348a` | Actual `load_pbp` accepted 2024/2025 synthetic local loader data, returned 4 rows, rejected impossible pre-1999 and future seasons | **Synthetic NFL PBP fixture**; no historical NFL records downloaded |

### Specific pricing finding (synthetic 3-way odds +140/+220/-105)

- Multiplicative normalization: `[0.33565289, 0.25173966, 0.41260745]`
- Shin result: `[0.33581061, 0.23800082, 0.42618857]`
- Maximum absolute difference: `0.01373884` (about **1.37 percentage points**).

This proves two methods can disagree on the **same market price**. It does not prove either method is an independent win probability or that a bet is profitable. Symmetric -110/-110 yielded `[0.5,0.5]` under both.

### Actual repo and CI evidence

- Draft PR **#23**: https://github.com/tyrollclimaco09-oss/Atlas/pull/23
- `integrations/forks/fork-source-smoke.py`: dependency-free **actual** fork source imports, offline IDs and normalized example.
- `integrations/forks/shin-reference-smoke.py`: actual compiled Shin algorithm.
- `integrations/forks/nflreadpy-loader-smoke.py`: actual NFL loader, dependency-injected local fixture.
- `integrations/forks/scout-arsenal.mjs`: shadow evidence bridge to `ATLAS_UNIFIED_SLATE_SOURCES_V1` canonical source, exact UUID/team/tip and source timestamps, fail-closed.
- `integrations/forks/catalog.json`: 24 fork candidates, target nodes, scope, licenses and actual test status.
- GitHub Actions run `41109037929`: all three jobs **SUCCESS**; first 25 JS tests passed, including strict timestamp/identity, privacy and Final Gate checks. Additional registry tests were subsequently added.

### No-invention / no-production boundaries

- Fork source code was actually executed, but **no live NBA game feed, current NFL PBP download, or current sportsbook prices** were produced by these probes.
- All player-stat, NFL PBP, and bookmaker price examples were explicitly labeled synthetic.
- No sportsbook wager, true/fair forecast, live odds extraction, production Supabase modification or original ChatGPT Sites Command Center release.
- There is no unattended fork-provider sync yet. Fork evidence enters SCOUT as `UNVERIFIED_FORK_SOURCE_CLAIM` until independently corroborated and frozen.
- `Shin` and multiplication are alternative bookmaker margin-removal reference methods, **not forecasts**.
- Source rights, rate limits, contractual/API conditions, provider independence and security require individual review before live ingest.

## Next meaningful release acceptance

1. Live read-only NBA: `nba_api` and `sports-skills` both resolve an actually scheduled game against ATLAS canonical UUID. Record source time, primary provider and rights. No silent conflict repair.
2. Live read-only NFL: use a named historical nflverse PBP period with a reproducible source checksum and known game identities; evaluate against official box results.
3. PRICING: test pinned Shin against a frozen actual DK 2-way and 3-way market where available, after independently verifying the same quoted timestamp and source. Keep market-derived probabilities separate from ORACLE independent fair probability.
4. CALIBRATOR: adopt fast-check/MSW/Playwright isolated tests for malformed, duplicate, future-dated, and stale source inputs and original Command Center flows.
5. Only then migrate a redacted approved fork observation into the actual slate's read-only evidence view; user authorizes any Final Gate.
