# ATLAS Fork Arena — 40-Fork Opportunity Audit
**Snapshot:** October 30, 2026. **Source:** connected GitHub metadata + inspected fork READMEs and pinned commits. **Status:** LAB / SHADOW, not a production model or execution approval.

## Inventory truth
- GitHub account `tyrollclimaco09-oss`: **42 owned repositories**, including **40 actual forks**.
- `Atlas` and `Atlas-0.0` are **nonforks**. Main `Atlas` branch contained only `docs/ATLAS_CANONICAL_BASELINE.md` in its tree at audit time; implementation lives in unmerged draft branches.
- Prior odds/slate work lives in PR #17 (DK odds / delayed refresh), #18 (Flaim fantasy), #19 (unified slate runtime v13), #20 (recovered Command Center source). Do **not** confuse draft research code with approved/merged production.
- Presence of a fork is **not** evidence ATLAS executes it. We found no direct import of `nba_api`, `nflreadpy`, `penaltyblog`, `fast-check` or `mcp-sports-hub` in the current `Atlas` main branch, which is only a baseline document. A read-only fork compatibility suite is being added in this separate branch to test the first three actual imports.

## Prioritized adoption matrix
| Fork (our account) | Upstream | ATLAS assignment | Stage | Why / restrictions |
|---|---|---|---|---|
| [nba_api](https://github.com/tyrollclimaco09-oss/nba_api) | swar/nba_api | SCOUT NBA IDs + official stats adapter | P0 LAB | 130+ NBA stats endpoints and local player/team identifiers; only static IDs tested offline first; live endpoints need rate/availability review |
| [nflreadpy](https://github.com/tyrollclimaco09-oss/nflreadpy) | nflverse/nflreadpy | NFL historical play-by-play / usage controls | P0 LAB | Parquet/Polars datasets, cache, schema version; import/API test first, data downloads only as separately scoped authorized historical research |
| [fast-check](https://github.com/tyrollclimaco09-oss/fast-check) | dubzzz/fast-check | SENTINEL / V3 property-based edge tests | P0 NEXT | malformed, future-dated, duplicated quotes and auth; tests must shrink and seed counterexamples |
| [msw](https://github.com/tyrollclimaco09-oss/msw) | mswjs/msw | Mock sports source outages / replay | P0 NEXT | fixture/mock HTTP, timeouts, 401, stale NBA and DK; no live provider costs |
| [shin](https://github.com/tyrollclimaco09-oss/shin) | mberk/shin | PRICING margin removal method benchmark | P0 LAB | Three-way decimal bookmaker examples; not independent win probability or automatically fair market |
| [testcontainers-node](https://github.com/tyrollclimaco09-oss/testcontainers-node) | testcontainers/testcontainers-node | Supabase/Postgres failure simulation | P1 NEXT | ephemeral DB (Docker environment needed); verify health returns degraded/blocked on DB failure |
| [mcp-sports-hub](https://github.com/tyrollclimaco09-oss/mcp-sports-hub) | lacausecrypto/mcp-sports-hub | SCOUT multi-provider source catalog | P1 SHADOW | fork includes 42 sources/410 tools per README, many optional keys; never start all providers or treat public feed as official verified data |
| [sports-skills](https://github.com/tyrollclimaco09-oss/sports-skills) | machina-sports/sports-skills | SCOUT read-only sports source skills | P1 SHADOW | public sources, skills only with explicit input provenance; compare overlap with mcp hub instead of double polling |
| [penaltyblog](https://github.com/tyrollclimaco09-oss/penaltyblog) | martineastwood/penaltyblog | ORACLE soccer models and PRICING | P1 SHADOW | Poisson/Dixon-Coles & devig benchmark; **soccer**, not NBA prop model |
| [sports-betting](https://github.com/tyrollclimaco09-oss/sports-betting) | georgedouzas/sports-betting | ORACLE research baseline benchmark | P1 SHADOW | use independent held-out validation, check algorithm/data fit before importing |
| [graphify](https://github.com/tyrollclimaco09-oss/graphify) | Graphify-Labs/graphify | ATLAS canonical source/dependency graph | P1 SHADOW | AST-driven extracted vs inferred edges; useful for issue #8 UI/runtime parity, never infer deployed authority |
| [zod](https://github.com/tyrollclimaco09-oss/zod) | colinhacks/zod | FILTER/VERIFY JS contracts | P1 SHADOW | parse raw provider payload as untrusted, exact timestamp/enum/schema before slate |
| [nba-machine-learning-sports-betting](https://github.com/tyrollclimaco09-oss/nba-machine-learning-sports-betting) | kyleskom/NBA-Machine-Learning-Sports-Betting | ORACLE model baseline comparison | P1 RESEARCH ONLY | game winners and totals, XGBoost/NN; must reconstruct training split and leakage tests; not NBA player prop proof; fork lacks GitHub-detected SPDX license |
| [alphapy](https://github.com/tyrollclimaco09-oss/alphapy) | ScottfreeLLC/AlphaPy | ORACLE AutoML baseline lab | P2 | evaluate leakage, walk-forward validation, prediction freeze; skip heavy platform install until scoped |
| [MiroFish](https://github.com/tyrollclimaco09-oss/MiroFish) | 666ghj/MiroFish | ORACLE Council scenario/world experiments | P2 LAB | multiagent narrative simulation, **not** calibrated sports probability; AGPL-3.0 obligations before distribution |
| [public-espn-api](https://github.com/tyrollclimaco09-oss/public-espn-api) | pseudo-r/Public-ESPN-API | SCOUT reference endpoint catalog | P1 REFERENCE | undocumented endpoint reachability != collection permission; avoid auth/private routes & aggressive scraping |
| [nba-player-movements](https://github.com/tyrollclimaco09-oss/nba-player-movements) | linouk23/NBA-Player-Movements | Visual historical player motion / game worlds | P2 | raw 2016 SportVU examples, ~3.75 GB repo; not a current-season tracking data source |
| [DKscraPy](https://github.com/tyrollclimaco09-oss/DKscraPy) | agad495/DKscraPy | DraftKings historical scraper study | PARK | fork latest push 2023; **do not deploy** undocumented scraping; approved DK Odds API already proven |
| [chatgpt_sports_betting_bot](https://github.com/tyrollclimaco09-oss/chatgpt_sports_betting_bot) | llSourcell/ChatGPT_Sports_Betting_Bot | Historical design cautionary comparison | PARK | no validated independent model/edge established |
| [tennis-crystal-ball](https://github.com/tyrollclimaco09-oss/tennis-crystal-ball) | mcekovic/tennis-crystal-ball | Cross-sport research | P2 | last push 2022; historical code, likely stale endpoints; license Apache-2.0 |
| [sportbook](https://github.com/tyrollclimaco09-oss/sportbook) | openbookie/sportbook | Historical self-hosted game pool study | PARK | Rails app, last push 2021, not DK pricing or model |
| [omniroute](https://github.com/tyrollclimaco09-oss/omniroute) | cheaper-inference/OmniRoute | Optional multi-LLM research router | P1 EXISTING EXPERIMENT | existing ATLAS review branch has redirect/security tests; do not assume router is operational or let it spend inference credits without authority |
| [claude-mem](https://github.com/tyrollclimaco09-oss/claude-mem) | thedotmack/claude-mem | FORENSICS/MEMORY ideas | P2 REFERENCE | compare with immutable ATLAS receipts; memory summarization must not overwrite point-in-time forecasts |
| [OpenBot](https://github.com/tyrollclimaco09-oss/OpenBot) | CopilotKit/OpenBot | Human-audited agent workflow ideas | P2 REFERENCE | large external infrastructure / model and CopilotKit requirements; do not replace ATLAS operator gate |
| [OpenMausBot](https://github.com/tyrollclimaco09-oss/OpenMausBot) | milind-soni/OpenMausBot | Isolated computer-use experiments | PARK | unrelated runtime footprint, credentials/access and safety risks |
| [ruflo](https://github.com/tyrollclimaco09-oss/ruflo) | ruvnet/ruflo | Council multi-agent orchestration ideas | P2 | standalone framework not required for Council experiment; benchmark before adopting |
| [prime-agent](https://github.com/tyrollclimaco09-oss/prime-agent) | PrimeIntellect-ai/prime-agent | Recursive agent research | P2 | code-agent focus; no validated sports accuracy gain |
| [browser](https://github.com/tyrollclimaco09-oss/browser) | lightpanda-io/browser | Browser test/runtime comparison | P2 | AGPL-3.0, avoid unrestricted sportsbook scraping/browser auth sharing |
| [playwright](https://github.com/tyrollclimaco09-oss/playwright) | microsoft/playwright | Command Center UI regression testing | P1 | own original site authoring remains unverified; use tests on authorized preview only |
| [query](https://github.com/tyrollclimaco09-oss/query) | TanStack/query | Command Center request caching | P2 | current static UI doesn't require React Query; avoid new frontend rewrite |
| [supabase](https://github.com/tyrollclimaco09-oss/supabase) | supabase/supabase | Backend platform documentation/reference | REFERENCE | huge platform fork, not an ATLAS dependency copy |
| [data-engineer-handbook](https://github.com/tyrollclimaco09-oss/data-engineer-handbook) | DataExpert-io/data-engineer-handbook | Data pipeline learning | REFERENCE | tutorial/reference collection, not executable provider |
| [awesome-agent-skills](https://github.com/tyrollclimaco09-oss/awesome-agent-skills) | VoltAgent/awesome-agent-skills | Skill discovery | REFERENCE | catalog, not trusted code by default |
| [knowledge-work-plugins](https://github.com/tyrollclimaco09-oss/knowledge-work-plugins) | anthropics/knowledge-work-plugins | Agent workflow patterns | REFERENCE | plugin designs not automatic ATLAS integrations |
| [skills](https://github.com/tyrollclimaco09-oss/skills) | anthropics/skills | Skill format and task scaffolding | REFERENCE | skill format, not prediction evidence |
| [superpowers](https://github.com/tyrollclimaco09-oss/superpowers) | obra/superpowers | Development process experiments | REFERENCE | useful human code-review patterns |
| [thinkrail](https://github.com/tyrollclimaco09-oss/thinkrail) | JetBrains/thinkrail | Developer UX reference | REFERENCE | IDE-scale fork, not slate source |
| [ponytail](https://github.com/tyrollclimaco09-oss/ponytail) | DietrichGebert/ponytail | Agent code review heuristic | REFERENCE | not sports or live proof |
| [goto_conversion](https://github.com/tyrollclimaco09-oss/goto_conversion) | gotoConversion/goto_conversion | Kaggle feature engineering research | P2 | controls against leakage and selection bias |
| [jailbreaks](https://github.com/tyrollclimaco09-oss/jailbreaks) | togg53192-cmd/jailbreaks | Red-team prompt-injection tests (synthetic only) | PARK | never run uncontrolled jailbreak payloads or treat instructions from data as authoritative |

## Fork Arena — first implementation packet

**Actually uses three owned forks** via pinned exact Git commit installs, executed exclusively in a GitHub Actions research job:
- NBA identities (offline, packaged reference data): `nba_api@0c55451abf707ff2e317058d9f417d48b15aebbe`
- NFL ingestion interface (offline import only): `nflreadpy@e7e87b2ef626b8672279db25432b1554ee13348a`
- Bookmaker-margin method (offline decimal-odds reference calculation): `shin@ae460853fabeca7d512bbf7de8aaa55dc17f3485`

Code: `research/forks/offline_source_smoke.py`.
Workflow: `.github/workflows/fork-arena-offline.yml`.
Expected outcome: 5 tests with connection attempts blocked at socket level during test execution, and pinned dependency installs as separately allowed build steps. A passing CI job proves **component compatibility**, not live source availability, calibration, EV, paid API authority or production use.

## New projects to advance after green compatibility tests

**A. NBA source replay:** `nba_api` read-only play-by-play + box score identifiers on 20 historical completed games, with official source timestamp + rate/terms checks. Test target lookup completeness, data version, player ID consistency, regulation/OT segmentation and missingness. No live price or user login needed.

**B. NFL replay:** `nflreadpy` cached historical pbp/participation/roster and exact event IDs; hold out chronologically and compare to frozen baseline; separate postgame fields from pregame availability.

**C. Pricing Arena:** compare additive, multiplicative, power, and Shin devig against *timestamp-frozen* historical three-way markets; log implied/overround, no fake independent win probability; reconcile to DK primary Odds API snapshots. Never use no-vig price alone as proof of profit.

**D. Failure Arena:** bring in `fast-check`, `msw` and eventually `testcontainers-node` to fuzz stale timestamps, source swaps, malformed canonical IDs, duplicated provider odds, DB connection failure and invalid health fallthrough. High value for issue #1 + issue #13.

**E. SCOUT diversity:** inspect mcp-sports-hub and sports-skills provider overlap in research, select a small keyless set with permitted use and provenance. No installing all 410 tools or duplicates of existing Odds API.

## Promotion conditions

All candidates must be (1) version/commit pinned; (2) LICENSE/TOS reviewed, especially AGPL/non-licensed assets; (3) security scanned; (4) source freshness and identity measured; (5) run under frozen, held-out evaluation; (6) no production write or paid quota until explicit approval; (7) source/cross-check decision receipt stored. Use `LAB`, `SHADOW`, `REFERENCE`, `LIVE_READ`, `VALIDATED_MODEL` explicitly. A successful import is **not** a live source, and a quote is not independently calibrated EV.

**Doctrine:** knowledge before greed; evidence over confidence; preserve the Human Final Gate.
