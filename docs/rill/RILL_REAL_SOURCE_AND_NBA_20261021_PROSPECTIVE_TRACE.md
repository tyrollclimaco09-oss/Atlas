# ATLAS — October 21 NBA RILL Live Evidence + Prospective Thesis Freeze

**Mode:** PROSPECTIVE SHADOW / NOT AN EXECUTED WAGER  
**Game:** Golden State Warriors @ Los Angeles Lakers, 2026-10-21 21:00 CT (scheduled).  
**Research cutoff:** 2026-10-21 daytime, before tipoff; sources observed approximately 17:50–17:57 UTC. Exact web quote observation times are not exchange-certified.  
**Primary thesis key:** `NBA_20261021_GSW_LAL_LUKA_PRA50_V1`.  
**Exact market:** Luka Dončić 50+ combined points, rebounds, assists.  
**Official book interface:** Account-executable DraftKings price UNVERIFIED.

## Historical factual baseline — research-only
- Luka Dončić reached 50+ PRA in **35 of 64** NBA regular-season games in 2025-26 = **54.6875%**.
- His regular-season means: 33.5 PTS, 7.7 REB, 8.3 AST across 64 games; context, not a joint threshold probability.
- The matchup includes availability losses among Warriors defenders and rotation players, notably Jimmy Butler, Moses Moody, Brandin Podziemski and Kristaps Porziņģis.
- Historical wins may not transfer to 2026-27 due lineup, offense, health, defensive assignments, overtime, rotation, and game state.

Sources:
- https://www.statmuse.com/nba/ask?q=luka+doncic+games+with+at+least+50+points%2Brebounds%2Bassists+this+season
- https://www.nba.com/lakers/news/luka-doncic-earns-sixth-all-nba-first-team-honor
- https://www.sfchronicle.com/sports/warriors/article/warriors-brandin-podziemski-miss-opener-l-a-22486550.php
- https://dknetwork.draftkings.com/draftkings-sportsbook-player-props/?tb_view=2

## Price tape — observation-grade only
- Public DraftKings Network page appeared with **+103**, corresponding break-even 49.26%, on one observation.
- A subsequent page response displayed **-101**, break-even 50.25%. These quote snapshots may come from cached/recycled content and **do not prove actual executable line movement**, CLV or sportsbook acceptance.
- Do **NOT** promote +103 or -101 to VERIFIED_EXECUTABLE quote.

## Statistical sensitivity check (not calibrated betting EV)
Historical 35/64 = 54.69%. Beta(0.5,0.5) posterior using 35 successes / 29 failures has mean 54.62% (assumes stationary exchangeability).
At +103, using historical posterior mean would imply approx +10.9 cents/$1 expected net return.
A **hypothetical -5 percentage-point** role/regime haircut gives ~49.62%, nearly equal to the +103 break-even of 49.26%; at -101, that scenario is negative expected value.
The -5pp shift is a sensitivity assumption, **not learned from data**. Posterior uncertainty and model regime shift have not been prospectively calibrated.

**WATCH policy / one-lead lock**: Only investigate if user-executable DraftKings quote is at least +110 for 50+ PRA, final lineup/availability confirms Luka active, and material playing-time caveats do not emerge. At publicly surfaced -101, **PASS / NO BET QUALIFIED**. +110 is a prospective experimental trigger from the pessimistic scenario with a small buffer, not a proven calibrated fair-price floor. No stake recommendation from this packet, no claimed profitability.

## RILL real data intake — one manual observed post
Captured October 21 at 17:56:06 UTC by connected operator SQL write to **existing** `atlas_human_signal_registry_v1` and `atlas_human_signal_releases_v1`, followed by SQL readback:
- `source_key=RILL:REDDIT:zealousidealquit879`
- `release_id=20cc19f3-f7b5-44b0-aa52-8c59917e4180`
- Source Reddit discussion: https://www.reddit.com/r/sportsbook/comments/1xbc5sc/nba_props_daily_102126_wednesday/
- Claim observed: public commenter advocates Tyrese Haliburton assists over 8.5, claims Pacers fully healthy, references claimed H2H. **Not verified.** Independent injury report contradicts being fully healthy (T.J. McConnell and Aaron Nesmith out).
- Captured without independently proven original publication time; `released_at = observed_at` with `released_at_trust=OBSERVED_AT_ONLY`; `exact_odds=null`; `production_influence=false`; `production_authority=false`.
- This **proves a manual shadow database ingress and readback**, **not** a successful authorized request to the new Supabase Edge Function. The latter remains unproven, with no Supabase signed-in Auth users currently.

## Rejected false edge — Cam Spencer 2+ threes
- 2025-26: 44/72 = ~61% over 1.5 threes, avg 4.5 3PA/23.8 minutes.
- Quoted public DraftKings ~+138 from a third-party odds snapshot, implying 42.02% break-even; no current account confirmation.
- Recent preseason minutes: 14–16; possible projection significantly lower than last season. Naively applying old hit rate is a likely regime mismatch. **INVESTIGATE, NOT BET**.
Sources:
- https://steezanomics.com/lab/players/cam-spencer/?line=3.5&market=Assists
- https://www.nba.com/player/1642285
- https://www.basketball-reference.com/players/s/spencca01.html

## Action gates
1. No actual bets placed, no account bankroll queried or inferred.
2. No conclusion that today's betting will recoup past losses.
3. No price or score/settlement updates after this packet may be used to alter its original baseline; corrections append as new versions.
4. No autonomous monitoring, scraping or betting. Human Final Gate remains authoritative.
