# ATLAS forecasting learning bridge — SHADOW

**Purpose:** turn independently verified NBA/NFL experiment observations into evidence-backed, reusable forecasting lessons. This is a deliberately read-only integration; no sportsbook access, database writes, model retraining, deployments, credential handling, or automatic production promotions.

## Commands

```sh
node --test integrations/learning/*.test.mjs
# Authenticated operator exports are passed as one JSON object on standard input:
node integrations/learning/reconcile-canonical-learning-cli.mjs < authorized-readonly-export.json
```

## Data contracts

1. `canonical-learning-adapter.mjs` consumes one JSON bundle with `experiment`, `frozen_cohort`, `observations`, `predictions`, `identities`, `official_outcomes`, and `quotes`. The existing ATLAS registry and views are input *sources*, **not** proof that these fields are already complete. An explicit source-authenticated player/team/event/market identity input, independent model probability, preregistered numeric baseline, official binary outcome and exact verified book quote are required.
2. It joins observations, forecast, official result, roster/market identity, and quote using **both candidate key and canonical event ID**. Ambiguous duplicates, timestamps after freeze, historical narrative-only baselines, synthetic SGP quotes, a market mismatch, unresolved voids and a missing causal root produce explicit HOLD blockers. It never derives IDs or probabilities from a player name or a story.
3. A fully reconciled cohort can be evaluated by `experiment-evidence-gate.mjs`, which compares out-of-time Brier/log loss against the original baseline and *separately* measures price-adjusted hypothetical ROI. A statistical threshold is not proof of profit or a substitute for ongoing out-of-sample testing.
4. `reconcile-canonical-learning-cli.mjs` accepts a **locally authorized** read-only JSON export from STDIN. No key or Supabase URL is stored in the repo. The CLI prints a sanitized audit summary and never writes to the ATLAS ledger.

## Exact current live data gap — November 9, 2026

Connected Supabase reads confirm 18 experiments, **3 source-recorded experimental observations**, **0 of those with official outcomes**, **1 historical UNSCORED probability-less frozen prediction**, **0 completed forensics-to-learning joins** and **0 registered models**. The three old experiment observations have missing canonical event IDs and narrative baselines. None may be converted into a scored record by guessing. The Nov 8 `FULLSEND_R2` paper account is a different synthetic accounting system ($50 initial, $20.63 final cash, -$29.37 net), not canonical independent model-training credit.

Existing DB objects observed: `public.atlas_shadow_experiment_registry_v2`, `public.atlas_shadow_experiment_observations_v2`, `public.atlas_prediction_registry_v1` (read model), `public.atlas_forensics_learning_bridge_v1`, `public.atlas_decision_outcome_attribution`, `public.atlas_market_identity_audit_v1`. These structures do NOT currently establish source-authenticated exact player-market eligibility or a complete outcome join. The read-only adapter expects additional independently verified external records when they become available.

## Promotion boundary

**DRAFT / SHADOW** means useful code, not working live ingest. GitHub Actions runs `node --test integrations/learning/*.test.mjs` on changes. Synthetic positive-case tests prove only logic, not that the sports model wins. The next proof is an authorized read-only source-to-packet replay with a real prospectively frozen model probability, current roster/event/market ID, independently frozen baseline, authentic quote and official outcome. That would still produce only a human-review candidate. No user money moves without the human Final Gate.

## Existing historical regression examples

- November 8 Tyler Herro falsely attached to Miami–Sacramento: market identity HOLD, not ordinary forecast LOSS or sportsbook void.
- Domantas Sabonis DNP: void/adjustment separately accounted for, not a forecast error.
- Raiders moneyline repeated across parlays: a single underlying game/script root must not inflate independent-case counts.
- Multiplication of separate public prices is **not** a verified sportsbook SGP quote.
- A favorite-looking strategy with worse price-adjusted outcomes must not be promoted based only on a good hit rate.

**Operator status:** read-only adapter and gate are code-level integration. Provider/authenticated live ingest, automatic canonical observation/outcome joins, public site deployment and production parameter promotion remain **NOT VERIFIED / NOT DONE**.