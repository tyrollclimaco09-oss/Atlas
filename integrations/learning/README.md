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


## Live forecasting and market research are separate from bankroll settlement

This bridge serves **all ATLAS sports-prediction work**, not only simulated wagering. A source-verified forecast with an independent pregame probability and a verified outcome can enter **forecast-quality scoring** even if no book offers the market. A **financial-return claim** additionally requires the exact eligible bookmaker market, accepted price, source timestamp, settlement rule, and recorded stake. `forecast_disposition` and `pricing_disposition` are distinct; neither ever directly places a bet or modifies real-money authority. NBA and NFL moneyline, spread, total, player and period markets can use the shared source/time/outcome contract, but each requires its own statistically justified probability model rather than applying a football model to all lines.

### First actual future canonical forecast freeze (Nov 9)

A new **unvalidated** NFL example was frozen *before* Bills–Vikings kickoff:

- Canonical event: `NFL:2026-11-09:BUF@MIN`, source game competition 974116, actual canonical event UUID in ATLAS events. Official kickoff: Nov 9, 7:15 PM CT.
- Forecast key: `ATLAS-NFL-BUFMIN-20261109-ML-BUF-HEUR-V01`, frozen 2026-11-09 **17:58:11.719081 UTC** in `public.atlas_prospective_prediction_freeze_v1`, model `NFL_POINT_MIDPOINT_LOGIT8_V0/0.1.0` in `atlas_model_registry_v1`, status UNVALIDATED / DESIGN.
- Experimental Buffalo moneyline p = `0.4968750406894683` from simple offensive/defensive scoring midpoints and arbitrary logistic scale 8. Neutral frozen baseline p = 0.50 in source-linked `atlas_shadow_experiment_observations_v2`. Data receipt `ATLAS-NFL-BUFMIN-20261109-INDEPENDENT-INPUTS-V1` predates freeze. **This is NOT a calibrated wagerable probability.**
- Preserve the source conflict: connected DraftKings team stats has Minnesota scoring defense 12.4 PPG; NFL official capsules show 13.3 PPG. Version0 holds its original 12.4 input; an official-source sensitivity remains separately logged.
- A later price reference was attached **after** the model freeze in `ATLAS-NFL-BUFMIN-20261109-POSTFREEZE-PUBLIC-PRICE-V1`. NFL.com reported BUF -186/MIN +156; these are public article prices, **not native book checkout quotes**. Approximate two-way devig Buffalo probability is 0.62475. Price-model disagreement is a research warning, not a profitable Minnesota pick.
- Official result unavailable at freeze. Postgame proof: obtain source-verified final, append immutable outcome receipt, join only outcome/close columns on frozen prediction and source-linked observation, then calculate Brier/log loss versus the frozen 50% baseline. Missing result, authentic quote or held-out sample stays HOLD. Retain real-vs-paper separation and operator Final Gate for actual wagers.
