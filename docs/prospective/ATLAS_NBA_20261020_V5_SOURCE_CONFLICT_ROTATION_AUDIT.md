# ATLAS NBA Opening Night V5 — Source Conflict + Rotation Opportunity Audit

**Captured:** 2026-10-20 00:45:45 America/Chicago (pre-tip)  
**Scope:** Boston @ Detroit (2 PM CT), Philadelphia @ New York (6 PM CT), OKC @ San Antonio (8:30 PM CT).  
**Branch:** `review/pass0-slate-regression-2026-10-16`.  
**Status:** REVIEW_ONLY_SHADOW, source-linked audit, no bets, no Supabase writes, no production promotion, no verified executable DraftKings betslip.  
**Parent:** `docs/prospective/ATLAS_NBA_OPENING_20261020_DEPTH_MARKETS_GAMESENSE_V4.md`, immutable prior pregame observations retained.

## New material observations and decision changes

### BOS @ DET — Duren rebounds DOWNGRADE; Pritchard assists UPGRADE for investigation
1. **Official Detroit preseason Oct 16 vs Toronto:** Duren 20:18, 14 points, **3 rebounds, 6 turnovers**, while John Collins 22:26, 12 points, **8 rebounds**. Duncan Robinson 19:31, 4 three-point attempts, 1 make; Ausar Thompson 19:24, 12 points, 4 assists. Toronto rested starters, so the exhibition is **not** a future forecast. However, it refutes assumptions that all Duren minutes automatically produce 10+ rebounds and Collins does not compete on the glass.
2. **Official Boston preseason Oct 14 vs Charlotte:** Mitchell Robinson 17:18, 7 rebounds, 3 blocks (3 offensive rebounds), Jayson Tatum 29:18, 3-for-8 threes, 6 assists, Paul George 24:09, 1-for-7 threes, 4 assists. The lineup started Jordan Walsh and Robinson; Payton Pritchard off the bench delivered **11 assists and zero turnovers** in contemporaneous coverage. Injury report lists only Devin Carter out, but Boston's opening starter role remains **not confirmed**.
3. **Role graph:** If BOS doubles bigs, Detroit's Duren, Collins and Ausar cannot all receive full rebound opportunity vs the same missed shots. If DET goes Collins-at-5, Duren minutes weaken. If Pritchard runs bench units, starting status is a poor proxy for assist volume; his actual touches and overlap with Tatum/George matter.
4. **House Mirror evidence:** Oct 15 ESPN-carried DK historical quote: Duren rebounds O/U 9.5, Cade assists O/U 9.5, White 3PM O/U 2.5, Pritchard points 15.5 but his **assists were NOT posted at that archived DK read**. A third-party aggregation subsequently listed Pritchard assists at 4.5 across books (not established at DK). Do not call 4.5 a DK quote.
5. **Decision DELTA:** `Duren 10+/12+ rebounds: PRIORITIZE -> INVESTIGATE/WATCH` pending >26-minute role confidence; `Pritchard assists: WATCH -> INVESTIGATE` pending minutes and DK market; `Mitchell Robinson blocks/OREB: DISCOVER`, but 17-minute preseason sample does not support a reliable 2+ blocks forecast; `Cade assists + Duncan threes: STILL RESEARCH` pending Duncan attempts/pace.

Source receipts:
- https://www.nba.com/pistons/game/0012600056-raptors-vs-pistons-detroit-mi-10-16-2026/box-score
- https://www.nba.com/celtics/game/0012600017-hornets-vs-celtics-boston-ma-10-14-2026/box-score
- https://www.celticsblog.com/celtics-scores-results/147696/celtics-beat-hornets-114-93-in-preseason-dress-rehearsal
- https://www.celticsblog.com/boston-celtics-news/148052/celtics-pistons-opening-day-injury-report
- https://www.scoresandstats.com/blog/nba-player-props-today/
- https://www.betravon.com/nba-player-props/celtics-vs-pistons-2026-10-20

