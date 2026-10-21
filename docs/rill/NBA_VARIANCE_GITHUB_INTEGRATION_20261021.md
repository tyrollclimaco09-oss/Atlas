# ATLAS NBA Variance × GitHub Integration — Evidence-First Pass
**Date:** October 21, 2026. **Scope:** GitHub review branch only; SHADOW, no real-money decision authority.

## Executive outcome

Do **not** add a second basketball simulation stack. Reuse the existing first-party ATLAS modules. The true missing link is validated **possession/rotation opportunity supply**, clean source/provenance fields, and a **price sensitivity report** that keeps scenario uncertainty visible all the way to SENTINEL.

New review work:
- `scripts/scout/nba-scenario-price-envelope.shadow.cjs`: pure four-scenario price comparator for exact Sharpe 9+ rebounds market, with quote identity, time, source and uncertainty boundaries.
- `scripts/scout/nba-scenario-price-envelope.shadow.test.cjs`: positive and adversarial controls, including fake operator-executable quotes, wrong markets, stale times and price sensitivity.
- Existing `scripts/scout/nba-integrated-100worlds.shadow.cjs`: attach this envelope directly to the **same** Sharpe thesis and coupled NBA worlds. No new node.
- `.github/workflows/nba-variance-research-review.yml`: scenario proof plus prior coupled/100-world regression suites.
- This audit and research-fork capability map. No third-party repo code, data, secrets or remote automation installed.

## Reconciled first-party assets (observed via connected GitHub)

| Repo path | Ownership | Existing verified limit | Reuse plan |
|---|---|---|---|
| `scripts/scout/source-contract-shadow.cjs` | SCOUT/VERIFY | Synthetic time, source, ID, leak/fallback checks | The canonical intake gate; preserve, don't fork |
| `scripts/scout/game-sense-workload-shadow.cjs` | Game Sense/VERIFY | Five-player minute/usage timeline feasibility only | Feed validated lineup exposures to prediction layer |
| `scripts/scout/nba-100-worlds-hybrid.shadow.cjs` | Game Sense | 11-game scoring paths partly *market-anchored*, scenario weights assumed | Maintain 100 readable worlds, don't equate them with calibrated odds |
| `scripts/scout/nba-causal-props.shadow.cjs` | Game Sense | Historical joint player games plus speculative role/efficiency modifiers | Baseline challenger, not primary possession truth |
| `scripts/scout/nba-rebound-opportunity-coupled.shadow.cjs` | Game Sense/Outcome Intelligence | CHA–BKN score, 2PM/3PM/FTM, missed FGA, team ORB/DRB, Sharpe PTS/REB/AST, aggregated teammates conserved in synthetic worlds | **Extend this existing module**, not a new rebounds simulator |
| `scripts/scout/outcome-intelligence-shadow.cjs` | OI/TACTICIAN | Explicit synthetic joint settlement and ticket payoff; unknown weights remain unknown | Attach only independently bounded scenario frequencies and exact package prices |
| `scripts/scout/house-mirror-shadow.cjs` | House Mirror/PRICING | Family-balanced market-only no-vig benchmark; not independent fair probability | Compare two-way exact-market prices without allowing bookmaker probabilities to train Oracle secretly |
| `scripts/scout/nba-rolling-calibration.shadow.cjs` | CALIBRATOR | Past-only, player-game basic thresholds; retrospectively selected thresholds, regime drift | Freeze prospective candidates, benchmark skill out-of-sample |
| `scripts/rill-intake/{core.mjs,index.ts}` | SCOUT/RILL | Protected endpoint exists; signed operator end-to-end and source fetch unproved | Capture signed, timely source-origin claims; never weight creators automatically |
| `command-center/{slate-engine.js,pricing.js,app.js}` | Human operator / Final Gate | Browser-local interface, backend/phone parity unproven | Future *read-only* render of validated worlds, no autonomous bet |

