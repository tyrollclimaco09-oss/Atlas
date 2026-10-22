# ATLAS / Real Free-Key Sources — Access-Verified Reconciliation
**2026-10-22 | read-only Supabase inspection | no external paid odds requests | no Supabase writes | SHADOW only**

## Correction to earlier recommendations (supersedes previous version of this document)

The original shortlist treated marketing descriptions as evidence that a user could obtain a useful free-tier API key. That was NOT sufficient. The user reported inaccessible/confusing signup and no visible key. This audit requires evidence of an ACTUAL published signup form, quota, key-delivery steps, and permitted free data. **None of the new keys have been obtained or tested on ATLAS; signup page verification is not credential verification.** Do not say a service is connected until it passes authenticated readback.

**API-SPORTS correction:** A *single API-SPORTS account/key* works across sports products, not separately generated NFL/NBA/Basketball keys as previously recommended. Their official signup routes to `https://dashboard.api-football.com/register`, which could not be fetched from this research environment (403) and the operator reported signup difficulty. DEFER; do not keep instructing operator to create multiple keys. Free claims of 100/day per API are supplier claims and data may be limited by competition/season.

**SportsGameOdds correction:** Free Amateur plan advertises useful NFL/NBA props, 9 books, ~2500 objects/month. But the official key setup page explicitly REQUIRES a credit card for signup, contradicting several marketing landing pages. DEFER as friction/card-gated; never claim no-card.

**TheOddsAPI distinction:** `theoddsapi.com` (base `api.theoddsapi.com`, auth `x-api-key`) is a DIFFERENT provider from our tested `the-odds-api.com` (base `api.the-odds-api.com`, v4). Similar names are not interchangeable. Its official free signup form is verifiably present; key issuance and reliability are still UNTESTED. Its free tier advertises 25 requests/day, US NFL/NBA/MLB moneylines only. The provider's pages contained minor inconsistencies in older indexed descriptions; never rely on an undocumented feature/market without authenticated verification.

## Operator-ready candidates: actual free-key signup pages verified

| Rank | Provider | Direct account/key URL | Free entitlement advertised | ATLAS benefit | Supabase proposed secret | Access certainty |
| --- | --- | --- | --- | --- | --- | --- |
| P0 | CollegeFootballData (CFBD) | https://collegefootballdata.com/key | **1,000 requests/month** on free tier; email-delivered key; no credit card | Historical and current college football games, team/player stats; CFB Game Sense/ORACLE baseline | `CFBD_API_KEY` | Real email form seen; no authenticated readback |
| P0 | CollegeBasketballData (CBBD) | https://collegebasketballdata.com/key | Permanent free Core API; email-delivered key. **Shares quota** with CFBD account/plan | CBB box scores, PBP, lineup/substitution and player-level modeling; new coverage | `CBBD_API_KEY` | Real email form seen; no authenticated readback |
| P1 | TheOddsAPI (distinct from current provider) | https://theoddsapi.com/start | 25 requests/day, no credit card; NFL/NBA/MLB h2h US books | Independent sportsbook comparison / moneyline quote reference | `THEODDSAPI_SECONDARY_KEY` | Real form seen, backend/key quality untested |
| P1 | WeatherAPI.com | https://www.weatherapi.com/signup | Free ongoing 100,000 requests/month, 3-day forecasts, 1-day history; starts with 7-day trial automatically downgrading to Free | Stadium wind/rain/temperature and prospective weather forecasts | `WEATHERAPI_KEY` | Real email/Google signup verified; account delivery untested |
| P2 | BALLDONTLIE (metadata only) | https://www.balldontlie.io/ ; https://www.balldontlie.io/account/ | Free key immediately after signup; 5 requests/minute; NBA free endpoints: teams/players/games only | NFL/NBA identity and event reconciliation fallback; NOT player props/stat models | `BALLDONTLIE_API_KEY` | Public signup/auth schema verified; no account |
| P3 | Sportmonks (SOCcer only) | https://my.sportmonks.com | Free signup/token; **Danish Superliga and Scottish Premiership** only | Future soccer research; not needed for NFL/NBA immediate pilot | `SPORTMONKS_API_TOKEN` | Direct token process documented; free leagues too narrow |

