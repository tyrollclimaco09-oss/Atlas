# ATLAS capability hardening — evidence supplement (2026-10-11)

This is an additive, scoped audit of the **existing** ATLAS project, not a replacement for canonical architecture or an assertion of production readiness. Prior dated reports remain point-in-time receipts. Method: connected GitHub metadata/review source, connected Supabase project metadata and deployed Edge Function source, read-only SQL and log probes, and locally stubbed Node tests.

## Observed capabilities and limits

| Area | Observed evidence | Correct state |
| --- | --- | --- |
| GitHub | ATLAS public repo; `main` retained at baseline; review/recovery branches exist | Source-control and review work available, not live-site equivalence |
| Supabase project | `ACTIVE_HEALTHY`; eight `ACTIVE` Edge Functions listed | Metadata/Edge deployment observed, runtime success unproven |
| Database | Read-only `execute_sql`, table list and security advisors return connection timeouts | **SQL inspection blocked**; no full outage assertion |
| Logging | Read-only aggregate log service returned source counts in a prior check | Observability partially available; no sensitive records read |
| Operator surface | Deployed site-runtime v9 has GET-only handlers for board, candidate, alerts, reassessment, state and health surfaces | Handler/source evidence only; original ChatGPT Sites source and HTTP acceptance unavailable |
| Intake | Runtime-intake v3 validates operator identity before named database RPC | Procedure, constraints and HTTP behavior not inspected |
| Source acquisition | NFL free scout v1; multisport free scout v2 retrieve/normalize reference schedules; SHADOW/verify-only options | Reference only; no independent corroboration or execution authority |
| Odds data | Odds ingestion v17 and two provider smoke utilities exist | Price/time/authorization/cost controls require checks |
| Health | Core health v16 uses one database read model | A verified **source-level false-green logic defect** remains in deployed function |
| OmniRoute | Preserved private gateway/source preview tests; published preview previously failed HTTP 500 | Gateway development not equivalent to successful inference |
| Human Final Gate/RC9 | Existing doctrine and historical reports | No current end-to-end enforcement receipt; keep execution HOLD |
| Forecast, pricing, forensics | Intended canonical modules | No new working implementation inferred from tool registration or docs |

## Review-branch patches (not deployed)

1. `scripts/health/health-policy.cjs`: separate pure fail-closed reference evaluator. It retains current public top-level enum (`HEALTHY`, `DEGRADED`, `STALE`), propagates unknown/degraded evidence into non-green state, rejects invalid/future timestamps, and avoids rounded-age classification at exact thresholds. **Review logic only**, not an automatic replacement for deployed function. Confirm consumer contract before integration. Unit tests: `node --test scripts/health/health-policy.test.cjs` (17 local passes).
2. `scripts/omniroute/local-only.cjs`: when the validation-only fetch preload allows a loopback URL, pass `redirect: 'error'` to deny automatic redirect following. **Not an OS sandbox**; no running instance was restarted. Regression addition `scripts/omniroute/tests/fetch-redirect.test.cjs` (3 local passes); existing regression suite (7 local passes).
3. Combined isolated Node test run: 27/27 local passes with stubbed network. Tests are not live gateway/Edge acceptance, fresh Codex restoration, production-load proof or a full CI run.

## Ranked blockers and probes

