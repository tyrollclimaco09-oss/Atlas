# ATLAS NBA / Q3 live-source snapshot gate — engineering checkpoint 16

**As-of:** Oct 22, 2026 (Chicago time) · **Research branch:** `research/odds-api-probe-2026-10-22`.
**Current classification:** `TESTED_CAPTURE_CAPABILITY_NO_ACTUAL_LIVE_FREEZE`.

## Verified context
The 2026–27 official [Thunder team schedule](https://www.nba.com/thunder/schedule) and [NBA league communication](https://pr.nba.com/2026-27-nba-regular-season-schedule) both schedule **Denver at Oklahoma City** on **Oct 22, 2026, at 8:30 PM CDT / 9:30 PM ET**. NBA game ID `0022600007` and intended schedule code `20261022/DENOKC` are contract inputs requiring exact upstream verification during execution.

## New implementation and test scope
- `scripts/proof/nba-live-q3-freeze.mjs` implements an explicit operator-triggered public NBA schedule, live scoreboard and live PBP read. No odds API, bet execution, Supabase write, automated polling or production authority.
- The snapshot requires both scoreboard reads to show the same source identity, **gameStatus=2**, **period=3**, NBA clock `PT00M00.00S`, and no play-by-play action from Q4 or later.
- Only then does `preQ4Feature` generate a deterministic two-player-per-team FGA rate baseline with selected NBA IDs and SHA-256. The output includes source hashes, source observation times, CI run ID and commit SHA; final Q4 attempts are **not** fetched or included in the forecast.
- [GitHub offline CI 39880473176](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39880473176) passed **5/5 tests** for fixed game identity, rejecting pregame and running Q3 clocks, dual live-state boundary, no Q4 leakage, and rejected unknown shooter teams.
- `.github/workflows/atlas-nba-live-q3-freeze.yml` runs offline tests on push. The **live capture step is only on manual workflow_dispatch**; no job was manually dispatched and that invocation path is not yet proven callable on the isolated branch. GitHub Actions' manual workflow registration on a nondefault branch may require a separate review and operator mechanism; **do not claim it is executable from the UI until verified**.

## Strict claims
- This pass validates only **code gates and CI**, NOT a successful pre-Q4 capture. A fake retrospective timestamp would defeat the entire arc.
- The last few moments of Q3 are a very narrow window. If this operator-triggered code does not run while *both* live scoreboard observations still show Q3 at zero, the correct result is **BLOCKED**. We do not backdate. A later in-game or postgame packet must have a new classification and cannot inherit freeze authority.
- NBA source licensing, actual play-by-play completeness at the live moment, device usability, source latency and external timestamp signature are **unverified**.
- NBA 14-game Oct 20–21 retrospective source test **5.452 MAE** remains separate from historical V3's differently trained and unreplayed baseline. No probability calibration or betting EV has been proved.

## Next authorized NBA move
Verify a runnable operator-trigger in the research environment, make one contemporaneous live Q3 snapshot before Q4, preserve its independent timestamp and complete outcome-blind roster, then settle its exact Q4 labels **after** the game against official counts and score without changing selected players. If the window is missed, preserve the failed attempt and prepare the next game; don't reconstruct an allegedly live forecast after the fact.

**Production release: HOLD. Human Final Gate remains required.**