**Critical distinction:** team/pool conservation already exists for one pilot matchup; it does *not* prove a possession-by-possession NBA forecast or full five-man team-consistent player allocation. The model reverse-engineers feasible team FGA/FGM from a sampled final score; that is a mechanical consistency step, not observed play-by-play.

## What each NBA statistic actually needs

### Points
- Offensive possessions × on-court usage × shot opportunity mix (rim, mid-range, 3PT, FT/and-1) × opponent/defender- and fatigue-conditioned shot efficiency.
- Separate field-goal attempts and makes; three-point volume versus conversion; missed FG leads to rebound **inside the same possession** if recovered offensively.
- Defensive matchup, switch/double frequency, screen actions, pace, late fouling, turnovers and garbage-time share.
- Existing historical 2PM/3PM/FTM decomposition is the local baseline, but **shot quality, shot location, defender attribution and teammate substitution are unobserved**.

### Rebounds
- Player on-court minutes × opponent **missed** shots (+ own missed shots for offensive boards) × contested/deferred opportunity × matchup/box-out position × recovery share.
- Don't count every missed shot as an independent new possession. Never give two rebounders the same physical board.
- Available: team- and Sharpe-level historical rebounds, source-conditioned pool allocation. Missing: real NBA player tracking `REB Chances` and deferral labels, 5-man contest distribution, missed free-throw rebounds.

