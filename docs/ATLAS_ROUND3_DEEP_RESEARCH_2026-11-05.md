# ATLAS 🦾 — Round 3: Deep Market, NBA and NFL Research

**Date:** 2026-11-05. **Stage:** LAB / SHADOW. **Scope:** Independent competitive-method research, NBA/NFL forecasting and price-integrity design. No sportsbook actions, paid API calls, model promotion or production deployment.

## Executive decision

The highest-leverage approach is to build an original, observable **Evidence-to-Price-to-Outcome system**. We should not buy more pick signals, blindly copy proprietary UIs, or treat a sportsbook's public reference quote as an executable account offer. The major new findings are in (1) opportunity-level basketball data, (2) drive-based NFL data, (3) timestamp and price-lifecycle evidence, (4) model calibration, and (5) blinded testing. Research ideas enter SHADOW before any software integration, and the Human Final Gate remains necessary for real-money execution.

## Discoveries — product/source → original ATLAS subsystem → acceptance experiment

| # | Source/method | What is actually documented | Original ATLAS subsystem | Test/failure gate | Prioritization |
|---|---|---|---|---|---|
| 1 | PBP Stats API | On/off, five-player lineups, possession search, assist network, playing-time distributions | **Possession DNA**: reconstruct possessions and role-conditioned chances | Event-identity check; only features observable before cutoff; compare forecast Brier/MAE vs current baseline | P0 data research |
| 2 | CourtIQ / on-off methodology | Teammate absences and minutes/usage rates; small lineup samples warned | **Rotation Shock Engine**: expected minutes, possessions and usage redistribution | Sample-size shrinkage, no treating on/off as pure causal effect; ablation under real late scratches | P0 |
| 3 | NBA official tracking glossary | Potential assists, rebounding chances, touches, passes, matchup stats, pace | **Opportunity Funnel**: minutes→chances→conversion distribution for assists/rebounds/points | Test projected opportunities and actual thresholds independently on future games; log missing tracking coverage | P0 |
| 4 | nba_api endpoint guide | PlayByPlayV3, GameRotation, player matchup/usage tracking; old V2 endpoints removed or unavailable for recent seasons | **NBA Adapter Health Gate**: endpoint version, coverage, schema, failure modes | 7+ edge-case fixture tests; reject silently empty V2 response; report official roster check availability | P0 |
| 5 | nflverse/nflreadr | Historical game-level play-by-play, EPA and player/team stats; refresh schedule; some participation feeds released after season | **Drive Engine**: plays, dropbacks, target share and game-script world | Pre-week game models vs actual drives/plays on chronological held-outs; exclude unavailable future participation features | P0 NFL research |
| 6 | NFL Big Data Bowl 2026 | NFL tracking datasets, submitted counterfactual, coverage and player-separation research | **Route & Coverage Lab**: test route geometry, air yards, separation under coverage | Offline study only; licensing and live-feature availability must be validated; no claiming live NGS feed | P2 |
| 7 | SpankOdds | Book opener alerts, limit-change alerts, directional moves, odds screen | **Opener & Limit Watch**: detect markets opening and changing limits | Record first observed time, source, event, posted limit if legitimately accessible; test against later decisions | P1 |
| 8 | SockOdds history | Distinguishes `opened`, `changed`, `withdrawn` quotes; no row means unchanged, not a data gap | **Quote Lifecycle Ledger**: never resurrect withdrawn prices | Fixture for open→change→withdraw→reopen; `withdrawn` never considered executable | P0 |
| 9 | The Odds API historical | 5-min timestamped historical market snapshots incl. player props; paid and quota-limited | **Time-Machine Replay**: same cutoff for forecasts/odds/rosters | Temporal leakage suite, source freshness, separate observation and availability timestamps; no paid calls without approval | P0 design, paid hold |
| 10 | Unabated API concepts | `data.lastUpdated` may represent the newest included line, not freshness of all lines | **Per-Line Freshness**: old prop cannot borrow a newer board timestamp | Verify independent line/source timestamp; stale and null remain explicit | P0 |
| 11 | Betfair exchange API | Back/lay depth, amounts available at price, last traded price and traded volume | **Liquidity Lens**: effective fillability, fees, price depth, account constraints | Compare nominal vs realizable prices; this is a transferable concept, not an assertion that Betfair is available to this user | P2 |
| 12 | Betwatch movement study | Source-first vs market-follow-through differs by book; observed lead rankings sensitive to polling intervals and small windows | **Lead-Lag Lab**: determine which source leads *per sport/market/time* | Build source-poll cadence normalization and randomized lag placebo; no blanket claim 'Pinnacle always leads' | P1 |
| 13 | Betwatch public line-movement page | Example Nov5 JAX ML opener +115 alongside JAX spread opener -9.5; likely inconsistent same-time market evidence | **Cross-Market Consistency**: flag large favorite/underdog contradictions | Research heuristic only; verify source timestamps and game identity before calling data wrong | P0 |
| 14 | Bet2Invest | Strategy-builder and historical Pinnacle opening/closing-line backtests, with auto-execution features (which ATLAS will not copy) | **Rule Arena**: DSL for hypothesis definitions and time-travel replay | Freeze logic before testing; nested temporal validation; compute payoff at prices actually available at the decision time | P1 |
| 15 | Economic Inquiry (2025) news response study | 117,174 odds, 32 books; delayed/complex reactions to absence announcements in European soccer | **News-to-Price Event Study**: time around NFL/NBA verified injury news | Record published/observed/book-change times; event controls, no assuming soccer effect transfers to NBA/NFL | P1 |
| 16 | Machine Learning with Applications (2024) | NBA sports betting study suggests calibration can matter more than top-1 accuracy in their study | **Calibration Arena**: chronological Brier, log loss, ECE, reliability, interval coverage, price-conditioned ROI | Replay with independent chronology; paper's reported single-season ROI not reproduced or production proof | P0 |
| 17 | Oxford Economic Papers (2026) | Favourite–longshot bias study compares 150k+ European soccer games, competition effects | **Market Bias Lab**: test odds-band residuals and implied-probability calibration | Hold out NBA/NFL by date/book/market; avoid importing soccer conclusions directly | P2 |
| 18 | Prior World Forge | Correlated game-script scenario model offline synthetic tests | **Conditional Joint Distribution**: simulate leg interdependence with shared minutes/pace/score | Calibrate marginals and joint co-hit rates vs held-out games; quantify SGP independence error | P0 research |

