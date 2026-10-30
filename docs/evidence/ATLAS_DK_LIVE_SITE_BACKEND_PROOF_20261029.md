# ATLAS DK-first integration — verified live backend bridge (2026-10-29)

## Result
This is **a real deployed backend integration**, not a promise or a hypothetical UI. It is **research-only**, not an approved betting engine.

- PR: https://github.com/tyrollclimaco09-oss/Atlas/pull/17 (draft review branch)
- Existing Supabase project: `lhliqbbooproqtslmgqi`.
- Existing Edge Function: `atlas-site-runtime` **v12**, deployed and ACTIVE, `verify_jwt=true`; previous GET modes retained.
- New protected GET mode: `/functions/v1/atlas-site-runtime?mode=dk_odds`.
- The handler reuses existing operator identity / hashed site reader auth, current allowed origin, and existing `atlas_site_research_reports_v1` table. **It does not call The Odds API or write to any table**.
- Live provider read: 2026-10-29T23:59:47.562Z, direct The Odds API v4, DraftKings only, HTTP 200, 3 credits, 454 provider credits remaining in returned headers. Stored research snapshot ID `e6d4d186-8589-42d7-ba57-9bec54a6df96`; delivery key `atlas-dk-odds-shadow-20261029t235947562z`.
- Snapshot schema `ATLAS_DK_SITE_SNAPSHOT_COMPACT_V1` has 3 pending-linked NBA matchups, 18 DK moneyline/spread/total quotes, market timestamps, 2,530 characters. Its server-side read becomes `STALE_REFERENCE` after 900 seconds and **returns no live odds data** in that state.
- Previously verified full-slate research runner produced 323 DraftKings quotes, 18 NBA events, 72 market comparisons on Oct 29. This larger packet is **not** the 3-game snapshot served by the backend; do not conflate the two.
- Original legacy `atlas-odds-ingest` remains disabled; no recurring provider refresh or autonomous wagering.

## Canonical event identity — real production metadata writes
Existing `events` and `provider_events` tables reused. Three Oct 29 NBA records and three provider bindings were inserted **pending review**, not promoted to confirmed/executable:
- CLE@ATL: canonical `bf74ff8e-2fbd-49cf-af50-0c3c4b43281a`, provider `b123d92eb8046e43fabf95a33a676634`, official nominal tip 2026-10-30T00:00:00Z.
- SAC@NOP: canonical `0b2f055f-38a1-4488-939e-e37990d74fd7`, provider `f91d27cc050b1b85073d745372c73833`, official nominal tip 2026-10-30T00:00:00Z.
- MEM@POR: canonical `f56930e0-914e-4e46-80b2-5082fe9782fd`, provider `ba667ca1b0b042f0661cb9d9af56c165`, official nominal tip 2026-10-30T02:00:00Z.
Independent schedule sources (NBA):
- https://www.nba.com/game/CLE-vs-ATL-0022600144
- https://www.nba.com/game/sac-vs-nop-0022600145
- https://www.nba.com/game/mem-vs-por-0022600146
Provider scheduled commencement was +10 minutes relative to nominal NBA tip. The reconciler explicitly checks the <=15-minute tolerance and flags larger discrepancies, never silently repairs.

## Security, authority and verified HTTP behavior
- Deployed read route unauthenticated: HTTP **401**; public/anon key alone: HTTP **401**.
- An ephemeral 96-character random site credential was generated inside an isolated sandbox and *only its SHA-256 hash* briefly inserted into the existing site-reader credential table for a positive read test. Its plaintext never appeared in GitHub or the response.
- Positive live `dk_odds` HTTP **200**, `status:FRESH_RESEARCH`, 3 events, 18 quotes, human Final Gate required, execution_authority false.
- Existing `board` GET HTTP **200** under that authorized test credential. Existing `health` mode timed out during a ten-second test: **not certified**.
- Test credential was deleted from the database, and a second request using the revoked credential returned HTTP **401**.
- No sportsbook wagers placed, no production market_snapshots inserted, no automatic odds polling, no exposure of THE_ODDS_API_KEY to frontend, no claimed positive EV or model validation.
- Production modifications in this turn: **3 canonical pending events, 3 provider links, 1 research report, 1 read-only upgrade of existing Edge Function**. No new tables were created.

## Remaining user-facing UI gap
GitHub issue #8 still lacks original authoritative Command Center frontend source. A small client adapter exists at `integrations/odds-api/command-center-client.mjs` to call the newly deployed backend mode with the existing operator authentication; it was **not** secretly pushed into an unknown live UI artifact. The protected backend can already serve the data to that UI once its source is recovered and wired.

## Controls and next acceptance
- Frozen reference-only odds cannot be treated as executable DK quotes; user final verification and Final Gate remain mandatory.
- Routine refresh must use a reviewed internal-only job with quota reserve and kill switch. Do not restore the retired public handlers or spend provider credits on each dashboard page read.
- New source CI: `node --test integrations/odds-api/*.test.mjs`; 40 offline test cases including the frontend adapter; GitHub Actions workflow succeeded at initial implementation. Verify latest head again after edits.