### PHI @ NYK — distinguish *opportunity transfer* from easy star unders
1. **Confirmed roster regime change:** Philadelphia's starting offensive core is LeBron, Brown, Maxey, Embiid and Edgecombe. Previous-team season points averages from 2025-26: Maxey **28.3**, Brown **28.7**, LeBron **20.9**, Embiid **26.9**. Oct 15 DK **historical base points lines**: **21.5, 19.5, 16.5, 22.5**, respectively. Large step-downs are an **existing bookmaker role adjustment**; these gaps are NOT bookmaker errors or automatic under edges.
2. **Bench risk:** Barlow OUT with back stress injury, Hukporti OUT season, Fall out; Bona, Wade and Simons uncertain across October 19 reports. If Embiid has limited minutes/fouls and reserves are unavailable, Knicks could gain rebounding opportunity. If Simons is active, reserve scoring/3PA distribution changes. Day-of statuses required.
3. **Counter-mechanism:** Knicks championship starters Brunson, Hart, Bridges, Anunoby and Towns already share roles, but new Philadelphia offense can either speed up the game or bog down in early chemistry. On-court role of LeBron (primary organizer vs secondary cutter) changes his assists and Maxey's spot-up 3PM; defending champs' ring ceremony is motivational context **not quantitative probability**.
4. **Old quotes only:** Oct 15 DK LeBron AST 7.5 (-102 O), Maxey 3PM 2.5 (-102 O), Towns REB 11.5 (-101 O), Brunson PTS 27.5 (-104 O), Hart REB 7.5 (-129 O). Never reuse as current or combine SGP payout by multiplying legs.
5. **Decision DELTA:** `LeBron 8+ AST + Maxey 3+ 3PM` investigation **survives** as one causal script; `Brown/Maxey/LeBron high points overs` lose priority until possession split observed; `Towns/Hart rebounds` conditional on Embiid and frontcourt minutes; `OG steals/defensive stocks` relevant but NOT yet implemented in existing OI-01 shadow code.

Sources:
- https://www.reuters.com/sports/knicks-chase-back-to-back-banner-nba-built-stop-dynasties-2026-10-16/
- https://www.libertyballers.com/76ers-injury-report/99328/philadelphia-sixers-injuries-dominick-barlow-first-apron-cap
- https://www.nba.com/game/bos-vs-phi-0012600018
- https://www.scoresandstats.com/blog/nba-player-props-today/

### OKC @ SAS — new real three-guard observation, not just a story
1. **Spurs Oct 16 preseason vs Sacramento:** Harper 20:38, **19 points (7-for-12 FG), 3-for-6 threes**, 4 assists; Fox 22:28, 16 points and 3 assists; Castle 23:23, 13 points and 5 assists; Vassell 21:32, **2-for-6 threes**, 4 assists and 6 rebounds; Champagnie 17:22, **3-for-10 threes**; Wembanyama 17:23, 12 points, 8 rebounds, 2 blocks. Spurs led by a huge margin and shortened starter minutes, so this is an opportunity **mechanism illustration**, not a projection.
2. **Spurs Oct 15 vs Phoenix:** The new Fox–Castle–Harper opening group reportedly shot **1-of-10 with three points before first substitution**, despite eventually winning. That shows the three-guard chemistry can **fail early**, challenging our 'all three guards thrive' game script.
3. **Lineup regime:** Fox, Castle, Harper, Vassell, Wembanyama projected; Tobias Harris out, increasing bench-wing/forward substitution opportunities. Thunder likely begin SGA, Wallace, Jalen Williams, Holmgren, Hartenstein, with reserve Caruso/Ajay Mitchell and others; verify day-of.
4. **Pair alternatives:** Harper 10+ points + Vassell 2+ threes remains **a research double**, but Harper's points may rise when Castle/Fox assists fall (shared creation); Vassell's outside makes do not require Harper's points, and Champagnie competes for wing 3PA. SGA assists can rise in a containment script but requires teammate converted FG.
5. **Decision DELTA:** `Harper 10+ PTS + Vassell 2+ 3PM: INVESTIGATE` with new preseason volume receipt; `Champagnie 3PM` becomes **conditional depth scout**; `SGA 15+ AST: EXTREME_TAIL_ONLY`; `Wembanyama 42.5+ PRA` is a user-proposed line not confirmed DK. Oct 15 DK historical Wembanyama PRA was **41.5**, SGA AST **6.5**, Castle AST **5.5**, Chet rebounds **7.5**.

