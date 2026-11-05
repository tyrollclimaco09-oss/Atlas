# ATLAS 🦾 — Competitor Intelligence & EV Hunter

**Research date:** 2026-11-05 · **Focus:** NBA + NFL · **Mode:** read-only research, LAB/SHADOW · **Status:** no production integration or paid-provider activation

## Executive decision

Keep ATLAS's independent forecasting, immutable point-in-time research, adversarial challenges, human Final Gate, and separate DK/MGM bookkeeping. **Borrow the reliable methods, not proprietary designs, code, undocumented model predictions, vendor guarantees or their quoted live prices.** The target is an ATLAS Market Cortex that combines fair-pricing research with player-role forecasting, odds timestamp verification, correlation-aware HYDRA paper generation, and verified settlement/CLV.

With the last operator-confirmed DK bankroll at $13.50, adding $20–$500 monthly betting tool subscriptions cannot be justified from that balance. Use free/public research and existing connected sources first; prioritize a bounded prospective benchmark before considering paid vendor data.

### Competitor matrix — capabilities are vendor-advertised, not independently audited accuracy

| Product | Observed advertised mechanics | ATLAS mechanism to research | Risk / verification question | Primary source |
|---|---|---|---|---|
| Unabated | Vig-free market consensus, synthetic hold, best line, alt spread pricing, line movements | `PRICING: market consensus and alt ladder` | Are bookmaker weights independent? Does spread conversion generalize? | https://unabated.com/tools/core/odds |
| OddsJam | +EV and arbitrage scanners, middles, market discrepancies, bet tracker and CLV | `EDGE THIEF: discrepancy ranking` | Are quotes live/account available and same exact market? Vendor profit claims unverified | https://oddsjam.com/betting-tools |
| Outlier | Prop finder with last 5/10/20, sport/book/side filters, alerts, price comparisons | `SCOUT: high recall prop discovery` | Does hit rate add OOS information once minutes/role and opponent are modeled? | https://help.outlier.bet/en/articles/6711738-research-player-propositions-with-outlier-s-prop-finder |
| Rithmm | Custom models, copied leaderboard models, AI model generation, model performance and line shopping | `ORACLE Council: frozen challenger competition` | Selection bias and model copying leakage; independent baselines necessary | https://www.rithmm.com/ |
| Props.Cash | Advanced filters, play-by-play progress, correlated player prop research | `HYDRA: joint outcomes and game-script clustering` | Historical conditional correlations are not prices for SGPs | https://props.cash/ |
| Pikkit | Read-only BookSync, cross-book tracking, line comparison, outcome analytics, Pro CLV | `LEDGER: reconciliation/receipt lineage` | Security/consent, platform coverage, no assumption that API readback exists | https://pikkit.com/ |
| Betstamp | Account-independent manual tracker, automatic outcome grading, odds comparison, CLV/ROI breakdowns | `FORENSICS: exact line CLV and cohort ROI` | CLV based on which book, timestamp and same threshold? | https://www.betstamp.com/tracking |
| Action Network | Real-time odds, experts, betting sentiment, movement, alerts and bet tracking | `SCOUT: social and movement signals` | Public bet/handle percentage not necessarily sharp/profitable money | https://www.actionnetwork.com/app |
| OPTIMAL | Cross-book +EV grading, floor/ceiling projections, pick'em cheat sheets, swipe slip builder | `TACTICIAN: alternate floors with uncertainty` | Does advertised probability have OOS validation? Push alerts may be too late | https://www.optimal-bet.com/ |
| OddScouter | No-vig Sharp Index, filtered +EV board, tracked outcomes and fractional Kelly | `PRICING: reference basket + stakes lab` | Index source/volume weighting; tiny modeled edges fragile | https://www.oddscouter.com/ |
| Betwatch | Advertised exchange/sportsbook/pick'em odds aggregation, movement history, best lines and EV board | `MARKET_CORTEX: event-book-market data matrix` | Self-published numbers and freshness claims need independent confirmation | https://betwatch.io/ |
| DarkHorse Odds | +EV/matched-betting and offer comparison | `LAB: promotional mechanics / market mismatch research` | Not NBA/NFL core; don't infer guaranteed profits | https://about.darkhorseodds.com/ |
| The Odds API | Timestamped historical odds snapshots, events and props on plan-dependent endpoints | `DATA: immutable premarket price receipts` | historical API costs credits and snapshots are not every price tick; paid plan required | https://the-odds-api.com/liveapi/guides/v4/ |
| OpticOdds | Licensed real-time normalized odds, history, player props, scores, grading and injuries | `PROVIDER ADAPTER: future option` | contract, cost, permissions, provenance, duplicate provider event IDs | https://developer.opticodds.com/docs/odds-api-getting-started-guide |

