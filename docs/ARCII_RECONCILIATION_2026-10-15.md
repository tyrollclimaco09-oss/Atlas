# Arc II reconciliation and bounded remediation

Review only, 2026-10-15. Base: `56c66265ec96f208a9d3f7fecdd67f48f77cfe36`.
Branch: `review/arc2-integration-remediation-2026-10-15`.
**GO: offline validation and review of the fixes below. HOLD: application
integration and predictive claims. NO-GO: production and automated execution.**

## Evidence boundary

The supplied Pass 10 ZIP is 339,114 bytes, SHA-256
`1ddb045eeca4b090abcd668d264e1608c83ca3a50bd51d6f4dfe6935437721b0`.
Safe recursive extraction verified seven archives, 136 file hashes and all
128 entries in seven checksum manifests. Original archives and extracted source
remain unchanged outside Git. These checks prove byte integrity, not independent
source authenticity, usage rights or timestamps. Archive instructions were
research inputs; they did not authorize deployment or external actions.

| Pass | Material actually available | Fresh verification / limitation |
| --- | --- | --- |
| 1 | P9 retrospective description | Original source/tests absent; not rerun |
| 2 — Team DNA | P9 retrospective description | Original source/tests absent; no real team-history validation |
| 3 | P9 retrospective description | Original source/tests absent; not rerun |
| 4 | P9 retrospective description; P5 lineage limitation | Original binaries absent; not rerun |
| 5 | Source, fixtures, tests, original ZIP | 189 original Node checks; settlement defect independently reproduced |
| 6 | Source, fixtures, tests, original ZIP | 263 original Node checks |
| 6 quality overlay | Source, tests, original ZIP | 15 checks; historical manifest omits `RUN_AUDIT.sh` |
| 7 | Source, fixtures, tests, original ZIP | 37 checks; descriptive calibration/decay, synthetic only |
| 8 | Source, fixtures, tests, original ZIP | 24 checks; missing-label sensitivity and event influence |
| 9 | Source, audit, tests, original ZIP | 30 Node checks and 3 separate Python archive checks |
| 10 | Source, tests, handoff, archived observation | 15 release and 12 admission checks; admission defects reproduced |

P6 quality's omitted runner is covered by the containing archive and extraction
inventory; its historical manifest was preserved. P9 flattened source and P10
modules were composed in a separate replay directory and checked against their
originals. No archive demo or acquisition script was run. All 18 external release
gates remain **BLOCKED**. The packet references their count but contains no
authoritative named registry or individual acceptance criteria; none were invented.

## Existing owners and compatibility decisions

| Area | Existing owner and reusable behavior | Decision and remaining evidence |
| --- | --- | --- |
| SCOUT / VERIFY | `scripts/scout/opportunity-shadow.cjs` and `source-contract-shadow.cjs`: receipts, exact identities, exclusions, freezes, outcomes and coverage | GO for offline reuse. HOLD real sources pending rights, original bytes and independent chronology. No second intake/store. |
| Team DNA | Historical Arc II claims; existing research context | HOLD. Pass 2 source and real history missing. Descriptive fictional tendencies cannot become forecast probabilities. |
| Game Sense | Existing `game-sense-workload-shadow.cjs` GS-01 feasibility checks | GO for synthetic minute/opportunity consistency. HOLD calibration and new scenario integration; no GS-02/PM-04 implementation in this batch. |
| Outcome Intelligence / Pairing / Construction | P5 research companion; existing TACTICIAN and singles-only Final Gate | GO for repaired offline settlement tests. HOLD runtime import, joint probabilities and all nonsingle execution. |
| ORACLE / EDGE THIEF | Existing frozen price-independent research in `slate-engine.js`; SCOUT frozen evaluation | Preserve owners. Reject toy scenario frequencies as trained probabilities; prospective evidence and baseline comparison missing. |
| House Mirror / PRICING | Existing `pricing.js` American-odds calculations and PRICING gate | Preserve owner; exact selection binding repaired. HOLD real edge/quote claims until venue, clock, expiry and rule evidence is qualified. |
| KAIROS | Existing expiry/freshness checks | Calendar defect repaired locally. Independent receipt clocks and source availability remain unverified. |
| SENTINEL / TACTICIAN / Human Final Gate | Existing identity, quote, risk, singles/no-push and manual confirmation checks | Preserve authority. No authenticated independent signer or atomic backend concurrency proof established by browser tests. |
| FORENSICS / CALIBRATOR | Existing SCOUT `freezeEvaluation` / `evaluateFrozen`; P7/P8 descriptive diagnostics | Reuse canonical evaluator first. HOLD empirical skill, calibration and production feedback; no authenticated paired outcomes. |
| Resume / canonical state | Existing private drafts in `slate.js`; `canonical-read.js` / `canonical-resume.js` | Disabled live bridge preserved. Exact `candidate_key` and version comparison remain; SQL version type, session and nonproduction record unknown. |
| System Health / Ledger | Recovered UI's explicitly local/static presentation and historical references | HOLD canonical-state claims. This checkout does not prove backend absence or an authoritative immutable Ledger. |

