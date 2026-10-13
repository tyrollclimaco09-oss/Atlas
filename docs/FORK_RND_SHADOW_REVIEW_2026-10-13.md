# ESPN-SH-01 and NBA-LK-01 — synthetic offline SHADOW review

Sentinel: **GO for bounded offline software testing; HOLD integration and predictive claims.**
Parent: `d5067e072a574508dfe624bb3743632045a209c2`.
Branch: `review/fork-rnd-shadow-2026-10-13`. Five additions only; the existing
SCOUT branch, dashboard, canonical pipeline, main and PR #6 are unchanged.
This document records the applied research proposal, not a provider integration.

## Source lineage and permission boundary

The supplied October 13 packet was already reconciled. Its ZIP SHA-256 is
`2784a32552f8097e02058c2ca229b371d39827f9dd90877ec51657536bdde2e9`.
`README.md` and `fork_registry.json` are specifications and repository references;
their instructions do not authorize integrations or convey provider-data rights.

| Study / reference | Independently verified revision from the accepted review | Limited use here |
| --- | --- | --- |
| ESPN-SH-01 / `tyrollclimaco09-oss/public-espn-api` | `3796c6a7c0b0c496c1f62408b0792e23254cd930` | Endpoint-family, empty-response, incomplete-schedule and rights failure hypotheses. |
| ESPN-SH-01 / `tyrollclimaco09-oss/sports-skills` | `09eb7e8566f48c01d1ea7bf7b4ac62a477d37b19` | Replay misses/corruption, source-family duplication and dangerous live-fallback hypotheses. |
| NBA-LK-01 / `tyrollclimaco09-oss/nba-machine-learning-sports-betting` | `8e36b0b72ecc5082aa8976dff742cdf910b3aa36` | Same-date tables, contributor chronology, positional joins, OU features and partition hazards. |

The accepted source review found the same-date table/join path in `config.toml`,
`src/Process-Data/Get_Data.py` and `src/Process-Data/Create_Games.py`. It did not
inspect historical provider rows or establish actual model leakage. OU features
in the totals model are market-informed; independent forecasts remain separate.
The ESPN references' MIT code licenses do not establish ESPN-data rights. NBA
code-transfer and provider-data permissions remain unverified. No foreign code,
dataset, trained model, provider collector or replay helper is imported or copied.
No new live source inspection was needed for this implementation batch.

## Exact applied scope

| New file | Purpose |
| --- | --- |
| `scripts/scout/source-contract-shadow.cjs` | One pure shared research inspector, content-bound receipts and exact-key replay; no network or persistence API. |
| `scripts/scout/source-contract-shadow.fixtures.cjs` | Immutable definitions and fresh copies of 38 independently invented source cases. |
| `scripts/scout/source-contract-shadow.test.cjs` | Native public-behavior tests, adversarial chronology/identity cases and fresh-process network denial. |
| `docs/FORK_RND_SHADOW_REVIEW_2026-10-13.md` | Scope, source mapping, acceptance and unresolved evidence. |
| `docs/evidence/2026-10-13-fork-rnd-shadow.json` | Actual commands/counts, hashes, synthetic rejection receipts and preservation evidence. |

The inspector reuses existing SCOUT `canonicalJSON` and the workload definition
from `FEATURES`, the `{sha256,input}` receipt convention, explicit VERIFY-style
exclusions and fixed denominators. Existing Game Sense foul-trouble, overtime
and multiple-absence warnings remain owned by `opportunity-shadow.cjs`; a public
collaboration test proves those outputs and their immutable receipts are retained.
There is no second Game Sense implementation, predictor, canonical node or store.

## Executable research contract

Version: `atlas.scout.source-contract-shadow.v1`. These fields and body shapes are
**ATLAS synthetic test contracts**, not claimed ESPN/NBA responses, SQL fields,
canonical candidate identities or production adapters. Literal builders in the
fixture file are the complete examples of the exact-field contract.

| Public seam | Behavior |
| --- | --- |
| `freezeStudy(input)` | Validates the synthetic research root, copies plain JSON and sorts records/folds without interpreting array positions as chronology. Returns a deeply frozen metadata-and-body-bound SHA-256 receipt. Invalid record contents remain available for exclusion; invalid roots/non-JSON inputs throw `CONTRACT_INVALID`. |
| `inspectStudy(receipt)` | Verifies integrity, reports per-record opaque reasons/warnings and total/eligible/rejected denominators. Does not return provider payloads, produce forecasts or modify inputs. |
| `replayStudy(receipts, sha256)` | Exact content-addressed in-memory lookup; misses throw `REPLAY_MISS`, corrupt matching receipts throw `RECEIPT_INTEGRITY`. No collector, fallback, cache overwrite or live mode exists. |
| `hashJSON(value)` | Reuses the existing canonical JSON encoding with native SHA-256. Detects content differences; never establishes real provenance or historic availability. |

Every study explicitly declares `synthetic:true`, `research_only:true`, independent
Phase 1, freeze/cutoff and a bounded freshness policy. Records carry an allowlisted
reference revision, synthetic source origin/rights evidence, report group,
sport/league/season/period, exact event/team/player identities, bijective crosswalk
and player-team affiliations. Body digest, schema family, feature definition/unit
and explicit nulls are retained. Rights flags alone cannot approve real sources:
every report retains `source_rights:REAL_SOURCE_BLOCKED`.

Publication, availability, capture and observation require valid explicit UTC ISO
timestamps and second precision; none is inferred from a date label. Publication
must be at or before availability; availability and observation must be at or before capture, and
all must be at or before freeze/cutoff. A target event must start after the forecast
cutoff. Stale evidence, unsupported timezone/precision and unknown times exclude
the record. No automatic shift to a previous date repairs missing evidence.