## One concrete integrity alarm from November 5

A publicly displayed Betwatch line-movement page lists Jacksonville at Baltimore with opening moneyline JAX **+115** while an adjacent opening spread reads **JAX -9.5**. If those represent the same event, book/consensus and timestamp, the favorite/underdog signals sharply conflict. This is not proof that the site is 'wrong'; *time/window/source mismatches can explain it*. The ATLAS takeaway is to implement cross-market temporal identity checks and quarantine contradictions until reconciled. Never use a visual table's 'open' label as proof that all fields are simultaneously sampled. Source: https://betwatch.io/line-movement-tracker

## Where we can actually innovate, rather than imitate

### NBA: forecast the process, not only the box score

For assists: estimate the player's minutes and on-court possessions, possible passes, potential assists and teammates' conversion under opponent coverage. For rebounds: estimate minutes, opponent miss volume, rebound chances, share and conversion; split offensive vs defensive chances. For points: estimate minutes, touches/usage, shooting attempt distribution and free throws. In all cases use a mixture over game scripts and minutes states (e.g. close/normal, blowout, foul trouble). The statistical objects must remain estimable from legitimately accessible data with uncertainty intervals and prospective baseline comparisons. A 'last five hit %' remains descriptive only.

### NFL: forecast drives and opportunities

Build distributions for team drives, plays per drive, pass rate over expectation, target opportunity, intended air yards, red-zone visits, and TD distribution conditional on game state. A receiver's catch projection should depend on QB/pass attempt availability, route participation, target allocation and catch probability, not just receiving yards last week. Tracking-only methods stay offline if NGS licensing or event availability is unresolved.

### PRICING: separate a good forecast from an attainable bet

Each quote has event_id, market type, line, side, sportsbook, `first_seen`, `line_changed_at` (if known), `source_observed_at`, `market_withdrawn_at` (if known), `operator_verified_at`, `accepted_price_at`, `price`, `maximum_available` (if known), and `source_authority`. Missing values remain null. Compare identical alternate lines and independent fair probabilities; include fee/hold and probability uncertainty. Market snapshots can be stale even when the enclosing response has a recent `lastUpdated` value. A bet exists in the real ledger only after human confirmation.

### Opportunity-quality and correlation research

A 20-leg all-hit ticket can be undermined by just one weak threshold (Nov4 Maxey 19 vs 20), or a correlated availability failure (Tatum rested, Jalen Johnson out). HYDRA must count unique marginal opportunities, scenario-specific co-hit probabilities, and shared failure roots. A reported 20-leg payout without genuine current combined odds is not a verified profit estimate.

### Experimental economics: detect slow market assimilation, not 'smart money' vibes

Use verified player news timestamps and 1m/5m/15m movement windows with placebo controls. Test source lead/lag after correcting polling intervals. A movement without explanation remains a movement; it is not a guaranteed informational edge. Avoid inferring sharp-money flow without reliable handle, limits and direction.

## Five decisive prospective experiments

