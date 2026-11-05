# ATLAS 🦾 — Value Cortex V6 / Feature Heist VI

**Created:** November 5, 2026, America/Chicago. **Scope:** Original research and interactive prototype. No live data, no real bets, no production code changes, no paid API requests.

## Why a new feature architecture?

ATLAS already has independent forecasting, edge challenges, scenario research, manual Final Gate, paper HYDRA and forensics. A sprawling list of new top-level tools would duplicate work. Instead attach **evidence-bearing sub-nodes** to the existing canon. Nothing is an autonomous execution agent.

**Canonical flow:** SCOUT → FILTER/VERIFY → EDGE THIEF + ORACLE → PRICING → KAIROS → SENTINEL → TACTICIAN → HUMAN FINAL GATE → LEDGER → FORENSICS → CALIBRATOR. LAB / SHADOW concepts do not silently promote.

## 20 feature proposals assigned to existing nodes

| New ATLAS feature | Parent | What user sees (interactive/info) | What must be proven | Priority |
|---|---|---|---|---|
| 1. Signal Radar | SCOUT | Market-wide searchable candidate explorer: sport, player, market, role, news, quotes | Source freshness, precision and recall on historical events | P1 |
| 2. Minutes Redistribution Map | SCOUT→ORACLE | Visual 240-minute NBA rotation balance, pre/post injury | Minutes forecast MAE and availability accuracy vs baseline | P1 |
| 3. NFL Opportunity Tree | SCOUT→ORACLE | Drive→plays→dropbacks→targets→yards→prop map | Prospective play volume and target MAE | P1 |
| 4. Probability Ribbon | ORACLE | Median + 10/50/90 percentiles per outcome | Coverage and calibration by market | P0 |
| 5. World Mixer | ORACLE→HYDRA | Game-script sliders with joint outcomes and countercases | Out-of-sample log loss and multivariate calibration | P1 |
| 6. Value Surface | PRICING→TACTICIAN | 2D alternate line × offered price EV heatmap | Monotonic tail probabilities, exact market matching and held-out fairness | P0 |
| 7. Consensus Stress | EDGE THIEF→PRICING | Book-by-book no-vig probability and leave-one-out range | Cross-book matching and stability before source weighting | P0 |
| 8. Edge Fragility Slider | EDGE THIEF | EV under low/base/high model probabilities; no asserted edges | Calibration-validated probability error bands | P0 |
| 9. Market Tape | PRICING | Price/line movement chart with timestamped updates and withdrawals | Timestamp/event identity and complete provider coverage | P0 |
| 10. Edge Lifespan | KAIROS | Observed first sight→verification→withdrawn; right-censored when unknown | Real quote availability at actual decision time; no fabricated fillability | P0 |
| 11. Lead/Lag Network | KAIROS→PRICING | Which book appears to move first; see follow-through arrows | Same-market millisecond time alignment; exclude venue latency artifacts | P1 |
| 12. Data Provenance Lens | FILTER/VERIFY | Clickable raw→normalized→forecast→quote lineage with immutable hashes | 100% reconstructability from cited original receipts | P0 |
| 13. EV Durability Scorecard | CALIBRATOR | Candidate age vs recapture rate; no fake sharpness badges | Prospective recapture rates, median lag, censored windows | P1 |
| 14. Risk–Coverage Arena | CALIBRATOR | Abstention threshold slider; show how error changes with coverage | Chronological held-out evaluation, compare to always-pick and market | P0 |
| 15. Missed-Opportunity Ledger | LEDGER→FORENSICS | Grade rejected opportunities without pretending bets were made | Whole-candidate denominator, timestamps, quote and eligible status | P1 |
| 16. Common-Cause Loss Map | SENTINEL→FORENSICS | Graph ticket↔game↔player↔script exposures | Correct exposure sums and source-verified outcomes | P1 |
| 17. Price Target Watch | KAIROS | Watch threshold/price, notify only on verified state transition | Alert receipt time, latency, missed and false alerts | P1 |
| 18. Decision Time Machine | FORENSICS | Drag slider to see precisely what ATLAS knew at each moment | Zero future-field leakage through backward replay | P0 |
| 19. Paper/Real Toggle | TACTICIAN→LEDGER | Separate unpriced paper hypotheses and accepted real tickets | No synthetic ROI, accepted odds only from user account receipts | P0 |
| 20. Challenge Graph | EDGE THIEF→CALIBRATOR | Each model thesis with for/against evidence, falsification trigger | Pre-registered failure criteria and comparison arm outcomes | P1 |

## Intellectual sources and legitimately replicable design patterns

