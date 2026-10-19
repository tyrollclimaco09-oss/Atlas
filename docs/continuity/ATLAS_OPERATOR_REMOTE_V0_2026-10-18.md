# ATLAS Operator Remote v0 — control surface contract (review-only)

**Purpose:** One mobile-friendly command surface that dispatches explicit operator requests to connected tools and shows verified readbacks. This is NOT a new source of truth, credential vault, sportsbook execution agent, or automatic orchestration service.

## Authority and boundaries

- GitHub: code, docs, immutable review evidence and checkpoint manifest. Current review branch `review/pass0-slate-regression-2026-10-16`.
- Notion: human-readable Codex/index; Create State: searchable graph/context; Google Drive: independent recovery copy; GitHub Actions: actual CI run results. None substitutes for another.
- ChatGPT connected plugin actions only run where the user has actually connected and authorized them. A standalone website cannot call ChatGPT plugin APIs by itself. Do not imply otherwise.
- No credentials stored in browser localStorage, URL parameters, GitHub commits, or source files. Do not build an unrestricted tool proxy.
- Fail closed on unavailable connection, missing source, expired handoff, mismatched SHA, pending CI, ambiguous intent, or unavailable current book quotes. Mark `UNKNOWN`, `BLOCKED`, or `CONFLICT`; never display a synthetic PASS.
- Read-only and research actions can be proposed from the remote; GitHub writes require explicit operator action; all release/production promotion and wagering require separately verified human approval and existing Final Gate. Remote must not place bets.

## Six commands (all operator-triggered, never scheduled)

| Control | Intended ChatGPT command | Allowed v0 output | Stop line |
| --- | --- | --- | --- |
| Run Slate | `ATLAS: Run the slate. Research only, preserve canonical registry and evidence.` | Research board, evidence, abstentions | No sportsbook submission or fabricated odds |
| Final Gate | `ATLAS: Inspect Final Gate for current slate; require actual user quote and explicit sign-off.` | Verify/hold checklist | No implicit authorization |
| MasterSave | `ATLAS: MasterSave. Pin source commit, blob IDs, CI, compare Notion/Create State/Drive readbacks, record conflicts.` | One versioned checkpoint receipt | No automatic sync claims |
| Reconcile | `ATLAS: Reconcile GitHub review branch, test receipts, plugin mirrors, drift and blockers.` | Status and next repair | No production changes |
| Plugin Hub | `ATLAS: Audit connected plugins, capabilities, permissions and freshness for this workflow.` | Connected/available/blocked map | No phantom connection |
| R&D Lab | `ATLAS: Continue evidence-first shadow R&D, preserve Arc III pass accounting.` | Review-only experiments | No premature production promotion |

## State model

Each command yields `request_id`, `intent`, `requested_at`, `actor=HUMAN_OPERATOR`, `capability`, `source_ref`, `source_sha`, `evidence_time`, `connection_state`, `status` (`READY`, `UNKNOWN`, `BLOCKED`, `CONFLICT`, `REVIEWED`), `result_ref`, `approval_required`, and `limitations`. Missing fields remain missing; never invent receipts or fill blanks from memories.

## V0 experience

1. Use a ChatGPT control menu (or manually copy one of the exact commands) to start the workflow.
2. Assistant discovers and calls the specific connected plugin, validates the tool result and readback, and reports status.
3. Only after verified result, optionally write one GitHub review receipt and project a short Notion/Create State pointer.
4. On mobile, surface compact summary and direct links to GitHub Actions, Notion Codex, Drive recovery and approved dashboard.
5. Do not claim that a web dashboard has direct plugin execution until a separately designed authenticated bridge is deployed and tested.

## Roadmap / acceptance gates

**V0 — now:** in-chat commands + versioned operating contract; no new app, no extra backend, no paid API.  
**V1 — later, only after approval:** read-only mobile dashboard rendering verified status via narrow authenticated adapters and an explicit connection inventory. No provider secrets in client.  
**V2 — later:** per-action scoped backend broker, least-privilege tokens, audit logs, idempotency, allowlisted commands, CSRF protection, rate limits, expiry and human confirmation. Threat-model before rollout.  
**V3 — only if proven useful:** authenticated event-driven connector synchronization with conflict review, not latest-wins.

**Acceptance for v0:** six documented commands; canonical authority boundaries; no duplicate database; no auto-execution; actual GitHub commit; CI observed separately. Arc III stays 0/15 until explicitly resumed.