| Rank | Gap | Next bounded proof |
| --- | --- | --- |
| P0 | SQL inspector times out while project is marked healthy | Distinguish connection/pool/proxy access vs DB failure using sanctioned read-only checks, no sensitive rows |
| P0 | Health source may return green on unknown/degraded market snapshot | Adopt reviewed pure logic only after downstream enum tests; nonproduction HTTP test and explicit deployment approval |
| P0 | HUMAN FINAL GATE, expiry, signed receipts, idempotent execution are not currently verified end-to-end | Restore exact RC9 runner, versioned constraints and nonproduction unauthorized/retry/timeout acceptance tests |
| P1 | Site/source custody fragmented | Recover original ChatGPT Sites source and map existing API modes to Supabase; do not rebuild or duplicate |
| P1 | Odds-ingest checks a decoded JWT role string | Check gateway signature parity; verify service identity cryptographically or through a vetted server-side credential; see issue #3 |
| P1 | Scout idempotency uses read-before-insert application checks | Inspect uniqueness/transaction guarantees and concurrent retries; see issue #4 |
| P1 | Provider smoke endpoint publishable-key auth and third-party quotas | Validate caller restrictions, budgets and mock no-cost fallback, see issue #5 |
| P1 | OmniRoute published HTTP synthetic preview previously returned 500 | Build fixed source separately and recheck locally; no paid inference |
| P2 | Independent model, edge/thesis, pricing, game-sense, calibration not end-to-end demonstrable | Prove one point-in-time fixture from SCOUT through human rejection/approval to replay before expanding |

## Safe integration order

PRESERVE existing site and deployment -> RESOLVE read-only database reachability -> MAP actual authority and existing schemas -> FIX misleading health and auth guard rails with shadow tests -> COMPLETE one non-betting candidate round trip -> VERIFY final-gate/RC9 invariants -> then evaluate R&D adapters.

Never copy production secrets or sensitive source/rows into public GitHub; do not merge, deploy, migrate, create agents or jobs, enable inference, or execute bets from this audit alone. No external provider billable calls were made.

## Current cloud reconciliation and health-input batch

This supplement records a new current-instance check after provisioning. It does not rewrite the earlier receipts. The uploaded **ATLAS — MASTER RECONCILIATION, RECOVERY & ENGINEERING HARDENING** request controls this batch. Its pipeline, human authority, and FOUNDATION/EXPEDITION/CONSTELLATION/ORION layers are preserved. The canonical baseline remains byte-identical to main (SHA-256 `dd323f190b6670280833815cf7139aaec9a623337ee6d6d27286ed8682862000`).

**Verdict:** PASS for the bounded review-source batch; BLOCKED for authenticated deployed inspection and original-site recovery; UNKNOWN for current end-to-end ATLAS enforcement. No production-readiness verdict follows from local tests.

### Fresh findings and work completed

- Native Git verified `main` at `be38a56c10b4c8f8168689e8cf59413fb35e10e2`, reconciliation at `42450a22710f80c00f9e0e95151c12f9e6eb7217`, capability hardening at `0fb64c215de5b8096a97eab0fdcbe8aad4551c1c`, and the feature branch at `3d6a929315cb098ea8344d929a03153997ec3f15`. OmniRoute's preview-fix ref still advertises `d4f39e2189f1ef189ab1fd7838e555c1a8e23c1d`.
- All 17 selected checkouts were initially clean. Main contained the canonical narrative; the existing capability-hardening branch supplies developer helpers and the reviewed health policy, not recovered frontend/Edge/SQL application source. Work uses that existing review branch; no duplicate issue, PR, or decision component was created.
- The original 27 isolated tests were rerun: 27 passed, zero failed/skipped. Historical pass counts alone were not accepted.
- **Confirmed reference-policy defect:** `Date.parse` normalizes February 30, non-leap February 29, April 31 and `24:00:00`. The policy could classify their normalized instant as `HEALTHY`. It also accepted integers outside JavaScript's exactly representable range as valid connection counts. Nine new regressions failed before the fix.
- `scripts/health/health-policy.cjs` now validates calendar/time/offset components before parsing, and requires safe integer connection metrics. Public keys, `HEALTHY`/`DEGRADED`/`STALE`, reason-code names, freshness thresholds and future-skew tolerance remain unchanged. Valid leap dates and positive/negative offsets retain healthy behavior. This remains a reference evaluator; no deployed function was replaced or connected.
- Added one real HTTP regression for the existing redirect defense: an ephemeral loopback server serves normal health successfully, but its redirect is rejected and the target receives zero requests. The same regression fails against the pre-redirect reconciliation source. No external address, gateway, credential or model is involved. The guard remains additional Node protection, not an OS/native/subprocess sandbox.
- Supabase agent-skill entry points already exist in the preserved branch. No unpinned reinstall or duplicate MCP configuration was created.