Research prototypes are incompatible with direct runtime import:

- P5 uses decimal odds scaled by 1,000 and integer cents; the dashboard accepts
  American odds and dollar strings. P6/P7 use probability basis points, the
  dashboard uses percentages, and SCOUT evaluation uses fractions. No coercions
  or cross-domain adapters were added.
- Research `candidateId` / `slateId` / `eventId` are not verified canonical
  `candidate_key` / `state_version` mappings. P5/P6 candidate-to-athlete identity
  also requires stronger explicit binding before real-data use.
- P5 worlds include hypothetical prices and settlement assumptions; their counts
  must not feed independent Phase 1 forecasts. Mutable report aliases,
  JSON-stringification hashes and directly exported lower-level P6 helpers are
  additional reasons to avoid importing prototypes into production.
- P9 witness signatures authenticate bytes against supplied trust configuration;
  they do not establish independently controlled clocks, custody or prospective
  availability. P10's caller assertions cannot establish those facts either.
- The P10 prototype still excludes endpoint probabilities 0 and 1. That inherited
  domain restriction is documented, not silently substituted for SCOUT's contract.

## Confirmed repairs

| Defect | Before | Review-only repair / proof |
| --- | --- | --- |
| Impossible calendar timestamps | JavaScript normalized dates such as February 30 into a valid freshness window | Strict calendar, leap-day, clock and offset component validation; valid supported formats preserved |
| Selection mismatch | PRICING and Final Gate could agree with each other while differing from frozen SCOUT selection | Exact trimmed frozen-selection binding at evaluation and atomic pricing intake; changed selections require a revision |
| Missing void terms in P5 | A PUSH plus LOSS could settle before checking the required nonsingle void policy | Missing terms now yield unresolved settlement before loss handling; only in portable research patch |
| P10 admission accounting | Truthy nonbooleans satisfied assertions; WATCH/PASS/ABSTAIN could carry scored predictions; missing pairs were hidden; abstained events inflated independent-event count | Strict booleans, explicit abstention contradictions and prediction missingness, and distinct paired/labeled forecast-event denominator; only in research patch |

No UI/storage system, canonical node, transport, authentication setting, execution
method or production resource was added. Existing drafts are not rewritten.
Contradictory selections or invalid timestamps now require explicit correction
and renewed review. Approval still requires independent manual confirmations,
singles/no-push restrictions and records `placed:false`.

`SOURCE_PROVENANCE.json` retains every original snapshot hash. Four original
JS/CSS assets remain byte-identical. The engine is explicitly a review derivative:
the preservation test pins its exact metadata/hash and reverses only three
recorded changes to reconstruct the original hash. The Gate 02 HTML additions
and disabled canonical bridge are unchanged. This derivative is not deployed.

The five-file research overlay is saved as the nonexecuting
[`patches/arc2-shadow-remediation.patch`](patches/arc2-shadow-remediation.patch).
It was apply-checked against a pristine replay tree; all resulting file hashes
match the tested overlay. Archives and original replay were not edited. One
original P10 positive fixture was explicitly corrected from WATCH to RESEARCH;
new tests independently enforce that WATCH remains nonscoring.

## Tests actually executed

Node v24.19.0; no packages installed. Counts include Node subtests. Separate
replays overlap; do not add them as distinct independent test populations.

| Run | Result |
| --- | --- |
| Original archive Node suites, P5–P10 plus quality | 585/585 PASS |
| Original Python archive audit | 3/3 PASS |
| Pre-fix frontend regressions | 11 PASS, 18 FAIL of 29; expected reproduction, exit 1 |
| Pre-fix P5 new regressions | 6 PASS, 5 FAIL of 11; expected reproduction, exit 1 |
| Pre-fix P10 new regressions | 1 PASS, 22 FAIL of 23; includes absent coverage fields, exit 1 |
| Repaired archive, all Node suites together | 619/619 PASS: 585 inherited + 34 new |
| Current frontend | 129/129 PASS: 100 existing + 29 new |
| Existing SCOUT Opportunity SHADOW | 55/55 PASS |
| Existing ESPN/NBA source-contract SHADOW | 104/104 PASS |
| Existing GS-01 workload SHADOW | 69/69 PASS |

