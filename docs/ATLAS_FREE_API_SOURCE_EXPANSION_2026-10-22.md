# ATLAS Free-First Source Expansion — 2026-10-22 (READ-ONLY AUDIT)

## Scope and doctrine

The user's request: identify **useful** free sources/API keys to configure as Supabase Edge Function secrets, before the next paid odds request. This is an audit and staged integration plan, **not deployment or production promotion**. No paid The Odds API calls, no third-party sports-feed calls from ATLAS, no Supabase modifications and no wager execution occurred during this pass. Source/pricing claims are based on provider docs viewed October 22, 2026; provider eligibility and exact season coverage must be validated before ingesting.

Respect existing ATLAS canon: SCOUT -> FILTER/VERIFY -> ORACLE + EDGE THIEF -> PRICING -> KAIROS -> SENTINEL -> TACTICIAN -> HUMAN FINAL GATE -> LEDGER -> FORENSICS -> CALIBRATOR. Source data is not evidence of a calibrated betting edge.

## Existing Supabase live inventory, read-only

Connected project `lhliqbbooproqtslmgqi`, reported ACTIVE_HEALTHY. Deployed Edge Functions exist:
- `atlas-odds-ingest` and `atlas-odds-smoke`: already reference `THE_ODDS_API_KEY` and `api.the-odds-api.com` in deployed source
- `atlas-therundown-smoke`: references `THERUNDOWN_API_KEY`, provider access unproven
- `atlas-nfl-free-scout`: nflverse/GitHub-source code present
- `atlas-free-sports-scout`: ESPN, NHL API and MLB StatsAPI source code present
- `atlas-runtime-intake`, `atlas-site-runtime`, `atlas-core-health`, `atlas-rill-signal-intake` also present.
Project lists 258 tables in public including `providers`, `provider_adapters`, `provider_events`, `market_snapshots`, `evidence_snapshots`, `ingestion_runs`, `ingestion_records`, `data_quality_flags`. These are schema/infrastructure observations, NOT proof of live end-to-end source ingestion. No new table required for API scout proposal before assessing existing schema.

## Sign-up priorities — new credential candidates

| Stage | Provider | Free offer at research time | Valuable information / likely ATLAS consumer | Proposed Edge secret | Caveat |
| --- | --- | --- | --- | --- | --- |
| P1 | API-SPORTS NFL & NCAA | 100 requests/day **for that API**, free tier | NFL + college games, events, teams/player stats and injuries -> SCOUT/VERIFY/ORACLE features | `API_SPORTS_NFL_KEY` | Confirm free subscription and **2026 season** coverage in dashboard before tests |
| P1 | API-SPORTS NBA | 100 requests/day **for that API**, free tier | NBA games, rosters, player/game stats; potential second-source injury/rotation evaluation | `API_SPORTS_NBA_KEY` | Confirm endpoints available in free tier, especially player-game data and season freshness |
| P2 | FantasyPros Public API | Free by application for *personal noncommercial nonproduction* work | NFL/NBA/MLB/NHL player news, injuries, projections; valuable independent signal / alert evidence | `FANTASYPROS_API_KEY` | Approval required; limits and exact free endpoint scope must be verified. Attribution and non-compete terms. Do not use as unrestricted production feed |
| P2 | API-SPORTS Basketball | 100 requests/day for that API | Other basketball leagues and possible women's/college coverage | `API_SPORTS_BASKETBALL_KEY` | Audit league/season and statistics before subscribing or ingesting |
| P3 optional | API-FOOTBALL soccer | 100 requests/day; free tier has season limits | Match schedules, injuries, lineups, players, odds for future soccer lane | `API_FOOTBALL_KEY` | No immediate NFL/NBA EV milestone need |

API-SPORTS reports 100 free requests/day **per API**, reset at 00:00 UTC. Avoid assuming one key authorizes all products or that all seasons are free; check each product's dashboard. Official: https://api-sports.io/ ; https://api-sports.io/sports/nfl ; https://api-sports.io/sports/nba ; https://api-sports.io/sports/basketball and https://www.api-football.com/pricing .

FantasyPros official docs: https://api.fantasypros.com/public/v2/docs/ ; https://support.fantasypros.com/hc/en-us/articles/49749297704475-How-do-I-request-access-to-the-FantasyPros-API ; https://secure.fantasypros.com/api-keys/request/ . Public API's key header is `x-api-key`; sports are `nfl`, `nba`, `mlb`, `nhl`, plus others. Free access is research and prototype only; published/prod/redistribution require separate permissions.

## Free/no-key sources — reuse, do not create Supabase secrets

