# ATLAS Operator Remote — owner-gated HTTPS status preview
**Date:** 2026-10-19 (America/Chicago).  
**Scope:** Dedicated private preview only, using Vercel Authentication for **all deployments**. No production promotion, credentials, betting or plugin write actions.

## Exact permission boundary
The user approved the next milestone after review-only remote work. Implement a new isolated Vercel project without reusing ATLAS Supabase, and configure `ssoProtection.deploymentType = all` **before** any deployment. The connected Vercel team was read back with exactly one confirmed owner member at the time of setup. Protect every preview, deployment and production URL. If protection settings cannot be confirmed, STOP—do not deploy any files. An unauthenticated request should encounter Vercel's platform sign-in, not an ATLAS status response. Never create a shareable link, bypass secret or exemption.

The remote's hosted preview is **platform-protected**, not an application-managed login: `scripts/remote/authz-contract.cjs` and `status-gate.cjs` remain test-only identity contracts, not silently wired or used to fake identity proof. Team membership and protection settings must be revalidated when making any future promotion or adding new users.

## Files (versioned source in this existing repo)
- `command-center/operator-remote.html`: existing single operator remote; adds a navigation link to the protected STATUS view.
- `command-center/operator-status.html`, `.css`, `.js`: strictly scoped live read-only status detail. The status page uses no inline script, creates all result text using `textContent`, and fetches `./api/status` only over the same HTTPS origin.
- `scripts/remote/vercel-status.mjs`: tiny GET-only web function handler. Checks request path/method, no-store headers and exact GitHub reader contract. Rejects any write method. Does not claim direct user authentication or accept user-provided repository/URL arguments.
- `scripts/remote/github-public-status.cjs`: existing bounded public GitHub REST reader with final HEAD reread (TOCTOU protection).
- `command-center/operator-private-index.html`, `operator-private-vercel.json`: protected deployment entry and headers. Their deployment filenames are `index.html`, `vercel.json`, respectively.
- `command-center/operator-remote.webmanifest` and existing verified PNG icon blobs: phone Home Screen assets.

The isolated deployment bundles these reviewed sources, preserving the original command center and canonical v2 registry. This is NOT a new ATLAS brain, plugin authority layer, sportsbook UI or separate research database.

## Required proof gates
1. GitHub review CI must pass actual Node auth/endpoint tests and mobile Chromium tests, including denied access, stale data, malformed responses, and XSS rendering checks.
2. Create the isolated Vercel project with `ssoProtection: {deploymentType:"all"}`; independently **read back** `ssoProtection` and team-membership before deployment.
3. Deploy to **preview only** via reviewed inlined files pinned to exact source Git SHA, with no connected Git auto-deployment and no secrets.
4. Confirm deployment becomes READY and project protection still says `all`.
5. Make an **unauthenticated** visit to both the home URL and `/api/status`; confirm they are gated (redirect to official Vercel authentication or explicit 401/403), not returning the ATLAS page/status JSON. Recheck after deployment; if the public endpoint leaks, stop and disable or restrict before reporting.
6. Have the operator sign in with their existing Vercel owner account to verify the positive browser flow. The assistant cannot claim owner login completed on the user's behalf.

## Release stop lines
No team credential storage, manual password collection, API key setup, main branch deployment, Supabase mutation, plugin connection transfer, future background automation, sports betting, Final Gate bypass or Arc III closure. Signed in Vercel owner access allows **read-only GitHub status** only. Current offline CI does not prove a profitable sports edge.

## Evidence
See subsequent reviewed commit, GitHub Actions verification and Vercel project/deployment readbacks as recorded in this file or a linked post-deployment receipt. No live HTTPS or protected deployment may be claimed before tools confirm it.
