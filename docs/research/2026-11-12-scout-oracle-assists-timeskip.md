# ATLAS — SCOUT→ORACLE participation-aware assists distribution timeskip

**Classification:** RESEARCH / SHADOW / PROSPECTIVE SKILL NOT PROVEN  
**Date:** November 12, 2026 (America/Chicago)  
**Base:** PR #43 at `9aa1ecec31338a5c10ac3039702c1713aaee83f2` stacked on PR #37; never edit the frozen November 11–12 14-game forecast artifacts.

## Integration findings

1. **Do not duplicate ORACLE's distribution ladder.** PR #37's `integrations/learning/distribution-ladder.mjs` blob `917a267d25c6243e07275292a132ce77afacf6d6` already supports discrete negative-binomial scenarios, half-integer alternate lines and sensitivity ranges. This sprint adds `scout-oracle-participation-shadow.mjs` to fit conditional parameters from normalized observed historical minutes and assists, then calls the existing compiler.
2. **Mathematics:** assists per minute rate λ ~ Gamma(a0,b0) [shape, RATE in minutes], historical assist counts conditional on played minutes ~ Poisson(λm). After k observed assists in M played minutes, a=a0+k and b=b0+M. In scenario m, the predictive number of assists is NB(shape=a, mean=a·m/b). Combine scenario probabilities with predeclared weights. This model does not include tactical, opponent, lineup, playmaking or shooting-conversion effects unless externally fitted; same-player exchangeability is an unproven assumption.
3. **Baseline:** count distribution with raw historical rate and a single historical-average minutes scenario (NB dispersion 500 approximates Poisson); registered before evaluation. It is not a market-implied reference probability.
4. **Evidence:** The adapter verifies deterministic raw *normalized JSON* hashes, unique identities, receipt timestamps, cutoff ordering, historical game uniqueness and model/rule scope; this does **NOT authenticate NBA original bytes or provider signatures**. Real source capture, roster identity, injury reporting and scenario-weight estimation remain separate upstream blockers. Confidence intervals for rate parameters are not the same as scenario ranges.
5. **No promotion:** Research outputs always indicate `source_authenticated:false`, `confidence_calibrated:false`, and `execution_authority:false`. No sportsbook quotes, tickets, account access, database writes or deployments.

## Executed test counts

- New native test file: **20/20 PASS** (incl. source SHA tamper, post-cutoff receipt, duplicate training event, target leakage, player/team mismatch, unknown availability, malformed history, market rule mismatch, bad scenario weights, quote independence and monotone alternate thresholds).
- Existing Part 2 regression files plus new tests: **50/50 PASS** locally. This does *not* replace the full GitHub CI suite.
- 4,500 independently seeded synthetic cases across five worlds: **4,499 evaluated, 1 HOLD** for an out-of-domain simulated historical assist count. Original records retained.
- JS native NB 6+ tail vs independently implemented SciPy `scipy.stats.nbinom.sf`: **max absolute difference 5e-09** across scored cases.

## Synthetic-stress results — 6+ assists

*Higher positive Brier gain = new model better; lower Brier and ECE better. All probabilities conditional on generated input assumptions, NOT real NBA skill.*

| Synthetic world | N scored | New Brier | Baseline Brier | Difference (baseline-new) | Central 90% count interval coverage | ECE (10 bins) |
|---|---:|---:|---:|---:|---:|---:|
| Stationary conditions | 900 | 0.1295 | 0.1311 | +0.0016 | 94.2% | 0.028 |
| Informed minutes increase | 900 | 0.1326 | 0.1593 | +0.0267 | 94.0% | 0.033 |
| **Wrong future minutes** | 900 | 0.2206 | 0.1503 | -0.0703 | 76.3% | 0.306 |
| Unanticipated role decline | 900 | 0.1759 | 0.1793 | +0.0034 | 86.0% | 0.260 |
| Extra future game-level shock | 899 | 0.1595 | 0.1621 | +0.0026 | 80.4% | 0.062 |

**Falsification:** Wrong minutes inputs produce much worse Brier (new ≈0.2206 vs baseline ≈0.1503) and only 76.3% coverage for a nominal central 90% predictive count range. Role decline produces 0.260 ECE. Perfect mathematical implementation can still make weak sports forecasts. Under accurate minutes increases, the participation-aware variant improves in the synthetic generating world; this does not prove an NBA edge.

*The 90% count interval is discrete and may overcover due to integer outcomes. Paired bootstrap percentiles are under an independent synthetic-case sampling assumption, not a valid sports-skill confidence interval.*

## Real-source research probes (not admitted prospective evaluation)

- Manually crosschecked published historical player-game lines from two public 2026–27 game-log pages for Cade Cunningham: ten games, 333 displayed minutes, 76 assists; the numbers match. Source pages: `https://www.statiqsports.com/nba/cade-cunningham/game-log` and `https://latescratch.com/players/cade-cunningham/`. The original HTML bytes and exact official event/player IDs are **not archived/attested here**, and displayed minutes are rounded.
- Conditional Nov 12 DET@WAS pilot: assume availability, and **hypothetical** 26/33/40-minute scenarios with 20/60/20% weights. The Gamma-Poisson conditional 6+ assists probability was ≈72.45%, static historical-average-minutes reference ≈76.72%. This is **not** a forecast eligible for live betting, because minutes-scenario weights, current player eligibility, official identities, and historical raw-source provenance are not verified.
- Four-game retrospective arithmetic reconstruction (train on first six visible games, predict each of next four in historical order) produced mean Brier **0.08622** for the new model vs **0.06610** for the baseline. The method was designed after the outcomes and is from only one player, so it must NOT be promoted into a prospective performance claim.

## Promotion readiness / next experiments

**HOLD** model calibration, source authentication, bookmaker pricing, and Final Gate use. To progress: build an original-byte capture and authenticated player/team/event crosswalk; freeze 6+ AST model parameters, scenarios, prior choices, cutoff and a simple baseline before games; separately store the actual outcomes with time-stamped raw NBA box evidence; evaluate a sufficiently large untouched later cohort with Brier/log loss, interval coverage, missingness and calibration; compare robustness to minutes-model errors. Staged research code must never auto-promote.

## Evidence/claim categories

- **VERIFIED_CURRENT_OBSERVATION:** local scripts, tests, synthetic simulation outputs and GitHub source file hash; external historical tables directly read today, without claimed vendor byte authentication.
- **SYNTHETIC_EXPERIMENT:** 4,500 simulated cases, stress worlds, bootstraps, and probability-accuracy diagnostics.
- **REPORTED_HISTORICAL_RECONSTRUCTION:** four game-log-derived player events, non-prospective.
- **PROPOSED_DESIGN:** original-byte identity and box-score attestor, pretip minutes model, source registration, new forward cohort.
- **UNRESOLVED_HYPOTHESIS:** participation-aware NBA assists distributions are better than the historical-rate baseline on real events.

## Regression command

From a repo checkout with this proposed module and PR #37's compiler:

```bash
node --test integrations/learning/scout-oracle-participation-shadow.test.mjs
node --test integrations/learning/*.test.mjs
```

The 4,500-case locally reproducible simulation scripts and seeded datasets are in the companion research zip; these simulations were not separately executed in GitHub CI.