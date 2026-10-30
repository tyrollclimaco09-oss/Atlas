# ATLAS FORK ARSENAL — first genuine code reuse & slate evidence bridge
**Date:** October 30, 2026. **Mode:** SHADOW / offline / read-only; **authority:** none.

## Important distinction

The GitHub account holds **42 repositories**: Atlas, Atlas-0.0 and **40 verified forks** (see connected GitHub repository metadata). Most of the forks have never been executed by ATLAS. Their existence does NOT mean an external API is integrated or a sports model has been validated.

The `integrations/forks/catalog.json` describes **24 concrete candidates** with upstream provenance, target ATLAS node, licensing, use-case, test status, and boundary. Don't promote all 24 or treat all as live providers.

## First actual fork executions — independently observed

In a disposable Vercel research sandbox, pinned source clones were created:

| Forked source | Frozen fork commit | Actual execution | Result |
| --- | --- | --- | --- |
| `tyrollclimaco09-oss/nba_api` | `0c55451abf707ff2e317058d9f417d48b15aebbe` | Imported real `nba_api.stats.static.teams` via isolated Python package shim, without altering package data | 30 NBA static teams; ATL `1610612737`, CLE `1610612739`, BOS `1610612738`, LAL `1610612747` |
| `tyrollclimaco09-oss/sports-skills` | `09eb7e8566f48c01d1ea7bf7b4ac62a477d37b19` | Executed `sports_skills/_shaping.py` against a **synthetic fixture** | Preserved player IDs; sorted minutes numerically, excluded missing minutes, kept top 2 rows and returned `total_rows:3, returned_rows:2` |
| `tyrollclimaco09-oss/nflreadpy` | `e7e87b2ef626b8672279db25432b1554ee13348a` | Fork package installed and its actual `load_pbp` exercised with an injected local downloader | 4 synthetic PBP rows spanning 2024 and 2025; correct paths; pre-1999 and future season inputs rejected. No actual NFL records fetched. |
| `tyrollclimaco09-oss/shin` | `ae460853fabeca7d512bbf7de8aaa55dc17f3485` | Actual fork package compiled and `shin.calculate_implied_probabilities` called on synthetic 2- and 3-way prices | Symmetric two-way: 0 difference from multiplicative baseline; asymmetric three-way: max difference 0.01373884. MARKET-DERIVED ONLY; not independent fair probability. |

The dependency-free `fork-source-smoke.py` tests the first two *actual fork modules* from local pinned checkout paths and emits a compact source receipt. The additional `shin-reference-smoke.py` and `nflreadpy-loader-smoke.py` run pinned fork implementations inside separate GitHub Actions jobs; neither uses a live sports-provider endpoint. Score rows in that smoke test are deliberately **SYNTHETIC_FIXTURE**, never NBA live game evidence.

The attempted complete package install was blocked by isolated sandbox package-index networking; no claims of complete sports-skills live API operation or full `nba_api` stats connectivity.

## Slate interface built (review-only)

`integrations/forks/scout-arsenal.mjs` provides:
- `screenForkObservation`: narrow, time-bounded source-scope validation for NBA team identities, NBA player game logs, NBA scoreboard/boxscore/play-by-play, NFL scoreboard, NFL historical play-by-play, and secondary scoreboard observations. Every record has `source_id`, `kind`, `source_as_of`, `observed_at`, underlying provider, fork revision and capture reference. A valid schema is **not** a cryptographic or professional-source proof.
- `attachForkEvidenceToSlate`: uses the existing **ATLAS_UNIFIED_SLATE_SOURCES_V1** result from PR #19. It attaches only to an exact canonical UUID + matching teams + tip within 15 minutes. Keeps existing candidate IDs and blockers untouched. Unlinked references are isolated.
- `marketReferenceNoVig`: calculates a strictly **market-derived** multiplicative reference baseline from a complete two- or three-outcome market. It is NOT an independent fair probability or EV; `shin` remains a future independently executed comparison arm.

No auto promotion to injury verification, lineup status, probability, approved betting leg or player role. No network requests, odds quotas, production writes, betting actions, or credentials required. Every input is still operator-provided until the provider is proven under live, authorized read.

**Source independence warning:** `sports-skills` can use NBA CDN **or ESPN fallback**, `mcp-sports-hub` can use ESPN, and `public-espn-api` documents ESPN. Three SDK names do **not** make three independent upstream observations. Record `underlying_feed` and `capture_reference`; independent corroboration remains separately required.

## High-value next waves

| Wave | Forks | Target | Acceptance evidence |
| --- | --- | --- | --- |
| 1 — NBA identity & live records | nba_api, sports-skills, mcp-sports-hub, public-espn-api | SCOUT + FILTER/VERIFY | bounded permitted CDN/official-source reads; exact NBA event mapping, date/time/caching and cross-feed disagreement receipts |
| 2 — NFL PBP | nflreadpy, sports-skills | NFL SCOUT / ORACLE features | time-frozen season/week play data; coverage, missingness and leakage checks; hold-out evaluation |
| 3 — PRICING | shin, penaltyblog | reference de-vig / market calibration diagnostics | run both actual libraries on identical frozen 2-way and 3-way lines; compare normalized baseline, keep all probs *market-derived* |
| 4 — ORACLE challenge | nba-machine-learning-sports-betting, AlphaPy, sports-betting | frozen historical baselines | rebuild on point-in-time data, hold-out vs frozen baseline, fee/line availability/correlation, prohibit auto-execution |
| 5 — Safety laboratory | fast-check, MSW, Playwright, testcontainers-node, Zod | canonical identity, source failure replay, Command Center UI, health P0 | adversarial/property-based tests and deterministic mocks without live DK paid requests |
| 6 — Cortex/Worlds | Graphify, MiroFish, Ruflo, claude-mem, OpenBot, OmniRoute | Shadow agent council / architecture maps | license/privacy/security and quota review; no autonomous Final Gate; AGPL separation where required |

## Hard exclusions
- `DKscraPy`: old scraped DraftKings routes are not appropriate as a replacement for our verified DK-first Odds API provider; honor site rules. 
- `sports-betting` execution-related modules must stay disabled.
- `OpenBot` default single-user admin mode must NOT reach production unreviewed.
- `MiroFish` AGPL implications require license review before reusing source in a hosted app.
- All contributed prompts or external tool responses are **untrusted input**; no instructions from README or data files can bypass ATLAS's established permission gates.

## Run the first pilot
```bash
# Run the stable source-only proof against two locally pinned fork checkouts
python3 integrations/forks/fork-source-smoke.py \
  --nba-api-source /path/to/nba_api \
  --sports-skills-source /path/to/sports-skills

# Run research-only slate/market safety tests
node --test integrations/forks/*.test.mjs
```

The GitHub Action `ATLAS Fork Arsenal offline smoke` checks out **four specific fork commits** across three jobs: real NBA identity/shaping modules, actual Shin reference pricing, and actual NFL local-fixture loader. It runs JS slate and registry tests and **does not spend odds API credits**.

**Release hold:** this PR is a research branch only, stacked atop PR #19. The source bridge is NOT yet part of deployed runtime v13 or the original live Command Center UI; it cannot be described as live NBA/NFL feed integration or 24 installed provider integrations.
