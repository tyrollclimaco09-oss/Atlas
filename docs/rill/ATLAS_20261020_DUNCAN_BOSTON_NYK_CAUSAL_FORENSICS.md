# ATLAS October 20, 2026 — Two-Game Causal Forensics
**Written:** October 21, 2026 AFTER both games; this is not a pregame prediction.  
**Scope:** Celtics @ Pistons; 76ers @ Knicks. Research/postgame validation only. No betting execution, no production model changes, no retroactive forecast modification.

## 0. Immutable pregame record — never overwrite with final scores
- SCOUT V2, created October 19, 2026: `docs/prospective/ATLAS_NBA_OPENING_SCOUT_WIDE_V2_2026-10-20.json`, blob SHA `ec22f9a25dd3654b40ca80725977eeb75dc4423c`. Captured **Duncan Robinson 3+ 3PM / 3PA** as PRIORITIZE, historical 2.9 3PM and 7.0 3PA, with Boston switching and new Detroit frontcourt as uncertainties. Captured Cade assist alternatives, Duren rebound alternatives, Brunson scoring and playmaking, Maxey role changes.
- Game Sense V3, observed 2026-10-19 22:43:35 CT: `docs/prospective/ATLAS_NBA_OPENING_20261020_FULL_GAMESENSE_RERUN_V3.json`, blob SHA `dcdbe4419429a77a15db102d1204755d31dce2ab`. Explicit Cade-pressure -> Robinson/Joe/Collins spacing -> teammate threes/assists mechanism; its illustration used Duncan **2+** 3PM (a *different expression* from the V2 3+ candidate). Also froze competing Knicks Brunson 25+ scoring-takeover, Philadelphia shooting-war, LeBron quarterback, and foul/bench-depth scripts.
- Source-conflict / rotation V5, captured October 20 at 00:45:45 CT: `docs/prospective/ATLAS_NBA_20261020_V5_SOURCE_CONFLICT_ROTATION_AUDIT.md` blob `49533b7e4abdb34c49616596e9762c33a31c13ce`. Boston preseason twin-big rotation; Duren preseason 3 REB in 20:18; Detroit Duncan Oct 16 preseason 1/4 3PM in 19:31; role ambiguity preserved. A single low-minute preseason 3PM sample did not erase the longer historical three-point prior.
- These archived pregame artifacts are **hypotheses**, not verified executable prices or independently calibrated probability forecasts. A prior user-reported real 3+ ticket requires original accepted-betslip receipt and ledger reconciliation; never infer stake/profit from an archived shadow candidate.

## 1. DET 121 vs BOS 113 (October 20) — genuine positive mechanism signal, not proof of EV
Sources:
- NBA finalized game: https://www.nba.com/game/bos-vs-det-0022600001
- Official Detroit full box: https://www.nba.com/pistons/game/0022600001-celtics-vs-pistons-detroit-mi-10-20-2026/box-score
- Boston own recap: https://www.nba.com/celtics/news/game-recap-20261020-keys-bosdet
- September 2 pregame explanation of Detroit off-ball Cade offense: https://www.nba.com/news/detroit-pistons-cade-cunningham-off-the-ball
- October preseason staff: https://www.nba.com/pistons/news/duren-obliterates-all-concerns-in-sparkling-debut-as-pistons-net-blueprint-win

**What happened:** Boston up to +22 early third; Detroit won by 8; Boston Q1–Q4 = 28/30/30/25, Detroit = 27/18/37/39. One DET 23–0 late-game run. Duncan: 27:49, 9 3PA, 5 3PM, 21 PTS, 15 fourth-quarter points. Cade: 22 PTS, 8 AST on 18 FGA. Duren: 22 PTS, 9 REB. Unexpected rotation catalyst Javonte Green had 19 PTS after not appearing in first half. Paul George: 38 PTS, 7/12 3PM; Jayson Tatum: 13 PTS on 6/23 FG, 0/7 threes, 11 AST.

