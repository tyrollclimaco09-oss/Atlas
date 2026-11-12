# Patch notes — ATLAS SCOUT→ORACLE assistance-rate modeling (November 12, 2026)

**Research-only stacked extension on PR #43.**

### Added
- A new normalized historical box-score and minutes-scenario intake for NBA assists; explicit source SHA256, receipt ordering, event/player/team checks, duplicate prevention, known-status and rule checks.
- A first conditional Gamma-Poisson (negative-binomial predictive) assists model; reuses the existing PR #37 `compileDistributionLadder` and its original settlement/threshold semantics.
- A frozen-formula historical-rate comparator; printed 4+/6+/8+/10+ ladders, scenario sensitivity bounds and explicit output non-promotion flags.
- 20 new native regression tests. A synthetic 4,500-case stress arena + independent SciPy comparisons are archived separately.

### Measured
- 50/50 local JS tests passed (20 new; 30 inherited Part 2 integration/math tests).
- 4,499 synthetic cases scored, 1 held by data validation. Scenario-misspecification caused severe degradation. Independent numerical probability error ≤5e-9.
- Retrospective 4-game player diagnostic did **not** beat static baseline; not a genuine prospective trial.

### Not done
- No authentic original NBA raw box-byte ingestion; no same-origin source attestation; no official crosswalk or validated model skill; no trusted minutes weights; no native prices; no bankroll changes, wagers, production promotion or deployments.
- Existing PRs #37/#43 and the 14 original frozen November 11–12 event forecasts are unchanged. The source patch is additive and SHADOW only.

### Fail-closed next gate
Register original-byte player source + signed identity, obtain prospective participation-scenario weights, retain immutable forecasts and prices, then compare future outcomes on preregistered cohorts. Until that exists, **HOLD all real-money decisions**.