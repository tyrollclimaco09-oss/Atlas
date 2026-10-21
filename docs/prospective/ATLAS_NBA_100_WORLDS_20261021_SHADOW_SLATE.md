# ATLAS | NBA 100 Worlds — 2026-10-21 Prospective Shadow Slate

**Freeze:** Before October 21 NBA tipoffs. **Authority:** SHADOW. **Deployment:** Review branch only, no site/backend/decision promotion. **Do not auto-bet.**

## Executive verdict

- All **11** scheduled NBA fixtures (DraftKings sports-data event feed, observed October 21).
- **12,000** high-resolution modeled game paths per fixture = **132,000** paths; **100** representative worlds per fixture = **1,100** explainable world snapshots, deterministically sampled from the full ensembles.
- 2025-26 team ORtg/DRtg/pace from 30-team StatMuse source; 64 distinct real Luka player game logs verified against 2,143 PTS, 495 REB, 530 AST, 254 3PM and 694 3PA aggregate. Displayed minutes rounded per game; rounded sum **2293** differs from published actual **2289**.
- Current third-party **October 21 18:00 UTC** DraftKings-labeled spread/total references from AgentBets, **not** executable user-specific prices.
- Model: **35% prior-season team benchmark + 65% market reference**, uncalibrated mixture chosen for stress-testing. Regime-change uncertainty and 2026-27 roster shifts are material. Whole-model hit frequencies are **model-conditioned frequencies**, NOT proof of calibrated outcome probability or betting profitability.
- Two phase baseline distinction: 2025-26 matchup **historical statistical baseline** is calculated separately and preserved in every output. The *blended* simulation is a **House Mirror / market-aware scenario model**, NOT an independent price-blind Oracle estimate. Never use the blended model to claim a mispriced bookmaker offer.

## Exactly what was simulated

1. A team matchup statistical baseline from last season ORtg, opposing DRtg and average pace, plus a declared **3-point home-court margin**.
2. A market-aware baseline blended with the source-provided spread and total. Changing market weight is an explicit sensitivity experiment, not retroactively selecting a better-fitting weight.
3. Correlated tempo, separate efficiency/margin variation, full-game scores, simulated overtime to eliminate tied final results, first-half allocation and comeback detection.
4. Each matchup receives 12,000 sampled regulation/overtime paths. Qualitative paths: **COMEBACK**, **BLOWOUT**, **SHOOTOUT**, **GRIND**, **CLOSE**, **BALANCED**. These labels partition modeled outcomes; scripts are not fitted frequencies.
5. Representative 100 = **10 bins of total score x 10 bins of conditional margin or lead player's combined production**. This two-dimensional sampling corrects a v1/v2 issue: selecting only by total overrepresented Luka 50+ PRA (58/100 despite 49% full-model frequency).
6. Game-specific player stress on GSW@LAL: 64 empirical Luka game vectors (joint PTS+REB+AST+3PM+3PA+minutes) resampled together and adjusted for scenario minutes, pace, blowout and uncertain role. Variance comes from real historical logs; the adjustments/weights are assumptions.
7. A 2x2 proposition outcome matrix: both Luka PRA 50+ and 4+ made threes; PRA-only; threes-only; neither.

## 11-game snapshot

| Away @ Home | Third-party ref total | Independent 2025-26 total | Mixed modeled median | Modeled central 80% | Home win frequency* |
|---|---:|---:|---:|---:|---:|
| MIL @ WAS | 238.5 | 231.7 | 236 | 214–259 | 60% |
| ATL @ ORL | 233.5 | 231.3 | 233 | 210–256 | 57% |
| MIN @ MIA | 240.5 | 235.3 | 239 | 216–262 | 56% |
| CHA @ BKN | 219.5 | 223.7 | 222 | 199–245 | 42% |
| CHI @ TOR | 237.5 | 231.1 | 235 | 213–259 | 77% |
| UTA @ MEM | 242.5 | 238.3 | 241 | 219–264 | 58% |
| IND @ NOP | 239.5 | 233.1 | 238 | 215–261 | 49% |
| DAL @ HOU | 230.5 | 227.3 | 230 | 207–253 | 77% |
| GSW @ LAL | 233.5 | 229.5 | 232 | 210–255 | 68% |
| PHX @ POR | 231.5 | 226.6 | 230 | 208–254 | 58% |
| SAC @ LAC | 227.5 | 228.2 | 228 | 205–251 | 68% |

*Model frequency, not a calibrated forecast. Because bookmaker-derived reference is an input, apparent agreement with sportsbook odds is **not** independent validation.

## Luka lead (locked; no bet)

