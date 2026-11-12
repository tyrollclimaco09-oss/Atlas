# ATLAS Part 2 — native math bridge (SHADOW)

Status: Draft research integration only. Base: PR #37, branch review/learning-evidence-gate-2026-11-09, head d485ee0f825d8cf9e8031ee63f1fdc82c4529fc7.

## Why this is not a parallel system

Existing engine integrations/learning/opportunity-value-engine.mjs remains unchanged. It controls evidence requirements, identity and price gates, portfolio caps, shadow status, and zero execution authority. The optional part2-opportunity-bridge.mjs first calls rankOpportunities(packet,policy) and only annotates returned case rows with part2_research. Missing extra evidence is expressly marked HOLD_NO_PART2_RESEARCH_PACKET. The bridge CANNOT turn a native HOLD into a PASS, upgrade a quote, or change any allocation or model freeze.

## Where the packet's math goes

| Responsibility | Existing module | New research diagnostic |
|---|---|---|
| ORACLE / uncertainty | Frozen forecasting cohorts in PR #40–42 | Beta-Binomial exchangeable rate baseline only; posterior interval and one-sided EV shortfall; scenario sensitivity |
| EDGE THIEF | Adversarial research | Unknown-correlation Frechet bounds for doubles; require supported conditional probabilities |
| PRICING / LINE SHOP | PR #37 Opportunity Value Engine; PR #38 offline reference scanner | Binary/general settlement EV; decimal-American conversion; exact-contract fixed-forecast price comparison |
| SENTINEL / Final Gate | Existing evidence, quote and portfolio blockers | Adjunct explicitly non-promoting; no change to stage, stakes, blockers or production authority |
| FORENSICS / CALIBRATOR | PR #41–42 freeze/evaluator | Later paired proper scores and missingness; no post-hoc changes to current frozen 14 games |

## Run locally

With the five Part 2 files beside the unchanged PR #37 engine, run:

    node --test integrations/learning/part2-*.test.mjs

The PR #37 workflow already runs node --test integrations/learning/*.test.mjs for changes under that directory. Its GitHub CI result must be inspected separately after PR creation.

## Critical limits

- The 14 existing cases are game-moneyline-style forecasts and do NOT constitute an authenticated NBA 6+ assists prop cohort.
- The Beta posterior requires pre-defined comparable binary trials; a past hit rate is not a validated participant/threshold distribution.
- Caller-supplied verified fields, hashes and timestamps alone are NOT origin attestations or proof that sportsbook quotes were actually obtainable.
- Unknown same-game dependence must remain unknown; bounds do not establish the likelihood of a specific double.
- A statistical screen passed is merely conditional math; it is not a real-money recommendation, authenticated EV, or model promotion.

## Next experiment

SCOUT + FILTER establish real timestamped minutes, availability, role and opportunity evidence; ORACLE freezes baseline-vs-role-adjusted 6+ AST probability distributions before tipoff; PRICING separately audits exact-market native quotes; FORENSICS evaluates later untouched outcomes and selection outcomes. Keep all missing data, controls and failures. Explicit operator Final Gate remains mandatory for any eventual live decision.

No database writes, deployments, wagers, paid API calls, or auto-promotion are part of this branch.
