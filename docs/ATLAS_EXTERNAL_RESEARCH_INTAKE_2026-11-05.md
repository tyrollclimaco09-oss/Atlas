# ATLAS LAB — External Sports Research UX/Methods Intake (2026-11-05)

**Status:** SHADOW / research proposal only. Input: ten operator-supplied screenshots of a third-party sports-analysis app, viewed 2026-11-05 (time shown in screenshots 02:38–02:48). This is not a live provider integration, confirmed data feed, vetted model, verified odds, licensed design source, or production implementation. All screenshot figures are examples to investigate rather than external ground truth. Do not copy proprietary UI assets, software, images or branding.

## Evidence we actually observed in screenshots

- Home navigation: today's cross-sport board, Best Plays, Smart Money, Build a Parlay, Analyze Props, Analyze Games, Player News, Player Profiles, Scan a bet slip, conversational follow-up.
- A Nov 6 NCAAF USF +2.5 (-110) research explanation attributes a 55.7% cover probability, a 0.4-point projected opponent advantage, plus a matchup, trends and game-script breakdown with contradictory factors (schedule strength 133 vs 95). No verifiable model provenance, distribution, training/evaluation timestamps, bookmaker execution price or market-availability receipt was shown.
- Props screen: search/league/market filtering (PTS/REB/AST/3PM/STL/BLK), list of hit rates over short lookbacks, opaque matchup scores, book-style quote, market side, game start and player portraits. Example Podziemski O16.5 PTS: 83% last six (only 5/6 descriptive). The 75% last four line is just 3/4, not a calibrated predictive probability.
- Player card: example Jalen Green U19.5 points+rebounds at -108, estimated 52.3% probability and '+0.4% edge', after comparing opponent defense and last-five hit indicators. Another Stephen Curry O32.5 points+assists example discusses opponent three-point rate. These model scores, player identities/teams and prices were **not independently verified**.
- Game analysis: 7 bookmaker labels and two NBA game cards with side/spread/total quotes, plus 'no model edge'. Book-specific timestamps or true offered/accepted pricing were not shown.
- Parlay flow: future schedule, explicit 'lines pending', swipe cards, quick generate and notification. A future card lacking a combined price is not an executable wager.
- News flow: injuries / latest statuses; text says 'updated just now' with individual player reports marked '5h ago'. This highlights the need for observed_at, source_published_at, effective_at and lineup-confirmed-at, rather than a single freshness badge.
- UI is dark navy/cyan, card-based, expandable sections with clear sports/market filters. Extract interaction patterns, do not replicate visual assets/branding.

## Two exact math checks (illustrative only)

1. USF +2.5 at -110: break-even p = 110/210 = **52.381%**. Screenshot modeled p 55.7% implies nominal gap **+3.319 percentage points**, and EV on a one-unit stake = 0.557*(100/110) - 0.443 = **+0.063364 units** or **+6.34%**. This is only a hypothetical *if* the independent 55.7% forecast is trustworthy, correctly event/line-linked and genuinely pre-market. A 3.3pp gap alone cannot substantiate an edge.
2. Jalen Green under example at -108: break-even p = 108/208 = **51.923%**. Screenshot p 52.3% implies **+0.377pp** and nominal EV **+0.73% stake**. That tiny gap is easily consumed by probability uncertainty or line movement, particularly with no model validation. The screenshot's '+0.4% edge' likely means percentage points; it should not be conflated with return on stake. A 4/5 hit record ('80% L5') is *not* an 80% forecast; 5/6 ('83% L6') likewise.

## Features to bring into ATLAS: prioritized

P0 — Necessary evidence before usability:
1. **Evidence first**: Capture event, selection, threshold, book, quote timestamp, actual account-available price, roster proof and frozen independent forecast, plus model version and source/effective timestamps. Missing quote remains null.
2. **EV calculator with uncertainty**: Display nominal break-even and estimated model p with uncertainty; report p-gap and return-on-stake separately. Require out-of-sample calibration and reject price-driven circular forecasts. Do not use 'favorable' without displaying uncertainty and model-provenance status.
3. **Explicit NO_EDGE vs NO_MODEL vs WAIT_PRICE vs INJURY_HOLD**, all separately available; the visual 'no model edge' badge conflates cases if not supported.
4. **SENTINEL exposure graph**: sum each real-money parlay stake across every dependent selection/event. Show correlated exposures and duplicate risk. Preserve existing paper selections and result grades.

P1 — High-value UX:
5. **Matchup proof cards**: 5 accordion layers — matchups, form/strength-of-schedule, roles+availability, game-script worlds, adversarial countercases. Each claim links to a source/timestamp; separate explanatory evidence from model features to avoid double-counting.
6. **Market-wide research table**: Sport, game, player, side, threshold, multiple book quotes and freshness, hits in last 5/10/20 (numerator/denominator), minutes/opportunity, opponent context, confidence interval, model version. Avoid ranking purely by small-sample hit%.
7. **Bet-slip scan**: Extract operator-supplied receipt, reconcile actual stake/accepted odds, event player identity and duplicates, then validate/grade. User screenshots are not automatic wager authorization.
8. **Paper-first parlay studio**: Select eligible legs, retain original individual timestamps, canonical game grouping and correlation; 2/4/8/12/20 paper structures; track price and potential payout only if verified.

P2 — Optional discovery/research:
9. **Smart Money**: only with provider-specific, trustworthy handle/bet splits, timing, bet limits, and movement. High reported professional share is not causally verified sharpness; compare against price and forecast out of sample.
10. **Dynamic dashboard news**: split true event times, ingest times, effective times and stale flags; include statuses for unavailable/missing reports.
11. **Natural language follow-up in-context**: 'What breaks this thesis?', 'Show source and forecast before odds', 'How would a +2pt move affect EV?', 'Build 8/12/20 paper slips' and 'Show correlated exposure'.

## Challenge protocol / experiments

E1 — **Reliability challenge**: 100 independent event-market snapshots, freeze model predictions *before* odds, compare against no-vig market baseline and strong simple model. Evaluate Brier, log loss, calibration bins, decision-specific realized ROI when true executable quotes exist, closing-line movement, and temporal holdouts. Do not claim statistical power in advance.
E2 — **Hit-rate illusion**: compare last-5/last-10 rule vs opportunity/minutes-adjusted baseline. Run frozen prospective and temporal out-of-sample; if hit-rate ranking fails, keep as descriptive feature only.
E3 — **Matchup score challenger**: test possession, defensive scheme, opponent strength, pace, usage, starter changes, and adversarial removal of weak features. Use ablations to show incremental value, not circular narratives.
E4 — **Parlay fragility test**: compare independent slip selection vs root-cause exposure-balanced selection using the same slate and prospectively frozen odds; compare all-leg hit rates, concentration, cancellation/DNP fractions, theoretical price availability, and valid book ROI separately.
E5 — **UI operability**: instrument number of actions to verify a selection, retrieve source receipt, or amend selection without changing immutable forecasts. Trace real-origin auth and current Command Center contract before deployment.

## Guardrails / promotion

Keep NBA+NFL first. Third-party screen is an idea submission, not evidence that the provider is accurate. Use our own original interface, legitimate sources and no harvested intellectual property. Paper experimentation can run while price unavailable, but always show it as research. No real wagers without user Final Gate. No production backends/weights/deployments changed by this intake. Preserve originals and add app-sourced hypotheses only in SHADOW until independent evidence beats baseline.
