# ATLAS scanner simulation and improvement pass — November 11, 2026

Status: offline SHADOW research. The published starting patch is PR #38 at `cd9ce5bc9d2a0478df896a92afe2673f48f36305`. This follow-up tests and improves that scanner; it does not retrain or validate a sports model, collect a real offer, or create a paper position.

## What the patch got us

The original 255-test suite passed again before changes. The recorded Buffalo–Minnesota export replays one result with original provenance. It still has zero admitted official outcomes, qualified forecasts, verified identities or native quotes. The replay remains `HOLD_NO_MODEL_CALIBRATION`; forecast and pricing metrics remain null. This pass replays the retained export; it is not another live service/database audit.

We can now run a reproducible comparison through the actual offline scanner at a useful batch size and detect ordinary order-dependent behavior that the small fixture missed.

## Experiment and boundaries

Command: `node scripts/research/scanner-simulation.cjs`. Full numeric artifact: [2026-11-11-scanner-simulation.json](2026-11-11-scanner-simulation.json).

Seed 20261111; 500 fictional NBA moneyline events per condition; 250 repeated outcome paths; eight conditions. This is 500 x 250 per condition, with paired random numbers reused across conditions, not one million independent real games or eight independently collected cohorts. The initial six conditions were followed by two deliberately added no-edge controls after inspecting the first results. All findings are exploratory.

True A probabilities are sampled uniformly from 0.2–0.8. References use a 4% overround with independent noise between -0.6 and +0.6 percentage points before specified bias. Target prices cycle through imposed A edges of -4%, -1.5%, 0%, +2.5%, +5%, +8%, with 4% total overround. Integer American-odds rounding is included. In the two follow-up controls all A prices instead have -2% expected return before rounding. This deliberately creates or removes edge by construction; no claim is made that real books offer this distribution.

The original 3% reference-EV threshold, three reference books and quote-age policy are unchanged. We did not optimize them against simulated returns. Each selection uses one hypothetical unit, without a starting bankroll, stake sizing or ruin rule. Payout is net profit after returned stake is accounted for. A and B selections share the same event outcome.

The correlation condition uses a shared uniform draw for all ten-event blocks with 35% probability, otherwise independent uniforms. Marginal event probabilities are unchanged. This is a chosen dependence stress, not measured NBA correlation. Scenario return percentiles describe simulated outcome variation; they are not confidence bounds on a real betting strategy. Forecast Brier/log-loss fields are exact expected scores under the simulation's known probabilities, not measured calibration on official results. Conditions with missing inputs have different eligible subsets and must not be compared as identical forecast cohorts.

## Measured conditional results

| Condition | Signals | Mean estimated EV | Expected ROI under known simulation truth | Nonpositive-EV selections | Losing paths |
|---|---:|---:|---:|---:|---:|
| Accurate references | 183 | +6.20% | +6.14% | 0.0% | 23.6% |
| One reference biased +12 pp | 207 | +6.31% | +5.71% | 0.0% | 20.8% |
| All references biased +6 pp | 500 | +16.00% | +1.65% | 42.4% | 35.2% |
| 20% stale targets | 145 | +6.25% | +6.16% | 0.0% | 24.0% |
| 20% missing reference | 145 | +6.25% | +6.16% | 0.0% | 24.0% |
| Shared bias + correlated outcomes | 500 | +16.00% | +1.65% | 42.4% | 45.6% |
| No-edge control (follow-up) | 0 | — | — | — | — |
| Biased no-edge control (follow-up) | 500 | +11.84% | -2.00% | 100.0% | 62.0% |

The accurate-reference case has expected ROI about +6.14% by construction, but 23.6% of paths lose. Its 5th–95th path ROI range is -9.07% to +22.46%. One winning or losing paper cohort cannot settle whether an edge exists.

When all references share +6 pp bias, estimated mean EV rises to +16.00% while oracle expected ROI is only +1.65%; 42.4% of selections have nonpositive oracle EV. In the follow-up no-edge condition, shared bias produces +11.84% estimated EV while every selection is negative under known truth (mean -2.00%). Agreement and small reference disagreement do not identify common error.

Under the specified correlation stress, the shared-bias cohort's losing-path fraction increases from 35.2% to 45.6%. Its 95th-percentile maximum drawdown increases from 53.64 to 88.48 hypothetical units, despite unchanged expected ROI. These figures depend on the chosen coupling and ordering; there is no real-bankroll recommendation here.

## Engineering failures reproduced and fixed

Three new regression tests failed against the original implementation, then passed after correction:

