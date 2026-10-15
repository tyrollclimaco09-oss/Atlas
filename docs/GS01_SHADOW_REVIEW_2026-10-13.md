# GS-01 — bounded synthetic workload consistency

Sentinel: **GO for offline SHADOW testing; HOLD integration and predictive claims.**
Branch: `review/gs01-workload-consistency-2026-10-13`.
Parent: `ed27d9fb39a924fc75cac3cf17e92e355cd69524`, preserved unchanged on its
existing review branch. This batch implements GS-01 only.

## Checkpoint review and scope

The parent custody/maintenance review passed: exactly five additions, no
credentials, foreign runtime code, packages or production callers. Its 2,216
lines comprise 358 helper lines and 1,858 fixture/test/documentation/evidence
lines. Its original Git patch remains recoverable; its branch is not on GitHub.
Main, PR #6 and the existing SCOUT/frontend/canonical files are unchanged.

Five GS-01 additions:

| File | Role |
| --- | --- |
| `scripts/scout/game-sense-workload-shadow.cjs` | Pure research-contract validator and immutable receipts; no allocator, predictor or production adapter. |
| `scripts/scout/game-sense-workload-shadow.fixtures.cjs` | Independently invented NBA/WNBA scenarios; no provider records. |
| `scripts/scout/game-sense-workload-shadow.test.cjs` | Public invariant/adversarial tests and fresh-process network denial. |
| `docs/GS01_SHADOW_REVIEW_2026-10-13.md` | Acceptance, assumptions and limitations. |
| `docs/evidence/2026-10-13-gs01-workload-shadow.json` | Commands, hashes, actual results, compact rejection receipts and preservation evidence. |

The existing `canonicalJSON` and plain-JSON `hashJSON` guard are reused without
modification. Existing `FEATURES`/Game Sense behavior is verified unchanged. Foul/overtime/
multiple-absence warnings remain in the SCOUT harness. The new minute contract
does not relabel its generic `workload` field or impose conservation on all
opportunities, touches, assists or rebounds. No canonical node or store is added.

## Typed synthetic assumptions

Version: `atlas.game-sense.workload-shadow.v1`. The fixture builders define all
exact fields. Every input is explicitly synthetic, research-only and independent
Phase 1, with synthetic event/team/player identities, freeze/cutoff/evidence
timestamps, a complete declared roster, explicit availability and before/after
allocations. `evidence_at` is a synthetic timestamp, not verified publication or
capture evidence. Unknown fields remain null and fail closed.

- Regulation is 48 NBA minutes or 40 WNBA minutes, with five players on court.
  Each declared overtime adds five game minutes and 25 team minutes. Thus NBA
  regulation requires 240 team minutes and WNBA requires 200.
- Rotation segments must cover the entire game without gaps/overlaps, with
  five unique known available players in every segment. Player minutes must
  equal their interval exposure and stay within elapsed game time. Inputs use
  whole-minute intervals; at most 30 synthetic roster IDs and 12 overtimes are
  accepted research bounds, not official roster/overtime limits.
- `usage` explicitly means **synthetic possession-ending opportunity share**,
  not official USG%. Shares total one; opportunity allocation equals share times
  declared team possession volume. Fractional continuous allocations are allowed;
  this is not a replay of indivisible actual possessions.
- Pace is declared separately for regulation and aggregate overtime. Uniform
  timing within each is a required synthetic assumption. Overtime possessions
  are supplied explicitly, never inferred from regulation pace. Player and
  simultaneous lineup demands must fit interval capacity. A bounded internal
  max-flow check establishes feasibility; it emits no allocation or forecast.
- Efficiency is an independently supplied synthetic conversion-rate assumption.
  Its delta remains separate from opportunity volume. No expected player score,
  win/bet probability, empirical precision or predictive improvement is produced.
- Transfers reconcile direct net minute losses/gains. Donors cannot also act as
  intermediary recipients; repeated causes cannot duplicate released minutes.
  Absence/foul caps must agree with availability/rotation. Blowout and disruption
  labels do not establish causal effects or scenario probabilities.

`freezeScenario(input)` copies/sorts plain JSON into a deeply frozen `{sha256,input}`
receipt. `inspectScenario(receipt)` verifies its digest, returns eligibility,
opaque reasons, explicit budgets and separate minute/opportunity/efficiency
deltas. It retains declared player denominators and never fills missing values
with zero. Input permutation and repeated inspection are deterministic.
Producer accessors, custom prototypes and proxy traps are refused by the existing
hash guard before they execute. Structural inputs and corrupt receipts throw
opaque `CONTRACT_INVALID`/`RECEIPT_INTEGRITY` errors without echoing payloads.

Every report preserves `execution_authority:false`, mandatory Human Final Gate,
`scenario_probability:null` and `predictive_value:NOT_ESTABLISHED`. These research
results are not connected to the browser, Supabase or any decision pipeline.

## Verification

Run from the checkout with the existing Node installation; no installation needed:

```sh
node --test --test-reporter=tap scripts/scout/game-sense-workload-shadow.test.cjs
node --test --test-reporter=tap scripts/scout/source-contract-shadow.test.cjs
node --test --test-reporter=tap scripts/scout/opportunity-shadow.test.cjs
node --test --test-reporter=tap command-center/tests/*.test.cjs
```

Actual counts, exit statuses, TAP hashes and fixture receipts are recorded in the
evidence JSON. The fixtures include starter absences/split backup minutes, foul
caps, blowouts, pace changes, assumed efficiency changes, overlapping labels and
explicit overtime. Named workflows have NBA and WNBA positive controls.
Deliberately rejected cases cover impossible lineups, gaps/overlaps, missing
assumptions, bounds, contradictory caps, double-counted/circular transfers,
unknown identities, timing and unsupported causal assertions.

Two additional interval controls prove that valid player/team totals can still
hide an impossible first-half opportunity demand. An overtime-only substitute
control verifies the distinct overtime capacity. The interval defect and roster
scope gap were reproduced before correction; final unexpected failures are zero.

The fresh-process proof traps transports, workers, subprocesses, globals and
unapproved imports **before** loading all three research helpers. It exercises
every fixture plus interval/OT controls and corrupt receipts. Four deliberate
denial controls work; exercised replay has zero transport attempts and zero
producer getter/iterator/proxy invocations, including swallowed-error paths.
This verifies reviewed paths, not arbitrary future code or an independent OS sandbox.

Fixture receipts are reproducible without handwritten duplicate logs:

```sh
node -e 'const f=require("./scripts/scout/game-sense-workload-shadow.fixtures.cjs"),g=require("./scripts/scout/game-sense-workload-shadow.cjs"); console.log(JSON.stringify(f.cases.map(c=>{const r=g.freezeScenario(c.build()),v=g.inspectScenario(r);return {name:c.name,receipt_sha256:r.sha256,eligible:v.eligible,reasons:v.reasons}})))'
```

## Remaining limits

Roster completeness, availability, pace, efficiency, caps and disruptions are
declared fictional assumptions. Synthetic consistency establishes no real
rotations, injury effects, scenario frequencies, provider rights, causal effects,
calibration or forecasting skill. Real prospective evidence remains blocked by
the existing rights/identity/availability gates. No provider/API/inference call,
Supabase/Sites change, migration, deployment, merge or betting execution occurs.

GS-02, PM-04 and pairing/SGP authorization remain deferred. Integration requires
separate human approval. The review commit is local until a separately authorized
push; Git provides its identity rather than recursive self-hashes in this evidence.
