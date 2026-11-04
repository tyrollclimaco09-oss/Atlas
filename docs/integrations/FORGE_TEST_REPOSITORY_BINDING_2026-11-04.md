# FORGE test receipt repository binding

## Problem

PR #25 validates the shape of GitHub Actions URLs, but a handoff claiming a test
result for its recorded source repository could point to an unrelated repository's
run. For example, a receipt for `tyrollclimaco09-oss/Atlas` could borrow a run from
`another-owner/another-project` and still be rendered with its claimed pass count.
The output correctly remained unverified, but the input identity contradiction
was not rejected.

## Change

For `tests[].run_url`, validate the existing GitHub Actions URL shape and compare
its owner/repository pair to `source.repository`, case-insensitively. Preserve the
original URL and reject the complete handoff on a mismatch. No input is mutated.

Cross-repository dependency links in `evidence[]` remain allowed and unverified.
This avoids excluding useful fork/dependency context merely because the packet
has one primary source repository.

## Measured verification

Five regression cases cover foreign repository, foreign owner, atomic rejection,
case-insensitive matching and retained dependency references. Against the original
code, the three rejection cases failed with missing expected exceptions: 35/38
handoff checks passed, three failed. After the fix, the full Fork Arsenal suite
passed **102/102**, zero failures, skips or cancellations. This includes 38 handoff
checks and the 64 inherited tests.

Executed command: `node --test --test-reporter=tap integrations/forks/*.test.mjs`.
Node host v24.22.1. JavaScript syntax and `git diff --check` passed. Tests are
offline and use labeled synthetic fixtures; no GitHub verification is performed
by the packet generator itself.

## Boundaries

Matching the repository does not prove that a run exists, tests the recorded
commit, passed, or reported the stated count. Existing
`OPERATOR_REPORTED_NEEDS_RECHECK` labels and non-signature digest semantics remain.
This change does not resolve the separately reported saved memory-package integrity
warning. It neither retrieves nor writes memory, installs tools, calls providers,
deploys code or grants execution authority.

This is a stacked draft on PR #25. Inspect the new GitHub Actions run separately
before treating the local result as CI proof.
