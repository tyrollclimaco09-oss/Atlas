# ATLAS contribution workflow

- Reuse existing code and preserve frozen forecasts, original receipts and their provenance.
- Keep market-reference EV separate from independent-model forecasts and price availability.
- Preserve source, identity, timing, payout and Human Final Gate holds. Tests and synthetic fixtures do not establish profitable predictions.
- Keep paid collection, production writes, deployments, schedules and wagers within the user's explicitly authorized scope.

## Patch notes for every change

Every completed implementation or fix must add a dated entry to `PATCH_NOTES.md` in the same review branch. Include:

1. What changed and the user-visible effect.
2. Why it changed, including the reproduced issue where applicable.
3. Commands actually run and their results; identify offline, fixture and live checks accurately.
4. Remaining blockers and compatibility limits.
5. Deployment status and next action.

Do not claim checks passed before running them. Mark incomplete work as incomplete. Preserve previous entries instead of rewriting history.

The offline GitHub Actions workflow checks that PRs changing research code or workflows also change `PATCH_NOTES.md`. This is a presence check; reviewers must still verify that the note is accurate and dated.

## Offline checks

`node --test integrations/learning/*.test.mjs scripts/research/*.test.cjs`

No dependency installation or external provider call is required for these suites.
