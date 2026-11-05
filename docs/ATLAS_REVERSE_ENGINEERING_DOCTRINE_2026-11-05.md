# ATLAS 🦾 — Reverse-Engineering-to-Original-Invention Doctrine

**2026-11-05 | LAB / SHADOW only**

## Directive

**Observe → Decompose → Hypothesize → Clean-room implement → Falsify → Compare against baseline → Archive → Human-authorized promotion.**

External products are research stimuli, not ATLAS truth. We can study publicly described concepts and accessible interaction patterns, then make **original, independently engineered** implementations. Do **not** copy proprietary code, private datasets, branding, protected media, credentials or restricted provider outputs. Comply with provider terms and data licenses. Do not claim that an external product's quoted accuracy or EV is verified.

## Reverse-engineering protocol (one evidence packet per feature)

| Field | Required evidence |
|---|---|
| Observation | Publicly accessible feature, user-provided screenshot, dated source URL |
| User job | What decision or research friction does it address? |
| Mechanism hypothesis | General quantitative/statistical method that could explain it, explicitly unconfirmed |
| Original implementation | New algorithm, data schema, unit tests and version |
| Adversarial challenge | Strongest failure mode; what would falsify value? |
| Comparator | Frozen ATLAS version, market-only baseline or simple alternative |
| Leakage check | Forecast frozen before relevant price/outcome and outcome data excluded from training |
| Metrics | Forecast calibration/Brier/log loss, margin/prop error, decision-quality EV with genuine prices, CLV, latency, root-cause correlation |
| Proof state | IDEA / BUILT_OFFLINE / VERIFIED_BACKTEST / PROSPECTIVE_VALIDATION / LIVE_READ_ONLY / PROMOTION_APPROVED |
| Authority | Human Final Gate on live bets; explicit approval before architectural promotion |

## Six mechanisms to adapt and independently test

1. **Game-script worlds (SaberSim concept)**: Represent distinct tempo/rotation/blowout/injury worlds; within-world player outcome models, weighted total probabilities and distributional correlations. Requirement: calibrated world weights and joint player observations across a held-out period. Synthetic-only demonstration added below.
2. **Rotation/opportunity engine (FantasyLabs on/off and game-flow concept)**: Estimate minutes → touches/usage → events → points/rebounds/assists rather than points-only priors. Validate injury substitutions against official play-by-play with point-in-time lineups; account for nonrandom player substitutions.
3. **SGP correlation checker (DarkHorse Odds conceptual inspiration)**: Compare weighted joint chance vs naïve independence, but market comparison must use an actual jointly executable quoted price; bookmaker pricing and event rules differ.
4. **Line-age detector (SharpStack and Unabated inspiration)**: Separate update times for individual market price, bookmaker event, overall board and ingestion. A fresh board is NOT a fresh price. Test alert-to-accepted-quote latency.
5. **Steam move skeptic (Sports Insights conceptual inspiration)**: Flag abnormal market movement and search for corresponding news. Do not label a move 'sharp' without signed provenance and out-of-sample validation.
6. **Settlement feedback loop (Pikkit, Juice Reel conceptual inspiration)**: Keep actual slips, account settlement, parlay dependency graphs, and unrealized paper experiments separate. Deduplicate shared misses across HYDRA cards.

## Executable first prototype: World Forge

- Source: `scripts/research/world-forge.cjs`
- Offline tests: `scripts/research/world-forge.test.cjs`
- Test command: `node scripts/research/world-forge.test.cjs`
- Tests executed: **23/23**, no network/provider/API calls, no actual pricing, and no external or proprietary algorithm code.
- The program computes weighted joint-event probability from a user-defined set of abstract worlds and conditionally independent per-leg hit probabilities. It displays marginal rates, pairs, covariance/correlation and the independence-vs-world gap, plus a sensitivity comparison. **Assumptions are supplied inputs, not inferred from live games or trained probabilities.**
- Synthetic example: two worlds equally likely; two events each hit with 80% probability in one world and 20% in another. Each marginal is 50%, but the conditional-independent-within-world joint is 34%, not 25%; a +9pp gap. With opposite event responses to the worlds, joint = 16%, a −9pp gap. This shows why SGP probabilities cannot be multiplied uncritically.

## World Forge research acceptance / what remains unproven

- [x] Original algorithm and tests run locally offline.
- [x] Hard validation of input world weights, conditional hit rates, duplicate IDs and required point-in-time research provenance.
- [x] No code path to place bets or claim an executable price or proven positive EV.
- [ ] Source verified possession/player rotations and historical play-by-play inputs.
- [ ] Fit scenario weights on a training window, freeze before game/market, and validate temporal holdouts.
- [ ] Compare calibrated unconditional and conditional distributions to independent and market baselines.
- [ ] Explicit within-world dependence or richer empirical multivariate distribution where conditional independence fails.
- [ ] Quote a valid same-game parlay at DraftKings or another book *with timestamp* before EV or realized ROI assessment.
- [ ] CI/Command Center/backend integration proof, review and approval.

**No promotion:** This is a clean-room research artifact. Keep the original ATLAS canon and all prior frozen November 4 receipts untouched.