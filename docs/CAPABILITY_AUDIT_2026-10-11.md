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
