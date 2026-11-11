# ATLAS prospective NBA first-cohort source proof — 2026-11-11

## What actually happened

- At approximately 15:23 UTC on November 11, the **connected DraftKings sports-data tool** returned ten `Upcoming` NBA games, exact native competition IDs and home/away team IDs, pregame team scoring averages and source response metadata. Its response was captured as a deliberately compact **research-only** source artifact in `integrations/learning/fixtures/nba-connected-prestart-20261111.json` (Git blob fingerprint recorded in the cohort).
- Independently checked the slate structure against the NBA's official **public** game schedule: https://www.nba.com/games?date=2026-11-11 ; all ten matchups and tipoff windows match as of this check. **This is not a signed NBA data-response attestation.**
- At **2026-11-11T15:26:47.6906831Z**, used a connected service time reference and the already captured scores/stats to prepare and commit an **immutable prospective research forecast** for ten game winners, before the earliest 2026-11-12T00:00:00Z tipoff.
- New output: `integrations/learning/fixtures/nba-prospective-forecast-freeze-20261111.json`. Source: exact git blob `9605d80d49d327f3acd4020d34ae49757f801e82`; captured provider request ID and timestamp stay linked to the source file.
- Formula preregistered before results: `home_win_p = sigmoid((home_ppg - away_ppg) / 18)`, rounded to nine decimals; model `NBA_RAW_PPG_DIFFERENTIAL_LOGISTIC18_V0` and neutral 50/50 baseline `NBA_NEUTRAL_GAME_WINNER_50_50_V1`. **Scale 18 is an exploratory choice, not fit, optimized or calibrated.**
- No bookmaker prices or inferred moneylines. Game winner is an outcome forecast, not automatically a sportsbook settlement contract. Home-court advantage, injuries, opponent defense, strength of schedule and context are *not* modeled. Bookmaker brand supplying team stats does not mean actual odds were used.

## Evidence-quality boundary

1. Tool receipt establishes a connected-source observation and provider IDs; it does **not** provide a vendor signature, independently authenticated canonical ATLAS event mapping, or future official outcome.
2. Git source blob and a deterministic pure evaluator can **detect post-freeze rewriting and stale inputs**. The source blob hash does **not** independently authenticate its original provider.
3. No historical results, future lineup news, closing price, or game outcome were included in the model. Real observed game results must be separately sourced **after games are final** and explicitly joined to the frozen exact team/event keys. Disagreements and postponed/void games must HOLD, never silently become losses.
4. Any subsequent 10-game Brier score is a **small-sample research diagnostic** requiring independent result verification, not proof of predictive skill, positive ROI, calibration or production readiness. At least the preregistered longer held-out period and source auth reviews are needed.

## Tests and operations

- New deterministic Node helper: `integrations/learning/prospective-source-freeze.mjs`. It reads source bytes, computes the Git blob fingerprint, freezes the full cohort from a declared formula, and checks the preserved manifest against both the exact original byte-backed source and analytic results.
- New regression tests: `integrations/learning/prospective-source-freeze.test.mjs`. They include source tampering, duplicate games, home/away identity corruption, after-tip data, odds or outcomes incorrectly attached, change of model/baseline, and result leakage.
- Source snapshot, formula and manifest are committed in SHADOW draft and have **zero** financial authority, data-ingest enablement, Supabase writes or bets.
- GitHub Actions [run 43048853741](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/43048853741) passed **299/299 offline tests, zero failures/skips** and **3,000/3,000 synthetic fault/invariance checks** on original PR #40 head `405a7f057813c30aa1b8aa37cbef7bda9b3af37f`. The source artifact and frozen formula are in the tested tree. This is code/source consistency proof, **not prospective model accuracy**.

## Remaining blockers

- Verified future official result ingestion, canonical event and market identity attestation, source-origin authentication and settlement rules.
- Long-run (at least 120 cases over 21 days as the existing gate specifies) chronological holdout, variance and calibration versus frozen baseline, and thereafter authenticated exact native prices for separate price-edge/ROI research.
- No new Supabase migration, deployment, scheduled job or site publish. P1 source-to-forecast proof now has one real 10-case prospective cohort; outcome and external authority remain on HOLD.

## Postgame handoff

Updated the EXISTING enabled ATLAS NBA/NFL Postgame Forensics task (not a new scheduled job), retaining its 06:30 America/Chicago daily cadence. The November 12 pass is instructed to check each of the ten games against connected DraftKings SCORES and actual official NBA.com finals, preserve all discrepancies and source observation timestamps, and compute a provisional Brier comparison only for well-matched confirmed results. Future run status and delivery remain unverified. No Supabase forecast or result records were backfilled; the current historical source-authentication HOLD remains.