### Current instance versus historical runtime

| Check | Result | Direct current evidence |
| --- | --- | --- |
| Node / npm / Python | PASS | 24.19.0 / 11.9.0 / 3.12.14 |
| Existing hardening suite | PASS | Original 27/27, exit 0 |
| New health tests against unchanged baseline | FAIL, expected regression proof | 31 tests: 22 pass, 9 fail, underlying exit 1 |
| Real HTTP redirect test against pre-redirect source | FAIL, expected regression proof | 0 pass, 1 fail, underlying exit 1 |
| Final integrated local suite | PASS | 42/42; zero failed, skipped, cancelled or todo; exit 0 |
| Changed CommonJS syntax / diff whitespace | PASS | Three `node --check` commands and `git diff --check` |
| Current private gateway | BLOCKED | `127.0.0.1:20128/healthz`: connection refused; retained runtime/config directories and Pi CLI absent initially |
| Live published preview / Pi transport / actual coding inference | NOT TESTED | No installed gateway or approved inference provider; prior 500/400 receipts remain historical |
| Fork preview/ranking suites | NOT TESTED in this batch | Ref verified; fork `node_modules` absent. Prior 8/8 and 6/6 remain historical |
| GitHub PR #6 API / current issue states | BLOCKED | Git reads work; GitHub API returns Forbidden / proxy CONNECT 403 |
| Supabase metadata / MCP endpoint | BLOCKED | Current HTTP 403 / proxy CONNECT 403, before authenticated database inspection |
| Codex Supabase registration | BLOCKED | `codex mcp add` cannot persist managed `/run/codex-environment/codex-home/config.toml`: read-only filesystem |
| Supabase OAuth / SQL / pooling / grants / RLS | NOT TESTED | Registration and authenticated-access prerequisites unavailable; no outage or permission conclusion |
| Original reported site retrieval | BLOCKED | Exact supplied hostname returns proxy CONNECT 403; no source or rendered UI recovered |
| Independent restoration | NOT TESTED | This is a new provisioned checkout, not verified restoration of the previous retained runtime/authentication |

The checkpoint's ACTIVE_HEALTHY project and eight Edge Function versions are **reported historical metadata** in this batch: odds-smoke v16, odds-ingest v17, core-health v16, therundown-smoke v11, runtime-intake v3, site-runtime v9, nfl-free-scout v1 and free-sports-scout v2. None was freshly inventoried, invoked, exported or deployed. Current proxy denials do not reproduce the earlier SQL timeouts and do not establish a complete database outage.

### Source and state ownership

| System | Canonical role from the request | Observed source / state custody |
| --- | --- | --- |
| Original ATLAS Command Center | One operator interface | Existing supplied ChatGPT Sites URL; original files, revision, browser storage and API contracts unavailable |
| Supabase `lhliqbbooproqtslmgqi` | Canonical application data/state | Historical handler descriptions only; current tables, RPCs, constraints, RLS and state locations UNKNOWN |
| GitHub / Atlas | Versioned source and evidence | Exact baseline/review refs, developer helpers, local reference policy/tests and preserved documents accessible |
| Codex | Controlled engineering/review | This isolated cloud checkout executes local tests; managed global MCP config is read-only |
| ChatGPT | Research and supervised handoffs | User-supplied reconciliation artifact accessible; original Sites artifact/Page retrieval tooling unavailable |
| OmniRoute / Pi | Optional development transport | Gateway recipe and guards versioned in Atlas; preview-fix ref verified; installed runtime, transport and inference unverified here |
| External sports/reference repositories | Evidence inputs and research candidates | Selected checkouts present; no ATLAS application manifest/adapter wiring proves active integration |

The following maps intended ownership without inventing an actual table, route, storage key or RPC. Historical handler existence is not a verified browser-to-database contract.

