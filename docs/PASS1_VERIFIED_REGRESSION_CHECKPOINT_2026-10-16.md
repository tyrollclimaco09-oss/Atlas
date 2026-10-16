# ATLAS Pass 1 — Verified regression checkpoint (2026-10-16)

## Execution evidence

- Review branch: `review/pass0-slate-regression-2026-10-16`.
- Tested head: `7d28f457e850da7cc587a0229fb8f60abcf01ec9`.
- GitHub Actions: https://github.com/tyrollclimaco09-oss/Atlas/actions/runs/38910321624
- Review suite: **134 tests, 134 pass, 0 fail, 0 skipped** (Node 22; source-preservation snapshot test excluded from this review job by design).
- Original source-preservation suite: **success** in separate job, checked out at preserved baseline `510e22c7a4c9259ec4e1f7b651cd21ac6cb9df9b`.
- Test run is a CI result for repository code; it does not verify a deployed Sites version, Supabase, a live feed, sportsbook quotes, betting execution, or prospective model accuracy.

## Diagnosed failure and correction

- First CI run `38910238516`: 133/134 passed. The failure was an existing test matching `/Duplicate candidate/` after the new precise-identity error changed its wording. This was a **backwards-compatibility error contract** failure, not evidence that atomic import was broken.
- Corrected the message to begin `Duplicate candidate` while retaining exact event/time/market/selection identity.
- Updated new test and review provenance manifest to reflect the corrected bytes.
- Reran: **134/134 PASS**. Historical custody **PASS**.

## Clean-footprint rules established

1. Historical `SOURCE_PROVENANCE.json` is immutable evidence of the recovered baseline, not a file to rewrite for new reviews.
2. `PASS0_REVIEW_PROVENANCE.json` records review-only Git blob identities, independently tested.
3. Every review modification must update its manifest when an inventoried blob changes.
4. CI must check original historical provenance against its original commit and review behavior against current code, without conflating them.
5. No silent merges, deployment, backend writes or automatic bet placement.
6. Tests must actually run before any green claim; review CI does not clear production release gates.

## Still blocked

- Discovery universe is bounded by local browser workspace capacity (up to 64), not a durable multi-run registry.
- Game Sense/Team DNA/Outcome Intelligence and parlay expression research lack a verified live typed integration.
- Old draft compatibility and 16 MB/browser storage behavior need more extensive property and browser tests.
- Original production-site parity, backend isolation and 18 inherited release gates are not cleared.
- No preregistered prospective calibration outcome or demonstrated prediction lift.

Next build: durable versioned discovery registry with a full candidate census and continuation cursors, then typed research-only expression tournament and scenario evidence. Preserve current Final Gate restrictions until supported by independently validated settlement models.