### CRITICAL SHARED CFBD/CBBD QUOTA
CFBD and CBBD are operated by Rad Sports Analytics LLC; their current terms explicitly say API requests across both draw from the SAME plan's quota. **Do not add the two free allowances together**, and verify credentials/entitlements after signup. Free CFBD is reported as 1,000/month; student .edu emails may qualify for 3,000/month academic plan, but do not assume user eligibility. CBBD data range varies by endpoint; e.g. plays from 2005–06, substitution/lineup data from 2023–24, 2026-27 season parameter is `season=2027`. The user must confirm prospective season records are available before claiming 2026 coverage.

Sources:
- https://collegefootballdata.com/api-tiers
- https://collegefootballdata.com/key
- https://collegebasketballdata.com/key
- https://www.collegebasketballdata.com/api-tiers
- https://collegebasketballdata.com/terms
- https://api.collegebasketballdata.com/data-availability
- https://theoddsapi.com/start
- https://theoddsapi.com/pricing
- https://theoddsapi.com/docs/
- https://www.weatherapi.com/signup
- https://www.weatherapi.com/pricing
- https://www.balldontlie.io/account/
- https://docs.balldontlie.io/
- https://www.sportmonks.com/football-api/
- https://sportsgameodds.com/docs/basics/setup
- https://api-sports.io/
- https://www.api-football.com/news/post/how-to-get-started-with-api-nfl-the-complete-beginners-guide
- https://api-sports.io/terms

## Existing Atlas & Supabase — DO NOT RECREATE

Live Supabase project previously checked: `lhliqbbooproqtslmgqi`, project status `ACTIVE_HEALTHY`. Deployed function sources include:
- `atlas-odds-ingest`, `atlas-odds-smoke`: The Odds API key/env support already coded, **not proof the current GitHub secret was replicated to Supabase**.
- `atlas-therundown-smoke`: references `THERUNDOWN_API_KEY`, provider status unverified.
- `atlas-nfl-free-scout`: nflverse/GitHub NFL data.
- `atlas-free-sports-scout`: MLB StatsAPI, NHL public API, ESPN source integrations.
- `atlas-runtime-intake`, `atlas-site-runtime`, `atlas-core-health` and others: keep existing authority/guardrails.

Public schema has 258 tables including existing `providers`, `provider_adapters`, `provider_events`, `market_snapshots`, `evidence_snapshots`, `ingestion_runs`, `ingestion_records`, `data_quality_flags`. Do not invent new database tables or claim live ingestion based on table/function existence.

Key-free sources already worth using: NHL public score/gamecenter API; MLB StatsAPI; nflverse/nflreadpy; ESPN source adapter with rate/terms caveat; hoopR and wehoop historical replay; National Weather Service `api.weather.gov` for US stadium weather (no key). Caching and point-in-time provenance still required. User expressly prefers utilizing these before new paid keys.

## Exact Supabase secret setup (operator only)

URL: https://supabase.com/dashboard/project/lhliqbbooproqtslmgqi/functions/secrets

1. Obtain a key on the **direct provider link**. Do not paste the key in ChatGPT or any GitHub file.
2. Add a secret with the exact proposed name and value from the vendor. No key? No secret required.
3. Supabase Edge Function secrets and GitHub Actions repository secrets are **different vaults**.
4. A secret by itself DOES NOT enable ingestion: existing or new function code must read it server-side via `Deno.env.get()`.
5. Before any new requests, agree on one endpoint, identity, expected quota cost, as-of time, receipt format and research value. Cap quotas and fail closed. No credential echo, no automatic polling and no betting execution.

## Next implementation gates

1. **Operator acquisition P0**: free CFBD and CBBD keys via actual forms (or one to start). User signals key NAMES only, never values.
2. **Access proof**: authenticated response for one dataset per source with proper 2026/2027 season identity, schema, quota headers, and provenance; no implied profits.
3. **Unify source contracts** in existing `atlas-free-sports-scout` and ledger schemas after read-only schema verification; NEVER replace canonical DB.
4. **Source quality audit**: missing fields, player/event matching, late updates, rights, injury freshness, and retrospective leakage.
5. Only then consider a new paid-odds credit for price-vs-forecast comparison. Maintain the 100-credit reserve and manual quota gates from `docs/ATLAS_ODDS_API_QUOTA_GOVERNANCE.md`.

**Authority:** SHADOW-only, existing HUMAN FINAL GATE intact. No live provider calls, Supabase schema/deployment changes, secrets mutations, or production promotion in this audit.