| Existing feature/state to recover | Intended owner / interface | Current exact storage/API proof |
| --- | --- | --- |
| Command Board; Golden Slate; slate resume | Supabase state, original Command Center UI | UNKNOWN; site-runtime v9 reads reported, source/contracts unavailable |
| Apply Research; research copy/paste | Supervised ChatGPT handoff, original UI, Supabase intake | UNKNOWN; runtime-intake v3 reported; identity/schema/resume acceptance unverified |
| OpenGPT navigation | Original Command Center / ChatGPT handoff | UNKNOWN; original navigation source unavailable |
| Candidate identity; duplicate-run prevention | Supabase canonical identity and ingestion owner | UNKNOWN; uniqueness/transaction/RPC and browser run IDs unavailable |
| Source freshness; Sentinel classifications | Existing FILTER/VERIFY, KAIROS and SENTINEL owners using Supabase evidence | UNKNOWN deployed contract; local health reference is independently tested, not an execution gate |
| Human Final Gate | Human approval and existing backend enforcement | UNKNOWN protocol, authority, expiry and replay enforcement; execution HOLD retained |
| Ledger; Forensics | Supabase immutable history, existing ledger/forensic owners | UNKNOWN tables/receipts/replay contracts; no rows read or substitute storage created |
| System diagnostics | Existing backend diagnostics and operator UI | core-health v16 reported; local reference policy verified; live health/consumer parity unverified |

### Security findings and confidence

| Finding | Status / confidence | Scope and consequence |
| --- | --- | --- |
| Invalid normalized dates / unsafe DB counts produce false green | FIXED in local review source; high confidence | Deterministic failures and passing regressions. Production applicability UNKNOWN until real function/consumer parity is inspected; relates to existing issue #1 |
| Redirect denial | PASS at actual isolated HTTP boundary; high confidence | Existing fix independently verified; no claim about a running gateway or universal network isolation |
| Odds-ingest decoded JWT role / signed service identity | UNKNOWN current enforcement; historical concern | Existing issue #3; deployed gateway signature checks and server-side identity must be inspected, no replacement auth invented |
| Scout read-before-insert / concurrent duplicates | UNKNOWN current enforcement; historical concern | Existing issue #4; DB uniqueness/transactions unavailable, so absence of race protection is not proven |
| Provider authorization and quota consumption | UNKNOWN current enforcement; historical concern | Existing issue #5; no paid provider enabled or third-party API consumed |
| Final-gate/RC9, receipts, deadlines, replay, RLS and RPC privilege | UNKNOWN current enforcement; readiness blocker | Original runner/schema/nonproduction fixtures required. Historical counts are not production proof |

### Preserved R&D and next integration opportunities

All classifications below separate reported decisions from demonstrated implementation. No sports R&D promotion occurred and no useful research was removed.