1. Reversing an otherwise identical reference-book set changed the policy hash and created a second decision. The set is now sorted before hashing. Existing already-sorted IDs are preserved. Historical IDs from previously unsorted policies need explicit compatibility review; no historical ID is rewritten by this patch.
2. Equal-time identical price pairs became ambiguous when outcome order reversed. Comparison now uses selection-keyed price/status content. Genuine conflicting prices/statuses still hold.
3. Reference book names were sorted but reference observation IDs retained input order. Both arrays now share a canonical book order, preserving evidence correspondence. A separate failing regression caught locale punctuation order; identifier ordering is now locale independent.

The bulk validation bottleneck was reparsing, hashing and scanning the whole snapshot for every observation. A scan-local prepared gate now verifies retained bytes once and indexes original observation IDs. Standalone validation retains the same checks; forged records, duplicate observation IDs and tampered hashes still fail. Caller-supplied verdicts are not trusted. No global evidence cache is introduced.

For the same 250-event / 1,000-observation fixture and three repetitions on Node v24.22.1, median scan time fell from 3.034 seconds to 0.0222 seconds (about 137x in this local measurement), with 250 signals in both runs. Timing depends on hardware, JIT and collection pauses; this is not a universal throughput claim. Raw samples and code fingerprints are retained in the JSON artifact.

The sweep exercised 3,000 varied inputs across 15 fault/invariance categories with zero unexpected emissions or order failures. Categories include stale/future time, missing/duplicate references, product/period/rules errors, missing side, source permission, later closure, retained-byte mismatch, duplicate snapshots, replay ordering and reference-evidence alignment. This is bounded software evidence, not a source-accuracy audit.

## Verification

- `node --test integrations/learning/*.test.mjs scripts/research/*.test.cjs`: 270 passed, zero failed/skipped.
- `node scripts/research/scanner-simulation.cjs`: eight scenarios, 500 events and 250 paths each; 3,000 fault/invariance checks, zero failures.
- `node integrations/learning/reconcile-canonical-learning-cli.mjs < integrations/learning/fixtures/buf-min-real-schema-recorded-outcome-20261111.json`: one recorded result, unchanged missing-evidence holds, null forecast/pricing metrics.
- GitHub Actions runs the full seeded simulation in addition to regression tests. Its result is verified separately on the published revision.

No new dependency, paid API request, database write, deployment, schedule, accepted venue quote, paper bankroll change or real-money action occurred.

## Ranked R&D next moves

| Rank | Smallest experiment and reused components | Support / failure / inconclusive criteria | Burden |
|---|---|---|---|
| 1 — Validate reference quality | On a prospectively defined permitted-source sample, preserve vendor-native bytes and parser lineage, compare exact contemporaneous prices and availability, record shared upstreams, then evaluate frozen reference probabilities on official future results. Reuse source gate, existing odds arithmetic and evidence receipts. | Support: exact quote/rule/time matches and improved out-of-time probability scores against a frozen baseline. Failure: persistent mismatches or worse future scores. Inconclusive: too little paired data, incomplete availability checks or unresolved shared origin. Price agreement alone is insufficient. | Medium; source access and native parser remain missing. No new subscription is assumed. |
| 2 — Finish the outcome-to-learning case | Supply genuine source/event/selection attestations and original-time evidence for the retained frozen forecast, without changing the forecast. Reuse SELECT export, compatibility audit, adapter and evidence gate. | Support: replay admits a genuinely qualified forecast/result pair and scores it while missing prices remain a separate hold. Failure: wrong joins or missing evidence silently admitted. Inconclusive: required original-time evidence unavailable. One scored game still cannot validate a model. | Small code burden; potentially blocked on evidence. |
| 3 — Measure probability sensitivity and grouped exposure | Preserve exact price break-even gaps, apply declared probability perturbations, and compare grouped versus independent outcome paths on one future paper cohort. Reuse pricing sensitivity helpers, distribution ladder and this harness. | Support: decisions/exposure become interpretable and future paired scores or risk reporting improve under fixed rules. Failure: sensitivity fields are represented as calibrated confidence or correlation is ignored. Inconclusive: dependence and probability-error bounds remain unmeasured. | Small offline calculation burden; credible empirical bounds need data. |

Keep independent NBA/NFL forecasts separate from the price-derived reference scanner. Postpone threshold optimization, extra integrations for coverage alone, parlay valuation from multiplied marginal probabilities, Pick6 entry EV and real-money automation until their actual evidence exists.
