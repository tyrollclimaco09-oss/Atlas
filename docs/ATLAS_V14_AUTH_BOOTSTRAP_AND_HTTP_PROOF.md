# ATLAS V14 — Operator Bootstrap and Live HTTP Security Proof

As of November 6, 2026 (America/Chicago). **No human operator account was created or promoted. No paid odds provider request or wager was placed.**

## Verified current state
- Supabase project: `lhliqbbooproqtslmgqi`.
- `auth.users`: **0**. `atlas_site_reader_credentials_v1`: **0**.
- Existing `atlas-slate-duo-v10` Edge Function **v6** with JWT validation enabled, source parity to GitHub previously verified.
- **LIVE HTTP SECURITY ACCEPTANCE:** GitHub Actions [42251270159](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/42251270159) called `GET /functions/v1/atlas-slate-duo-v10?mode=integration` without any JWT or API key and received **401 Unauthorized**. The live log contains: `UNAUTHENTICATED_HTTP_DENIED: HTTP 401`.
- This establishes the negative gateway test only. It does **not** prove a valid operator can authenticate or read the manifest.

## Secure invitation prerequisite (one human action)
On the project owner's existing Supabase Dashboard login, open **Authentication → Users**, choose **Add user → Send invitation**, and send the invitation to the actual intended operator's verified email address. The intended operator must accept and confirm the email. Do not enter a made-up email, secret, password or OTP in any public GitHub issue, CI log or chat.

Supabase Auth is separate from organization/Dashboard login. A Supabase Dashboard owner is **not automatically** an Auth user for this project. No account existed in auth.users as of this audit.

Relevant documentation: https://supabase.com/docs/guides/auth/users

## Admin-only tooling already in this branch
- `scripts/admin/invite-operator-v14.mjs`: explicit verified-recipient invitation workflow; default is dry-run, network POST is disabled without `--send`, administrator approval and a second send confirmation. Never assigns operator privileges in an invitation.
- `scripts/admin/enroll-operator-v13.mjs`: grants `app_metadata.atlas_operator=true` to an **existing confirmed** Supabase Auth user only after exact user UUID/email SHA-256 match and two explicit admin confirmations. Never displays tokens. Re-reads user authorization after write; the user must refresh the Auth session.
- `scripts/admin/test-operator-http-v14.mjs`: read-only signed-in operator HTTP acceptance. Requires the genuine user's session access token and project's **publishable** key in a trusted local execution environment; it checks negative 401/403 plus authorized 200 and rejects executable/production betting claims.
- `scripts/research/verify-anonymous-edge-v14.mjs`: an unauthenticated real HTTP probe with no tokens. Already passed in GitHub Actions.

**Important:** The invitation and enrollment tools have only been evaluated with synthetic test identities. We have NOT used live auth-admin secrets, sent a live invite, granted permissions, or run a valid signed-in request. The session token and service role/secret key must never go into ChatGPT, GitHub source, or a public workflow.

Supabase's published docs recommend performing invitations and app_metadata updates through trusted server-side Auth Admin APIs or the Dashboard. With newer `sb_secret_` keys, the supported SDK is preferred over manually substituting a secret key into a legacy JWT Authorization header; adapt the admin runner as required by the actual key type before performing a live admin write.

## Acceptance gates before leaving HOLD
1. A real confirmed `auth.users` identity appears and is independently verified as the intended operator.
2. Actual administrator grants the operator role in `app_metadata` through an approved secure method; verify persisted readback and refreshed token.
3. Signed-in caller from the verified site origin receives genuine HTTP 200 on read-only `mode=integration`, with 12 nodes and no execution authority. Independently retain the unauthenticated 401/403 proof.
4. Published editable ChatGPT Sites project session wiring is verified; GitHub recovered-source previews are not equivalent.
5. Separately restore only approved quota-limited live market intake; no automatic service or wagering promotion.

## Existing market-candidate work retained
V13 research-only Washington-at-Atlanta moneyline candidate remains `SCOUTED` and `EXPLORATORY_ONLY`, with a third-party public reference price (NOT account-executable); the canonical evidence spine preserved a failed first intake, a successful corrected attempt and twelve node receipts. Its native Final Gate was correctly blocked. Do not tamper with the source freeze or override this hold.

## Local scripts (example process, not a user action already performed)
Use securely managed environment variables instead of committing a `.env` file. Run `node scripts/admin/invite-operator-v14.mjs` for a validation-only preview. Only an authorized administrator who has independently confirmed recipient identity should supply actual server-side credentials and decide whether to run `--send`. Then verify the account, run the existing-user authorization script in dry-run first, and explicitly approve an apply operation. For the end-to-end login proof use `node scripts/admin/test-operator-http-v14.mjs` with a real token **in the local trusted environment**, never in source code or chat.

### Status
**CONFIRMED:** live unauthenticated HTTP denial; protected source; safe invitation and HTTP-check contracts; GitHub CI.

**BLOCKED:** live Auth user creation/invite, operator permission grant, valid signed-in HTTP readback, published-site session, paid odds feed, human Final Gate.
