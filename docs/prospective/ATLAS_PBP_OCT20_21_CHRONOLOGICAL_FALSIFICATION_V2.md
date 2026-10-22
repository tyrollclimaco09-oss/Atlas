# ATLAS — NBA/NFL PBP Calibration: Chronological Falsification V2
**Research checkpoint dated October 22, 2026** | `REVIEW_ONLY_SHADOW` | NO production promotion, wager or Supabase mutation.

## Concrete scope and source provenance
- **NBA:** Oct 20 (3 games) + Oct 21 (11 games), 14 Basketball Reference play-by-play tables reviewed; 28 team-level derived records. Q3 margin is a *known end-of-Q3* covariate, never a pregame-known covariate. For each game, choose top two shot attempters per team from Q1–Q3 ONLY; target their combined Q4 FGA relative to prior per-quarter average.
- **NFL:** 12 textual Gridiron week 1–6 game descriptions for New England and Chicago (1,988 entries including kickoffs, penalties, nullified actions). Counts are source-specific proxies, NOT verified offensive snaps/targets. Full-league nflverse 2026 PBP release verified available but its 7 MB Parquet/CSV.GZ binary was NOT ingested here.
- Raw third-party PBP tables are not copied into this GitHub checkpoint. Locally generated derived summaries, Python checks and SHA-256 manifest are available in the user conversation's downloadable shadow pack.

## Audited prediction challenge (fourteen games)
| Test | Mean-only | Q3 lead OLS | Q3 lead Ridge (alpha=100) |
| --- | ---: | ---: | ---: |
| Leave-one-**game**-out MAE, all games | 0.319773 | 0.253665 | **0.253334** |
| STRICT train Oct 20 (3 games), test Oct 21 (11 games) MAE | **0.341886** | 0.438750 | 0.363467 |
Tuesday max absolute end-of-Q3 margin was 13; Wednesday max was 41. The improved pooled LOO score failed later-day generalization. **REJECT promotion.** No in-game, pregame or sportsbook edge established. No parameter change made to ORACLE/PRICING.

## Red-team and data gates
- Exploratory 500 margin-shuffling challenge: ~0.4% shuffled samples matched/exceeded the pooled LOO Ridge gain; it does **not** override chronology, model-selection uncertainty or incomplete historical sample.
- Excluding Phoenix–Portland and Warriors–Lakers *post hoc* reduces LOO MAE difference: baseline 0.226113 versus Ridge 0.212117. Do not tune selection on observed game outcomes.
- NBA official CDN liveData action adapter supports corrections, source fingerprints and lagged **pre-event** score. Adapter unit tested on constructed records, NOT yet source-validated on actual CDN raw payload.
- NFL adapter separates presnap covariates from realized `epa`, success, targets and yardage; unknown play types and `no_play` penalty cancellations must NOT become valid pass/rush opportunities.
- Freeze latest claims/lineups/odds by *captured_at ≤ decision_cutoff* and optional *effective_at ≤ cutoff*, de-duplicate per key to prevent many-to-many source multiplication.
- Local tests: **12 pass**, including cutoff chronology, corrected NBA event, no-play cancellation, and prior-week-only NFL pass share.
- Connected Supabase historical events and market snapshots do not constitute a live PBP feed; no verified executable price binding or independent player-stat distribution has been supplied.

## Canonical ATLAS mapping
**SCOUT/FILTER** verify event provenance and as-of roster identity. **ORACLE/Game Sense** should evolve from final-score draws toward shared possession/lineup (NBA) and drive/play/route/target (NFL) paths. **EDGE THIEF** attacks post-outcome leakage, role ghosts, cancellation flags and source echo chambers. **PRICING/TACTICIAN** cannot calculate price authority/SGP joint EV until prospective player-stat distribution calibration and exact authentic quotes. **FORENSICS/CALIBRATOR** preserve both frozen baseline/upgrade, benchmark Brier/log-loss/interval coverage on later slates grouped by game/week, and reject failed changes.

## Next hard evidence gate
1. Acquire and verify one real NBA official event feed against score, substitutions and player box totals and the actual 2026 nflverse season PBP bytes; capture legal/provenance hashes.
2. Backtest **earlier dates against later dates only** with a much broader range of blowout and lineup regimes (not only Oct 20–21).
3. Freeze both original vs new candidate probabilities before further games; test identical held-out labels, not ex-post profitable-looking thresholds.
4. Production deployment or betting remains prohibited without independent validation and explicit operator Final Gate.

**Verdict:** This pass produced an actionable **negative** model-selection result plus strengthened parsing/clock and as-of correctness tests. It did NOT train a new real-world-winning model.
