# Pass 10 — Floot SHADOW ↔ ATLAS discovery reconciliation

**Status:** REVIEW / SHADOW ONLY. No merge, deployment, sportsbook connection, model execution, or human approval implied.

## Verified provenance at handoff
- Canonical ATLAS GitHub review branch: `review/pass0-slate-regression-2026-10-16`.
- Pass 9 CI `39101023568`: baseline provenance PASS, 154/154 Node regressions PASS, five real Chromium scenarios PASS. In the Chromium suite the GUI research packet uses the actual slate ID; storage quota simulations verify exact saved draft bytes.
- Floot project: `c79bff86-a646-4f33-99a2-68e577d4a4c7`, ATLAS Shadow Command Center, v0.4 research-custody prototype. Floot helper specs and typecheck run separately; CI in this repository **does not** execute Floot's code.

## Research-only exchange contract
1. Floot accepts a user-supplied `atlas.research.v1` packet (`phase: research`, an explicit `runId`, 1–8 candidates, exact scout event/start/market/selection). User claims are copied into preserved, **unverified** SCOUT/VERIFY/ORACLE observations. Floot keeps these in browser localStorage, not any backend.
2. Floot's **Export to ATLAS** produces `atlas.discovery.v1` with `revision`, `records` and `events`. Records use the **current canonical key** `event|startsAt|market|selection` (trimmed, lowercase); observations use `at,runId,verify,oracle,disposition`; events use `at,runId,key,action`.
3. Floot excludes demo/legacy records lacking preserved source observations from ATLAS exports. An ambiguous canonical delimiter collision, source-scout identity mismatch, or oversized payload blocks conversion; users should retain the full Floot Shadow backup.
4. In the current Command Center the operator chooses **Restore discovery** for the exported census file. It calls `AtlasDiscovery.importJSON` and `AtlasDiscovery.merge`; it **does not** inject candidates into the live slate, validate forecasting/independence, import pricing, or confer execution authority.
5. Floot's full `atlas.shadow.session.v2` export is a separate recovery backup and **must not** be mislabeled an ATLAS census. A legacy `atlas.shadow.session.v1` restore preserves ambiguous origin as `legacy`, not `synthetic`.
6. Both systems remain browser-local and single-device unless an operator transfers a file. No Supabase/Floot database, GitHub automation, online synchronization, or immutability assumption is established.

## Tests and remaining gates
- Floot: `helpers/shadowProtocol.spec.tsx` exercises preserving unreviewed source fields, replay, multi-run receipts, malformed packet rejection, v1 migration, export format, exclusion of demos, delimiter collisions. `helpers/shadowWorkspace.spec.tsx` mounts the React UI, tests staging/reload and corrupt-storage lock. Floot TypeScript typecheck is separate.
- ATLAS: `command-center/tests/pass10-floot-bridge.test.cjs` independently checks that a synthetically constructed Floot-format census is accepted, merged idempotently, and does not create approval or pricing assertions. This is a **contract fixture**, not proof of a live cross-platform file transfer.
- OPEN: visually and interactively inspect Floot's real phone preview when its tab is foreground; execute an exported file round-trip into the real ATLAS UI; verify source identities, conflict policy, recovery after browser termination, access controls, durability, true point-in-time proof, and independent pricing. Two browser keys cannot be made crash-atomic by compensating writes alone. No live feed or joint probability model exists in this prototype.

**Stop rule:** Do not promote Floot to the ATLAS source of truth based on green synthetic/unit/UI tests. A prospective freeze, actual ingestion, source verification, and independently audited decision ledger are still required.
