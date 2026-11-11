# ATLAS — pre-registered postgame scoring + rival model (November 11, 2026)

**Status:** SHADOW, genuinely pregame, separate from live wagering. This file documents implementation and evidence classification; it does not report results of games not yet completed.

## Provenance / immutable frozen arms

Source: `integrations/learning/fixtures/nba-connected-prestart-20261111.json`, actual connected DraftKings sports-data schedule/stats snapshot (captured November 11, 15:23:11 UTC); original Git blob SHA `9605d80d49d327f3acd4020d34ae49757f801e82`. The original independent-formula PPG-based outcome cohort was frozen before tipoff at 15:26:47 UTC in `nba-prospective-forecast-freeze-20261111.json`, then committed before the first 00:00 UTC November 12 game start.

**New independent-method challenger**, frozen at **2026-11-11T15:44:35.4663222Z** in the separate `nba-record-challenger-freeze-20261111.json`: use only the same source's exact pregame team records, no odds, scores or PPG; Laplace-smoothed home/away season win-loss log odds, with fixed half-strength shrinkage. Formula:

`p(home) = sigmoid(0.5 * [ln((home wins+1)/(home losses+1)) - ln((away wins+1)/(away losses+1))])`

The 0.5 multiplier is a **chosen exploratory parameter**, not empirically fitted; original PPG18 and neutral 50/50 baseline stay unchanged. Same underlying feed means the two methods are **not independent sources or evidence samples**. A matchup counts once; comparing three methods does not triple n. This is not a calibrated forecast, positive EV estimate or bet.

## Real postgame evaluation workflow

After each game's final, collect a separately timestamped snapshot from the connected DraftKings SCORES service and a separately read NBA official game page; preserve exact final scores, recorded home/away abbreviations, native competition and team IDs where available, stable source references, source excerpt plus SHA256 of the actual captured excerpt/bytes, and the two source observation times. A syntactically official URL or a declared digest is **not** provider authentication. Be explicit about upstream-syndication conflicts, authentication, source timestamps and any bad/suspended games.

Pipe the two source observations for each match to the read-only CLI:

```bash
printf '{"observations":[]}' | node integrations/learning/score-prospective-nba-cli.mjs
node integrations/learning/outcome-pattern-check.mjs
```

Empty observations intentionally return **10 HOLD, zero scored, null paired metrics**. A completed game requires two uniquely matched source observations with contract `ATLAS_NBA_POSTGAME_RESULT_OBSERVATION_V1`: `origin` of `CONNECTED_DK_SCORES` or `NBA_OFFICIAL_PUBLIC_PAGE`; matching `canonical_source_event_key`, `home_team`, `away_team`, final score and status; precise native `provider_competition_id`, `home_team_id`, `away_team_id` for the DK record; source URI (`connected-draftkings:competition/<id>` for DK or a real `https://www.nba.com/game/...` page for NBA), `receipt_id`, `observed_at`, actual captured `evidence_excerpt`, and `capture_sha256` computed from the captured evidence. `upstream_chain_id` is optional when unknown and should never be guessed.

- Both sources must indicate `Final`, matching exact home/away and scores, with observation times after tipoff; missing, duplicate, inconsistent, void, tied, disputed or suspended cases HOLD without silent exclusion.
- Score `Brier = (p-y)^2`, log loss `-y ln(p)-(1-y)ln(1-p)`, where `y=1` only when the home team wins. Compare the original frozen PPG model, newly frozen record-control arm, and original neutral baseline *on the identical admitted cases*. Partial samples carry a selective-case warning.
- **Even two matching sources are provisional research**, not an authenticated sportsbook market or vendor-signed official outcome. The CLI always reports zero calibration-authorized samples, zero ROI, and no production or wagering authority. The output is a non-persistent diagnostic; archiving validated source payloads is a separate reviewed workflow.
- The original GitHub source and forecasts are verified on every scoring run and cannot be edited to fit a final result. Later reports must be separate append-only artifacts, never replacement of the prestart JSON.

## A little extra: exhaustive sensitivity

The `outcome-pattern-check.mjs` program enumerates **all 1,024 possible binary outcome patterns across the ten frozen games** and measures when each model's Brier score would beat the neutral baseline or the rival. **The patterns are not equally probable**, the counts are not a probability of winning, and this is not a betting simulation. No outcomes are supplied to this test. Its purpose is to challenge any claim of guaranteed predictive superiority and reveal performance fragility.

## Distinct gates

1. **Software verification:** exact source byte/forecast identity, age, no duplication, no lookahead, no paper/real-money effects, hold behavior on incomplete scores.
2. **Retrospective research diagnostics:** source-matched after-final outcomes, Brier/log-loss relative to neutral and record challenger, separately documented source provenance and disagreements.
3. **Model graduation:** source-authenticated canonical market/identity/outcome receipts from the correct time, a larger *chronological multi-day* holdout and uncertainty analysis. Ten correlated games on one day are inadequate.
4. **Financial research:** native quote, exact sportsbook period/rules, price/timestamp and complete payout/settlement evidence. Nothing in this patch authorizes EV/ROI or live entries.

No paid API requests, new tasks, Supabase writes, production deployments, bankroll mutations, merged PRs or wagers are made. The existing Forensics automation is the scheduled postgame reviewer; execution after results and delivery must still be verified.

**GitHub CI:** results are not asserted here until the new PR runs. Link the actual run and exact commit SHA in PATCH_NOTES.md when available.