## Highest-value borrowable mechanics (ranked)

### P0 / build and test without paid feeds

**1. Price truth ladder** — For every candidate store a strictly keyed tuple `(event_id, player_id?, market, side, line, book, American_price, source, observed_utc, offered/account_verified)`. Show `PUBLIC_REFERENCE`, `ACCOUNT_QUOTE`, `STALE`, `SUSPENDED`, and `UNAVAILABLE` separately. Only compare odds for the exact same side and line. Provider polling time, time a line last changed and account acceptance time are different fields.

**2. Dual FAIR PRICE tracks** — Estimate a *market-derived* two-sided no-vig probability independently of the candidate book when possible (leave-one-book-out, report sensitivity to anchors/weights); and retain the *original independent ATLAS forecast* (ORACLE) before market viewing. Neither should silently overwrite the other. Compute break-even and expected return using the independent model only when validated. Market agreement is not proof of the true outcome probability.

**3. EV uncertainty** — Display model point estimate, low/high defensible probability bounds, price break-even, nominal EV, worst-case EV, whether the apparent edge survives plausible model error, and why. Avoid auto-marking +0.4pp theoretical discrepancies as practical value. Never claim mathematically guaranteed positive expectation from fallible probabilities.

**4. CLV/closing price match** — Only evaluate identical event/side/threshold at entry and close. Distinguish close against same book, benchmark sharp book, and market median. A moved threshold needs separate price-equivalence estimate or `NOT_COMPARABLE` state.

**5. BetSlip receipt scanner + exposure graph** — Reconcile the user's actual DK/MGM screenshots or connector readbacks; recognize that one parlay repeats the same leg risk already present in a single. Show stake by leg, event, team, script, sport, sportsbook, and outcome. Do not infer wager placement from intent; no autonomous bets.

### P1 / prospectively validate

**6. Prop Finder with role distribution** — Browse by league, market, player, book, filter (last 5/10/20 numerators AND denominators), game-script, minutes, usage, opportunities, opposing role/scheme, news, travel/rest. Rather than rank blindly by hit% (5/6 looks impressive), forecast the actual count distribution (negative binomial/Poisson for opportunities as appropriate, minutes-conditioned scoring and rebounds), then test incremental Brier/log loss vs baseline.

**7. Research card explanation** — Expandable panels `Matchup / Role & Availability / Trends / Game Script / Price & EV / Countercase / Evidence Receipts`. Show model contribution and separate from speculative narratives. Preserve confidence uncertainty and contradictory evidence.

**8. Paper HYDRA combination construction** — Build 2/4/8/12/20-leg slips with valid line+date+player identities; include control tickets, counterpart tickets and common-root failure tracking. Separate cross-game approximations from same-game correlation; no SGP joint probability without joint model. If quoted parlay odds unavailable, theoretical payout remains null.

**9. Movement and alert lab** — Compare lead/lag among quoted book timestamps; distinguish a book moved first vs polling artifact. Record alert trigger time, delivery time, market availability at alert receipt, and selection price slippage. Reject expired false +EV notifications. React Live style pregame/inplay research only when latency and bankroll risks are measured.

### P2 / lower-confidence exploration

**10. Smart Money / social divergence** — Use verified handle versus ticket splits and source quality, not anonymous 'sharp' labels. Evaluate reverse-line movement against opponent context and consensus baseline; test out of sample, control for the market already incorporating that information.

**11. Portfolio & model league** — Compete frozen ORACLE variants, Council, ridge/schedule challengers, market-only, and blend models; identical pre-match cutoffs, outcomes, price snapshots and research exposure. Promotion based on held-out results, not impressive screenshot percentages.

**12. Research command center** — Original dark ATLAS Cortex navigation, not a pixel-perfect third-party copy. Mobile and desktop two-track views; home shows slate quality and proof statuses; one selection opens receipts, model forecasts, alternative markets, root-risk, and Final Gate. No fake portraits or sportsbook-like fabricated prices.

## Tiny but decisive math checks