- Historical **35/64** at 50+ PRA (54.7%); **36/64** at 4+ threes (56.3%). 35/64 historical fraction has an approximate 95% Wilson interval of **42.6–66.3%**, before any roster-regime adjustment.
- 12,000-path simulated **Luka 50+ PRA: 48.95%** (5,874 paths). **4+ threes: 53.69%** (6,443 paths).
- Median modeled **33 points / 7 rebounds / 8 assists / 4 threes / 36 minutes**; median *joint PRA* = **49**. Medians of individual components are not additive.
- PRA 10th–90th: **34–64**.
- Representative 100 examples: **50/100** Luka 50+ PRA and **56/100** 4+ made threes. **Only 12,000-path model quantities should be shown as model frequencies**; 100-world counters are examples.
- Joint truth counts among 12,000: both **4,045** (33.7%), PRA-only **1,829** (15.2%), threes-only **2,398** (20.0%), neither **3,728** (31.1%). Never multiply independent hit rates to approximate this joint settlement.
- PRA50 modeled conditional frequency with constrained role ~22.6%, base role ~51.3%, expanded role ~64.0%; **not calibrated**.
- Blowout path PRA50 frequency **41.7%**, close-game path **51.7%**; latter conditioned on a modeled minutes penalty for blowouts, not verified coach behavior.
- Additional 6,000-path role reweights: **43.75%** when more constrained, **53.55%** when more expanded; wide uncertainty swamps apparent narrow value at today's quoted market.

**Price point:** Third-party / public DK prop page surfaced **-101** for 50+ PRA at one observation; elsewhere +103 had appeared. Not a confirmed accepted DK user-account quote or measured CLV. Break-even at -101 ~50.25%; +103 ~49.26%. **No positive-EV wager established.** Previously discussed +110 experimental trigger is NOT a betting authorization: plausible role scenarios still fail it.

## Reusable ATLAS slate behavior — research lane first

```text
SCOUT verifies scheduled slate / official starters / social source roles
  → VERIFY checks timestamps, team + player identity, injury contradictions
  → GAME SENSE creates independent matchup/player baseline and explicit script hypotheses
  → ORACLE + EDGE THIEF freeze baseline and credible counterpaths BEFORE opening live prices
  → HOUSE MIRROR / PRICING optionally assimilate market references; avoid circular "edge" claims
  → 12k+ modeled paths and 100 balanced readable worlds, plus 2x2 settlement comparisons
  → CALIBRATOR labels scenario weights, input sensitivity, prior calibration and model skill
  → SENTINEL / KAIROS block stale inputs, invalid script/model contracts or missing executable quote
  → TACTICIAN chooses one strongest expression and compares it to alternatives
  → HUMAN FINAL GATE decides any actual stake, if qualified
  → LEDGER / FORENSICS later join outcomes without rewriting this freeze
```

**Operator readout per game:** Expected team pace, forecast median plus 80% interval, 100 sample worlds, model frequency (clearly labeled), top 2 failure paths, data freshness, and one next-step decision. Avoid twelve equal-strength "top picks"; SCOUT remains broad and TACTICIAN chooses one lead. If the lead has no price edge, **WATCH/PASS** — not forced substitution.

## Acceptance and release gates

- Model regression: **15 tests** (including data integrity, score conservation, overtime no tie, paired player-stat bounds, reproducibility, 2x2 pairing, sensitivity and representative-world check). Actual GitHub CI: https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39656761373 .
- Stored immutable v1/v2/v3 output evidence. v1/v2 100-sample selection was biased for the focal player even though high-resolution ensemble was the same; v3 corrects selection. Do not delete flawed artifacts — they are valuable FORENSICS.
- **No prospective calibration proof** yet. No assumption-driven Monte Carlo size can replace head-to-head predictions vs a simple baseline and independent market estimates.
- **No generalized daily-data pipeline** yet. This engine currently requires an approved 30-team table, 64-game Luka reference, and October 21 snapshot; it intentionally rejects incomplete input scopes.
- **No Command Center API integration**, no live automatic odds fetching, no betting authority, no Supabase schema changes for this new simulation.
- Next pass: refactor the reference model for current-day schedules, evaluate independent parameter fits on heldout historical games, add player-specific logs for strongest 1–3 candidates, and compare delta-only 100 Worlds across live checkpoints.
- Main production promotion requires observed feed parity, independent calibration, quote-level KAIROS/Final Gate, reviewed version and rollback plan. Keep draft PR status until done.

## Source references

- https://www.statmuse.com/nba/ask/nba-team-offensive-rating-defensive-rating-and-pace-in-2025-26
- https://www.statmuse.com/nba/ask?q=luka+doncic+stats+all+games+2025-2026
- https://agentbets.ai/odds/draftkings/nba/
- https://dknetwork.draftkings.com/draftkings-sportsbook-player-props/?tb_view=2
- https://www.sfchronicle.com/sports/warriors/article/warriors-brandin-podziemski-miss-opener-l-a-22486550.php

**ATLAS doctrine:** truth > ego; knowledge > chasing yesterday's loss; immutable point-in-time comparison; no automatic promotion.
