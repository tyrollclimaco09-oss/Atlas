# ATLAS 🦾 Major timeskip — audit passes 10–14

**Observation date:** 2026-10-22 America/Chicago · **Branch:** `research/odds-api-probe-2026-10-22` · **Status:** retrospective/shadow with production authority **OFF**.

The priority is to **earn** each prediction permission, not to maximize models, synthetic episodes or green counters. NBA and NFL never share a forecast, distribution, market or training dataset. Raw third-party play data are not committed; bounded source references, hashes and experimental code are preserved.

## Pass 10 — NBA cut at Q3, not after Q4

New `scripts/proof/nba-q3-feature-firewall.mjs` separates:
- `preQ4Feature(game, period1to3)` rejects every period outside Q1–Q3; ranks two positive-FGA shooters per team using Q1–Q3 only; records independent Q3 and three-quarter FGA counts, a deterministic selection and SHA-256 of feature JSON.
- `q4Settlement(feature, period4plus)` rejects any pre-Q4 period, settles selected Q4 FGA labels and separately excludes overtime.
- The **feature function cannot accept Q4 outcome or postgame player box-score stats** as arguments. Full NBA PBP vs box-score parity is a separate postgame integrity gate *outside* that feature function.
- Tests mutate Q4 outcomes without changing the Q3 feature hash, inject future events, check overtime exclusion, unknown shooter/quarter fail-closed.
- [Live-source + five-test proof](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39875747455): all 3 existing Oct 21 historical games reproduced the old 49→18, 55→24 and 54→3 Q1–Q3/Q4 aggregates; 5/5 relevant tests passed.
- **Limit:** this was executed retrospectively after the games. SHA-256 demonstrates deterministic contents; it does **not** prove a timestamped Q3 live freeze.

## Pass 11 — NBA date-complete retrospective benchmark, not cherry-picked

New `scripts/proof/nba-oct-date-census.mjs` selects **every** game scheduled on October 20–21, 2026 from the NBA league schedule, with an anti-duplicate gate. No selection depends on success, margin, players or odds. All NBA CDN source game IDs and per-player FGA must reconcile; each failure is retained as a *rejected row*, and CI fails if any game is missing.

[GitHub run 39876106760](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39876106760): **14 scheduled / 14 accepted / 0 rejected**; fixed historical top-four FGA-per-three-quarters extrapolation scored **MAE 5.4523809524 Q4 attempts**, median abs error **3.5**, worst **17.6666666667**. The 14 games were three on Oct 20, eleven on Oct 21.

| Extreme game | Historical baseline | Actual top-four Q4 FGA | Abs error |
| --- | ---: | ---: | ---: |
| GSW @ LAL Oct 21 | 18.00 | 3 | 15.00 |
| PHX @ POR Oct 21 | 17.667 | 0 | 17.667 |

10/56 selected players recorded **zero Q4 FGA**. These are shot counts, not confirmed no-play or benched player minutes.

**Critical V3 comparator correction:** The original Library `REPORT.md` for `ATLAS_PBP_V3_CHRONOLOGICAL_SHADOW.zip` reported a *trained historical exposure-weighted* baseline Oct20–21 **MAE 7.062**, and April-selected saturating ridge **6.456** on 14 games, sourced from Basketball-Reference. This new NBA-CDN **untrained rate** baseline 5.452 is a **different algorithm/source and possibly different exact player/event definitions**. Thus `NEW_BASELINE_BEATS_V3` is **NOT ESTABLISHED**. The original 57-game row-level archive remains inaccessible for replay. Do not compare the 5.452 and 7.062 as if identical baselines.

## Pass 12 — attack the convenient “benched” explanation

New `scripts/proof/nba-q4-zero-participation.mjs`: take 56 Q3-selected players, identify zero-Q4-FGA cases, and seek **other direct Q4 play-by-play events for those exact NBA person IDs**, including events that are not shots.

[GitHub run 39876565802](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39876565802): all 14 games valid, two synthetic distinction tests passed:
- **10** selected players shot **0** FGA in Q4.
- **6 of 10** nevertheless have at least one other Q4 event directly referencing the player ID. **4 of 10** had no such direct Q4 event.
- **PHX @ POR:** all four selected Q3 top shooters attempted zero shots in Q4; **three** had other Q4 actor references.