- Unabated Odds Screens, movement/freshness indicators, synthetic hold, alt lines and no-vig tools: https://www.unabated.com/tools/odds-tools and https://unabated.com/content/videos/learn-about-the-game-odds-screen
- SmartStake's market-detail panels combine quote, fair odds, history and book comparisons: https://www.smartstake.app/docs/advanced
- Smarkets matched-price/volume history: https://help.smarkets.com/hc/en-gb/articles/360015273571-What-are-the-charts-at-the-top-of-each-market
- Betwatch describes source-weighted/proportional consensus and alternative methods; methodologies are **hypotheses** until source/licensing/validation: https://betwatch.io/
- Sharp Signal historic price scrubbing: https://sharpsignalbets.com/home
- Selective-prediction risk–coverage method: https://incerto.dev/docs/api/sp.html
- SaberSim's full-game simulation and correlated-outcome design pattern: https://support.sabersim.com/en/articles/17506644-where-do-your-projections-come-from
- RotoWire projected vs confirmed lineups, projected minutes, and late-scratch uncertainty: https://www.rotowire.com/basketball/nba-lineups.php
- Sportradar incremental odds-change message semantics: https://docs.sportradar.com/uof/data-and-features/messages/event/odds-change
- The Odds API historical snapshot caveat: historical samples every ~5 minutes, not an exhaustive feed; requires paid usage: https://the-odds-api.com/historical-odds-data/

**Never** infer real API access from documentation. Quote streams, exchange volumes, proprietary lineup models and player tracking require appropriate permissions/licensing. No copied logos, code, color assets or data exports. The interface is our original implementation.

## What was actually implemented in this branch

### New pure research module: `scripts/research/value-cortex.cjs`

- American odds conversion, robust EV range **conditional on the assumed** probability bounds. The range is not a statistical confidence interval unless supplied by a validated model.
- Finite-distribution probability surface: alternate line and synthetic offer → expected return matrix.
- Same-event/line two-sided odds consensus with proportional vig removal and leave-one-out reference stability. Reference estimate **is not automatically fair**.
- Quote tape with OFFERED/CHANGED/WITHDRAWN states. Computes an observed time window only when both observed boundaries exist; no claim of fillability or unseen intermediate status.
- Risk–coverage analysis from user-supplied frozen predictions, with built-in prospective timestamp checks and `profitability:null`.

### Offline test file: `scripts/research/value-cortex.test.cjs`

44 assertions cover mathematical conversions, incomplete/mismatched/cutoff-stale quotes, duplicate books, lack of independent model, market withdrawal, future-data leakage, and visible error/coverage denominator. Run `node scripts/research/value-cortex.test.cjs`.

### Original frontend-only HTML lab: `docs/labs/value-cortex-v6-demo.html`

Responsive dark research-terminal UI with original graphical visuals. The EV matrix responds to uncertainty slider; scenario and status cards state synthetic data; time-based quote timeline explicitly labels recorded observations, not executable quotes; risk–coverage panel tracks how rejected observations change the sample denominator. Entirely offline/no external network script. **It is not the published Command Center.**

## Real requirements before adoption

**P0 hard-gates:** (a) real provider integrations verified at user-origin with read-only contracts; (b) aligned market identity/event/line/book/observed time; (c) official roster/source and point-in-time data; (d) properly validated independent forecast distribution; (e) precommitted test cohorts with non-selected controls; (f) complete paper/real receipt distinction; (g) human Final Gate remains mandatory.

**Test design:** (1) collect every eligible NBA/NFL candidate at frozen decision time; (2) evaluate value surfaces and consensus while retaining quote gaps and no-model states; (3) compare rolling chronological forecasts to no-vig market baseline and existing ORACLE; (4) measure calibration, Brier, log loss, totals/margin MAE, predictive interval coverage; (5) market outcome: quote recapture, CLV only with identical book line and verified closing price; (6) ticket accounting: placed bets only, stake and payouts from receipts; (7) perturb injury and price timing and verify expected invalidation.

**Do not promote a model because 44 unit tests pass.** Unit tests prove implementation behavior on synthetic examples, not real-world efficacy. A two-book reference is a consensus observation, not an independent fair estimate. A lower-bound positive hypothetical EV is not a proven edge without calibrated bounds. Historical replay must be time-safe.

## Dependency scope

- Earlier research PR #29: calibration pivot, evidence gate, market integrity, correlation and Discovery Guard. Proposed shared contracts, but **not** automatically integrated.
- Earlier feature PR #30: alternate-line and scenario scaffolding; V6 adds cross-book robustness, temporal availability and risk–coverage visualizations. Potential overlap must be reconciled during review.
- Live Command Center source and browser-origin parity still require independent acceptance; this branch creates a standalone demonstrator, not an app deployment.

**Decision:** LAB/SHADOW candidate; no deploy, auto-merge, paid credentials, screenshot dependency, or wagering authority.