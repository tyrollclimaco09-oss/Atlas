# ATLAS — Play-by-Play Calibration Arc, 2026-10-22

**REVIEW_ONLY / SHADOW. No Golden Slate, production scoring change, deployment, bankroll action, or executable EV claim.**

## Verified raw-source audit

**NBA:** Inspected detailed action logs for the **three October 20** and **11 October 21** NBA games (14 total), with reconstructed finals matching source game results. Each team's two highest Q1–Q3 FGA shooters were identified without using Q4, and their Q4 opportunities were measured. 28 team-level records are grouped into 14 game-level observations. Primary PBP example: https://www.basketball-reference.com/boxscores/pbp/202610200NYK.html ; Oct21 critical blowout: https://www.basketball-reference.com/boxscores/pbp/202610210LAL.html and https://www.basketball-reference.com/boxscores/pbp/202610210POR.html .

**NFL:** Inspected all six completed Patriots and all six completed Bears Weeks 1–6 descriptive PBP pages (12 games, 1,988 play entries including special teams and nullified plays). A text-based heuristic excluded 125 nullified/no-play entries but does **not** produce validated snap, route, or target counts. Confirmed nflverse 2026 full-season PBP release exists and was updated October 22 at https://github.com/nflverse/nflverse-data/releases/tag/pbp ; the full-league compressed file was **not** downloaded/parsed, because file acquisition was unavailable in the current runtime. Offline nflverse loader prepared separately in conversation artifact.

## First held-out test (not a production probability improvement)

Target: Q4 FGA relative to each game's two main Q1–Q3 shooters' earlier FGA per-quarter pace, pooled over both teams. Regress on **absolute Q3 score margin** using 14-fold *leave-one-game-out* evaluation. Flat baseline MAE **0.31977285**, score-margin model MAE **0.25366470** => **20.67% lower** on this extremely small two-day retrospective sample.

**Critical sensitivity falsification:** excluding Phoenix–Portland (41-point Q3 lead) reduces relative gain to **6.77%**; excluding **all three 30+ point Q3 gaps** reduces relative gain to **4.03%**. The useful signal is likely concentrated in an **extreme blowout/rotation regime**, not broadly predictive across close games. Requires independent future held-out slates. Observational, not causal. Forecasts made pre-tipoff cannot use future Q3 score; model its scenario distribution, while live end-of-Q3 predictions may use actual prior score state.

Other descriptive examples: Oct21 GSW–LAL after Q3 68–102, Curry and Doncic each **zero Q4 FGA**; PHX–POR 66–107 after Q3, Lillard, Avdija and Clingan each **zero Q4 FGA**. Oct21 ATL–ORL after Q3 99–100, Banchero and Jalen Johnson had multiple Q4 FGA.

## Proposed integration in existing ATLAS nodes, NOT deployed

1. **SCOUT/FILTER:** versioned source-approved NBA event feed; official NBA action IDs and update/correction audit; full nflverse game_id+play_id; score/source/time stamps; no raw copyright material committed.
2. **ORACLE + Game Sense:** predictive game-state trajectories, NBA possessions→rotation/on-court stint hazard→attempts/rebound chances→shooting/assists; NFL drives→pre-snap down/distance/score/OL-QB personnel→play call→routes, targets, rushes→yards, game totals; season baselines shrunk early season.
3. **EDGE THIEF:** block same-play leakage, stale social provenance, cross-game actor ambiguity, wrong player team, nullified NFL snaps, postgame info, unrealistic independent player/ticket simulation.
4. **PRICING + TACTICIAN:** use coherent shared-state Monte Carlo P(leg) and P(11)/P(10)/P(01)/P(00), compare only against validated market-time-matched sportsbook quotes; no independent edge estimated here.
5. **FORENSICS + CALIBRATOR:** hold fixed original baseline, frozen future scores and versioned probabilities; run incremental ablations +injury-role, +tempo/score, +lineup/OL, +verified social. Accept only demonstrated gain on future held-out games grouped by game/day, plus calibration and tail coverage.

## Gate status

- **Source discovery:** PASS (14 NBA source PBP and 12 NFL source pages; nflverse release verified).
- **Derived descriptive NBA score reconciliation:** PASS at extracted finals.
- **One-feature Q4 opportunity demo:** PASS exploratory, **not** calibrated or production.
- **Raw full-season NFL ingestion:** **BLOCKED / NOT PERFORMED**.
- **Live official NBA CDN raw-action adapter integration:** **UNTESTED ON REAL FEED**; synthetic validation tests only.
- **Independent pregame probability improvements / fair odds / +EV / runtime production proof:** **NOT PROVEN**.

An offline research artifact containing derived CSVs, NBA/NFL ingestion adapter prototypes, one-feature leave-one-game-out test and extreme-blowout sensitivity, and 8 passing synthetic/integrity unit tests is held in the conversation ZIP. No personal betting details, sportsbook slips, or source data dumps are included in this GitHub checkpoint.

**Status:** `REVIEW_ONLY_SHADOW | NO_DEPLOYMENT | NO_PROVEN_EV | NO_PRETEND_FULL_NFL_INGESTION`
