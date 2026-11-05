# ATLAS 🦾 — Idea Heist IV: Deeper reverse engineering, November 5, 2026

**Status:** External-source research + original **offline** proof-of-mechanism. No commercial-provider integration, paid calls, bets, new bankroll change, production backend deployment, or validated prediction advantage. Focus NBA and NFL.

## Methodology

Study publicly documented principles only; do not reproduce proprietary code, paid datasets, licensed player images, or competitors' branding. Separate source-stated capabilities from ATLAS inventions. Every proposal needs an experiment, point-in-time evidence, adversarial failure mode, and held-out acceptance metric. Public historical model pages may be *retrospectively refitted*; they aren't timestamped pregame predictions by default.

## Eight emerging research adaptations, ranked

| Tier | External approach and primary source | Original ATLAS method | Falsification / failure mode |
|---|---|---|---|
| P0 | DARKO: recency-decay/Kalman filtering and varying weight on prior estimates (https://www.darko.app/about) | **Adaptive Oracle:** player-specific state uncertainty, minute/role priors, measured posterior updates | Walk-forward next-game NBA stat log loss/MAE versus stable rolling windows; false volatility in small samples |
| P0 | Dunks & Threes EPM: estimated player skills plus minutes to forecast team strength (https://dunksandthrees.com/about/epm) | **Roster Synthesis:** source-verified active roster and minutes-proportioned team impact | Injury-out slate metrics versus prior team-only model, ablation on inaccurate minutes/roster |
| P0 | Multiple hypothesis testing, statsmodels FDR_BH (https://www.statsmodels.org/stable/generated/statsmodels.stats.multitest.multipletests.html) and financial false discovery literature (https://academic.oup.com/jrssig/article/18/6/22/7038278) | **Discovery Guard:** account for all tried models, duplicate markets, frozen test windows; FDR diagnostics where justified | Demonstrate nested chronological holdouts, experiment lineage; cannot claim a statistically significant betting edge from adjusted p-values alone |
| P0 | scikit-learn TimeSeriesSplit chronological training/test separation (https://sklearn.org/stable/modules/generated/sklearn.model_selection.TimeSeriesSplit.html) | **Temporal Truth Audit:** test start after feature observation, training cutoff and forecast freeze | Fail if any outcome/late lineup/quote becomes a model input before prediction |
| P1 | nfl4th: fourth-down conversion, field-goal and punt decision WPs (https://nflverse.r-universe.dev/nfl4th/doc/manual.html) | **Coach Mind:** coaching-style distributions influence possessions, clock run-off and NFL fantasy/prop opportunity | Compare play-rate, total possession and fourth-down decision metrics against simple baselines; market pregame spread input may destroy independence if reused in an alleged independent forecast |
| P1 | Cleaning the Glass: garbage-time/heave filtering, halfcourt/transition splits (https://cleaningtheglass.com/) | **Context Filter:** preserve all raw NBA possessions while deriving normal-vs-blowout/late-clock views | Test whether context filters predict future minutes/efficiency, not merely retrospectively clean stats |
| P1 | NBA official tracking definitions: Potential Assists, REB Chances, touches (https://www.nba.com/stats/help/glossary) | **Opportunity Lineage:** explicit attempts/chances -> conversion efficiency -> realized props | Grade assist and rebound chances on future games; test stability vs raw L5 hit rate |
| P2 | Betfair stream API plus Pinnacle delta/line-limit documentation (https://support.developer.betfair.com/hc/en-us/articles/360000402291-Market-Order-Stream-API-How-does-it-work ; https://github.com/pinnacleapi/pinnacleapi-documentation/blob/master/GettingStarted.md) | **Event Market Tape:** append-only initial snapshot plus every observed delta, market withdrawal, quote source/latency, actual offered size | Price sequencing and replay; cannot infer DraftKings account availability or market-fill size from another venue. Exchange and sportsbook mechanics differ. |

## Surprising licensing & temporal truth warning

DARKO's terms prohibit commercial use of its charts/data/ratings without permission and do not provide blanket bulk-data or model reuse rights (https://beta.darko.app/assistant-terms). Its historical time-machine values may change after later model refits. Therefore, its methods inspire an original approach; public historical charts are **not** an independently frozen data archive or pretip proof. Keep provenance snapshots and respect licenses.

## Prototype: Discovery Guard

Original files: `scripts/research/discovery-guard.cjs`, `scripts/research/discovery-guard.test.cjs`.

Capabilities actually implemented:

- **Temporal evaluation audit:** model, market, feature and result timestamps; prohibits training/test overlap and future-feature leakage; verifies forecast freeze before game and before separate market observation. Clear HOLD rather than invisible repair.
- **Research-family multiple-testing diagnostic:** Benjamini-Hochberg p-value adjustment for a declared hypothesis family, strictly an offline statistic and only theoretically appropriate under its assumptions; ATLAS multi-market dependence requires careful validation. Never a betting-approval stamp.
- **Duplicate-market detection:** marks repeated candidate fingerprints appearing in different experimental slips; overlap does not create independent observations.
- **Probability-bound EV sensitivity:** shows nominal/lower/upper EV for a quoted American price and supplied probability interval. Returns **no edge authorization** without independent, validated bounds and human approval. A lower bound that crosses zero makes the nominal value fragile.

**Local executed result:** 32/32 Node.js offline synthetic tests passed on November 5. No real sports model, market provider, historical training or prediction validation was executed by this module.

### Illustrative fragility, no real bet

At **+100**, a model estimate of 55% yields a nominal +10% return on stake. If a credible uncertainty interval is 48–62%, the *lower-bound* EV is **−4%**, so nominally positive EV is not a robust edge. This example illustrates uncertainty; its interval was chosen synthetically, not estimated from historical ATLAS results.

### Accept/reject checks

1. Select exactly one independent future window; freeze all candidate models and tuning rules before it starts.
2. Capture every attempted experiment, not only winners; avoid treating 12/20/22 overlapping tickets as independent observations.
3. For accuracy, compare log loss, Brier, interval coverage, outcome errors and coverage/abstentions. For actual profitability, compare timestamped **account-executable** odds, stakes, net outcomes and later prices where available.
4. Log all source access rules/attribution; do not ingest restricted private data or copy proprietary source.
5. Only promote through human Final Gate after fresh prospective validation and meaningful out-of-sample improvements.

### Chain fit

SCOUT obtains data; FILTER/VERIFY preserves timestamp/identity; ORACLE creates a frozen model; EDGE THIEF audits uncertainty; PRICING checks exact markets; **DISCOVERY GUARD** sits inside CALIBRATOR/FORENSICS and prevents self-deception when comparing many candidate methods. It should *not* become an autonomous betting veto or another opinion engine.

The next measurable NBA experiment: current rolling player-stat baseline vs Adaptive Oracle on the same pre-registered future player/event set, with separate minutes forecast MAE and stat error/coverage. The next NFL experiment: include fourth-down/pace assumptions only if input independence from comparison odds is documented; otherwise label the model market-assisted.