**Hypotheses:**
- Duncan 3+ threes **HIT** (5). More modest V3 2+ also HIT. Volume: 9 3PA versus ~7.0 preseason-known previous-season attempts/game. This is supporting evidence for usable opportunity/role, not proof of the exact Cade-to-Duncan passing path or defensible implied edge at a particular bet price.
- Cade 8+ AST **HIT at boundary** (8), but 9+/10+ did not. A pass-first concept does not guarantee all assisted opportunities convert. Absence of verified potential-assist data prevents inference that Cade was the direct creator of all Duncan makes.
- Duren 10+ REB **MISSED** (9), validating need to account for rebound competition and missed-shot supply rather than copy ~10.5 RPG.
- Paul George/Boston **scoring allocation changed**: PG reached 38, Tatum only 13 despite 23 shots, and provided 11 AST. Do not infer Tatum had low usage solely from low points. This is *conversion vs volume* and player-creation redistribution, not just a lineup-minute issue.
- Detroit bench **Javonte Green substitution shock** matters. V4 mentioned him as a conditional end-of-bench player and warned that roster presence does not imply expected minutes. 19 unexpected points are a model-relevant tail event, not evidence it was pregame forecast.

**Duncan counterfactual mathematics:** If historical observed means were 2.9 3PM on 7.0 3PA, coarse rate = 41.43%. The observed +2 three-point attempts would add **0.83 expected makes** at that constant rate; shooting 5/9 exceeded the resulting 3.73 expectation by **1.27 makes**. This arithmetic separates opportunity from realized shooting luck but *cannot* identify true defensive gravity, individual game shot-quality, an ex ante matchup hit probability, or EV.
- Fixed-attempt iid-binomial illustration at 41.43% make probability: P(3+) at 5/7/9 attempts ≈ 34.2% / 61.1% / 79.4%. These are **sensitivity illustrations**, not a prospective minutes/3PA distribution, calibrated odds or an estimate that Duncan was 79.4% before the game. The 9 attempts were observed *after* the event.

## 2. PHI 106 vs NYK 100 — lost efficiency/spacing and transition control, not lost shot volume
Sources:
- Official NBA game with quarter scores: https://www.nba.com/game/phi-vs-nyk-0022600002?lid=6jxj1xa7r0k8
- NYK official final box: https://www.nba.com/knicks/game/0022600002-sixers-vs-knicks-new-york-ny-10-20-2026/box-score
- Shot-quarter chart: https://www.basketball-reference.com/boxscores/shot-chart/202610200NYK.html
- NY Post contemporary reporting on pace and drive-to-kick-out creation: https://nypost.com/2026/10/20/sports/the-glaring-76ers-advantage-that-sunk-knicks-in-opener-running-in-mud/

**What happened:** NYK led 58-54 at halftime; scored only 18 in Q3 while PHI scored 29, including an 11-0 closing PHI run. NYK Q1–Q4 25/33/18/24, PHI 23/31/29/23. NYK shot **35/94 (37.2% FG)** and 11/33 from three; PHI **37/89 (41.6%)**, 11/40 from three. The critical 2-point shooting gap: NYK 24/61 (39.3%) versus PHI 26/49 (53.1%). NBA team summary has PHI **24** fast-break points vs NYK **16** (do not substitute an inconsistent secondary-source estimate of 28). Brunson took 19 FGA but went only 6/19 FG, finishing 21 PTS with 8/8 FT. Towns 19 PTS / 12 REB, Drummond 14 REB in 24:27 incl. 7 offensive, Maxey 28 PTS with 2/9 3PM and 8/9 FT, Jaylen Brown 19 PTS.

**Hypotheses:**
- Pregame V3 'Brunson halfcourt scoring takeover' 25+ points **MISSED**: Brunson's 19 FGA reflect opportunity; 6 FGM show poor conversion. This should grade the *opportunity forecast* separately from the *threshold settlement*. Do not falsely claim the failed 25+ prediction was due to missing shot attempts.
- Brunson 20+ PTS would have HIT, but was not the same V3 forecast or a recorded executable quote. The observation is an alt-line sensitivity lesson, **not a retroactively earned winner**.
- Drummond rebound conditional role **materialized** (14 REB despite 24 minutes). Independent big minutes and 2PA misses can produce 14 boards, especially 7 offensive. We need actual team rebound supply and player share per court stint.
- Maxey points 22+ **HIT** (28), but 3+ threes **MISSED** (2). His role was as much creation/FTA as made threes; 'scoring' must not be collapsed into '3PM'.
- New Philadelphia LeBron/Brown arrivals complicate frozen 2025-26 player team/usage priors. Bench 3s from Simons (3) and KCP (2) matter; Knicks attention to star players can shift shot opportunity to other players. Specific defensive coverages remain unproved absent film/tagged clips.
- The ring/banner ceremony is a narrative context, **not a measurable causal loss explanation** on its own. We have objective shot conversion, Q3 stall, and transition differences.

