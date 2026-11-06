# ATLAS V15 — Operator identity + zero-credit provider preflight

**Evidence date:** 2026-11-06 America/Chicago. **Verdict:** Core native candidate/quote safeguards pass; operator authentication and paid market integration remain BLOCKED.

## Order executed

**1. Operator access**
- Direct Supabase readback: `auth.users = 0`, `app_metadata.atlas_operator = true = 0`, `atlas_site_reader_credentials_v1 = 0`.
- The Supabase connector does not expose Auth Admin create/invite/grant operations. The browser connector also cannot control a signed-in Supabase Dashboard from this chat.
- No account, invitation, or operator role was created. We intentionally did not guess an email or create a public bootstrap endpoint.
- Added `scripts/admin/operator-bootstrap-v15.mjs`: the current supported `@supabase/supabase-js` Auth Admin SDK route with verified email SHA-256 matching, confirmed Auth user ID, and two explicit approvals. It never treats `sb_secret_` as a user JWT. V13/V14 legacy Auth scripts now **refuse** `sb_secret_` keys rather than attempting an invalid bearer-token call.
- The script uses a dynamically imported SDK; it requires `@supabase/supabase-js@2.117.2` installed in the **trusted** administration environment before any real action (install locally with a reviewed package lock, never install API secrets into GitHub). No real client was initialized here.
- Supabase Dashboard's existing invitation path is `Authentication > Users > Add user > Send invitation`. A human administrator selects the correct email, and the invited person confirms it. Only then can app_metadata be granted to this verified user through a trusted admin action. Refresh user JWT afterward.

**2. Authorized HTTP**
- Previously verified: actual unauthenticated GET to `atlas-slate-duo-v10?mode=integration` returns HTTP 401 (run [42251270159](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/42251270159)).
- Positive signed-in HTTP 200 remains UNVERIFIED because there is no confirmed Auth user or session.
- `verify_jwt=true` stays enabled. No public bypass, service key in a browser, or manufactured JWT.

**3. Live provider and market-reference controls**
- Added exact applied DB migrations `20261106194023_atlas_market_intake_failclosed_v15.sql` and `20261106194124_atlas_market_intake_null_contract_v15.sql`.
- New private table `atlas_market_intake_controls_v15` registers 2 source paths: `ATLAS_WEB_REFERENCE` (MANUAL_REFERENCE, never executable), and `THE_ODDS_API` (DISABLED).
- Both have `network_calls_enabled=false` and `daily_paid_credit_budget=0` enforced by CHECK constraints. RLS enabled; anon/auth SELECT denied; only service_role SELECT granted.
- Read-only function `atlas_market_intake_preflight_v15` rejects unknown sources, billable disabled provider, missing URL/market/selection, malformed American odds, future/expired timestamps and stale reference quotes. All responses explicitly set execution_grade=false, expected_value=null and production_authority=false.
- Direct database acceptance: paid provider DISABLED, freshly observed public quote RESEARCH_ONLY, old quote STALE, future source INVALID, invalid price INVALID, null URL/market/selection INVALID. SQL tests verified **10 expected cases**. No provider fetch, scheduled polling, credits or sportsbook account query.
- Evaluated the actual earlier WAS@ATL research quote at +231, attributed to DraftKings on third-party AgentBets with source timestamp 2026-11-06T15:00Z: **STALE_PUBLIC_REFERENCE**. Historical quote is preserved; it is NOT a current EV or executable price.

**4. Native candidate → Final Gate**
- Executed the actual existing Supabase rollback-safe functions:
  `atlas_test_candidate_birth_bridge_v1()`: PASS, native event/scout/candidate created and rolled back.
  `atlas_test_execution_quote_binding_v1()`: PASS, synthetic execution quote bound, malformed quote rejected, and missing full-chain Final Gate rejected; rolled back.
  `atlas_test_quote_policy_real_evidence_guard_v1()`: PASS, fake active policy rejected and shadow policy permitted; rolled back.
- All 3 reported `persistent_test_rows=0`. These are **synthetic rollback tests in live Postgres**, not current sportsbook availability or an approved live wager.
- The real V13 native research candidate, Washington ML, remains SCOUTED / EXPLORATORY_ONLY. No independent ORACLE probability, EDGE THIEF resolution, user-account quote, TACTICIAN certification, or Final Gate approval has been produced.

## CI and source parity
- `scripts/admin/operator-bootstrap-v15.mjs` + `tests/operator-bootstrap-v15.test.mjs`: **14 offline tests**.
- `scripts/research/market-intake-v15.cjs` + test: **23 offline checks** including source/clock/null guards.
- GitHub workflow `.github/workflows/atlas-slate-duo-v10.yml` runs these alongside all prior ATLAS research and safety tests; see exact V15 head's GitHub Actions.
- Repository is public; no email, private bankroll, secrets, API keys, Auth JWTs, or live private provider responses are committed.

## Exact remaining human handoff
1. From your authenticated Supabase Dashboard, send an Auth invitation to the **real** intended ATLAS operator and accept it, or sign up as that user through an approved Auth flow.
2. Have the project administrator inspect the real `auth.users` identity and grant `app_metadata.atlas_operator=true` via a trusted environment; **do not paste secrets into chat or GitHub**.
3. With a refreshed real user JWT, run the positive **authenticated 200** check through the existing GET-only function; keep negative 401 as a separate proof.
4. Only after explicit API credit budget approval can a truly quota-controlled polling connector be assessed/deployed. This V15 migration deliberately does **not** reenable the retired provider.
5. Obtain price-independent, time-frozen market-specific probabilities, an adversarial EDGE THIEF rebuttal, source-proven quotes, and required native risk receipts before any human Final Gate.

**No wagers, live automatic providers, Auth roles or source model weights were modified in this pass.**
