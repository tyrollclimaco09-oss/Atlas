# ATLAS — October 22 standard slate: 100 × 250 simulation shadow checkpoint

**Authority: REVIEW_ONLY_SHADOW. Not Golden Slate, not final gate, no wagers, no production promotion or Supabase writes.**

## What actually ran
- **100 structured scenario-based slate passes**, each running **250 stochastic outcomes for each of three games** (CLE@PHI, DEN@OKC, NE@CHI).
- **25,000 simulated three-game slates = 75,000 game outcomes** and **35 candidate/game-market outcomes** evaluated across passes.
- Reproducible seed: `202610221137`; candidate sensitivity CSV SHA-256: `83892114ae2f6b5150e5e70757a4959bd704ad0af032f3a9f0e407869f19688c`. Second replay produced an identical checksum. Structural/semantic assertions passed.
- Synthetic **sensitivity experiment**, not 100 live SCOUT/bet cycles, not statistically independent match outcomes, not calibrated win probabilities and not proven EV.

## Data integrity
- NBA official report October 22 11:30 ET: Jarrett Allen QUESTIONABLE, Spencer Jones QUESTIONABLE, Dominick Barlow OUT, Julian Strawther OUT, other absences. https://ak-static.cms.nba.com/referee/injury/Injury-Report_2026-10-22_11_30AM.pdf
- Patriots official final injury report: two starting guards and three cornerbacks out; other players questionable. https://www.patriots.com/news/injury-report-analysis-patriots-rule-out-five-players-for-thursday-night-football-vs-the-bears
- Public player priors: Courtside Oct22 NBA (contains *ghost minutes for ruled-out players*), PropSims Oct21 NFL. Not calibrated or blindly imported. https://courtside.higgsfield.app/projections?date=2026-10-22 ; https://propsims.com/games/ne-at-chi/
- Competing NBA game centers: CLE–PHI Statz 115–118, older Dimers 115–118, HoopVantage ~114–114; DEN–OKC Statz 113.5–120.9, Dimers ~114–120, HoopVantage ~110–117. Model/data-source independence is unknown.
- Connected ATLAS RILL source ledger has 10 releases, newest Oct21; *none are qualified fresh Oct22 signals*. Today's Reddit hypotheses were modeled as **opposing synthetic stress branches**, not predictive votes: equal exposure to PHI/CLE narratives, Jokić scoring/OKC pressure, Bears/Douglas/NE countercase. https://www.reddit.com/r/sportsbook/comments/1xc7sby/nba_betting_and_picks_102226_thursday/ ; https://www.reddit.com/r/sportsbook/comments/1xc48nq/pick_of_the_day_102226_thursday/
- ATLAS Supabase currently has **zero executable price bindings**; historical market snapshots are stale (latest Aug10). No certified +EV claims.

## Illustrative candidate frequencies (mean and scenario-run 10th–90th percentile)
- CLE Harden 7+ assists **69% (59–76)**, PHI Embiid under 8.5 rebounds **67% (60–73)**, PHI Brown 6+ rebounds **66% (61–70)**.
- DEN Murray 3+ threes **63% (59–66)**; DEN Jokic under 27.5 points **63% (48–76)** — strong social/game-script sensitivity.
- CLE Mobley 9+ rebounds **57% (39–75)** due to Allen availability scenarios.
- NE Douglas 3+ catches **58% (44–70)**; NE Henderson 26+ rushing yards **55% (33–78)** due to sharp disagreement in workload projections.
These percentages reflect **chosen unvalidated distributions**, and robustness in an inadequate model is not skill or real probability.

## Model & test caveats
- NBA assumed points-total SD 19, margin SD 12; NFL total SD 13, margin SD 13.5. No historical tuning/held-out evaluation; stylized score construction (not NBA possessions or NFL drives).
- NBA prop distributions approximate external 80% intervals as 10th/90th; NFL uses PropSims percentiles where available, heuristic Poisson receptions and conflicting rushing anchors. Player outputs not possession-constrained. Equal scenario branches **are not injury/status probabilities**.
- Outcomes across overlapping legs remain correlated; no SGP joint payout and no regional DK accepted quote. No stake recommendation.

## Next proof gate
1. Freeze timestamped scenario priors, verified active lineups and actual regional DK offers pre-event; never backfill.
2. Bind candidate continuity from SCOUT to ORACLE, PRICING, EDGE THIEF, KAIROS, FINAL GATE and FORENSICS without silent drops.
3. Retain baseline and updated forecast together on multiple **future** slates. Test holdout log loss, Brier, calibration by market, closing-line capture and correlated ticket settlement.
4. Only consider production improvements after independent audit and explicit human approval.

**Review output:** Full deterministic Python, scenario CSV, per-run market outcomes, documentation, report and test evidence are in the user-provided downloadable shadow experiment pack (not uploaded here to avoid adding a second canonical data source).
