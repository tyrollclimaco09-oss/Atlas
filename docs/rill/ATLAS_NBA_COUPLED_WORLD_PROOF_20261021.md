# ATLAS — October 21 NBA Coupled Opportunity & Calibration Checkpoint

**Mode:** SHADOW / read-only betting posture / zero sportsbook execution.  
**Review:** https://github.com/tyrollclimaco09-oss/Atlas/pull/11 (draft), branch `review/rill-live-intake-2026-10-21`.  
**Freeze:** Before October 21 Charlotte–Brooklyn tipoff. Only pregame research and third-party odds are used.  
**Source model:** GameSense existing NBA 100 Worlds; new `nba-rebound-opportunity-coupled.shadow.cjs`.

## Why this targeted pass was necessary

Prior implementations simulated player rebounds and assists independently of whole-game missed shots / made teammate FG. This is an important physical consistency risk. The historical 2025–26 mean may look right even when a particular simulated world implies too few missed shots or too few team rebounds to support a player result. More Monte Carlo draws cannot repair an incorrect structural model.

**Correction:** For CHA @ BKN only, consume the **same 12,000 full game worlds** used by the slate run. For each world, fix the simulated score, assign a feasible team shooting decomposition (2PM/3PM/FTM), generate field-goal misses, allocate every missed field goal exactly once to offensive rebound / defensive rebound / dead-ball, then allocate Sharpe individual ORB/DRB from BKN's resulting team rebound pool. All other Brooklyn players are aggregated. Sharpe simulated scoring must fit within team FGM and FT and assists within teammate FGM; team 240 player minutes (265 in sampled 1OT) and scoreboard are conserved. This is **NOT** an actual possession-by-possession or five-man rotation simulator.

### Genuine evidence (2025–26 historical season)

- Brooklyn (per game): 84.5 FGA, 37.5 FGM, 10.3 ORB, 29.0 DRB, 23.0 FTA, 25.0 AST, ~97.06 pace.
- Charlotte: 88.9 FGA, 40.9 FGM, 12.8 ORB, 33.3 DRB, 21.7 FTA, ~96.80 pace.
- Day'Ron Sharpe: 62 games, 1160 recorded season minutes, 171 ORB, 242 DRB, 413 total rebounds, 540 points, 145 assists. Full player log separately reconciled to 413 total rebounds.
- Primary sources: https://www.basketball-reference.com/teams/BRK/2026.html ; https://www.statmuse.com/nba/ask/which-team-is-better-this-year-brooklyn-nets-or-charlotte-hornets ; https://www.basketball-reference.com/players/s/sharpda01.html .

### Structural tests (PASS in GitHub CI)

- Score conserved: `2 * teamFGM + 3PM + FTM = team score`.
- Rebounds conserved: each missed field goal credits one ORB, one opponent DRB, or uncredited dead-ball; team boards = player Sharpe boards + other-team-player boards, by ORB/DRB split.
- Assists constrained: Sharpe assists do not exceed teammate made field goals. Points and FT allocations cannot exceed team totals.
- Team player minutes conserved: Sharpe minutes + teammates minutes = 240 (or 265 if simulated one OT).
- 2x2 Sharpe rebounds 9+ / assists 3+ outcomes exhaust all simulated worlds; alt-line thresholds monotonically decrease as thresholds rise.
- Fail-closed on tampered historical rebound totals, malformed full game world, bad scenario weights, wrong matchup.
- Seeded outcomes reproducible. This validates **mechanical invariants**, not betting probabilities.

## Sharpe — team-coupled 12k Monte Carlo per workload scenario

| Scenario | Modeled average minutes | Mean REB | P(9+ REB), conditional on scenario | Hypothetical $1 expected net at +113 |
| --- | ---: | ---: | ---: | ---: |
| Restricted (22/25/28-min options, share .88) | 24.14 | 7.55 | 35.3% | -$0.25 |
| Mixed (23/27/30 min, share .90) | 25.84 | 8.22 | 43.77% | -$0.07 |
| Starter (27/30/33 min, share .95) | 29.26 | 9.89 | 65.38% | +$0.39 |
| Same starter minutes, stronger board competition (share .85) | 29.26 | 8.84 | 52.34% | +$0.11 |

