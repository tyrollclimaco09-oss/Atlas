# ATLAS — Oct 21 NBA Full-Variance / Positive-EV Search Audit

**Status:** 2026-10-21 PREGAME SHADOW research, NOT independently calibrated, NOT betting authority.  
**PR:** https://github.com/tyrollclimaco09-oss/Atlas/pull/11 (draft).  
**Study:** NBA full-game 100 Worlds + real player-history causal prop variance + social-signal disagreement reconciliation.

## What is actually implemented and executed

- 11 official DraftKings NBA fixtures scanned; 30 NBA 2025-26 historical team ORtg/DRtg/PACE records reconciled.
- 12,000 simulated outcomes/game = 132,000 shadow game outcomes; 100 10x10-stratified readable worlds/game = 1,100 representative worlds.
- Luka: all 64 2025-26 season game lines verified against season totals; joint PTS/REB/AST/3PM bootstrap, optional role/market-weight sensitivity, 2x2 PRA 50+ versus 4+ threes.
- Four additional players' 2025-26 regular-season full game logs (Sharpe 62, Bam 73, Johnson 72, Barnes 80), including removal of accidentally included April playoff games and reconciliation to official season totals.
- 20,000 conditional draws/player x four = 80,000 additional shadow player scenarios. Inputs include historical joint stat vectors, expected workload, blowout, foul trouble, pace, rebound share / missed shots, assists-conversion and usage perturbation.
- Chronological past-only 2025-26 basic-market calibration (42-60 holdout games/athlete) and Brier benchmark; thresholds selected in hindsight, and 2026 conditions differ. Tested new simulation has NOT shown a prospective calibrated edge.
- Integrated one-call runner `scripts/scout/nba-integrated-100worlds.shadow.cjs` combines games, props, checks and a one-lead research thesis. Selected bet is **null** and bet_authority false.
- Automated GitHub CI tests for existing RILL authorization, NBA 100 Worlds, causal prop input validation and integrated slate. All checks passed on review branch; not deployed to Command Center or main.
- Existing Supabase shadow Human Signal tables hold two new contradictory projections about Day'Ron Sharpe: one external analyst ~30 min; one fantasy projection ~26 min. Verified direct database write/readback; **not** an end-to-end authenticated Edge Function smoke.

## Price-specific research (quotes NOT verified operator-executable)

| Player expression | Third-party reference quote | Break-even | Conditional model frequency | Model verdict |
|---|---:|---:|---:|---|
| Day'Ron Sharpe >=9 rebounds | +113 | 46.95% | 43.65% | PASS under default |
| Bam Adebayo >=9 rebounds | -156 | 60.94% | 50.76% | PASS |
| Jalen Johnson >=40 PRA | -108 | 51.92% | 46.27% | PASS |
| Scottie Barnes >=6 assists | -139 | 58.16% | 47.98% | PASS |
| Luka Doncic >=50 PRA | -101 | 50.25% | 48.95% | PASS |

**Do not use these as real-value estimates.** Each model frequency depends on uncalibrated assumptions and compares to mutable third-party odds.

### Sharpe conditional uncertainty

- 62 last-season games: 413 total rebounds in 1,159 individually rounded minutes; ~6.7 rebounds per game in ~18.7 minutes. Historical 9+ rebounds in 14 of 62 games.
- Confirmed prospective starting-center role following Nic Claxton trade, but starter title is NOT a 30-minute guarantee.
- External Action Network analyst Erik Beimfohr projects "30-minute range"; different Fantasy Edge 2026-27 season expectation is 25 minutes/game; NBA Fantasy Edge depth board earlier showed ~26.
- Recent preseason exhibited foul trouble (5 fouls in 17 minutes, Oct 14) and a shoulder-related missed exhibition followed by 21-minute return.
- 12k-outcome conditional scenario: 20/24/28-min mixture, rebound share 0.88 -> 29.8% reach nine; default 22/27/31, share 0.91 -> 43.6%; 27/30/33, share 0.95 -> 56.3%; same extended minutes but share 0.87 -> 49.7%. These assumed mixtures are NOT empirically calibrated.
- At +113, break-even 46.95%; the sign of assumed EV flips from negative to positive depending on unproven workload/rebound-share assumptions. Thus NO BET qualification.
- Opponent Hornets feature new personnel and altered possession/rebound opportunity; prior years' defensive allowances are not contemporary lineup facts.

Evidence:
- https://www.netsdaily.com/nets-game-previews/114999/nets-vs-hornets-opening-night-and-the-dawn-of-a-new-era
- https://staging-aws.sports.yahoo.com/articles/nba-player-props-6-best-174339663.html
- https://fantasyedge.co/players/dayron-sharpe
- https://www.cbssports.com/nba/players/3177612/dayron-sharpe/
- https://www.statmuse.com/nba/ask/dayron-sharpe-stats-in-2025-26

### Calibration diagnostic (lower Brier better)
| Market | Sample | Past-smoothed | Minute Poisson | Blend | Neutral .50 |
|---|---:|---:|---:|---:|---:|
| Sharpe 9+ REB | 42 | .2358 | .2316 | .2301 | .2500 |
| Bam 9+ REB | 53 | .2018 | .1889 | .1956 | .2500 |
| Johnson 40+ PRA | 52 | .2436 | .2395 | .2364 | .2500 |
| Barnes 6+ AST | 60 | .2587 | .2613 | .2586 | .2500 |

Historical thresholds were chosen after seeing the prior year; these diagnostics measure a limited forecasting setup, not an audited profit edge.

## What must be added before claiming the "every angle" goal is complete

1. **Full live rotations**: five-man on-court timeline, substitutes, minutes availability and foul count; player-level team-minute conservation and injury/time caps. Initial individual models do not jointly conserve all five on-court player allocations.
2. **Shot volume / quality**: true 2PA/3PA/FTA, expected free throws, shot zones and shot creation vs defender. Current points bootstrap uses historic point outcomes with hypothetical usage changes, not shot-level full simulation.
3. **Rebound opportunity engine**: actual opponent misses, ORB chance/contested rebounds, shot-location rebounds, box-out role, positional lineup and team rebound-sum consistency; current player rebound-share is assumed.
4. **Assist opportunity engine**: potential assists from real play-by-play passing / catch-and-shoot teammate conversion, shift with teammates and turnover/scheme pressure; current assist perturbation is approximated.
5. **Possession-level team simulation**: unified game-level causal distributions linking players to total points, possessions and rotation states; current team and player simulations are not fully coupled. Avoid calling frequencies standalone fair prices.
6. **RILL evidence grading and source provenance**: distinguish firsthand verified news, republished echoes, analyst forecasts, and crowds. User account price and DraftKings market rules must be fresh, account-visible, and timestamp-matched.
7. **Calibrator prospective held-out validation**: choose test slate, freeze all inputs and threshold searches, score Brier/log loss/interval coverage versus existing no-social, simple-minute models; report selections and passes; verify measured calibration and CLV before promoting.
8. **Sentinel/Human Final Gate**: no chasing losses, no automated bets; social not a probability nudge, forecast uncertainty cannot be ignored.

## Decision

**KEEP: Sharpe rebound workload as the ONE research lead, but price-expression PASS TODAY at displayed +113 until independently verified 29-30 minute rotation projection + acceptable rebound share + current DK account quote.** The other four assessed overs do not meet even model baseline break-even. No recommendation to stake real funds was authorized or executed.

No merge to main. No price/odds account authorization. No actual profitable EV established. Simulation test success proves reproducibility and basic integrity, not forecast accuracy.