- Two-sided fair from equal -110/-110: implied each 110/210 = 52.38095%; normalize pair => **50% / 50%**, overround **4.7619%**. Normalized prices are a market inference, not true independent probability.
- Operator screenshot example USF +2.5 at -110 with a claimed 55.7% forecast: break-even **52.381%**, nominal gap **+3.319pp** and expected net return **+6.336%** on amount staked if (and only if) independent 55.7% is valid. Reliability unverified.
- Operator screenshot Jalen Green under 19.5 PTS+REB at -108, claimed 52.3% forecast: break-even **51.923%**, nominal gap **+0.377pp** and EV **+0.730%**. Tiny edge is highly sensitive to miscalibration and quote latency.
- Real DK Nov 4 Cleveland +136 rather than public +131 reference, stake $2.00: if it had won, +136 would pay **$0.10 more** than +131; the actual Cleveland selection **lost**, and price improvement alone did not produce profitability.

## Falsification experiments and acceptance surfaces

| Lab | Setup | Pass evidence / disconfirmation | No-go behavior |
|---|---|---|---|
| QUOTE_TRUTH | Capture paired public/verified-account quotes with event identity and timestamps for NBA/NFL, compare 100+ events/market quotes prospectively | Measured stale rate, line-match precision, quote-available-on-arrival rate, 95% exact line/side mapping target only if realistic and predeclared | Never show account-executable price from public sources |
| PRICE_FAIR | Freeze multiple devig approaches and market-anchor sets before result, exclude target book from fair anchor | Compare forecast calibration, cross-book disagreement, stress weighted consensus | No +EV approval on a one-sided, stale, circular or thin market |
| PROP_FINDER | Freeze high-hit% vs role/usage/minutes/pace distribution models prospectively | Out-of-sample Brier/log loss and forecast interval coverage; player DNP policy; ablation | No '83% to hit' interpretation from 5/6 history |
| MOVE_LEAD | Timestamp odds changes by book and arrival; measure notification lag and post-alert price | Lead/lag stability, market availability at click, slip rejection rate; compare counterfactual no alert | No assumed sharp money from movement alone |
| PARLAY_ROOT | Run overlapping and diversified paper 2/4/8/12/20 cards with same frozen candidate pool | Leg outcomes, concentration, root-failure dedupe, true quoted combo price if available | No independence products for correlated legs or fake payout |
| MODEL_ARENA | Compare frozen ORACLE, Council, market-only, mixed models on exact same unseen games | CLV where available, Brier/log loss/MAE, conditional intervals, outcome ROI, confidence ranges by day | No post-hoc winning arm promotion |
| BOOK_LEDGER | Screenshot receipts vs API when authorized; separate DK/MGM and combined wallet | Wager ID, accepted odds, time, settled payout, source reconciliation, nonduplicate wagers | No unproved real bet or CLV claim |

## Implementation status: bounded prototype (locally executed)

The research-only CommonJS module `scripts/research/market-intelligence.cjs` in the attached local folder includes:

- American-to-decimal and break-even odds conversion;
- proportional two-way de-vig (clearly one particular assumption, not a certified universal fair price);
- expected net return calculation with model probability intervals;
- screen grouping by event/market/side/exact threshold, best-priced fresh account-confirmed *reference* among verified quotes;
- account/public/stale/unavailable/future quote distinctions;
- no independent-model promotion without model-validation and point-in-time freeze;
- CLV comparison only when same side, line and event;
- all outputs explicitly return research status, no approval and no bets placed.

**Execution:** `node scripts/research/market-intelligence.test.cjs` — 30/30 passing local offline tests. Existing `node scripts/research/pivot-gate.test.cjs` — 29/29 passing local offline tests. **59/59 total local checks.** These use illustrative synthetic quotes and actual *previously reported* sample stakes/odds, not connected live market requests. They **do not** establish provider wiring, sportsbook account integration, historical predictive advantage or live backend acceptance.

## Sources and consumer caveats

All claims about external products come from publicly viewable vendor pages. Confirmed as *advertised functionality*, not verified accuracy. Vendor ROI/profit guarantees and high-frequency odds assertions are marketing claims. Community anecdotes describe subscribers receiving signals after prices changed, a caution to track delays explicitly: https://www.reddit.com/r/EVbetting/comments/1r9djzs/what_ev_app_do_you_prefer/ . A separate October thread cites high subscription costs, bookmaker limits and low accepted stake as practical economics: https://www.reddit.com/r/sportsbetting/comments/1rvftl5/alternatives_to_oddsjam_thank_you/ . These anecdotes are not representative samples.

Use free/public official data and existing authorized integrations first. No vendor paywall bypass, unauthorized scraping, paid APIs, automated execution, or copying proprietary app code/assets. Maintain NBA+NFL primary, research/paper-first proof, and human Final Gate.

**GitHub status:** This local research report is an export, not proof of a committed or deployed change. If the connected GitHub tool is unavailable, the user can use these files as the review packet.