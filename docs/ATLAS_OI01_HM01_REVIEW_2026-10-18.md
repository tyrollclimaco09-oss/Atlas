# ATLAS — Model & Market Refinement (OI-01 / HM-01)

**2026-10-18 · GitHub review only · No Floot, backend migration, deployment, betting execution, or canonical Final Gate promotion.**

## Evidence boundary

The existing SCOUT intake/evaluation, source-contract tests, and Game Sense workload feasibility (GS-01) remain owners of their present contracts. This pass adds two **offline synthetic research companions** under `scripts/scout/`. Neither companion supplies training data, predicts a game, calls a sports feed, or changes canonical application state. The new offline workflow job also executes existing SCOUT/Game Sense tests, so those preserved contracts are checked for regressions.

- `outcome-intelligence-shadow.cjs`: version `atlas.outcome-intelligence.shadow.v1`; freezes exact synthetic event/player/market/threshold and hypothetical stat-line worlds before attaching any prices; validates calendar cutoffs, units, assignments, mutually distinct worlds, optional declaration of weights and total mass; returns both/A-only/B-only/neither truth tables, split outcomes, conditional second-leg frequencies **only when explicitly declared synthetic weights are present**. Without weights, probability, expected value, and ROI stay null. Its SHA-256 checksum proves local JSON integrity, not independent witness custody or actual pregame existence.
- `settleTickets` and `compareExpressions` take only separately quoted synthetic American prices for each exact single, double, triple, SGP, cross-game or round-robin component. Higher-leg prices **must not** be inferred from marginal odds. The four-world payoff table tracks full ticket/portfolio settlement, including case-level partial wins and losses. Any multi-leg push/void remains unresolved until a specific venue's payout/void rule is proved; all expected-value claims then remain unavailable. Currency figures are theoretical unrounded arithmetic, not a sportsbook's cent-rounding policy.
- `house-mirror-shadow.cjs`: version `atlas.house-mirror.shadow.v1`; checks the exact two-way, no-push market/selection/settlement contract, research-freeze vs quote chronology, staleness and anomalous book hold, retains accepted/rejected denominators and upstream source-family overlap. Performs *proportional* de-vig for a **descriptive market-only benchmark**. First aggregate observations within provider family, then take a family-balanced median; many displayed books through one feed must not overweight the benchmark. Neither a market-derived benchmark nor a pinned local checksum establishes independent Oracle fair probability.
- No profit optimization, ticket recommendations, automated stakes, wagering API, sportsbook credentials, or production model promotion are present. `recommended_ticket_id` and `independent_fair_probability` remain null; executable authority remains false.

## Targeted falsifications and repairs

1. Initial integration CI showed a missing player statistic was rejected under generic bounds rather than the precise missing-stat integrity code. Classification was corrected and retested.
2. Replay, event identity, exact units, frozen before cutoff, plausible quote chronology, phase-one price contamination, nonfinite/invalid weights, simultaneous world assignments and duplicate synthetic IDs are negative tests.
3. Test fixtures explicitly distinguish joint P(11) from marginal-product P(A)P(B), evaluate conditional P(B|A) and correctly retain A-only/B-only cases; they do **not** validate those probabilities for real players or events.
4. Price comparison never creates missing combo odds. Alternate threshold equality blocks multi-leg ROI without a documented push/void policy. Explicit round-robin components settle as their own tickets.
5. House Mirror originally computed median across displayed books, allowing the same upstream provider to dominate. A targeted asymmetric fixture demonstrated provider-family balancing; the market benchmark remains an observed-price transformation, not an Oracle estimate.

## Not yet proven — hard stops

- **GS-01 → Outcome Intelligence coupling:** GS-01 verifies declared NBA/WNBA possessions, rotations and minute/usage feasibility, but does not produce probability distributions. OI-01 accepts hypothetical scenario stat lines and does **not** yet enforce full team-level causal consistency across touchdowns, missed shots, rebound chances, pace, passing volume, defenses, injuries or correlated sports. Do not promote GS-01 scenario labels to calibrated OI-01 world weights.
- **Real source:** no production-bound, authorized, rights-cleared, timestamped upstream feed currently provides prospectively received player-level opportunity/availability evidence to these modules.
- **Independent forecast:** no trained/frozen baseline, independent probability model, proper holdout, independent clock/witness or adequately labeled and scored outcome cohort establishes predictive value.
- **Real market:** no authenticated exact DraftKings quote or sportsbook-specific settlement/void/rounding and accessibility evidence was used. Fake quote ages, scenarios or odds do not clear House Mirror/KAIROS.
- **Execution:** browser draft writes are not crash-atomic; canonical source/identity/provider concurrency and human Final Gate still require their separate production checks; all previously inherited production gates remain blocked.

## Dependency-ordered next refinements

1. **One genuine feed** before more models: preregister NFL QB passing-attempt opportunity for one future slate as the first evidence lane (without replacing the separately specified NBA prospective pilot). Inspect source rights, complete slate and player ID census, original bytes, observed/published/received clock, cutoff, duplicate reports and crosswalk. A current stat page or free endpoint alone is not prospective evidence.
2. **Freeze baseline before labels/quotes:** preserve every candidate and abstention, with an independent estimate (or null), exact statistical target, inputs, model version and negative controls. Capture an independently controlled witness receipt when available. No post-event reconstruction.
3. **Game Sense consistency:** add real workload conservation and scenario-conditioned player-stat feasibility checks, with competing paths and hard counterfactuals, before assigning any validated scenario weights. Keep unsupported sport-specific claims as unknown.
4. **Pairing/quote validation:** use verified joint outcome estimates and separately observed package odds, settlement rules and provider-family provenance to compare singles, doubles, SGPs, multi-game parlays, alternates and round robins. Evaluate paired outcome missingness and empirical forecast error; no coherent-story = +EV shortcut.
5. **Operator gates:** maintain KAIROS freshness, SENTINEL budgets/correlation, original price independence, immutable decision receipts and human Final Gate. No autonomous betting.

## Verification procedure

The review-branch workflow `.github/workflows/atlas-review-pass1.yml` runs:

```bash
node --test scripts/scout/*.test.cjs
```

under read-only GitHub permissions and without installing sports/provider SDKs. Existing frontend provenance/regression and real Chromium smoke jobs remain separate. Individual job status and exact test counts must be read from GitHub Actions; this document is **not** a substitute for CI evidence. DO NOT add independent counts from overlapping historical suites or equate green synthetic contracts with prediction accuracy.

Review branch: `review/pass0-slate-regression-2026-10-16`.
