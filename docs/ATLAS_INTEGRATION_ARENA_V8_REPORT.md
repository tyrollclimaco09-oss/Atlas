# ATLAS 🦾 — Integration Arena V8 (November 5, 2026)

**Branch goal:** Combine original ATLAS research nodes from PRs #29–#32 on a review-only, nonproduction branch, with a reproducible historical regression and newly frozen pre-tip NBA score baseline. **No wagers, no paid APIs, no production writes, no model promotion.**

## Governance and branch structure

- Depends on draft PR #29 (`research/atlas-nov05-calibration-pivot-v4`) for `pivot-gate.cjs`, `market-intelligence.cjs`, and `discovery-guard.cjs`.
- Includes explicitly snapshotted original code from sibling LAB draft PR #30 (feature-lab), PR #31 (value-cortex) and PR #32 (edge-dna), with their standalone tests. All come from the operator's same ATLAS repository; this is a temporary dependency assembly for integration verification, **not** a merge of those PRs or a production release.
- Provides a new `integration-v8.cjs` bridge and public 29-assertion test exercising the module contracts end to end.
- No change to the parent frozen forecasts, previous LAB PRs, Command Center, sportsbook account, Supabase, or operational model weights. All future promotion remains subject to human Final Gate and separate QA.

## Newly frozen pre-tip event-baseline packet

- Source: connected DraftKings SportsMCP `search_games_v1` completed NBA team-filtered results, generated **2026-11-06T01:26:12.198893Z**. Covers **27 completed games** with ORL, PHX, MIA or GSW, Oct 21–Nov 4 2026. Provider competition IDs, team identities and scores are preserved in the JSON fixture.
- Actual code freeze time **2026-11-06T01:29:19.272Z** (November 5, **7:29:19 PM CT**).
- Future events at freeze: `ORL@PHX` event **1025923**, scheduled **2026-11-06T02:00Z** (8 PM CT); `MIA@GSW` event **1025924**, scheduled **2026-11-06T03:00Z** (9 PM CT).
- Formula: **(team last five games' scored average + opponent last five games' conceded average)/2**, for home and away separately. No home adjustment, opponent-strength calibration, injury adjustment or odds input. A score-only baseline: **not a fair win probability**.
- **ORL@PHX**: 114.4 Orlando, 115.3 Phoenix (home margin +0.9; total 229.7).
- **MIA@GSW**: 116.5 Miami, 121.4 Golden State (home margin +4.9; total 237.9).
- `independentProbability`, `odds` and `modelValidated` not inferred. Prior public betting quotes were visible in the conversation, so while the deterministic *formula* has no odds input, the creation is not a fully blinded study.
- NFL `JAX@BAL` had already started when connected source was checked at 7:24 PM CT. **No invented NFL pregame freeze.** Injury sources and NBA lineups were observed but not accepted into this model until reliable verified, timestamped provider identity/availability arrives.

## Real-data regression and root-cause proof

The existing November 4 frozen pregame report (original SHA-256 `43fb8d3126f175817ac91d3b54c6585d7207c275cf3709e53d5b98c56b64c1b2`) is a **retrospective regression fixture**, not an unseen validation set.

- 14 scored NBA games, original side calls **7/14**, Brier **0.229708**, margin MAE **9.393**, total MAE **9.25**; recomputed from the original per-game rows.
- 22 original paper cards across 3 overlapping batches, **4** complete threshold hits. These are overlapping hypotheses, not 22 independent samples nor priced parlays.
- Subsequent 8/12/20-leg market-card grades recomputed by re-grading frozen legs: **6/8**, **7/12**, **13/20**, all full-card losses. Repeated Detroit and Memphis moneyline failures each appear in all three; one failure can destroy many overlapping cards.
- **Private local-only financial reconciliation**: the operator-supplied real-money screenshot and spoken $0.70 double were checked with the ledger/exposure modules, and the reported ledger reconciled. Exact stakes, balances, and receipts remain out of this *public* repository branch and out of public CI fixtures.

## Offline tests actually run

- Re-ran **211/211** existing assertions across 6 relevant core LAB suites locally (pivot-gate 29, market-intelligence 30, discovery-guard 32, feature-lab 35, value-cortex 44, edge-dna 41).
- Executed **51/51** newly composed private integration assertions on local historical and operator receipt data, **not committed to a public repo**.
- Executed **29/29** standalone **public-safe integration assertions** in `integration-v8-public.test.cjs`, including frozen-time checks, model reproduction, 14-game scoring, missing-quote rejection and synthetic exposure grouping.
- Local self-contained HTML proof cockpit was tested with Chromium desktop and mobile views; five tab selections and game comparison work, with no JS errors or mobile overflow. The private dashboard, which displays sensitive personal betting information, is available only as a local conversation artifact, not in GitHub.
- Counts are distinct only within the named test suites; they are functional assertions, not independent empirical sports-model validation. **Fresh GitHub Actions/CI, published site parity, live account quote, and Supabase integration are not proven.**

## Reproducibility (public branch after checking out its dependencies)

```bash
node scripts/research/pivot-gate.test.cjs
node scripts/research/market-intelligence.test.cjs
node scripts/research/discovery-guard.test.cjs
node scripts/research/feature-lab.test.cjs
node scripts/research/value-cortex.test.cjs
node scripts/research/edge-dna.test.cjs
node scripts/research/integration-v8-public.test.cjs
```

The frozen score report is in `scripts/research/fixtures/v8/ATLAS_INTEGRATION_V8_PRETIP_PUBLIC.json`. Do not regenerate its frozen timestamp or prediction values after tipoff. The historical game response subset is in `nba_team_history_2026-10-21_to_2026-11-04.json` and its source timestamp is preserved. The November 4 historical public fixture contains *no real-user account financial records*.

## Upgrade acceptance gates

1. **Fresh CI:** 7 suite executions on the pinned integration head; reject code divergence from parent PRs and apply source SHA matching.
2. **Data provenance:** live official roster/team ID and provider quote actual source and effective timestamps, with missed update/recovery logic verified.
3. **True prospective model evaluation:** compare score MAE and correct moneyline side on tonight's two already-frozen events only after results are official; continue over many untouched future NBA and NFL games, include the market-only controls.
4. **Fair probability & pricing:** no EV, +EV or CLV claim unless an independently calibrated fair probability and exactly available book price are independently timestamped and matched to the same line.
5. **Published frontend parity:** test under actual Command Center origin and user session; PR preview availability is not that proof.
6. **Human approval:** no auto-deployment, real-money placement, backend promotion or model-weight edits.

**Verdict: Research cross-node logic passes offline; real-data forecast freeze was captured before tipoff; future performance, live account prices, and operational integration remain unproven.**