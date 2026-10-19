# ATLAS Operator Remote v2 — reviewed release candidate

**Date:** 2026-10-18 America/Chicago (CI UTC 2026-10-19).  
**Status:** REVIEW_ONLY_NOT_DEPLOYED; no live plugin broker or website deployment.  
**Evidence run:** [GitHub Actions 39191334440](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39191334440), HEAD `95e81c8b5130a6970b3e13f67a89ea130ed58f8d`, five of five jobs PASS.

## Files and authority

- **Active standalone remote:** [`command-center/operator-remote.html`](../../command-center/operator-remote.html) (existing v1 file updated in place; not a new rival remote).
- **Active canonical v2 registry:** [`docs/continuity/ATLAS_OPERATOR_REMOTE_V2.json`](ATLAS_OPERATOR_REMOTE_V2.json). Its first immutable reviewed commit is `6e9910d8e4b6858853b41782d984a391674aeef9`. The browser-embedded manifest is generated from that exact source and equality-checked in CI; commands explicitly cite this immutable Git commit. v1 registry is historical.
- **MasterSave remains separate:** `docs/continuity/ATLAS_MASTER_CHECKPOINT_2026-10-18.json`, source anchor `1ae37684b060750a54036f113f144351ecab3c15` and [verified backup receipt](ATLAS_MASTERSAVE_VERIFICATION_2026-10-18.md).
- **Preserved Command Center:** `command-center/index.html`, `app.js`, existing Final Gate, ledger and backend stay unchanged.

## Concrete v2 improvements over v1

1. **7-provider routing preview** (GitHub, Notion, Create State, Drive, Linear, tldraw, Figma). Each of the eight existing actions illuminates its expected plugin route. Status is **Not live-checked**, never inferred from this static file.
2. **3 deliberate read-only workflow kits:** PREFLIGHT = STATUS → PLUGINS, RECOVERY = RESTORE → AUDIT, RESEARCH_PREP = ARCIII → GRAPH → STATUS. All code and registry tests reject non-read actions in any kit.
3. **Permission-mode gate:** MASTERSAVE and RESUME default to `PREVIEW_ONLY`, with no write or new research authorized. A specific checkbox changes the generated text to `OPERATOR_APPROVED_REVIEW_ONLY`. Switching action or routine resets this consent; no production, sportsbook, plugin install, or Arc III sign-off.
4. **Portable evidence receipts:** generated ChatGPT commands request `action_id`, `observed_at`, `sources[{provider,source_ref,observed_at,status}]`, `result`, and `remaining_blockers`. ChatGPT must still read real linked tool output. Generated receipts are not independent provider attestations.
5. **Offline/security controls preserved:** no fetch, outgoing browser network calls, account tokens, local/session storage, background tasks, or hidden state. Strict CSP and manual clipboard fallback preserved.
6. **Mobile UI:** responsive plugin cards and routine options, working at 375–390 CSS-pixel viewports; action selection and checkbox gates tested in real Chromium.

## Verified test results

The final pre-documentation code commit, `95e81c8b5130a6970b3e13f67a89ea130ed58f8d`, has [complete GitHub Actions PASS](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39191334440).

- **168/168** Command Center and remote Node tests PASS, including manifest exact parity, immutably pinned registry, read-only route packages, explicit consent reset, prompt evidence receipts, security, clipboard behavior and provider mapping.
- **8/8** actual Chromium tests PASS, including iPhone-sized viewport, plugin-route selection, routine order, plan/execute gating, clipboard denial and zero external network requests.
- **12/12** MasterSave integrity and drift tests PASS.
- **261/261** offline SCOUT/Outcome Intelligence research integrity tests PASS.
- **Original snapshot provenance** separate job PASS.

Earlier intermediate commits during v2 development produced failed test jobs because old v1 assertions were not yet migrated and test fixture callbacks were not correctly awaited. Those intermediate failures are retained in GitHub history. This review records the latest completed PASS without pretending earlier fails never existed.

## Trust and application boundaries

- The **HTML is a prompt launcher**, not an authenticated plugin API and not a live health monitor.
- The **ChatGPT in-conversation operator controls** can initiate action-specific tool workflows only after a genuine user click. The provider still enforces its own authorization and user connection process.
- The **GitHub pinned reviewed content** is authoritative for code and research documentation only. Supabase operational state, bet execution and authentic sportsbook prices require their own independently authenticated evidence. Do not use retrospective synthetic tests to infer edge.
- User-initiated MasterSave may update the review branch and connected pointers/backup only when available and read back; this is **not background synchronization**.
- The preserved Arc III pause remains **15 passes planned, 0 formal Arc III sign-offs**; Floot parked. The RESUME control does not imply Final Gate approval.

## Remaining improvements (not yet delivered)

- Truly hosted smartphone-friendly remote URL with authenticated provider-safe backend, permission scoping and rate limits: **NOT BUILT, NOT DEPLOYED**. Need separate deliberate deployment/security review.
- Automatic connected-app health and durable event receipt ledger: **NOT BUILT**. A receipt requested from the assistant must be saved and verified separately.
- Device-specific accessibility/manual iPhone Safari testing: **NOT VERIFIED**; real Chromium mobile emulation only.
- Fresh cross-provider readbacks for the **v2 documentation pointer**: to be collected when updating secondary indexes; static HTML never guarantees sync.

**Next useful operator action:** try the **PREFLIGHT** kit in ChatGPT (STATUS → PLUGINS, read-only) and confirm actual current connected providers before any write workflow.
