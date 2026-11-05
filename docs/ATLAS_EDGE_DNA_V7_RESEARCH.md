# ATLAS 🦾 — EDGE DNA V7: Original Reverse-Engineering Intake and LAB

**November 5, 2026 · research only.** Parent references: ATLAS Nov4 postgame calibration and draft PRs #29 (gate), #30 (feature lab), #31 (value cortex). Scope is distinct: origin-of-edge accounting, evidence genealogy and correlated paper-failure forensics. Source experiences are inspirations, not copied proprietary code, UI, player images or sportsbook data.

## Newly observed outside features and credible mechanisms

1. **Unjuiced** (primary product docs) offers line/price shopping, hit-rate matrix, *injury impact*, advanced NBA research sheets, NFL receiver target maps, *triple-double market versus SGP* comparisons, and saved research views. We want **STRUCTURE CHECKER** (outcome-equivalence proof and settlement rules), **TARGET GEOMETRY** (NFL SCOUT), and **ROTATION SHOCK DIFF** (NBA ORACLE). Reference: https://unjuiced.bet/features/cheat-sheets ; https://unjuiced.bet/help/article/cheat-sheets-overview ; https://unjuiced.bet/help/article/how-to-use-hit-rate-matrix . A same-game parlay and triple-double bet may differ in DNP/void/reprice rules, so equivalence is not automatic.
2. **SaberSim** reports full game-script distributions and configurable correlation emphasis. Our **WORLD CONTRIBUTION** should show the specific game-script assumptions responsible for a joint-outcome shift, not confuse that with independently validated fair parlay odds. Reference: https://support.sabersim.com/en/articles/17506644-where-do-your-projections-come-from and https://support.sabersim.com/en/articles/17506464-what-does-the-correlation-slider-do .
3. **Fairline transparency** differentiates preregistered hypotheses from passed claims, and clearly discloses that last fetched time is not last book-update time. Our **PROVENANCE CLOCKS** must preserve provider last-change time vs ATLAS observation time separately, labeling unknown clock data as UNKNOWN. Reference: https://fairline.io/transparency .
4. **OpticOdds** explains server-sent event streaming and real-time suspensions; historical retrieval includes specific book/fixture/market boundaries and a rolling historic data window. Our **FEED RECOVERY** must explicitly identify missed event sequences, withdrawn odds, and source gaps. No live use licensed or connected by this lab. References: https://developer.opticodds.com/docs/sse-streaming ; https://developer.opticodds.com/reference/get_fixtures-odds-historical .
5. **Sportradar** NBA push docs distinguish update/delete events and explicitly require REST recovery after long disconnections. Our **EVENT VERSIONING** must permit corrections without pretending that a partial stream is complete. NBA realtime data is an add-on requiring access; this prototype calls no such API. Reference: https://developer.sportradar.com/basketball/docs/nba-ig-push .
6. **SportsDataIO** describes mapped identities for settlement integrity and timestamped line movements. Our **SETTLEMENT ID CHECK** ensures event/team/player matches before grade. Reference: https://sportsdata.io/live-odds-api .

## Unique ATLAS sub-nodes introduced

| Existing parent | V7 branch | Function and proof gate |
|---|---|---|
| EDGE THIEF + PRICING | **EDGE DNA** | Decompose the change in *modeled* ROI mathematically into a probability-component and price-component (symmetric Shapley). Never claim causal source or real +EV without an independently calibrated forecast and executable quote. |
| FILTER/VERIFY | **PROVENANCE CLOCKS** | Separate actual book last-change time, ATLAS capture time, and decision cutoff. Missing book timestamp cannot be silently inferred. |
| ARCHIVIST + FORENSICS | **EVIDENCE GRAPH** | Directed receipt DAG catches missing parents, cycles, source timestamps post-cutoff, and records retained lineage. |
| HYDRA + SENTINEL | **ROOT FAILURE ATLAS** | Groups repeated leg failures across paper tickets; DNP/ungradeable separate; cards sharing a root never become independent evidence. |
| PRICING | **STRUCTURE CHECKER** | Compare outcome predicates and book settlement rules before treating an SGP and named player market as equivalent. Any declared equivalence still requires sportsbook confirmation. |
| SCOUT + ORACLE | **TARGET GEOMETRY / ROTATION SHOCK DIFF** | Additional proposed features; need lawful data coverage, role methodology and prospective NBA/NFL test. Not implemented in this pass. |
| SCOUT + FILTER/VERIFY | **FEED RECOVERY** | Additional planned feature; requires provider event IDs, revisions, complete history and live-source contract. Not implemented in this pass. |

## Mathematical contract

For model probability p and observed decimal odds d, nominal ROI = p×d − 1. Between old and new assumptions, symmetric attribution is:

- **Probability component:** (p1 − p0) × (d0 + d1)/2
- **Price component:** (d1 − d0) × (p0 + p1)/2
- These sum *exactly* to p1×d1 − p0×d0 (subject to numerical rounding).

This is **not a causal explanation**: it answers which input changes mathematically accounted for a change. A market-assisted p cannot be called independent. A prior book quote that disappeared is not executable. A modeled EV estimate is not a certified profitable strategy. The UI marks examples SYNTHETIC.

## Offline implementation / run

- `node scripts/research/edge-dna.test.cjs` -> **41/41 local tests** on November 5.
- `scripts/research/edge-dna.cjs`: pure functions for EV accounting, quote provenance, structure-equivalence checks, receipt DAG, and HYDRA repeated-root mapping. No network, no provider calls, no account access.
- `docs/labs/edge-dna-v7-demo.html`: responsive offline interactive demo with probability and odds controls, origin timestamps and HYDRA fault tree. The HYDRA panel uses the Nov4 frozen HYDRA II research-candidate failure facts (Maxey 19, Miller 10, Tatum DNP, Jalen Johnson OUT) as a subset of the original cards. All EV and quote inputs in the simulator are fictional and clearly labeled.

## Next measurable acceptance tests

1. **EV source attribution**: archive matched event/market/line/side as-of cutoff. Distinguish post-forecast model updates from price movements. 100 prospective examples before deciding whether attribution yields operational value.
2. **Evidence DAG parity**: run against actual ATLAS source receipts, check schema, and flag stale, postgame, duplicate or missing dependencies. A structural pass doesn't certify data correctness.
3. **Cross-structure research**: for 10+ paired market structures (NBA triple double vs SGP and NFL TD examples), verify operator settlement rules, quote age, account availability and real combined price. No invented arbitrage or +EV.
4. **Paper root-map replay**: compare full-slate overlapping-card analysis vs unique-failure-root count on frozen Nov4 cards. Demonstrate that duplicate legs don't inflate evidence counts; distinguish DNP from lost thresholds.
5. **Source reconnection**: test stream-gap recovery only after a lawful provider feed and entitlement is actually available. Never spend API credits or assume an app's advertised capabilities are connected.

## Governance

LAB/SHADOW only. Original forecasts, existing PRs #29–#31, historical records, real balances and live sportsbook untouched. This proposal adds no new autonomous model or Final Gate authority. Promotion requires review, fresh CI, verified real-world data contracts, a held-out NBA/NFL evaluation, and operator approval.