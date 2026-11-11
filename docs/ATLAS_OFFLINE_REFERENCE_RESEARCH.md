# ATLAS learning replay and offline reference scanner

Status: SHADOW / review implementation. No ingestion, deployment, source promotion, account interaction, ledger write or wager occurs.

## Source lineage

- Learning implementation starts from PR #37 at `d485ee0f825d8cf9e8031ee63f1fdc82c4529fc7`.
- Pricing arithmetic and its original 30 assertions are reused from PR #36 at `ab4badaa58f23f5aa387745dc6f5be78bd658f20`, `scripts/research/market-intelligence.cjs` and its test file. No unrelated PR #36 frontend or backend work is imported.
- The pricing test harness now uses `node:test` so those 30 assertions are counted individually.

## Workstream A: recorded outcomes versus authenticated outcomes

`integrations/learning/sql/export-frozen-learning-cohort.sql` remains SELECT-only. Export V2 adds the original prediction ID and a separate `recorded_outcomes` collection, linked through an observation's recorded source receipt. Existing `official_outcomes`, identity and native-price admission checks remain intact.

`outcome-compatibility.mjs` recognizes the inspected Buffalo-moneyline legacy receipt shape using exact candidate/event/prediction IDs, selection, observed timestamp and numeric binary result. It returns the original receipt and a versioned diagnostic mapping. It does not turn `VERIFIED_SOURCE` or a caller flag into source authentication. Unsupported shapes and ambiguous original receipt IDs remain explicit holds.

The real recorded-outcome fixture was captured by executing the updated SELECT against the existing records; it is not a new model-training observation. The earlier pregame fixture is unchanged. Run the updated SELECT through an already-authorized read-only database session, then pass the returned `canonical_export` object to:

```sh
node integrations/learning/reconcile-canonical-learning-cli.mjs < authorized-export.json
```

Expected current proof: the recorded result appears with provenance; official identity/outcome and native-price holds remain where missing. No Brier, log-loss, ROI or model-promotion claim is manufactured. Later genuine source attestations must use their actual observation times and the existing gate.

## Workstream B: NBA full-game moneyline reference research

```sh
node scripts/research/scan-reference-cli.cjs --demo
node scripts/research/scan-reference-cli.cjs < offline-reference-packet.json
```

The demo has four fictional book observations and an explicitly synthetic NBA event. It reproduces the -120/+100 reference example at a hypothetical +105 target: probability 12/23 and market-reference EV about 6.9565%. It is never an available quote, empirical result or paper entry.

The packet contract is `ATLAS_OFFLINE_REFERENCE_SCAN_V1`. It contains an explicit as-of time, cohort/decision slot, target book, source and rules registries, prior decision IDs, policy, ingestion result and retained snapshot bodies. The example packet builder is in `scripts/research/fixtures/reference-snapshot.cjs`.

Only the documented internal normalized snapshot format is supported: `ATLAS_NORMALIZED_ODDS_SNAPSHOT_V1` with an observations array. A vendor-native parser and live fetcher are not included. An actual vendor integration must retain original vendor bytes as well as a traceable parser-produced normalized snapshot, with independently checked source permission/identity. A hash of normalized data alone does not establish vendor origin.

The source gate requires explicit source product/capability/book approval, reviewed timestamp semantics, complete market/rules identity, actual retained-body SHA-256 agreement and record-to-snapshot correspondence. This proves declared input consistency, not real-world truth. Registry values are configuration assertions; the scanner cannot authenticate its own sources.

Normalized products use `sportsbook` for a venue-neutral sportsbook proposition and `draftkings_pick6` for the separate Pick6 product. The target venue is a distinct book ID (`draftkings` or `betmgm`). References need the same event/start, teams, full-game period, selection, no-push rules and overtime treatment. Different periods or rule versions never share a quote key. Older price-screen callers missing the expanded identity fields are now quarantined.

Distinct approved reference books exclude the target. Each complete reference market is de-vigged separately, then the median probability is used. Book brands are not assumed to be independent data sources. The five-minute quote-age, one-minute capture-window, three-reference and 3% EV settings are pilot policies, not universally validated thresholds.

The latest observation controls each book/market. A later suspension, closure, unknown status or unusable price suppresses the earlier quote; an ambiguous same-time quote is held. Quarantine, review and insufficient-reference results remain separate from a complete zero-signal run.

Every result includes source/evidence links, validation receipts, rejected/reviewed observations, holds and comparisons. Receipt payloads are suitable for append-only research storage, but are returned as `NOT_PERSISTED`; no Supabase writer is added. An updated validation gets a new receipt identity instead of replacing a prior failure.

Candidate outputs say `market-reference EV`, have no independent-model probability, are not venue verified, create no paper entry and are never empirically performance eligible. The caller supplies prior decision IDs from its research ledger; repeated scans retain subsequent observations but suppress a second decision. The CLI itself has no persistent store. Operational ingestion/validation failures have nonzero CLI exits. A complete no-signal result is distinguishable from no observations, missing target, review and insufficient references.

## Pick6 boundary

`scripts/research/pick6-contracts.cjs` supplies separate structural selection and entry contracts. A selection structure pass requires later source validation. Even supplied multipliers or marginal probabilities cannot enable entry EV: the payout, source/rules and joint-outcome adapters are explicitly unimplemented. Returns are `HOLD_ENTRY_VALUATION` with null EV. No Pick6 board collection, jurisdiction eligibility, contest payout or submitted entry is claimed.

## Testing and release

```sh
node --test integrations/learning/*.test.mjs scripts/research/*.test.cjs
```

Fixtures test real-schema replay, unchanged holds, source/record validity, market identity, timing, lifecycle withdrawals, target exclusion, reference deduplication, evidence tampering, decision deduplication, CLI failure states and unsupported Pick6 entry valuation. Synthetic cases must stay out of empirical performance results.

GitHub review is separate from deployment. Keep the branch unmerged until reviewed; do not enable provider credits or promote a model as a side effect. Every completed change gets a dated entry in `PATCH_NOTES.md` under the repository's `AGENTS.md` instructions.

The GitHub workflow requires a patch-note change whenever a PR changes implementation or workflow files. It checks presence, while review checks accuracy. No recurring job is scheduled.
