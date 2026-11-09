# ATLAS | Production Readiness & Predictive Value Contract
Audit: November 9, 2026 (America/Chicago). Status: SHADOW, draft PR #37. No real-money wager authority.

## Target
Full NBA/NFL market census -> independent pre-price prediction -> frozen baseline comparison -> exact source-authenticated bookmaker quote -> conservative price-adjusted value -> correlated risk -> HUMAN FINAL GATE. Every category is DISCOVERED / VERIFIED / HOLD / RESTRICTED / ABSENT, with priority rationale. No forced bet. The model must beat a simple, frozen reference in held-out outcomes; matching a baseline is not automatically good.

## Actual backend audit
| Capability | Verified evidence | Readiness |
|---|---|---|
| Supabase runtime | Multiple ACTIVE functions: atlas-slate-duo-v10, atlas-site-runtime, atlas-free-sports-scout | Functions deployed; actual operator route not certified |
| Bookmaker quotes | 532 historical market_snapshots. Newest provider timestamp 2026-08-10 00:07:08 UTC. 0 execution_grade, 0 canonical_market_id, 0 classified exact period/rule matches | BLOCK |
| Paid quote intake | atlas_market_intake_controls_v15: THE_ODDS_API DISABLED, network calls false, 0 daily credits; public references MANUAL_REFERENCE, nonexecutable | BLOCK. No paid reactivation |
| Forecast models | atlas_model_registry_v1 one UNVALIDATED/DESIGN model NFL_POINT_MIDPOINT_LOGIT8_V0; 2 frozen prediction rows, 0 scored outcomes | BLOCK |
| Calibration | atlas_calibration_readiness_current WAIT_FIRST_CAUSAL_OUTCOME, 0 admissible outcomes, auto parameter promotion false | BLOCK |
| Player and market identity | HYDRA draft PR26 17/17 CI roster tests, no authenticated official source. Canonical market identity registry empty | BLOCK |
| GitHub engine | Draft PR37 adds learning adapter, source crosswalk, score/price separation, opportunity-value-engine | 123/123 CI pass, offline only |
| Editable website | Floot project c79bff86-a646-4f33-99a2-68e577d4a4c7, new /predictions page, 25 category markets, model-baseline/pricing/risk UI | Floot 5 spec files passed, typecheck clean; unpublished preview, no connected backend resources |
| Vercel | Connected Vercel list_projects returned no accessible projects. Historical GitHub Vercel status URL does not establish current access | Edit/publish ownership not proven |
| Operator auth | Production operator JWT role + 200 valid / 401 invalid route pair not verified in current pass | BLOCK |

The earlier virtual research account held $20.63 after the November 8 settlement. Do not reset the account or claim a real-money balance.

## Ranking engine in draft PR37
Pure value evaluator supports NBA/NFL game lines, player counts, alternates, quarter derivatives and valid book-specific multi-leg products. Checks official game/player identity, period and settlement semantics, price-independent model and baseline frozen before odds, prospective unique-root Brier lift, lower uncertainty bound, actual OPEN native-book market ID and price, age <=300 seconds, and portfolio root/event concentration. Returns HOLD or SHADOW_HUMAN_REVIEW_ONLY; never executes real wagers. The typed input's verified flags are not source authentication; a trusted backend must actually certify origin and timestamps.

Suggested research-only threshold policies (NOT statistically proven): 120 independent scored roots, lower 95% forecast Brier gain >0, conservative EV above 1.5%, 1% maximum illustrative paper exposure per root, 3% event exposure. Test these on chronological future cohorts; never cherry-pick or retro-fit.

## Forecast coverage and evaluation
- Moneyline / spread / total: sport-specific game outcome, margin and scoring distributions with an independently frozen team-strength baseline.
- NBA player props: minutes, opportunity, possessions, shot/rebound/assist chances and efficiency with documented lineup, opponent and uncertainty scenarios. Compare count distributions, not only mean.
- NFL player props: QB attempts, snap share, routes, targets, carries, weather, injuries and game scripts. For each-quarter and first-scoring outcomes model joint dependencies.
- Exotics and parlays: require correctly calibrated joint distributions and accepted exact sportsbook product prices. No multiplication of marginal odds as book quotes.
- Scoring: Brier/log loss for binary markets, MAE/RMSE and CRPS when appropriate for real-valued distributions, official outcome joins, out-of-time controls, calibration plots, selection bias and held-out source failures; separately assess ROI at valid quoted book odds and CLV only when source-comparable.
- Every invalid, rejected, not offered and not bet candidate remains in the learning denominator for process-quality analysis.

## Release stages
R0 EDITABLE PREVIEW — Floot Prediction Lab built and source tests passing. Not a deployed predictive system.
R1 REAL READ-ONLY RESEARCH — operator-authorized auth session + real current official roster/schedule/event IDs + freeze source evidence + true result join. Validate 200/401 permissions, no secrets exposed and actual origin/CORS. Block stale/missing data.
R2 RANKED MARKET BOARD — allowed, timestamped native DraftKings/BetMGM quotes and exact market/period rules + authenticated current model baseline comparisons + uncertainty-aware opportunity ranking; test no-bet and replay/rollback cases. No paid provider calls without prior budget authorization.
R3 REVIEWED OPERATOR PRODUCTION — merge reviewed CI, source lineage, staging e2e, alerting, proven continuity and rollback. Human Final Gate is mandatory for any real wager; no autonomous execution, model promotion or bankroll spending.

## Smallest next integration
1. Connect Floot to canonical ATLAS through an authorized, restricted read-only backend adapter (no service credentials in client). Complete the user's missing operator-role and actual protected endpoint HTTP 200/401 proof before relying on it.
2. Authenticate official event, current-season roster, market identity, native quote source/time and outcome. Join the first actual frozen predicted probability to official final; compare it to the frozen baseline, with n=1 uncertainty.
3. Build a monitored, explicitly approved quote refresh (free feeds first; no silent paid API budget). Verify no stale data passed into the ranker.
4. Compare prototype versus actual connected operator UI under its owned origin; test all 25 coverage families as present/HOLD, and publish only after safety and read-only e2e tests.

Nothing in offline CI establishes profitable sports forecasting. Production status is NOT READY until the missing live source/auth/quality gates are empirically satisfied.