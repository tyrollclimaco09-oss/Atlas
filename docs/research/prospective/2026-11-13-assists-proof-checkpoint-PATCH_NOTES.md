# ATLAS — Nov 13, 2026 6+ AST prospective research freeze (SHADOW)

## Objective and preserved architecture

Advance the existing PR #44 SCOUT→ORACLE assists-rate research using real publicly observed game-log rows, while retaining PR #37's distribution compiler, PR #43's math bridge, PR #42's frozen 14-case game-win cohort, and all non-promotion gates. This branch is stacked on PR #44 but makes **no changes** to existing source modules or frozen cases.

## Frozen experimental comparison

- **Canonical research receipt:** `docs/research/prospective/2026-11-13-nba-assists-6plus-conditional-freeze-v3.json` (frozen Nov 12 20:09:08 America/Chicago), with all earlier versions and corrections retained.
- **Statistical targets:** Jalen Brunson 6+ AST NYK@IND (DK event 1025976, Nov 13 18:00 CST); Stephen Curry 6+ AST GSW@SAS (DK event 1025982, Nov 13 20:30 CST). Game schedule/event IDs from a connected scores feed, **not official NBA IDs**.
- **Historical source observations:** manually transcribed, rounded 2026–27 assists/minutes from public StatMuse, LineupExperts and StatIQ game logs (URLs inside JSON). Hashes represent normalized transcription only, **not original raw source authenticity**.
- **Model:** Gamma-Poisson assists/minute posterior with prior alpha=1, beta=7 minutes, three empirical minutes scenarios at 20th/50th/80th percentiles and weights 0.25/0.5/0.25; negative-binomial predictive tail P(AST≥6).
- **Baseline:** historical-count average assisted by a fixed-rate Poisson tail (same training games, same statistical outcome); predeclared comparisons are Brier/log loss per case, plus misses, holds, and sensitivity. No odds, EV or wager returns.
- **Frozen conditional probabilities:** Brunson model 0.42074255 vs baseline 0.41590801, scenario minutes [32,34,35]; Curry model 0.241815 vs baseline 0.19944210, scenario minutes [21,29,32.2].
- **Rate-only uncertainty (5–95%, conditional on scenario assumptions):** Brunson 0.23678–0.61585, Curry 0.09882–0.42131. These are neither source reliability nor calibrated coverage guarantees.

## Source and participation HOLDs

Neither player's official identity-and-availability attestation was obtained before this checkpoint. Curry's most recent logged appearance was about six minutes, which makes his next-game participation especially uncertain. Both predictions remain **HOLD_SOURCE_AUTH_AND_AVAILABILITY** and are **prospective conditional research only**, not certified forecasts eligible for live wagering.

If a player does not play, do not score a 0-assist loss; record **DNP / HOLD** (not a sportsbook void verdict). If a complete official player box score cannot be verified, hold the result and mark the missingness. Never substitute a later revised forecast without its own timestamp and immutable new version.

## Explicit supersession log (no silent repair)

- **v1:** first GitHub JSON inadvertently transcribed the first scenario minutes quantile as 28 Brunson / 18 Curry instead of the computed 32 / 21.
- **v2:** attempted correction failed because script referenced nonexistent `case.player` rather than the actual `case.name`; v2 still has wrong scenario-minute display fields.
- **v3:** verified data and corrected scenario values, unchanged numeric probabilities, valid before both Nov 13 events. v1/v2 remain in GitHub history/files as audit controls; **only v3 is the authoritative prospective conditional research receipt**. None of the three versions represents authenticated provider evidence.

## Exploratory retrospective check — explicitly not out-of-sample proof

9 chronological reconstructed player-game checks (each target follows at least six prior games): new model Brier 0.2286584 vs simple baseline 0.2295005, model log loss 0.6489551 vs baseline 0.6508221, per-game model better on 4/9. The method was not frozen before these historical outcomes, so do not classify this as independent prospective evidence or claim skill.

## Next proof checkpoint

1. After final on November 13, independently verify each player box score and eligibility/availability, preserving DNP/missingness.
2. Replay exact frozen v3 model and baseline probabilities, without modifying history; report scored denominator and per-game results.
3. Continue enrolling later events under the same unchanged method until there is a meaningful prospective cohort; group dependence by player and event.
4. Run calibration, Brier, log loss, scenario coverage, prior sensitivity, and no-missingness cherry-picking, with simple baselines. No production promotion until sources and scoring are admissible.

**Constraints:** Research only. No provider credits, DB writes, sportsbook interactions, autonomous wagers, deployments, PR merges, or production promotion.
