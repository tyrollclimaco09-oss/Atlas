# ATLAS Remote — bounded public GitHub status bridge (review only)

**Date:** 2026-10-19, America/Chicago.  
**No hosted URL, no logged-in operator identity, no private plugin bridge, no production deployment or wagering.**

## Why this lane

The existing repository `tyrollclimaco09-oss/Atlas` was read through the connected GitHub app and reported **visibility: public**. A narrowly scoped public GitHub REST reader is an appropriate first test of the ATLAS Remote's STATUS workflow; it is not a substitute for authentication before publishing a private control API. GitHub allows unauthenticated reads of public workflow metadata, usually subject to 60 requests/hour/IP.

The adapter is **GitHub-specific**. It does not bind ESPN or any sports data feed to SCOUT, cannot establish a profitable edge, and does not grant access to ChatGPT's private connector sessions.

## Source components and proof boundaries

| File | Purpose | Admission/proof |
| --- | --- | --- |
| `scripts/remote/github-public-status.cjs` | Fixed, tokenless public-REST read of review-branch current commit, workflow runs, and current-head jobs | No user-supplied URLs, refs, HTTP methods, credentials or dynamic target hosts |
| `scripts/remote/status-gate.cjs` | In-process STATUS-only gate layering the existing `authz-contract.cjs` over the public adapter | **NOT an HTTP server or real identity provider**. A synthetic trusted context in tests cannot authorize real users |
| `scripts/remote/github-public-smoke.cjs` | Informational on-demand public GitHub observation with explicit LIVE_UNVERIFIED/LIVE_OBSERVED_NOT_GREEN statuses | CI green **does not imply** successful external read; inspect actual log report |
| `scripts/remote/github-public-status.test.cjs`, `github-public-smoke.test.cjs` | Hermetic adversarial checks and staged status fixtures | Mocks prove code behavior; real availability requires independent evidence |

## Exactly what can be fetched

Only `GET https://api.github.com/repos/tyrollclimaco09-oss/Atlas/commits?sha=<frozen_review_branch>&per_page=1`, `GET .../actions/runs?branch=<frozen_review_branch>&per_page=5`, and `GET .../actions/runs/<validated_run_id>/jobs?per_page=20`. The repository and branch are compiled-in constants; the run ID must originate in validated GitHub response metadata. The adapter requests versioned GitHub REST JSON, rejects redirects, applies a five-second per-request deadline, bounds JSON bodies to 1 MB, never supplies an access token and uses no write methods.

To classify **MATCH**, current branch HEAD, matching workflow run HEAD, and all five expected review jobs must all report completed and success. In-progress, absent, stale or incomplete results are **PARTIAL**. Failing current-head CI is **CONFLICT**. Rate limiting, invalid JSON, oversized response, provider outage or malformed input remain **UNKNOWN**. The timestamp and source URLs are returned as evidence links; a public API response is not a cryptographic signature or internal deployment attestation.

## Authentication and production stop lines

- This is **not** an API for untrusted internet callers. The `status-gate` function accepts an externally supplied *trusted server context*, but neither the trusted identity middleware nor an HTTP server is built or connected. Never infer actual login from a synthetic test session.
- A live private remote still requires a separately approved HTTPS domain, identity provider, owner session with server-only cookie and revocation, CSRF enforcement, least-privilege provider adapters, request limiting, auditable receipts and endpoint hardening.
- The legacy static remote HTML remains **connect-src 'none'** and cannot call this local Node function. Its plugin badges remain **Not live-checked**; no invisible client-side wiring was added.
- MasterSave/RESUME never enter this read-only status bridge. No provider write grants, Final Gate changes, automatic bets, deployment, plugin installations, Supabase operational data mutations or Arc III pass promotion.
- The remote's pinned v2 command registry remains `docs/continuity/ATLAS_OPERATOR_REMOTE_V2.json` at immutable commit `6e9910d8e4b6858853b41782d984a391674aeef9`.
- Existing MasterSave historical anchor remains `1ae37684b060750a54036f113f144351ecab3c15`; Arc III remains **15 planned, 0 formal closes** and Floot parked.

## Audit acceptance gate

1. Review CI must run new tests and baseline jobs, with exact commit SHA and result retained.
2. The optional live GitHub observation must be inspected separately; **UNKNOWN, in-progress or stale HEAD is not a proof of current healthy integration**.
3. Never describe `status-gate` as authenticated until an independent real owner identity service has been implemented and authorization/replay tested end-to-end.
4. Only next deliberate deployment step after real identity choice: private HTTPS host + read-only STATUS route, fresh provider proof, deny-by-default behavior; all write capabilities remain disabled.

## Actual proof readback — 2026-10-19 UTC (review branch)

**Commit under test:** `8a647b022c178b7ec2eafd341a190b7d54a757b1`.  
**GitHub Actions run:** [39266988430](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/39266988430). `status=completed`, `conclusion=success`, all **five required review jobs succeeded**. Exact job names were fetched from GitHub after the workflow completed.

- Review/remote Node tests: **193/193 PASS**, including STATUS adapter schema, bounded public GET allowlist, stale-head denial, in-progress CI, missing/failing job detection, 403/404/network/invalid JSON/oversize refusal, synthetic trusted-context gating and grant non-consumption.
- Actual Chromium tests: **9/9 PASS**; prior mobile and clipboard requirements preserved.
- MasterSave source integrity tests: **12/12 PASS**.
- Offline SCOUT / Outcome Intelligence: **261/261 PASS**.
- Original baseline provenance: **PASS**.

**Independent live observation from the code running in CI (not a fixture):** In the `Review code and regression suite` job log at **2026-10-19T14:13:25.142Z**, `github-public-smoke.cjs` reported `live_provider_response_observed=true`, `observed_head=8a647b022c178b7ec2eafd341a190b7d54a757b1`, `same_as_checked_out_commit=true`, `adapter_classification=PARTIAL`, `reason=CI_NOT_COMPLETED`, and `final_verdict=LIVE_OBSERVED_NOT_GREEN`. That was **correct**: the job's own workflow was still in progress. This is evidence of an actual response from GitHub's public API and SHA parity, **not** evidence the adapter observed a green workflow *at that moment*. The independently fetched Actions run and five job readbacks subsequently established final green CI.

The public adapter therefore has **verified live public-source contact and fail-closed in-progress classification**, plus **independent later CI completion proof**. It has *not* yet demonstrated the adapter's `MATCH` classification against an already-completed live current-head workflow in a separately executed runtime. The synthetic/fixture tests covering that state passed; do not silently upgrade them to live evidence.

No user login, external HTTP server, OAuth token, hosted app, background service, private provider connector or sports feed is included. This patch is a reviewed status bridge, not production readiness.