All four `minutes distribution / rebound retention / foul shock` assumptions are **unfitted**. The $ expected values are illustrations from hypothetical scenario probabilities at an **unverified third-party +113 quote**, not valid real-money EV estimates. They **must not** be blended using invented scenario weights.

For reference +113, break-even = 46.95%; the plausible scenario envelope [35.3%,65.38%] **straddles** break-even. Hence there is no robust, source-verified +EV wager.

### Replay sanity check — not out-of-sample

When Sharpe's *actual 2025–26 logged minutes* were used with no new starting-role adjustment, the model's 12,000-draw average was **6.62** rebounds against **6.661** season actual; modeled P(9+) 24.82% against season actual 14/62 = 22.58%. This is **in-sample consistency only**: the on-court ORB and DRB shares were inferred using those same prior-season totals. Do not report it as cross-validated skill.

### Alt expression research (mixed scenario only)

`P(8+ REB)=56.85%`, `P(9+ REB)=43.77%`, `P(10+ REB)=31.52%`; plus threshold ladders for points/assists/PRA and 2×2 rebound/assist outcomes in the frozen JSON.

Alternative thresholds are **not identified as positive EV** because account quotes for exact selection and settlement rules were not verified. Opposite under needs its own current price and script evaluation; never flip directions based solely on a failed over thesis.

## Data limitations still preventing promotion

1. **Roster changes:** prior 2025–26 Nets/Hornets misses/boards may not reflect the 2026–27 lineup. This is not a current-season player-tracking baseline.
2. **Rotation disagreement:** published social/analyst sources project ~26 vs ~30 minutes; no proven objective weighting. Source citations are discovery only and are saved in RILL without probability authority.
3. **Shot reconstruction:** team score-conditioned shooting is mathematically feasible but not play-by-play-level game simulation; missed free-throw rebounds and dead-ball nuance approximated.
4. **Foul trouble / role shares:** guessed event probabilities and distribution, with 2025-26 team/player rebound totals as priors. Strong possibility of regime shift.
5. **Teammates aggregate:** all other Brooklyn players aggregated; not five-man on/off rotation or joint model for every player.
6. **No current authenticated DraftKings price**, and earlier reference price can be stale or quote rules incompatible.
7. **No independent prospective win/CLV proof**. Player-game Brier historical study uses different baseline models; this new coupled simulator has no prospective evaluation yet.
8. **No automatic scheduled intake** and no authenticated Command Center -> Supabase RILL user round-trip proven.

## Architecture recommendation — integrate without another node

- SCOUT: gather official availability + documented analyst minute projections + market reference and price provenance; preserve source origin and observation timestamp.
- VERIFY / KAIROS: reconcile event identity, freshness, team eligibility and current account-executable quotes. Fail-closed when missing.
- Game Sense / Outcome Intelligence: run score-conserved 100 Worlds with conditional player opportunities.
- ORACLE / EDGE THIEF: compare constrained, central and expanded rotations plus shot-share changes.
- PRICING: compare exact over/under / alternate line quote to uncertainty **only with calibrated estimates**. Do not claim model frequencies to be actual fair odds.
- SENTINEL: maintain **WATCH** for Sharpe rebounds while quote and minutes aren't independently verified.
- TACTICIAN: retain alt line ladder and 2x2 joint settlement tables; no fabricated correlation EV.
- HUMAN FINAL GATE: unmodified, no bet/stake made, no loss-chasing.
- FORENSICS / CALIBRATOR: use frozen packets to score future completed games once real receipts and final box score available.

**Release decision:** BLOCK main/production model promotion. Continue targeted shadow evaluation. Source, scripts, 100 representative world outcomes, scenario deltas and tests are committed to this GitHub review branch. Existing Supabase production functions unchanged.
