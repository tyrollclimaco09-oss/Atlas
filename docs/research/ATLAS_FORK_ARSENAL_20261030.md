# ATLAS Fork Arsenal — source adoption inventory
Recorded October 30, 2026. Research/shadow only. No paid provider calls, wagers or production promotions.

## What was checked
Authenticated GitHub returned **42 repositories** owned by tyrollclimaco09-oss. The REST repo metadata identifies **40 forks**, plus two original repositories (Atlas, Atlas-0.0). GitHub forks are source copies, NOT already-installed ATLAS components. Atlas main currently has only its canonical baseline; most integration work is on draft branches/PRs #17–20.

## First executed pilots
1. **nba_api** fork, commit 0c55451abf707ff2e317058d9f417d48b15aebbe: actual source module's bundled reference contained **30 NBA teams**, including ATL 1610612737, CLE 1610612739, BOS 1610612738, LAL 1610612747. Offline source execution, no API requests. Static ID references do not prove current roster, injuries, or a game's identity.
2. **sports-skills** fork, commit 09eb7e8566f48c01d1ea7bf7b4ac62a477d37b19: actual canonicalize_nba_event processed the package's historical 2026-06-14 fixture, with observed-at 2026-06-14T03:30:00Z and declared start precision minute. Output: machina-sports-schema/1, provider-scoped event ID, participants, temporal bounds, source provenance, usage rights, and explicit capability gaps. It was a **bundled fixture, not live 2026-10-30 NBA data**. Rights reported prototype_only=true and commercial_use=false. Raw provider payload included plays; do not copy them into ATLAS.
3. **ATLAS read-only adapter** under integrations/forks/canonical-scout.mjs consumes this schema, strips raw content, enforces rights and native IDs, retains bounded time and source commit, and sets canonical_event_id=null, execution_authority=false and approved_bet=null. The source's Machina surrogate never proves ATLAS UUID equivalence. Synthetic deterministic contract tests are not live validation.

## Priority matrix
| Priority | Forks | ATLAS unit | First useful integration | Blockers |
| --- | --- | --- | --- | --- |
| P0 — pilot now | nba_api + sports-skills | SCOUT / FILTER VERIFY | Offline canonical NBA identifier/time bridge | User rights, independently matched canonical event, no production promotion |
| P0 — next | nflreadpy + sports-skills | NFL SCOUT / historical Play-by-Play | One prospective NFL history source: sports-skills already depends on nflreadpy as optional extra | nflverse license/availability, frozen data and held-out validation |
| P0 — next | mcp-sports-hub | SCOUT / VERIFY | Add source-scoped read-only sports discovery with 1 unmetered public provider checked end-to-end | Docs advertise 42 providers / 410 tools; no real provider called, provider TOS & freshness unknown |
| P0 — next | shin | PRICING LAB / EDGE THIEF | Compare Shin with proportional and other no-vig methods on exact timestamped complete market | No market fair-probability or +EV inference |
| P0 — tests | fast-check, msw, playwright, zod, testcontainers-node | SENTINEL / QA / Command Center | Property-based date/market fuzz, mock API errors, authenticated browser flows, DB-outage tests | Must pin reviewed packages and use existing UI, not duplicate it |
| P1 — research | penaltyblog | Soccer models / Pricing | Poisson/Dixon-Coles and overround benchmarks on held-out soccer | Soccer-specific, not NBA prop model |
| P1 — research | nba-machine-learning-sports-betting, alphapy, sports-betting | ORACLE / CALIBRATOR / FORENSICS | Reproduce retrospective baselines and benchmark out-of-time log-loss, calibration, CLV | Legacy pins, odds collection, sports-betting optional *execution* module must be DISABLED |
| P1 — discovery only | public-espn-api | SCOUT | API schema references and candidate alternate source coverage | Unofficial; reachable endpoint != authorized collection or redistribution |
| P2 — historical | nba-player-movements, tennis-crystal-ball, goto_conversion | Historical LAB | 2016 SportVU spacing replay, tennis and feature engineering | Not contemporary player tracking |
| P2 — research infrastructure | graphify, claude-mem, data-engineer-handbook | CODEX / FORENSICS | Map source/provenance graph; memory governance and architecture | Privacy, memory retention, permissions |
| P2 — agent labs | omniroute, prime-agent, ruflo, MiroFish, OpenBot, OpenMausBot, thinkrail, browser | Cortex / ORACLE Council | Isolated role-specific pilots, not autonomous betting or credentialed production agents | Sandboxing and supply chain; MiroFish and Lightpanda browser report AGPL-3.0 |
| P3 — selective reference | query, supabase, knowledge-work-plugins, skills, superpowers, awesome-agent-skills, ponytail | Frontend/docs/engineering patterns | Reuse reviewed libraries/patterns only where compatible, not wholesale fork imports | Size, platform fit, licenses |
| PARK | DKscraPy, chatgpt_sports_betting_bot, sportbook, jailbreaks | None now | Legacy examples only | DK scraping/terms, old demos, no proven prediction or legitimate ATLAS research benefit |

Also assessed the independent Atlas and Atlas-0.0 repositories; neither counted as a fork.

## Specific acceptance gates
- All external inputs require provenance, time, rights, identity, completeness, and negative discovery records; code origin is not data authority.
- Fork read-only test output must not contain raw ESPN plays, sportsbook execution, private league IDs, cookies, secrets, or human Final Gate approvals.
- The source's prototype-only commercial=false license flag is authoritative for this pilot; it cannot become an unrestricted live feed.
- NFL historical data must be strictly pre-game time frozen before rolling replays; verified box scores only for after-the-fact FORensics.
- Shin is a market implied-probability adjustment, never an independent calibrated prediction.
- Stand up one canonical/verified source at a time, no dual ESPN importers, no browser sportsbook scraping for quotas. Use existing DK Odds API for pricing.

## Next actionable pilots
A. Run this fork adapter against an actual permissible frozen sports-skills envelope, preserving rights and canonical time bounds (offline source run already proven, ATLAS adapter tests separate).
B. Build one NFL historical nflreadpy parquet fixture, compare model baseline under out-of-time split.
C. Price method arena: proportional vs Shin vs power de-vig on 3-way market with same timestamp/book/outcomes; never claim profitable betting model.
D. Fuzz Slate2 timestamp, duplicate, auth and id mapping using pinned fast-check and MSW. Later use Playwright with the authoritative editable Command Center.

Human Final Gate always mandatory. Fork ownership is never proof of operational connectivity or forecast quality.