No event is **not evidence of benching**; an event does not prove full minutes or actual rotation. No injury/blowout cause has been adjudicated. Treat 0 Q4 shooting as a distinct mixture of participation and shot-opportunity hazards; add lineup/minutes evidence before fitting an “automatic benching probability.”

## Pass 13 — NFL chronological QB workload baseline, unfavorable to complexity

New `scripts/proof/nfl-qb-prior-week-baseline.py`: use free nflverse 2026 1–6 PBP source, derive QB player-game passing attempts, and **generate week W predictions exclusively from earlier weeks**; nothing from same/future week updates training until every week's predictions have been made.

Eligibility requires two observed prior QB games and last prior game ≥10 passing attempts. Benchmark each selected **postgame-appearing QB** against (a) own last-three historical attempt mean, (b) league-wide average of prior-week ≥10-attempt QB-game counts. Both price-blind; no betting market observed. Fails on wrong source or future weeks and checks target mutation invariance.

[Initial chronology proof 39875525098](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39875525098) + [uncertainty and selection-bias audit 39876250375](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39876250375):
- **214** QB-game rows in Weeks 1–6 source, **85 paired evaluations** over Weeks 4–6, from **45 distinct games**.
- Last-three MAE **8.67255** versus simpler historical league-reference MAE **7.51676**; +**1.15579** attempts in paired absolute error (positive = last-three worse). Last-three beat the comparator on **32/85** QB-game observations.
- Week 4 last-three slightly better (8.264 vs 9.030). Weeks 5 (8.471 vs 6.258) and 6 (9.327 vs 7.243) worse.
- Exploratory game-clustered paired-error bootstrap, deterministic 2,500 draws, 95% interval of (last-three minus league reference) **[−0.20549, +2.51007]**. **Contains zero.** No strong generalized superiority/inferiority inference.
- **Critical survivorship problem:** population is defined from QBs with **current-week postgame pass attempts**, so it does **not** represent all players who could have been selected to bet on before kickoff, including zero-attempt QBs. No genuinely timestamped pregame predictions, verified roster/starting role, market price, or deployment.

**Disposition:** `MODEL_LAST3_NOT_PROMOTED` and `LEAGUE_REFERENCE_RESEARCH_ONLY`. Do not claim a game-volume prop betting advantage.

## Pass 14 — Fresh backend and integration boundary

A **read-only** live Supabase query refreshed:
- `atlas_calibration_readiness_current`: **0 admissible causal outcomes**, `WAIT_FIRST_CAUSAL_OUTCOME`, automatic promotion false.
- `atlas_oracle_model_pipeline_readiness_v13`: **0 validated models**, 3 verified datasets; next `VALIDATE_NATIVE_BASELINES`.
- `atlas_operational_health_live_v1`: `MANUAL_ONLY`, 0 configured feeds. No Vercel↔Supabase authenticated preview proof is newly established.
- Old [Passes 07–09 custody](ATLAS_20261022_TRIPLE_TIMESKIP_07_09.md) and original 57-game report remain distinct; this timeskip contains no authorized Supabase writes, no app deployment, no wager or paid odds calls.

## Earned next steps, in order

1. **NBA:** external *before-Q4* snapshot and source timestamp proof; independently verify minutes/lineups and contemporaneous Q3 score; pre-register a new historical cohort and genuinely prospective scoring; compare matched row-level targets vs original V3 **only after** original raw archive is obtained.
2. **NFL:** define an eligible pregame QB player universe and **retain zero-attempt/missed-start outcomes**; use a timestamped historical roster and QB starter snapshot; construct separate true prospective price-blind candidate packets, evaluate after final stats. Preserve negative benchmark and uncertainty.
3. **Backend:** one authenticated Vercel preview→Supabase read and one unauthorized denial; canonical feed heartbeat→immutable point-in-time freeze→official final outcome receipt; manual human Final Gate only. Keep production `HOLD` until all are verified.

**Canon:** SCOUT→FILTER/VERIFY→EDGE THIEF+ORACLE→PRICING→KAIROS→SENTINEL→TACTICIAN→HUMAN FINAL GATE→LEDGER→FORENSICS→CALIBRATOR. The five passes add **source and model evidence**, not authority to wager.