| Source | Best use | ATLAS status / caution |
| --- | --- | --- |
| MLB StatsAPI: `statsapi.mlb.com` | Schedule, live feed, batter/pitcher game stats | Present in `atlas-free-sports-scout`; no signup; MLB data-use rights still apply; unofficial reference https://github.com/toddrob99/MLB-StatsAPI/wiki/Endpoints |
| NHL public web API: `api-web.nhle.com` | NHL schedule/gamecenter play by play | Present in `atlas-free-sports-scout`; unofficial documented interface; stability and usage terms unverified https://github.com/Zmalski/NHL-API-Reference |
| nflverse releases + nflreadpy | NFL PBP, historical stats, player usage | Existing NFL source adapter and fork. Dataset may update after games rather than instant/live; keep timestamp and source license https://github.com/nflverse/nflverse-data |
| NBA live NBA.com endpoints via existing `nba_api` fork | NBA scores, play-by-play and box scores | Existing fork but not confirmed as connected live Supabase adapter; free access is not an official guaranteed public API https://github.com/swar/nba_api |
| hoopR / sportsdataverse release assets | Historical NBA PBP, box scores, player/game datasets | No key; preserve dataset-version/time-cutoff controls; GitHub releases may be missing for a season; verify redistribution rights https://github.com/sportsdataverse/hoopR |
| wehoop / sportsdataverse releases | WNBA and women's college play-by-play, player box, shot/possession modeling | No key; some 2026 release files absent per README; validate exact seasons before relying https://github.com/sportsdataverse/wehoop |
| NWS / weather.gov | Outdoor NFL wind, precipitation, field conditions, observational reference | Official US government open API no key; rate limit is not published, cache and identify application via User-Agent https://www.weather.gov/documentation/services-web-api |
| TheSportsDB V1 | Supplemental event/team identity fallback | Shared public example key `123`, no private secret; free subset not enough for detailed player EV https://www.thesportsdb.com/docs/api |
| Open-Meteo | Weather cross-check, historical model features | Free non-commercial allowance 10,000 calls/day and no availability SLA; assess use rights first https://open-meteo.com/en/pricing |

## Negative selection — do NOT spend time / keys yet

- BALLDONTLIE's free NBA tier allows only 5 requests/minute and has major advanced endpoints (box scores, player stats, lineups, PBP, betting odds) paid-only. Useful for limited metadata, not our player-prop model without subscription. https://docs.balldontlie.io/
- SportsDataIO free trial provides **scrambled** sample data, not honest prospective results: https://sportsdata.io/developers/apis
- Odds-API.io has **paused new free keys indefinitely**; existing old free keys are grandfathered. https://odds-api.io/pricing/free
- The Odds API free monthly balance must be reserved for real odds, not used to fill statistical data gaps. Existing one-credit live proof: GitHub run 39743068149, observed 499 remaining at that moment only.

## Supabase setup card (operator action only, no actual credentials in repo or chat)

Open https://supabase.com/dashboard/project/lhliqbbooproqtslmgqi/functions/secrets
Choose **Add new secrets**, Key = exact proposed name, Value = key obtained from vendor, Save. Set ONLY keys for which the provider account is actually provisioned. Provider API plans are not created by adding a Supabase environment variable. GitHub Actions secrets and Supabase Edge Function secrets are separate stores: do not assume the existing GitHub `THE_ODDS_API_KEY` automatically appears in Supabase. Source for secrets: https://supabase.com/docs/guides/functions/secrets .

No need to enter secrets for no-key providers. Do not use `SUPABASE_` prefix for custom secrets. Do not paste values into ChatGPT, browser frontend JS, repo files, logging or database rows.

## Proposed gated integration sequence

1. Operators only obtain P1 API-SPORTS NFL and NBA free keys, and (optional, if accepted) FantasyPros research key. Record only the key **names**, not values.
2. Before external requests, compare source capabilities with existing `atlas-free-sports-scout` and `atlas-nfl-free-scout`; determine exactly which missing information each source would add.
3. Probe one narrowly-scoped NFL and one NBA statistical endpoint. Require exact 2026 data and nonempty ID/time fields. Observe provider rate headers, licensing and free tier access; no retrospective confidence from mock responses.
4. Normalize into existing event/provider IDs with independent timestamps, provenance, hash and quality flags. Use existing schemas and receipt tables subject to validation; do not create a competing master DB.
5. Calibrate model features OFFLINE before spending additional The Odds API credits; isolate model inputs from the target event's future data and from sportsbook outcome price features.
6. Promote only after prospective source->freeze->prediction->result pairing is demonstrated and user explicitly approves authority changes. No automatic betting execution.

No live data rights, key provisioning, or source reliability has been proven by this planning document.