### Assists
- Ball touches and passes × **potential assists** × receiving teammate FGA × shooter conversion.
- An assist needs a teammate made field goal; one made FG must not create more than one credited assist. Separate handoff/secondary/free-throw assists from traditional assists.
- NBA defines `Potential AST` as a pass to a teammate who shoots within one dribble, not merely any pass (https://www.nba.com/stats/help/glossary).
- Existing coupled model bounds assists by team made FG, but genuine passes/potential assists and teammate identity are **not in the input**.

### Multipliers and scripts
- Starting/bench rotation changes, foul distribution, pace/shot clock, OREB extension, turnover pressure, score margin, live timeout adjustments, opponent scheme, road/rest/travel, injuries, overtime.
- Build *causal* game scripts with actual opportunity updates; do not blindly translate storyline into a point-estimate boost.
- Outcome Intelligence should model the four-state truth table (both, A-only, B-only, neither) and higher-leg joint settlement; never multiply unverified marginals.

## Research-fork survey (read-only GitHub inspection)

| Accessible research fork | Useful capability | Decision |
|---|---|---|
| `nba-player-movements` | 2016 raw SportVU visualization: event clock, ball and 10 player positions. **Historical mechanics**, no 2026 player positions or proven redistribution rights | **SHADOW study only**; archived tracking motion ≠ current player tracking |
| `nba-machine-learning-sports-betting` | Historical team features, XGBoost/NN, separate totals/ML, time-grouped backtests, benchmark price handling | **SHADOW feature/validation inspiration**; check same-day data chronology and OU odds contamination, no model/weights import |
| `public-espn-api` | Reference schedule/play-by-play schema and source-contract failure fixtures | **Contract research only**; project states reachable endpoints do not grant API or redistribution rights |
| `sports-skills` | ESPN/NBA feed shapes, read-only canonical event/provenance examples | **Adapter design study**, not permission to scrape or a production SLA; README says personal-use third-party APIs |
| `DKscraPy` | Pricing ingestion shape only (README lists MLB/NFL scrapers) | **Do not integrate**: no NBA market coverage, odds entitlement/availability unverified |
| `ruflo` | Codex/Claude multi-agent task orchestration, CLI/harness patterns | **Engineering orchestration study**, not a predictive sports data source; no added runtime dependency |
| `MiroFish` | Multi-agent public-opinion scenario generation / counterfactual narratives | **SHADOW EDGE THIEF brainstorm only**; simulated crowds cannot become calibrated win probabilities or independent confirmations |
| `chatgpt_sports_betting_bot`, `alphapy`, `sportbook` | Potential benchmarking patterns; not individually contract-audited in this pass | **UNREVIEWED — no promotion** |

No fork has been installed into ATLAS, no third-party source is assumed licensed, and no fork is entitled to override point-in-time evidence or pricing authority.

## Provider/source readiness

1. **NBA official glossary** supplies precise *definitions*: potential assists, rebound chances (including deferred), pace, contest rates, usage, possessions, etc. A glossary is not a live data feed. https://www.nba.com/stats/help/glossary
2. **nba_api** documents candidate NBA Stats fields such as `PlayerDashPtPass` and `LeagueDashPtDefend`, but working endpoint documentation is not proof of production rights, latency, completeness or prospectively available pregame snapshots. https://github.com/swar/nba_api/blob/master/docs/nba_api/stats/endpoints/playerdashptpass.md
3. **DraftKings connected app** used in the previous phase for games and scores, not authenticated exact player-prop market quotes; do not call archived web prices user-executable.
4. **RILL Reddit and creator analysts** may find or contradict lineup minutes, but source origin and actual observation/release time must be preserved. Retweets ≠ independent evidence. Existing two contradictory 26- vs 30-minute forecasts remain SHADOW.

## Concrete Sharpe research result

Previously preserved team-coupled 12k-world case frequencies for 9+ REB:

- RESTRICTED 35.30% (24.14 mean minutes)
- MIXED 43.77% (25.84 mean minutes)
- COMPETITION 52.34% (29.26 mean minutes)
- STARTER 65.38% (29.26 mean minutes).

At *reference-only* +113: mathematical break-even ~46.95%; two of the model scenario families lose to price and two beat it. Min/max assumed span = 30.08 percentage points. To break even even under the lowest assumed scenario, the hypothetical quote would need roughly +184, **without any guarantee of real-world positive EV**. This cannot be labeled a verified betting edge because the scenario weights, 2026 roster transfer effects, and account quote are unproved.

New `nba-scenario-price-envelope.shadow.cjs` preserves that disagreement, enforces event/market/quote timestamp identity, refuses caller-self-attested executable prices, keeps `expected_value=null`, and attaches directly to the *existing* one-lead integrated slate. No extra slate engine was created.

## Minimum next work — prioritized by information gain, not test count

**P0 — independent real evidence lane (highest priority):**
- Obtain an authorized, prospectively timestamped 2026-27 feed with all relevant player box + play-by-play events and available rotation/lineup history. Verify rights, event/player/team crosswalks, missing-period coverage and event-clock vs observation-clock parity.
- Get actual pregame expected-minutes forecasts from independently timed sources; score against final minutes. Train role-transition calibration only after enough *held-out* examples; avoid choosing the best scenario after results.
- Preserve all prospectively researched picks and passes, no selective winning-example storage.

**P1 — opportunity-causal fidelity:**
- Extend *current* coupled-world engine to recover possession boundaries, offensive-rebound possession continuation, 2PA/3PA/FTA shot attempts, credited AST, source-defined rebound chances, five-player opponent defensive lineup and minute conservation; reject impossible assignments.
- First add **two adversarial real historical games** with complete play-by-play to falsify the model. No simulated quantity can replace that.
- Ensure free-throw rebounding, turnovers, team rebounds, and multi-overtime correctly settle within game-level rules.

**P2 — evaluation and expression tournament:**
- Frozen independent forecast versus no-social and minute-only baselines with chronological group splits; report Brier, log loss, calibration-by-bin, interval coverage, actual line availability, and price-adjusted returns only with actual quote receipts.
- Feed calibrated, rights-cleared Game Sense worlds into Outcome Intelligence; compare 1-, 2-, 3-leg, alternates and round-robin packages only with independently observed executable odds and confirmed sportsbook settlement rules.
- Keep KAIROS/SENTINEL rejection deterministic. No betting until Human Final Gate.

## Release decision
**APPROVE shadow infrastructure review only.** No main merge, new live crawler, public service or source-level authority. Read GitHub Actions for CI truth; passing conservation tests does not prove profitable forecasts.

**Canonical doctrine:** Truth over ego. Evidence over confidence. Quality over quantity. Knowledge over chasing yesterday's loss.