| Initiative | Reconciliation classification | Required evidence / existing owner |
| --- | --- | --- |
| GH-01 validation; Pandera-inspired FILTER/VERIFY | Approved but not wired (reported); current implementation UNKNOWN | Recover native schemas/fixtures and GH-01 decisions before importing a validator |
| NFL_DATA_ADAPTER; nflreadpy/nflverse | Approved but not wired (reported); current implementation UNKNOWN | Recover adapter registry, point-in-time source contract and dependency pins |
| Independent fair pricing, multi-method de-vig | SHADOW/experimental (reported), active implementation UNKNOWN | Versioned pricing fixture, independent forecast receipt and bookmaker-price separation |
| Native provenance / OpenLineage-inspired continuity | BLOCKED on original source | Recover lineage/receipt ownership; no parallel provenance store |
| Player props and underutilized markets | BLOCKED on discovery/identity/freshness contracts | SCOUT input adapters and verified actual market availability |
| Conditional game scripts; Game Sense; game-world/SGP correlation | SHADOW/experimental (reported), active implementation UNKNOWN | One chronological scenario/joint-probability harness with baseline comparison |
| EDGE THIEF ↔ ORACLE adversarial research | BLOCKED on contracts/fixtures | Recover bounded thesis/counter-thesis flow; no extra decision node |
| KAIROS; SENTINEL; immutable exposure history | BLOCKED on runtime/schema proof | Recover freshness/deadline/risk and ledger contracts; reference health tests do not supply authority |
| Walk-forward, CLV, Brier, log loss, ROI/drawdown, calibration uncertainty/drift, no-lookahead replay | BLOCKED on original ledger/outcome/evaluation source | Shared FORENSICS/CALIBRATOR harness, immutable point-in-time inputs and held-out chronology |
| False-kill / rejected-candidate analysis | Redundant backlog views of the same rejection history; implementation UNKNOWN | Preserve labels/cases under one existing history/replay owner |
| DuckDB/Polars/Hypothesis and other GH-01 integration choices | Deferred pending actual recovered contracts/workload; approvals preserved as reported | No blanket dependency installation or competing data engines |
| Gambly, Pikkit, OddTrader, Props.ai, Monster.bet, YourLineMate, HOF | Deferred research references, not verified active integrations | Evidence and authorization before any consumption/integration |

Next five priorities, in dependency order:

1. Apply the reviewed exact-host network additions and provide supported writable Codex MCP configuration; verify narrow authenticated metadata access without requesting secrets in chat or bypassing the managed configuration.
2. Recover the original Command Center files and sanctioned deployed definitions; locate exact state, candidate/run identity, approval and receipt owners. Preserve site/source provenance; build no replacement interface.
3. Investigate issue #2 using metadata-only read access, connection/pool/proxy diagnostics and permissions. Inspect actual constraints/RLS/RPCs without changing production or broadening grants.
4. Compare the reviewed health logic to core-health v16 and its consumers in a nonproduction contract test; then address service identity and scout idempotency at their existing owners under issues #3/#4.
5. Recover the actual RC9 runner and prove one existing non-betting candidate handoff, rejection/resume and human-gate/deadline/replay path before expanding research or approving integration.

### Reproduction and review

From `/workspace/Atlas` on the existing capability-hardening review branch:

```bash
node --test --test-reporter=tap scripts/health/health-policy.test.cjs scripts/omniroute/tests/local-only.test.cjs scripts/omniroute/tests/fetch-redirect.test.cjs scripts/omniroute/tests/fetch-redirect.http.test.cjs
git diff --check
```

The before-fix controls exported the unchanged policy from `0fb64c215de5b8096a97eab0fdcbe8aad4551c1c` and the pre-redirect guard from `42450a22710f80c00f9e0e95151c12f9e6eb7217` into a temporary directory, copied the new corresponding tests beside them, and invoked `node --test --test-reporter=tap`. Underlying exit 1 is retained as expected regression proof, not relabeled a passing suite.

See the [sanitized current receipt](evidence/2026-10-11-health-input-validation.json) for commands, versions, counts, code hashes and access limitations. Raw local logs are under `/workspace/audits/atlas-health-input-validation-2026-10-11`; that path is not a publication/restoration guarantee.

Existing review: [PR #6](https://github.com/tyrollclimaco09-oss/Atlas/pull/6), reported to target reconciliation. Current open/merge/base metadata could not be independently checked through the blocked API. No duplicate PR/issue was created. Local changes use `review/atlas-capability-hardening-2026-10-11`; the final handoff distinguishes local commits from remote preservation and deployment.

Only `network.allowed_domains` was saved to the cloud draft, preserving all known existing destinations and adding `mcp.supabase.com`, `api.supabase.com`, `api.github.com` and the exact original-site hostname. Saving does not apply networking, authenticate MCP, start services or publish. No `install_script`/`start_skill` replacement was necessary for the dependency-free Node review workflow; prior instructions remain preserved. Full application setup remains BLOCKED on source/access, and the previous gateway restoration recipe was not silently executed as this batch's workflow.