Sources:
- https://www.si.com/nba/scoreboard/kings-vs-spurs-10-16-2026-1485
- https://www.expressnews.com/sports/spurs/article/3-takeaways-spurs-three-guard-lineup-suns-22477861.php
- https://www.expressnews.com/sports/spurs/article/spurs-unveil-3-guard-lineup-de-aaron-fox-stephon-22477619.php
- https://www.expressnews.com/sports/spurs/article/san-antonio-spurs-okc-thunder-how-to-watch-22482941.php
- https://www.scoresandstats.com/blog/nba-player-props-today/

## House Mirror / source-conflict evidence — REJECT, not a play
- An article updated **2026-10-20 00:11 ET** at https://www.dimers.com/nba/news/nba-player-props-10-20-2026-ac claims massive positive edges (e.g., Harper o4.5 rebounds at +257 and purported 55.5% forecast) but labels its actual listed quote as `@ polymarket`; other quotes `@ kalshi`. These are **not DraftKings sportsbook quotes**, and differ in access, instruments and settlement rules. The article's KAT recommendation changes from **over 4.5 assists** to a textual **over 15.5 assists** claim. Therefore `book_identity=CONFLICT`, `threshold_consistency=CONFLICT`, `price_timestamp=UNVERIFIED`, `independent_skill=UNPROVEN`. Do not pass its computed EV to PRICING.
- A public DraftKings player-specific page for Derrick White shows categories covering counting stats, combos and alternate milestones, including visible 3PM O/U 2.5 at -120/-110 on crawl; this proves a **public surfaced price observation**, not that exact price is still currently valid/executable in user jurisdiction. The Oct 15 ESPN-carried archived DK 3PM O 2.5 was -114; without matching source observation timestamps **do not claim proven movement**.
- Third-party BETRAVON comparison reports Pritchard AST line 4.5, Ausar steals+blocks 3.5 and Mitchell Robinson blocked shots 1.5 across selected books. These demonstrate **additional market families**, NOT DK bookability or confirmed correlated SGP combinations. It also mixes PrizePicks with sportsbooks; do not merge product classes.
- DK DraftKings SportsMCP connected provider supports league schedule, scores and team stats, not authenticated regional sportsbook prop-market execution prices. Until a same-source eligible offer ID, event, market rules, timestamp, and readable betslip exist: **all current DK executable prices = null**.

Sources:
- https://www.dimers.com/nba/news/nba-player-props-10-20-2026-ac
- https://sportsbook.draftkings.com/players/basketball/derrick-white-odds-33364
- https://www.betravon.com/nba-player-props/celtics-vs-pistons-2026-10-20

## Evidence gate and next pass checklist (no automations created)
- Earliest game is BOS @ DET **14:00 CT**. Official/injury and rotation check roughly 13:15–13:45 CT; PHI @ NYK 18:00 CT check ~17:15–17:45; OKC @ SAS 20:30 CT check ~19:45–20:15. Reverify team and date in live scoreboard.
- Preserve distinct `evidence_observed_at`, `source_published_at` (null if not present), `book_quote_at` (null now), `event_start`, `market_id`, `official_roster_status`, `minutes_projected_and_method`, `scenario_hypothesis`, and `candidate_result_state`.
- Recompute opportunities using actual expected starter/bench overlap; ensure conservation of shared shots, assists, rebound opportunities and usage.
- **No fake statistical forecast:** Historical postseason co-hit counts and deliberately hypothetical OI scenario worlds do not imply tomorrow's conditional probabilities. The installed `outcome-intelligence-shadow.cjs` OI-01 engine does not yet handle NBA steals, blocks, PRA or double-double. `house-mirror-shadow.cjs` is for SYNTHETIC_DEMO quotes only.
- Prefer singles or a two-leg expression only *after* independent conditional probability and actual DraftKings price. SGPs require a whole-ticket accepted quote, cannot derive payout by multiplying singles. Pick6 separate DFS event/contest.
- Maintain SCOUT → FILTER/VERIFY → Game Sense → ORACLE/EDGE THIEF → PRICING/House Mirror → KAIROS/SENTINEL → TACTICIAN → HUMAN FINAL GATE → LEDGER/FORENSICS/CALIBRATOR. With absent data **SENTINEL HOLD**; no bets.

**Evidence quality result:** This V5 pass intentionally **demoted** an earlier Duren rebound idea, upgraded Pritchard/Spurs volume research cautiously, and explicitly **rejected** unreliable external edge claims. Quality over total candidate count.