1. **Opportunity Model Race (NBA):** freeze at least two pre-price projections per player — historical rate baseline vs opportunity/minutes+lineup model. Use all eligible players, not only best-looking selections. Grade continuous stat forecasts (MAE/quantile loss), threshold Brier/log loss and calibration; slice by injury, matchup, starter status and minutes surprise. No retroactive filters.
2. **Drive Engine Race (NFL):** compare season-average props to game-script and EPA/play-volume forecasts. Enforce kickoff freeze and feature availability. Model outcomes with drive counts and non-independent play rate/target share. Record null for unavailable participation datasets.
3. **Quote Integrity & Decay:** shadow record 200 exact market quote observations where source terms allow; independently check same-side/line price 1/5/15 minutes later. Score availability, median observed lag, withdrawals, and contradictions. No bet execution.
4. **News Event Study:** collect injury announcements prospectively with timestamps; compare influenced games and control games using before/after odds and game-state changes. Record multiple hypothesis testing and never import 2025 European soccer findings as NBA edge without replication.
5. **Market vs ORACLE vs World Forge:** frozen no-vig baseline, independent ORACLE, calibrated ORACLE and joint-world model on identical future samples. Report independent Brier/log loss, tail threshold calibration, joint hit calibration, realized CLV where available, and bankroll ROI only for actual settled wagers. Model selection may be after evidence, but promotions only on subsequent samples.

## Hard constraints and bottlenecks

- Existing DraftKings sports data connectivity does **not** establish sportsbook account quotes or an executable market API.
- `nflreadr::load_participation` indicates 2023+ participation data are typically released after the season; do not use future data in current-week predictions.
- `nba_api` notes some V2 endpoints are unavailable for current seasons; don't silently fallback to empty stats or unsupported official endpoints.
- PBP Stats API/docs availability is not evidence of permission to bulk redistribute or consume without limits. Respect all data licenses and API terms.
- Historical pricing on The Odds API is paid; do not spend credits or imply available snapshots without a real retrieved receipt.
- Betfair liquidity insight is general market research, not a recommendation to use unavailable exchanges.
- A winning case in published research is not transferable proof for ATLAS. No automatic model promotion or autonomous real wagering.
- Treat rights responsibly: learn from public product behaviors and published methodologies, build original code/UI, don't extract copyrighted software, bypass paywalls, scrape without authorization, or reuse protected assets.

## Practical build order

**P0 now:** (i) market consistency/freshness/lifecycle diagnostics in SHADOW; (ii) NBA possession/lineup/source adapter coverage tests; (iii) NFL feature availability matrix; (iv) standard forecast packet including independent distribution, evidence freeze and nulls; (v) HYDRA common-failure scoring.

**P1 after P0 passes:** (vi) injury→minutes/usage event study; (vii) source-level line movement/quote decay; (viii) user-facing research cards with source inspection; (ix) chronological model competitions.

**P2 after verified data access:** (x) exchange-style effective price, (xi) NFL tracking-based coverage models, (xii) alternate-line surface fitting, (xiii) possible public-market bias experiments.

## Primary sources inspected

- PBP Stats API: https://api.pbpstats.com/docs
- PBP Stats python project: https://github.com/dblackrun/pbpstats
- RotoGrinders CourtIQ: https://rotogrinders.com/pages/courtiq-by-rotogrinders-tutorial-faq-learn-more-1504403
- NBA tracking glossary: https://cdn-uat.nba.com/stats/help/glossary
- NBA endpoint guide: https://github.com/swar/nba_api/blob/master/docs/nba_api/stats/endpoint_guide.md
- nflverse data: https://nflreadr.nflverse.com/articles/nflverse_data_schedule.html
- NFL participation release: https://nflreadr.nflverse.com/reference/load_participation.html
- NFL Big Data Bowl: https://www.kaggle.com/competitions/nfl-big-data-bowl-2026-analytics
- SpankOdds: https://www.spankodds.com/index.html
- SockOdds history: https://sockodds.com/docs/examples/line-movement/
- The Odds API history: https://the-odds-api.com/historical-odds-data/
- Unabated docs: https://docs.unabated.com/guides/response-concepts
- Betfair Exchange docs: https://support.developer.betfair.com/hc/en-us/articles/6540502258077-What-Betfair-Exchange-market-data-is-available-from-listMarketBook-or-Stream-API
- Betwatch leading books study: https://betwatch.io/blog/which-sportsbooks-lead-line-moves
- Betwatch market example: https://betwatch.io/line-movement-tracker
- Bet2Invest: https://strategies.bet2invest.com/en-us
- Economic Inquiry injury odds (2025): https://onlinelibrary.wiley.com/doi/10.1111/ecin.13258
- NBA betting calibration (2024): https://www.sciencedirect.com/science/article/pii/S266682702400015X
- Scikit-learn calibration: https://scikit-learn.org/stable/modules/generated/sklearn.calibration.CalibratedClassifierCV
- Oxford favorite-longshot bias (2026): https://academic.oup.com/oep/article/78/1/90/8244336

**Artifact truth:** Research and proposal; no real-game modeling or remote provider integration executed in this particular round.