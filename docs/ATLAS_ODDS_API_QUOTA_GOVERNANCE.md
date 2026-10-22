# ATLAS / The Odds API — Credit Governance (SHADOW)

Status: 2026-10-22. Review-only. No production promotion, no live wagering, no browser key.

## Grounded starting point

- 2026-10-22T07:48:18Z first real source proof; GitHub run 39743068149.
- Observed provider headers after that probe: **used 1; remaining 499; last 1**.
- That is an observation at one instant, NOT a current balance guarantee.
- The observed quote set was 28 NFL events, 165 bookmaker H2H quotes, 28 DraftKings H2H quotes.
- No real model EV, offer executability, or persistent replay ledger has been established.

## Fail-closed operational gates

- Research workflow runs **only on manually dispatched workflow events**. No push, cron, or polling.
- Manual checkbox defaults **false**. With false/missing approval the code makes **ZERO network calls**.
- Only the exact environment flag `ATLAS_ODDS_APPROVED_CREDITS=1` permits the sole preapproved live odds request.
- First endpoint `/v4/sports` is free. Read `x-requests-remaining`, `x-requests-used`, `x-requests-last`; all three must be numeric and `last=0`.
- Abort paid request if remaining would fall below **100** or if total used would exceed **31** for the current provider quota cycle. This reserves at least 100 credits and limits further research from the initial observed used=1 to at most 30 credits (assuming no other consumers).
- The proof can only request `americanfootball_nfl` in `us`, `h2h` and decimal price format. Maximum planned cost **one credit**.
- Reject redirect, missing headers, unexpected cost, invalid source timestamps, malformed prices, duplicate game IDs. Never echo full URLs or raw API responses.
- No automatic retries. No environment-dependent hidden expansion.
- Provider header values are authoritative for account usage, not our local estimate. If another client uses credits, the account-level hard limit can only become tighter.
- A repeated manual run can spend another credit if explicitly approved; it must not be misreported as free.
- Provider terms, attribution, usage and downstream-storage permissions must be reviewed before retaining or distributing full snapshots.

## The low-cost research playbook

1. Prefer offline NFL/nflverse and NBA sources for game/stat modeling, plus locally preserved screenshots.
2. Use `/sports` and `/sports/{sport}/events` for discovery. Both are **zero quota credits** per official docs; cache results anyway to reduce traffic.
3. Broad main-markets odds: 1 credit per region per market, independent of event count. Combine markets into one carefully planned request only when the information is valuable.
4. Event-specific player props: one event at a time, billed per *unique returned* market per region. Scout likely markets and role/lineup conditions before spending.
5. Never query historical odds on the free plan: historical endpoints require paid access and cost roughly 10x live odds.
6. Before calling, draft a packet with objective, event and market keys, data coverage, expected cost, minimum decision value, and freshness requirement.
7. Save nonsecret receipts: provider, requested market key(s), quote-observation time, quote-source timestamp, response SHA-256, event identifiers, quota used/remaining, and documented reason for the call. Full quotes need rights-cleared, access-controlled storage for real replay; proof receipts alone are insufficient.
8. Compare one independent model, at least one no-vig benchmark, counter-cases, line mapping and sensitivity BEFORE anything is called a candidate +EV opportunity.
9. **No paid calls** for exploratory curiosity, repeated UI refresh, synthetic tests, model fitting, calibration reruns or already-observed snapshot replay.
10. Reserve **100 credits** for unexpected research needs, not live chase-betting. Keep current first-phase experimental ceiling to **30 extra credits** until a full real freeze→forecast→outcome packet passes audit.

## Provider cost references

- Docs: https://the-odds-api.com/liveapi/guides/v4/
- API cost: `/odds`: number of regions × number of markets. `/events/{eventId}/odds`: unique markets **returned** × regions. `/events/{eventId}/markets`: 1 credit.
- A bookmaker list of up to 10 counts as a region; using a `bookmakers` filter does not automatically make a request free.
- Quota headers are `x-requests-last`, `x-requests-used` and `x-requests-remaining`.
- Do not assume that "remaining 499" is still valid after other clients, a billing reset or parallel operator sessions.

## Implementation and limitations

- `scripts/scout/the-odds-api-probe.py`: source + quota preflight; default no network.
- `.github/workflows/atlas-odds-api-probe.yml`: manual dispatch only, one-credit explicit opt-in.
- `main`, the prior review branch, Command Center, Supabase and placement systems are untouched.
- A manual-only workflow on a nondefault GitHub branch may not be dispatchable from the Actions UI until its workflow exists on the default branch. **Do not merge/promote silently**. Treat existing recorded proof as sufficient until a reviewed activation path is approved.
