# ATLAS🦾 — Triple Engineering Timeskip, Passes 07–09

**Observed:** October 22, 2026 · GitHub isolated branch `research/odds-api-probe-2026-10-22` · **Proof class:** retrospective/shadow only. NBA and NFL have **different** models, features, identities and evidence chains. No wagers, no paid odds API calls, no Supabase writes, and no release promotions.

## Pass 07 — NBA Q1–Q3-only four-player selection and Q4 labels

Existing [preregistered NBA three-game source cohort](../prospective/ATLAS_NBA_20261022_THREE_GAME_FGA_INTEGRITY_06.md): October 21 games ATL@ORL, CHA@BKN, GSW@LAL, all official NBA CDN shots accounted per player. [NBA feature CI 39864872638](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39864872638) succeeded: **4/4 adversarial unit tests plus all 3 real-source games**. The first attempted leakage fixture was wrong (it moved a Q4 record to Q1); fixed it, preserved failed CI run as evidence, and the final test asserts Q4 changes cannot affect the Q1–Q3 selection.

- **Selection rule:** exactly two players on each team ranked by Q1–Q3 `isFieldGoal=1` attempts; deterministic numeric player-ID tiebreak; no player without an actual Q1–Q3 shot.
- **Independent target:** the Q4 FGA of those four players, counting period 4 only and excluding OT.
- **Integrity:** game/team/player IDs and every player's full-game FGA reconciled before extracting features. The original V3 57-game model remains a **separate, unreplayed** experiment.
- **Historical-only illustration:** naive rate extrapolation `sum(top-four Q1–Q3 FGA) / 3` evaluated against each game's postgame Q4 combined attempts. No trained model or calibrated probability.

| Game | Top-four FGA, Q1–Q3 | Naive Q4 rate | Actual Q4 top-four | Absolute error |
| --- | ---: | ---: | ---: | ---: |
| ATL @ ORL | 49 | 16.33 | 18 | 1.67 |
| CHA @ BKN | 55 | 18.33 | 24 | 5.67 |
| GSW @ LAL | 54 | 18.00 | 3 | 15.00 |
| **Three-game MAE** | | | | **7.444** |

GSW@LAL is a particularly useful **fragility example**: the pre-Q4 top-four players attempted only three combined Q4 shots, despite 48 total Q4 FGA across both teams. This may warrant rotation/benching research, but the **cause was not verified** and must not be presumed to be blowout benching.

**Important:** Source requests happened *after* the games. Merely extracting features from Q1–Q3 data and passing synthetic leakage tests does NOT prove an external Q3 freeze existed, or a genuinely out-of-sample/live prediction occurred.

## Pass 08 — NFL player/actor volume source cross-check

[Week 6 HOU @ JAX paired actor CI 39864788837](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39864788837): offline player-ID and wrong-week checks passed, followed by bounded nflverse 2026 Week 6 play-level actor extraction and independent ESPN final game box score.

| Player | NFLverse PBP actor ID | nflverse flagged volume | ESPN box-score volume |
| --- | --- | ---: | ---: |
| C.J. Stroud, HOU — passes | `00-0039163` | 34 | 34 |
| Woody Marks, HOU — rushes | `00-0040583` | 15 | 15 |

NFLverse PBP yielded 2 passing actors, 9 rushing actors and **0 missing source actor IDs within eligible pass/rush entries**. The cross-source match was **name + team + stat total**, NOT an independently verified direct GSIS↔ESPN person-ID map.

This strengthens the existing [116/116 strict event correspondence](../prospective/ATLAS_NFL_20261022_WEEK6_CLOCK_CORRESPONDENCE_06.md), but it does not prove the 11 unmatched event candidates, player target mappings, game-wide exact snap accounting, pregame workload estimates or positive EV.

## Pass 09 — source → research custody, live readiness and continuity

An integration workflow re-runs both existing sport extractors *in sequence* without paid odds data, validates expected game IDs, four-player Q3 selection, postgame label arithmetic and two player volumes; forbids model and external-freeze promotion; hashes both raw research-report files; emits **shadow-only** dual-sport custody metadata (not a new production canonical schema).

[Integration CI 39865337273](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39865337273): **five adversarial tests and actual combined readback passed**, with receipt:

| Input | SHA-256 of generated research packet |
| --- | --- |
| NBA 3-game Q3→Q4 source research | `a8d2bd42936291105a3d5ec180387df9073bb94368cea1ec67569fb9199e275e` |
| NFL Week 6 player-source research | `8fcd084a77af61aa7d5ef8484c4086d4c76594010668ef5edb354f629e8f2250` |

These hashes identify **the CI-generated research files**, not externally timestamped freezes at Q3/kickoff; artifacts have a seven-day retention. The GitHub workflow/readme/receipt pointers are durable. This document preserves both hashes for verification after artifact expiry.

**Fresh live Supabase read-only state** at approximately `2026-10-22T22:27:02Z`:

- `atlas_calibration_readiness_current`: **0 admissible outcomes**, `WAIT_FIRST_CAUSAL_OUTCOME`, no automatic parameter promotion.
- `atlas_oracle_model_pipeline_readiness_v13`: **0 validated models**, **3 verified datasets**, next `VALIDATE_NATIVE_BASELINES`.
- `atlas_operational_health_live_v1`: `MANUAL_ONLY`, **0 configured feeds**. Authenticated Vercel↔Supabase runtime parity remains **UNKNOWN** and was not tested in this pass.

No Supabase rows or schema were changed. This pass does **not** claim 3 profitable slates, 3 prospective proof packets or production readiness.

## Deterministic handoff / next gates

- [Canonical JSON](../continuity/ATLAS_CURRENT_HANDOFF.json) + [human handoff](../continuity/ATLAS_CURRENT_HANDOFF.md); validation `node --test scripts/continuity/atlas-handoff-guard.test.cjs`.
- **NBA next:** build q3-limited score/rotation/minute context and a **new** chronological baseline; get actual timestamped Q3 freeze before evaluating. Original V3 replay stays blocked until primary raw archive is recovered.
- **NFL next:** map pass/rush player IDs to an independent roster, study 11 unmatched source events, and freeze a price-blind *pregame* QB attempt distribution for a future game; settlement and calibration require real official outcomes after freeze.
- **Runtime next:** prove authorized 200/unauthorized 401 through Vercel↔Supabase preview with no secret exposure, then establish canonical feed heartbeat and immutable prospective receipt before a guarded non-wagering production rollout.

**Do not merge into main or mutate canonical Supabase research/calibration tables without separately justified authority.** Knowledge over greed; evidence over confidence.
