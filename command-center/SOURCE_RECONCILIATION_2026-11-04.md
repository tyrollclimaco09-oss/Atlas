# Original Command Center source reconciliation

## Problem and result

PR #20 was based on an older recovered served snapshot. The original owner-authorized
Sites source is now available at saved version 9, commit
`1c2c03229a9f073c42f090229d818fa73556d7f0`, for project
`appgprj_6aa794eb41fc8191b9ba25adfa1be5ff`. Applying the old snapshot as a complete
site update would discard newer copy/import, browser resume and empty-research fixes.

This review ports PR #20's existing source panel and canonical bridge additions
onto the exact version 9 assets. JavaScript and CSS from that baseline are copied
without edits. HTML differs only by the same named, tested read-only additions.
The existing `slate-sources.js`, `canonical-read.js` and `canonical-resume.js` are
unchanged. No session provider, paid refresh, new state store or paper-card engine
is introduced.

## Source custody

The existing Sites project was read through the owner connection. Its source
repository was opened without requesting automatic publication. The resulting
checkout was clean at the recorded commit. The original checkout remains clean;
the proposed changes live only in this separate GitHub review branch.

`CURRENT_SITE_SOURCE.json` records six SHA-256 digests computed directly from
`dist/` in that checkout. `SOURCE_PROVENANCE.json` remains byte-identical to PR #20
as the historical served-source receipt. Source-preservation tests independently
pin both sets of hashes. The historical receipt was not rewritten to imply that
its old source bytes were current.

| Asset | Difference from the old recovered snapshot |
|---|---|
| `app.js` | Same bytes |
| `pricing.js` | Same bytes |
| `slate.js` | Saved version 9: copy-only handoff, explicit departure, import/save feedback and resume behavior |
| `slate-engine.js` | Saved version 9: Mixed default, empty research, unchanged import handling and confirmed-shortlist support |
| `styles.css` | Saved version 9 layout/help additions |
| `index.html` | Saved version 9 interface plus the existing bounded canonical/source-read additions |

## Executed verification

- Original PR #20 source: **125/125** existing tests passed before changes.
- Original saved Sites source: **31/31** native tests passed in its own clean checkout.
- Updated preservation checks against the old PR source reproduced drift in
  `slate.js`, `slate-engine.js`, `styles.css` and HTML. TAP counted five failures
  because the asset group parent also failed; these represent four asset surfaces.
- Integrated review branch: **160/160**, zero failures, skips or cancellations.
  Command: `node --test --test-reporter=tap command-center/tests/*.test.cjs`.
- The 31 native tests were retained with only `../dist/` import paths changed to
  the review layout. Existing contract and local-workflow tests remain in place.
- Three mounted DOM contract probes exercise one scoped NBA read, the current
  Mixed default's local-only behavior and missing operator-session handling.
  Their transport and document are synthetic; they are not browser or live HTTP proof.
- JavaScript syntax and `git diff --check` passed. Node host: v24.22.1.

## Release limits

Saved version 9 source custody does not attest the bytes currently served by the
published URL. A prior version 8 publish receipt exists; this pass does not label
version 9 published. Browser rendering, native iPhone behavior, a valid operator
session, real-origin CORS and a current authenticated backend read remain open.
The existing reader still consumes zero paid upstream requests per click by design;
no real provider call or production database mutation was executed here.

The actual site source was not pushed or published. This GitHub branch is a
reviewable port. Roster-gate construction wiring from PR #26 and refresh policy
from PR #17/#19 remain separate work. The original site's current runner supports
human-reviewed singles; this pass does not manufacture HYDRA builder integration.

Next acceptance: compare serving assets with the identified saved baseline, then
exercise an approved private operator session under the actual origin before a
separately reviewed publication.
