# ATLAS V13 — Four-Step Rollout: Executed Results

**Date:** 2026-11-06 CT. **Mode:** LAB/SHADOW. **No bets placed, paid API calls, account impersonation, or production-model promotion.**

## 1. Secure operator enrollment — PENDING REAL IDENTITY
- Existing Supabase Auth user count = **0**, `app_metadata.atlas_operator=true` count = **0**, site credential hashes = **0**.
- Created `scripts/admin/enroll-operator-v13.mjs` with existing-user-only, confirmed-email SHA-256 match, admin approval and separate apply confirmation.
- Preserves existing app_metadata; reads user again after write; requires JWT refresh. Never prints keys/identity, never puts a service-role key in GitHub.
- Admin tool was tested with synthetic identities **14/14 GitHub assertions**. **No permission writes occurred on live Auth.**
- An administrator/operator must complete actual Supabase Auth sign-in and prove which existing confirmed user should be promoted before the privileged server-side tool can apply.

## 2. Real operator API authentication — BLOCKED
- Existing and new Atlas Edge endpoints share the same authorized operator gate and JWT validation.
- No Auth identity exists; a real authorized `GET /functions/v1/atlas-slate-duo-v10?mode=integration` cannot yet be proven.
- No live HTTP result is claimed. Source-level and CI tests cannot replace this acceptance test.
- Never disable JWT verification or add a public bypass; only mark AUTHENTICATED_HTTP_PROVEN after actual signed-in readback *and* unauthorized rejection.

## 3. Verified public market-reference intake — RESEARCH GATE PASSED; LIVE QUOTES STILL BLOCKED
- Used existing **ATLAS Web Reference** provider and existing **native prospective candidate intake**, not retired paid-odds ingest functions.
- Public third-party aggregator **AgentBets** reported DraftKings **Washington Wizards ML +231** for WAS@ATL, as of **2026-11-06T15:00:00Z**.
- Source: https://agentbets.ai/odds/draftkings/nba/ . Displayed book is an attribution, **not evidence the quoted price was account-executable**.
- Data type: third-party public market reference only; source clock and ATLAS observation clock recorded separately. Market source tied to The Odds API aggregate feed, not independently sourced; evidence weight=0, CORRELATED, UNCOUNTED.
- First native intake receipt **FAILED** on invalid evidence correlation label `DEPENDENT`. Original failed receipt preserved. The corrected second intake used supported `CORRELATED`, distinct idempotency key and explicit predecessor link; native intake status **COMPLETE**.
- No direct The Odds API request, no paid credits, no scheduled polling, no new `market_snapshots` with execution grade. Legacy odds functions remain disabled intentionally.

## 4. Real native candidate → DUO → Final Gate dry run — RESEARCH PATH PASSED; LIVE APPROVAL BLOCKED
- Game: WAS@ATL, NBA Nov 6, canonical event/state version 1.
- Market: moneyline, Washington Wizards. Public reference +231. Exact registered native candidate:
  `RUNTIME:9145fa1f-b29e-4c5d-ba0e-bb101a381bd1:S1:692329fd-481a-4d43-83bc-992eba55cbb7`.
- Native lifecycle **SCOUTED**, truth **EXPLORATORY_ONLY**, one persisted evidence lineage item; **zero** independent Oracle proofs, resolved Edge Thief challenges, Sentinel/Tactician risk proofs, account executable bindings, or actual Final Gates.
- Appended **12** candidate-linked canonical node receipts (SCOUT research; unresolved duo/price/risk WATCH; Final Gate BLOCKED; postgame pending).
- The actual native `atlas_prepare_final_gate_v2` attempt with no valid binding was **rejected for missing Tactician evidence**, and readback confirmed **0 Final Gate records** for that event. The strict missing execution-price guard remains active.
- `atlas_slate_candidate_coherence_v12` now records **1 native market candidate**, **0 aligned duo candidates**, **0 ready operator candidates** on the nine-game slate.
- No real or paper wager created from this candidate, no stake authorized.

## CI + machine-readable proof
- Draft [PR #36](https://github.com/tyrollclimaco09-oss/Atlas/pull/36) includes this work atop the V9–V12 research stack.
- [GitHub Actions run 42246829047](https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/42246829047): success.
- New V13 tests: 14 operator-enrollment + 16 public-market adapter + 20 native-integration = **50** assertions, alongside existing V10/11/12 and earlier research suites.
- Raw evidence: `docs/fixtures/ATLAS_V13_NATIVE_WEB_REFERENCE_HANDOFF.json`; original November 6 freeze stays unchanged.
- Source-to-frontend auth under the actual published ChatGPT Site is still unverified. No deployment to that published site.

## Completion criteria — no automatic promotion
1. Actual confirmed Supabase Auth user and operator-approved identity, no guessing; run admin enrollment dry-run first, then explicitly approved apply.
2. Verify authenticated GET and unauthorized-denial HTTP requests from intended origin, recording status without token leakage.
3. Approve a quota-bounded and timestamp-correct paid-feed path or continue research-only public references; never treat third-party prices as account executable.
4. For the same native candidate, obtain independent ORACLE forecast and adversarial resolution plus native PRICING/KAIROS/SENTINEL/TACTICIAN proof and a genuinely executable account quote; Human Final Gate alone can authorize a live wager.
5. Postgame FORENSICS and CALIBRATOR grade the frozen record only after official results; no rewriting.

**Verdict:** Native research integration works; authenticated operator execution and live data-price gating remain blocked by concrete missing inputs.
