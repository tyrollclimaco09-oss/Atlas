# ATLAS Operator Remote — phone and authentication foundation (review only)

**Checkpoint:** 2026-10-19, America/Chicago. **No hosted URL, no live login, no provider tokens.**  
**Code location:** `command-center/operator-remote.html`, `operator-remote.webmanifest`, `operator-icons/icon-192.png`, `operator-icons/icon-512.png`.  
**Server-side design only:** `scripts/remote/authz-contract.cjs`; **not wired to any HTTP handler or plugin API.**

## The exact distinction

1. **Present today:** versioned, mobile-responsive ATLAS command launcher plus ChatGPT-native remote. It can generate explicit user-reviewed commands and navigate to existing proof.
2. **Phone-install foundation:** local-scope Web App Manifest, 192/512 actual PNG icons, Apple Home Screen metadata, honest **NOT_CONFIGURED** auth status. Installation requires approved HTTPS hosting (or local development context); the GitHub file browser is not a standalone secure remote URL. This currently **does not** cache pages offline or synchronize anything in the background.
3. **Missing:** hosted origin, domain ownership, verified identity provider, server session store, OAuth/provider-token vault, credential lifecycle, provider adapters, audit receipts, per-app permissions, revocation and operational incident plan. **Not an authenticated application yet.**
4. **Policy test harness:** a pure Node backend *admission contract* with an 8-action allowlist; no deploy/admin/bet commands. It refuses all actions until the invoking HTTP server supplies a verified owner review-session, matching HTTPS origin, CSRF token and valid time. MASTERSAVE / RESUME need an additional owner-approved short-lived, one-use scoped grant and an atomic consume callback. Even successfully admitted intents report **execution NOT_IMPLEMENTED** and **provider_calls 0**. The contract cannot verify that its caller really authenticated the user.

## Required real backend before hosting a PRIVATE operator remote

- **Choose auth architecture and prove it:** a verified identity provider, strict owner binding and reviewed middleware. Session cookie HttpOnly, Secure, SameSite; server-side expiry, renewal and revocation. Never allow a client to claim it authenticated itself.
- **Server-held provider tokens only:** connect each provider by explicit per-service authorization; encrypt in a server-side secrets store, rotate/revoke, scope to read-only by default. Browser never receives OAuth access/refresh tokens, GitHub PATs, sportsbook credentials or Supabase service-role keys.
- **No generic plugin proxy:** narrow, per-action provider adapters with explicit requested scope. A ChatGPT plugin connection is *not automatically transferable* to a new website; OAuth scopes, provider consent and backend integration must be established separately.
- **CSRF and requests:** enforce HTTPS, exact allowlisted Origin, CSRF, body size/schema limits, no reflection of secrets, action-specific idempotency and rate limits, robust audit records (including denials). Stable anti-replay needs durable transactional compare-and-set; the contract's supplied callback is a **test seam**, not a deployed store.
- **No production authority:** no sportsbook execution, Final Gate bypass, production writes, plugin installation, background autonomous workflow or Arc III pass closure.
- **Review security headers:** Replace the current launcher `script-src 'unsafe-inline'` with external bundled scripts and strict CSP before authenticated operations. Add proper frame-ancestors policy, no-store to private API responses, and comprehensive server-side output encoding.
- **Private exposure:** use a private preview/auth-gated deployment first, not an unauthenticated public admin dashboard or GitHub Pages relying on secrecy of its URL. Deploy separately only after intentional operator approval and security review.
- **Proof before promotion:** integrated unauthorized-request denials; real identity provider verification; CSRF/replay tests against a transactional store; end-to-end provider readback with least-privilege scopes; fresh mobile Safari manual check; rollback and token revocation exercise.

## Review-only observed implementation and tests

The phone install assets and authentication policy are **source and contract work**, not a hosted PWA or working authentication. The CI review jobs exercise:
- home screen manifest path, supported sizes and actual PNG file signatures/dimensions;
- mobile Chromium display of the **not authenticated / hosting required** state;
- strict static command launcher behavior and zero external network requests;
- policy rejection of spoofed login, fake client approvals, bad origin/CSRF, session expiry, unapproved or expired grants, replayed grants, unknown actions and offline grant-store failures;
- contract admission of read intents and fresh, single-use review grants still returns `execution: NOT_IMPLEMENTED`.

## Operator decision boundaries

No paid API requirement, no changes to the original Command Center or MasterSave’s pinned contents, no production deployment. Arc III remains **15 planned, 0 formally signed off**, with Floot parked. Version the auth implementation separately from evidence and do not infer a profitable model from a green UI/security test.

**Next real deployment milestone:** select a private HTTPS hosting and identity provider configuration, prove the server session and one provider read-only adapter end-to-end, and independently audit before enabling any writable actions. Stop here if those genuine requirements are absent.
