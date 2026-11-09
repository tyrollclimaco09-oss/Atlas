# ATLAS Experiment → Knowledge Gate (SHADOW V1)

ATLAS's long-term problem is not a lack of research ideas; it is that hypotheses and results are not consistently joining into **reusable, trustworthy forecast learning**. This module creates an **offline, fail-closed experimental-graduation gate** without touching production.

## Run

\`\`\`sh
node --test integrations/learning/experiment-evidence-gate.test.mjs
\`\`\`

The exported pure function \`evaluateExperimentEvidence(packet)\` takes one preregistered, previously frozen NBA/NFL cohort. The input must include:

- Immutable hypothesis/cohort ID and case count, model version, independent frozen baseline, training cutoff and out-of-time holdout.
- One record for EVERY selected, rejected, voided and settled case, even if it lost. A case is not silently removed to inflate hit rate.
- Official event/team/market identity, verified settlement status, timestamped pre-price features and model forecast, official final outcome observed after the event, and a stable underlying causal-root key.
- For financial evaluation, exact verified pregame bookmaker/market identity, offered decimal price, timestamp after the independent forecast freeze, documented hypothetical stake, and non-synthetic quote type.

## What gets scored

1. **Forecast quality**: paired Brier/log-loss vs a predeclared baseline, with root-cluster bootstrap uncertainty. Distinct parlay slips sharing one root cannot be counted as independent wins.
2. **Financial quality**: price-adjusted *paper* net ROI and bootstrap uncertainty only on eligible exact book-quoted prices (not invented SGP multiplications).
3. **Integrity**: no wrong player-game join, no future information, no after-start freeze, no source-less outcome, no duplicate cases, no unreconciled frozen cohort.

If it fails, return **HOLD + exact blockers**. If sufficient evidence appears, return **HUMAN_REVIEW_ELIGIBLE_SHADOW_ONLY**, never automatically change a forecasting model or place a wager. The 120 independent roots / 21 UTC-day default is an exploratory minimum, **not** a guarantee of significance or profitability. Multiple-testing and regime-robustness reviews remain necessary.

## Intended integration (NOT DONE by this PR)

- Use current Supabase shadow experiment registry and observations rather than creating another database architecture.
- SCOUT/VERIFY authenticates official source identities; ORACLE freezes the pre-price cohort; PRICING attaches exact market quotes after the independent forecast; FORENSICS appends independently verified official outcomes; CALIBRATOR runs this pure gate and writes an append-only SHADOW evaluation receipt with source IDs and a result hash.
- On acceptance, test a versioned candidate against the frozen baseline on a **new** chronological holdout, with regression fixtures for prior errors (Nov 8 fake Herro/Miami player market, DNP/void, repeated parlay roots, synthetic combined prices, ledger replay).
- Human Final Gate for real money stays mandatory. No deployment, cron, paid feed, provider calls, DB schema modification, model training, or automatic promotion in this PR.

**Reality check, Nov 9 2026:** ATLAS learning read models showed 18 experiments, three observations without outcomes, one unscored prediction without a joined outcome and no model registry rows. This source change does **not** populate those missing data automatically. The next implementation step is a separately reviewed, source-authenticated, read-only **experiment observations → official outcomes → evaluation packet** bridge.