## 3. Transferable comparison
| Mechanism | DET–BOS | PHI–NYK | Game Sense ownership |
|---|---|---|---|
| Role/off-ball relief | Duncan 9 3PA while Cade 18 FGA / 8 AST | PHI secondary options score as NYK concentrates on stars | Verified last season + preseason + lineup roles; SCOUT/VERIFY |
| Opportunity vs efficiency | Duncan 3PA and conversion both elevated; Tatum 23 FGAs but only 13 PTS | Brunson 19 FGAs but only 6 FGM; Maxey 2/9 3PM but 28 PTS | Separately model FGA, 3PA, FTA, shooting zones/variance |
| Sudden rotations | Javonte enters second half, 19 PTS | NYK Drummond's 14 REB in 24 mins | Five-man minute/overlap/bench substitution tails |
| Momentum and defense | DET 23–0 run, Boston +22 to loss | PHI closes Q3 11–0, NYK only 18 Q3 | State-conditioned transition/turnover/shot-run models |
| Playmaker × shooters | Cade pressure and wing 3PA thesis consistent with outcomes | PHI increased shot creation from new stars and role players | Pass-to-shot chain, not just a scorer's season average |

## 4. Immediate ATLAS implementation requirements (no extra nodes)
1. **Historical role-prior packet**: prior season minutes, 3PA/min, FTA/min, catch-and-shoot, last 2–5 preseason games **with exhibition reliability discount**, teammates' additions/removals and likely five-man overlap; none of these alone is a fair probability.
2. **Opposition response**: projected trapping, double teams, switches, hedge/drop, rim deterrence and resulting off-ball vs on-ball opportunities. Separate observed film tracking from analyst guess/Reddit repetition.
3. **Possession-derived player stat generator**: include missed shots and FTs, same possession OREB resets, on-court potential assists, teammate conversion, turnover state, 2-point vs 3-point distribution.
4. **Endogenous substitution/live state**: update rotation when coach unexpectedly plays bench shooter; track actual play-by-play foul/rotation shifts. No late-game use of stale Q1 player stats.
5. **100 Worlds comparison**: preserve *separately* pregame sampled worlds, updated live worlds and realized world. Produce both player opportunity and conversion scores, a 2x2 ticket truth table and precise failures.
6. **Three falsifiers per thesis**: shooter attempts/minutes fall, shot-quality/defensive response differs, or lineup role expires. Alternate threshold ladder priced after research; no 'winning pick' learned as inevitable from postgame stats.
7. **CALIBRATOR**: matched forward samples for all picks *and passes*, with no-social/simple-rate baseline; test role models by grouped season and date. Price and CLV only from authenticated account-matched evidence.

## 5. Classification & release
- **Duncan 3+ — pregame hypothesis captured, outcome HIT, ex-ante edge UNKNOWN.**
- **Brunson 25+ — pregame scenario captured, outcome MISS, opportunity-volume hypothesis partially supported, conversion assumption failed.**
- **Game winners**: DET and PHI are finalized results; this document does not invent pregame moneyline recommendations.
- **Signal validation**: a single positive result is not a calibrated model. Avoid post-selection winner overfitting and injury/role hindsight.
- RILL/SCOUT hypotheses remain unverified until independent origin and time context checked. New retrospective data must never be merged into the original pregame feature freeze.
- **Status: forensic research artifact, not a production scoring model.** Await prospective repeatability.

**ATLAS doctrine:** Evidence over confidence; mechanism before result; one locked thesis but challengers preserved; no loss chasing, no automated bets.