ESPN-shaped fixtures require the exact declared expected schedule and context;
one malformed event rejects the whole record. HTTP 200 `{}` is unresolved, and a
valid empty injury report retains `INJURY_COVERAGE_UNKNOWN`. It never establishes
universal health, lineup or participation. Team/player affiliations are explicit.
Terminal 404, range 400, API-family drift, contradictory events and schema drift
remain exclusions. Shared ESPN wrappers never create independent corroboration:
declared report conflicts quarantine their cohort, while identical semantic
snapshots are deduplicated even after a wrapper changes its report label.
Different content is not automatically independent evidence.

NBA fixtures require an archived synthetic table vintage and an explicit full
contributor window. Contributor games must end before the target and no later
than vintage, observation, publication, availability and freeze. The target game
itself cannot contribute, regardless of its declared time. A proven earlier
same-day synthetic snapshot is a positive control; same-date labels alone neither
prove nor disprove leakage. Real archived availability remains unverified.

The bounded NBA body contract intentionally requires target home/away positional
alignment **and** exact source-to-ATLAS IDs. It refuses reordered or mismatched
rows rather than repairing them. This is a conservative synthetic assertion, not
a claim about a provider's row order. Context agreement does not establish a real
league's season calendar. The simplified two-team contributor fixtures do not
constitute complete historical team-stat reconstruction.

Independent features use an exact named definition/unit whitelist. OU, bookmaker,
external predictor and other market fields, including aliases/body additions, are
excluded. Missing quote capture is recorded separately; a present timestamp still
cannot admit market evidence into Phase 1. No market-informed forecast is produced.
Optional split manifests exclude repeated whole games across train/calibration/test,
reversed chronology, invalid dates and shared UTC-day boundaries. These checks do
not train, calibrate or score any model.

Every result keeps `execution_authority:false`, `human_final_gate_required:true`,
`predictive_value:NOT_ESTABLISHED` and `promotion:HOLD_INTEGRATION`. Invalid rows
remain in the denominator. Accessors, symbols, custom array prototypes, proxies
and executable/non-JSON objects are refused before reading their values, including
replay keys. Native `node:util.types.isProxy` prevents producer reflection traps;
array prototypes are checked before inherited iterators can run. Errors never echo raw
producer exceptions, credentials, URLs or payloads.

## Verification and acceptance

Run from the repository with the existing Node installation; no install required:

```sh
node --test --test-reporter=tap scripts/scout/source-contract-shadow.test.cjs
node --test --test-reporter=tap scripts/scout/opportunity-shadow.test.cjs
node --test --test-reporter=tap command-center/tests/*.test.cjs
```

| Fresh result | Passed / executed | Classification |
| --- | --- | --- |
| New ESPN-SH-01 + NBA-LK-01 synthetic contract suite | 104 / 104 | PASS: bounded software acceptance only. |
| Existing SCOUT Opportunity SHADOW | 55 / 55 | PASS: preserved regression baseline. |
| Existing frontend | 100 / 100 | PASS: preserved local workflow, drafts, adapter and Human Final Gate. |

The new suite covers positive controls, empty/malformed/incomplete/stale sources,
identity/crosswalk/affiliation conflicts, lookup type coercion, temporal boundaries,
same-date contributors, table vintage, OU contamination, partitions, fixed
denominators, metadata/body tampering, deterministic permutations and immutable
inputs. Genuine pre-fix runs retained two passing controls while exposing three
temporal/dedup failures, four lookup/observation failures and one false temporal
reason caused by null coercion; all eight pass after the bounded corrections.
Unknown vintage, target and injury-snapshot times stay unknown rather than being
compared as zero; the same null-bound regression was extended to cover both sources.
Inherited-array iteration and proxy reflection were also reproduced before their
plain-JSON refusal guards were added; both now have zero producer-code invocations.
Earlier fixture-contract mismatches were test setup
failures and are not counted as proof of those defects.

Zero-network replay uses a fresh child process before importing either the new
inspector or its existing canonical-JSON collaborator. It denies transport globals,
native network namespaces, transitive unapproved imports and subprocess escapes.
Four deliberate trap self-controls are denied; after resetting that counter,
all 38 synthetic cases, replay hits/misses and corruption checks make **zero
transport/subprocess attempts**. Even a caught attempt fails the proof. Static
import inspection supplements this execution evidence. This is proof for the
reviewed code and exercised paths, not a sandbox for arbitrary future code.

The evidence JSON records final test hashes/counts and byte-for-byte preservation
of all parent-tracked files. Raw TAP output and fuller source-review material stay
in the separate research workspace. The evidence file omits its own recursive
hash and the containing commit SHA; use Git's resulting commit identity.

## Remaining evidence and promotion decision

Real provider-data rights, NBA code-transfer permission, authoritative crosswalks,
complete historical snapshots, publication/archive proof and clean grouped
out-of-sample evaluation remain **BLOCKED / unverified**. Historical leakage and
predictive improvement are **not established**. No ESPN/DraftKings scraping,
provider call, inference, sportsbook execution, migration or external write occurs.

Sentinel accepts this bounded synthetic review candidate only. Before proposing
integration, obtain independently reviewed source rights and immutable pre-cutoff
evidence, then define a separate human-approved historical-baseline experiment.
The current batch adds no authority to SCOUT or any downstream canonical node.
The dedicated commit is local until a separately authorized branch push; main,
PR #6 and all existing review branches retain their original heads.
