# Priority pass — November 11, 2026

## Actual source and learning checks

Executed the current SELECT-only learning export against Supabase project `lhliqbbooproqtslmgqi` and inspected stored price metadata and intake controls. No database writes or provider requests.

- Stored bookmaker observations: 532; latest provider observation August 10, 2026, 00:07:08 UTC. Zero execution-grade rows, zero period values, zero settlement-rule versions, zero canonical market IDs. These cannot populate today's exact-market scanner without invented metadata.
- The Odds API control: DISABLED, network calls false, paid budget zero. Web-reference intake also has network disabled and a zero budget. No controls were changed.
- Frozen cohort: one forecast/result record, one source claim, zero provider event bindings, zero admitted market identities, zero admitted official outcome contracts and zero native quotes. The result is recorded separately; this is not a missing numerical prediction.
- Direct official recap retrieval corroborates Buffalo 23, Minnesota 6. Source: https://www.nfl.com/news/bills-vikings-on-monday-night-football-what-we-learned-from-buffalo-s-23-6-win-over-minnesota . This later observation does not establish missing pregame identity, exact settlement rules, or native book prices. No verification flags or frozen timestamps were backfilled.

## What advanced

Scanner outputs now include break-even probability, the probability cushion in percentage points, and EV sensitivity under declared +/-1, +/-3 and +/-6 percentage-point perturbations. These are assumption tests, not calibrated confidence bounds. They do not alter the frozen 3% selection rule or certify an edge.

Each signal identifies its reference source IDs and explicitly leaves upstream independence unverified. Several books from one feed are not silently described as independent sources. Candidate exposure is grouped by event, with unique decision counts. No stake is inferred: cash exposure, joint probability and portfolio variance remain null. Cross-event dependence stays unmeasured.

The synthetic +105 example loses its positive EV under the six-point downward probability perturbation. This is an explanation of fragility, not a claim that the true probability is six points lower.

## Remaining work, ranked

1. Obtain a permitted fresh native odds sample with source timestamps, complete two-sided markets and exact rule/period identity. Existing stored data are insufficient; collection remains disabled. Preserve native bytes and parser lineage, independently compare venue availability, and record upstream provenance before any empirical source-quality conclusion.
2. Supply genuine source/event/market identity evidence for the frozen case. Official score corroboration helps outcome review but cannot recover original-time missing identity evidence. A later source must retain its actual later timestamp. The export's hold is preserved.
3. Use the new sensitivity and grouping fields in future paper reports; measure actual joint exposure only after paper stakes and a supported dependence model exist. Do not multiply marginal probabilities or invent monetary exposure.

No subscription, deployment, schedule, production write, accepted sportsbook quote, paper debit or wager occurred. Prior synthetic results remain conditional engineering/research evidence, not a real forecasting record.