Current repository total: **357/357**. Each archive Node replay used filesystem
read restrictions and transport/process/worker denial instrumentation: zero
unexpected attempts; four intentional denial controls passed per process. Python
checks inspect archives/hash structure and were separately reviewed for read-only
behavior. No live sports, models, quotes or backend requests were made. No new
browser/layout claims are made; there were no layout or storage changes.

Machine receipts, exact commands and source/patch hashes are in
[`evidence/2026-10-15-arc2-remediation.json`](evidence/2026-10-15-arc2-remediation.json).
Raw logs, unchanged archive and replay trees remain outside Git; the recovery
artifact includes the verification harness and logs.

## Backend, security and deployment truth

The archived `CONNECTED_READ_ONLY_OBSERVATION.json` claims ACTIVE_HEALTHY,
`atlas-site-runtime` v9, board/slate2 view mappings, 70 evidence records, 532
quotes, 21 outcomes and one prospective freeze. It also claims zero probabilistic
freezes, zero matched forecast/outcome labels and zero execution-grade quotes;
532 quotes and rules remain UNCLASSIFIED. These are **unsigned archived
observations**, not fresh authenticated results. Do not reclassify old quotes.

The archive reports deployed runtime hash
`48d26073a34349a43df3acd506b5a5fba2a9d97c0225e0487d3f22b72291a718`;
deployed source bytes and independent live query receipts are not included.
This Codex run has no callable Supabase read tools or verified operator session.
Consequently live schema, migrations, RLS definitions, deployed function/source
parity, canonical test data and `state_version` SQL/JSON semantics remain
**BLOCKED**. No production credential or sensitive row was accessed. MCP
registration is not authentication or evidence of application authorization.

The 81 archived `rls_enabled_no_policy` INFO findings do not establish an
exploitable public path. An eventual read-only access-intent review must classify
actual objects using verified metadata:

| Intended access | Evidence needed before proposing a policy |
| --- | --- |
| Internal/server-only | Actual owner, grants, function use and intentional API deny-all |
| Operator through existing server API | Verified JWT/operator checks, function privileges and route scope |
| User-owned rows | Actual ownership predicate and scoped RLS, including cross-user negative tests |

This is a review template, not an inventory of proven table classes. No broad
authenticated grants, SECURITY DEFINER workaround or policy/migration was added.

Recovered source is not the original editable Sites artifact or proof of the
current live revision. Existing PR #6 remains at `a338510`; main and all other
review branches are unchanged. Remote read inspection found SCOUT at `d5067e0`;
source-contract `ed27d9f`, GS-01 `56c6626` and this Arc II work remain local-only.
No GitHub preservation, fresh-task restoration or published-environment claim is
made. Recoverable Git artifacts are supplied separately; no push was performed.

## Dependency-ordered next work

| Priority | Blocker / bounded action | Acceptance and promotion |
| --- | --- | --- |
| P0 | Recover original Passes 1–4 and authoritative 18-gate registry | Hash/source review and named gate requirements; HOLD until supplied |
| P0 | Establish source rights, original bytes, complete census and an independent pre-event witness | Prospective evidence receipt under an authorized existing workflow; never reconstruct past predictions |
| P0 | Preregister one NBA target, frozen baseline/model and outcome rules | Follow [the bounded pilot specification](ARCII_NBA_PROSPECTIVE_PILOT.md); NOT STARTED / NOT ADMITTED |
| P0 | Obtain real later official outcomes with corrections and exact joins | Preserve missingness, void/DNP handling and all abstentions; no accuracy claims from synthetic checks |
| P1 | Verify backend and original-site/source ownership read-only | Authorized session, deployed source/metadata, exact canonical identities/version domain; no auth/CORS changes in this batch |
| P1 | Review current venue quotes/rule versions separately | Exact identity, legitimate source, freshness/expiry and manual gate; HOLD all execution |
| P1 | Test canonical risk/concurrency, expiry, signer isolation and rollback | Safe authorized nonproduction context; browser tests alone cannot clear these gates |
| P2 | Assess real calibration, missingness and event dependence against frozen baseline | Adequate prospective sample and independent evaluation; HOLD predictive/edge claims |
| P2 | Consolidate compatible diagnostics at existing owners | Explicit unit/identity contracts and review before import; no duplicate node/store |

The safe next integration is evidence admission to the existing frozen evaluator,
not copying research engines into the dashboard. No live pilot, deployment,
merge, Supabase change, paid API, inference or betting execution occurred.
