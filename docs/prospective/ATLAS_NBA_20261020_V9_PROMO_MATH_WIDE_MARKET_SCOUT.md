# ATLAS V9 — 2026-10-20 NBA Wide Market & Conditional Profit Scout

## Scope and authority
- 3 game opening-night NBA slate, America/Chicago: BOS @ DET 14:00, PHI @ NYK 18:00, OKC @ SAS 20:30.
- **Review only.** Neither a sportsbook betslip nor an authenticated sportsbook API quote was obtained. Sports-data connector offers schedules/scores, **not** regional player prop offers or wager actions. Prior research/freeze files preserved.
- Research current as the early hours of October 20, 2026 CT. Each source's public publication time differs from its scraped/displayed odds time. Never represent a crawler timestamp as an authenticated DK offer quote.
- **No confirmed positive-EV selection.** No automatic stake, no betting execution, no canonical Supabase changes, no independent calibrated injury-conditioned player probability model.
- Earlier V1–V8 slate persisted separately. This pass deliberately shifts from one 4-leg 3-minute points screenshot to exhaustive market families, credible bankroll-aware promo mechanics, team-game sides, and fielded player roles.

## Structural search result #1: Promotional overlay may dominate unboosted prop discrepancies
Official public DK sportsbook Promotions page lists three NBA Threes Bet & Get event-specific promotions:
- "Get $1 in Bonus Bets for every 3PT made" for BOS–DET, PHI–NYK, and OKC–SAS. **Displayed public**, *not confirmed eligible for operator*.
- Source: https://sportsbook.draftkings.com/promos/sportsbook/No ; https://sportsbook.draftkings.com/promos/sportsbook/New%2520s
- A RealGM explainer (https://basketball.realgm.com/betting/news/nba/dk-76ers-knicks-threes-promo/) describes a PHI–NYK example: opt-in, at least $10 cash wager, eligible odds >= -200, reward $1 in Bonus Bet value per made three of either team, no qualifying boosts. However its promotion date range is logically inconsistent ("Oct 24 through Oct 20"), so **DO NOT TREAT ITS LIMITS/ELIGIBILITY AS OFFICIAL**. User must see exact Rewards terms in DK. Promotions may differ by jurisdiction/account and are not stackable unless specified.
- Historical team made threes/game from 2025-26 FOX Sports: Boston 15.4 + Detroit 11.0 = 26.4; Philadelphia 12.8 + NYK 14.9 = 27.7; OKC 13.7 + SAS 13.1 = 26.8. These are **past roster team-average sums, NOT 2026-27 projected game makes**. Offseason personnel and 3PA profile changes invalidate forward certainty.
- Example conditional EV of qualifying $10 wager at -110, **assume** actual p=50%, historical/research-only reward face=25 Bonus Bet dollars, bonus conversion realized value fraction c. Base wager cash EV = 0.5*(100/110 * 10)-0.5*10 = **-$0.4545**. If all qualifying terms met and unconditional 25 Bonus Bet dollars actually paid, total conditional EV = -$0.4545 + 25*c. At c=0.30: +$7.0455; c=0.50: +$12.0455; c=0.70: +$17.0455. NONE of c, reward total, offer eligibility, payout cap, or user bankroll is known. This is **not a promise or a stake recommendation**. Bonus Bets are not cash and stake is generally not paid back upon Bonus Bet redemption. If terms forbid or offer unavailable, promo EV = 0.
- Additional third-party-listed DK promos: Covers reports 50% "Player Combos" Profit Boost and King of the Court. Sources https://www.covers.com/betting/bonuses/draftkings-promo-codes ; https://www.sportsbettingdime.com/promos/draftkings/ . Not independently visible as an eligible user-specific token. Official application mechanics: https://help.draftkings.com/hc/en-us/articles/7525822014483-How-do-I-apply-a-boost-US .
- Exact conditional boost math: $10 stake at -110 ordinarily yields $9.0909 profit if win (win prob break-even 110/210 = 52.38095%). A genuine 50% **profit** boost on an eligible -110 SINGLE yields $13.6364 win profit, making break-even 10/(10+13.6364)=**42.30769%**. Strong cash EV only if true conditional p exceeds 42.30769%; margin/terms and qualification must be verified. This result does not prove any particular prop fair.
- 30% future profit boost and NBA King of Court by third-party reporting; do not stack, infer default eligibility, or blindly spend $30 on 3 games. Roster confirmation and capped operator bankroll gate apply.

## Structural search result #2: Game line disagreement, not verified profit
- Reproducible **secondary** DK odds sources disagree, varying by quote date and region. Example https://sharpshotpicks.com/nba-starting-lineups/ last research displays BOS -1.5 -108, DET +1.5 -112, BOS ML -120, DET ML +100, total 220.5; a different source https://www.actionnetwork.com/nba/odds lists another blend of spreads and +/- odds, not all DK.
- Independent external model https://hoopvantage.com/game/401909088 displays DET by **0.9 points**, calibrated win ~53%, explicitly fits margin normal residual spread **11.8 points** (https://hoopvantage.com/methodology). Conditional at DET +1.5, model P(cover) = Phi((0.9+1.5)/11.8) ≈ **58.06%**. At secondary displayed DK -112 break-even **52.83%**, theoretical gap **+5.23pp**, theoretical EV ROI about **+9.90%**. These are **not ATLAS independently verified model probabilities or proven edges**, and depend completely on the fitted normal model + lineup accuracy + exact still-available price.
- Crucial model input critique: HoopVantage assigns DET Taurean Prince **24 min** while Prince was questionable/personal in October 19 status; DET Duren only 23 and Collins only 19; BOS Robinson only 12 and Queta 21; lineups may diverge materially. https://hoopvantage.com/game/401909088 vs injury https://dknetwork.draftkings.com/2026/10/19/dean-wade-headlines-nba-injury-report-tuesday-10-20-26/
- Other public models are NOT consensus: Dimers predicts BOS 112 to DET 110 with near 50/50 spread probabilities (https://www.dimers.com/nba/predictions/2026_1_det_bos), OVERLINE BOS 111.37–110.80 DET and ~52% BOS (https://overlinesports.com/game/nba/401909088), CourtFrame DET by 2.3/58% (https://www.courtframe.com/games/41600). CourtFrame self-markets 7/7 agreement among its OWN variants, **not 7 independent providers**. ScoresAndStats reports 57% DET home ML based on home/away win-rate simple heuristic, **not a modern lineup-aware model**: https://www.scoresandstats.com/predictions/basketball/nba/boston-celtics-vs-detroit-pistons-odds-picks/2026-10-20/
- Proper state: `DET +1.5` *PRICE-AND-LINEUP INVESTIGATE* only, no wager. Conditionally re-evaluate if +1.5 -112 or better is truly executable and a corrected independently calibrated model gives >52.83% cover chance with safety margin.

## Official injury / rotation gate
- NBA opening tripleheader official https://www.nba.com/news/nba-rosters-set-for-2026-27-regular-season ; games start 3pm, 7pm, 9:30pm ET.
- NBA lineup aggregator https://sharpshotpicks.com/nba-starting-lineups/ reports **0/6 confirmed**, all six merely projected near midnight ET; Boston fifth starter has conflicting projections (Walsh vs Scheierman vs Pritchard/Queta). No lock.
- DK Network Oct 19 injury https://dknetwork.draftkings.com/2026/10/19/dean-wade-headlines-nba-injury-report-tuesday-10-20-26/ says Simons, Bona, Wade, Prince QUESTIONABLE; Barlow and Harris OUT. Philadelphia injured bench can yield Walker minutes but doesn't imply sportsbook edge before role/status and market availability.
- Spurs head coach verified preseason named Fox/Castle/Harper/Vassell/Wemby starting five; OKC expected SGA/Wallace/Jalen Williams/Chet/Hartenstein. https://www.expressnews.com/sports/spurs/article/three-takeaways-spurs-126-97-preseason-rout-22479433.php
- Detroit versus Boston defensive pressure + Detroit additional 3PT specialists vs BOS Robinson/Queta rebound/screen workload; PHI four creators plus Knicks defense; SAS three guards vs OKC two bigs and Wallace/Caruso pressure.

## Wide market lanes (DO NOT ASSUME ALL OFFERED)
1. Game markets: ML, spreads, alternative spreads, totals, team totals, quarter and half team totals and point spreads.
2. Player full-game: points, rebounds, assists, 3PM, steals, blocks, 3PA (only if posted), combos P+R, P+A, R+A, PRA, stocks (steals+blocks) if offered.
3. Milestone: 10+/20+/25+/30+ points, 2+/3+/4+ made 3s, 5+/8+/10+ AST, 8+/10+/12+ REB, double-double/triple-double, blocks ladder.
4. Period: 1Q player points, first-half AST/3PM, first 3-minute scoring props when eligible; high uncertainty, not foundation.
5. Event: "first to" opening tip, first basket, first make blocked by October 16 NBA authorized partner restriction. **Do not scout banned first-of markets as executable**. Source https://www.nbcsports.com/nba/news/nba-works-with-sportsbook-partners-to-remove-specific-wagers-prop-bet-parlays-on-games
6. Bet construction: SINGLE, DOUBLE, SGP, SGPx, CROSS_GAME, ROUND_ROBIN; require actual whole-combo quote and DK acceptance. Pick6 is separate DFS contest, cannot assign sportsbook EV.
7. Promotional overlay: Threes Bet & Get, Player Combos boost if eligible, King of Court if eligible. Consider qualifying min stake and cash-equivalent bonus conversion. Promotional stacking is NOT assumed.
8. Market integrity: no phantom book identities, comparable sides and settlement, source/quote timestamps, same region and market threshold, no conflating Kalshi/Polymarket/Pick6/DK.

## Player-market finalist research lanes
### Celtics @ Pistons
- Cade AST and P+A vs Duncan Robinson and Isaiah Joe 3PA; defender doubles can boost assist opportunities but made baskets necessary.
- Pritchard bench assists / White threes; Boston wing/center starters unconfirmed.
- Duren REB under/over sensitivity to Collins-at-five and Boston screens/rebounds; earlier V5 downgrade preserved.
- Ausar Thompson steals+blocks *OI-01 unsupported*, monitor role and official market.
- **NEW** DET +1.5 spread possible model-based discrepancy with countermodels strongly disagreeing, potentially sharpened by actual injury/lineup.
### 76ers @ Knicks
- LeBron AST / Maxey 3PM paired Game Sense, but huge 4-creator sharing; early-season variance.
- Brunson PTS or P+A vs Knicks half-court environment; Towns REB/PA and Hart RA compete.
- Edgecombe 3+ AST and depth Simons/Bona/Wade question; Walker REB/PR if minutes and offer verified.
- Player Combo Profit Boost *only* if user eligible token and actual line has independent fair model.
### Thunder @ Spurs
- Wemby blocks vs double-double vs PRA alternative expressions, not auto stack.
- Harper PTS, Vassell 3PM/3PA and Castle AST depend on three-guard overlap.
- SGA AST low/medium ladder vs 15+ extreme tail; rule enforcement does not guarantee lower points.
- Hartenstein AST vs Holmgren rebounds and Wallace steals; existing Outcome Intelligence code does not support steals/blocks or PRA/double-double.
- Spurs heavy defensive impact could show in team/game total or player shot selection without matching Wemby PRA over.

## What the October 20 socials actually show
- https://www.reddit.com/r/sportsbook/comments/1xaeuha/nba_props_daily_102026_tuesday/ social posts have high bankroll/win-rate claims and picks (Cade 23.5 points at Bovada -135; SGA 6.5 AST; Wallace steals; Harper rebounds; first-game parlays). **No timestamped DK accepted betslip, audited sample or validated edge**.
- One poster says Detroit "added no scorers" and Boston "added no defense," which fails the current roster audit (DET added shooters Joe, Boston added Mitchell Robinson). Social hypothesis, not source.
- https://www.reddit.com/r/sportsbook/comments/1xaets0/nba_betting_and_picks_102026_tuesday/ has opposing opinions BOS vs OKC, tiny unsourced sample; not a market signal.
- ESPN/beat reporter source should outrank Reddit/X anecdote for role, health, team chemistry; official injury report outranks both for availability.

## Profit / bet gate
- Foundation: *unapproved* until true current DraftKings sportsbook offer and model-proven fair probability.
- The **best distinct opportunity class** found in this pass is account-eligible **promo overlay** rather than a demonstrated naked market inefficiency. But reward limits/bonuses must be verified in operator's Rewards page; RealGM listing has inconsistent dates and DK public landing page hides full terms.
- Conditionally evaluate `DET +1.5` under a lineup-corrected model; avoid re-labeling external model as ATLAS oracle.
- No approved ticket or stake. Preserve user-set bankroll caps and avoid chasing high returns. Do not put $10 on each game solely for a promo when bankroll cannot comfortably handle it.
- At 13:15–13:45 CT check BOS–DET; at 17:15–17:45 CT PHI–NYK; at 19:45–20:15 CT OKC–SAS. Recheck offered market, user-specific promo token and whole betslip. If not available, PASS.

## Reproducible computations
- Profit boost break-even at -110 / 50% boost = 10/(10 + 1.5*(1000/110)) = 42.30769%.
- Without boost at -110 = 110/(110+100)=52.38095%.
- DET +1.5 ATS at margin μ=DET+0.9, sd=11.8 implies P=(normalCDF((μ+1.5)/11.8))≈0.580584826; DK -112 break even 112/212≈0.528301887; conditional ROI=0.580584826*(100/112)-(1-0.580584826)≈0.098964; **only** if external model/input correct and price available, neither proven.
- Promo bet-and-get toy reward illustration: 2025-26 average threes per matchup roughly 26.4/27.7/26.8; these are not forecasts and not guaranteed bonus credits. Real value of Bonus Bets below face and eligibility uncertain.
