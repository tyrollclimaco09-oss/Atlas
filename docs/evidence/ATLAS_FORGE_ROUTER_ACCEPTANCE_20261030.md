# ATLAS FORGE — GPT multi-project router acceptance

**Date:** 2026-10-30, read-only research branch. **Status:** draft PR #24, not merged or production deployed.

## Verified GitHub inventory

- 42 linked repositories: 2 ATLAS originals + **40 true forks**.
- `integrations/forks/workspace-catalog.json` includes all 40 upstream references, names and licenses/unknown-license flags, explicit permissions/caveats and eight project profile memberships.
- Trust labels: **5** source-code-smoked, **11** reviewed for a bounded use, **13** reference only, **8** isolated lab candidates, **3** blocked from ordinary routing.
- The five code-tested forks are `nba_api`, `sports-skills`, `nflreadpy`, `shin` and `graphify`. These were **offline source proofs, not certified live provider integrations**.

## Executed router acceptance

An isolated Vercel sandbox cloned `review/atlas-gpt-fork-workspace-2026-10-30` and executed the CLI and Node tests against the actual GitHub source:
- Earlier checkpoint: **55/55** combined Fork Arsenal and workspace tests passed.
- Current final CI: **64/64 tests passed**, zero failures, GitHub Actions `ATLAS Fork Arsenal offline smoke` run **41112893782** on commit `322821cb573e127c2a6d74c584f4e0a020c68542`. Checked raw job log, `fork-evidence-contract`, plus successful `pricing-market-reference` and `nfl-historical-loader` jobs.
- The `doctor` command returned `ok: true`, `forks: 40`, `profiles: 8`, `installed_by_router: 0`, `live_provider_connections_certified: 0`, `external_commands: 0`.
- The `brief` command was executed for a named project `Study Planner`. It produced a context-specific shortlist (MSW, Playwright, Testcontainers, fast-check, Graphify, TanStack Query, Supabase), bounded step-by-step implementation instructions and a clear no-autorun/no-live-data warning.
- The `graph-context` adapter accepts locally existing Graphify JSON and extracts code-only symbol/file references. Tests explicitly ensure no raw source code or non-AST entries are included in a brief and malformed/untrusted graphs fail closed.

## Graphify genuine fork test

See `docs/evidence/ATLAS_FORGE_GRAPHIFY_CODE_ONLY_PROOF_20261030.md`. Pinned source `c588b72d936927790a87ad009955078ed40562a3`, blocked network before code extraction, 10 public ATLAS integration files, **75 nodes, 126 relationships, 10 communities**. Those numbers describe an earlier frozen source commit, not an ever-current deployed application. No LLM tokens/API keys were used.

## Usability delivered

```sh
node integrations/forks/workspace-cli.mjs doctor
node integrations/forks/workspace-cli.mjs projects
node integrations/forks/workspace-cli.mjs route --project atlas-sports --goal "Run the Slate"
node integrations/forks/workspace-cli.mjs brief --project development --workspace "My App" --goal "continue building safely"
# --graph PATH: optional only for an already generated, locally reviewed AST graph
```

The root `AGENTS.md` provides compatible local project instructions for coding assistants; the repo's `integrations/forks/skills/atlas-forge-workspace/SKILL.md` is a portable skill **not installed automatically** in ChatGPT/Codex. All code is on the draft branch and portable after review.

## Explicit nonclaims

- **0** automatic fork installations, live third-party provider sessions, GPT API calls, codebase scans of other private repositories, Vercel production deployments or Supabase writes created by the FORGE router.
- **0** automatic bets, market outcomes, probability models, predictive accuracy claims or sportsbook balance changes.
- The original ChatGPT Sites Command Center remains unwired to FORGE; its editable source/deployment authority has not been proven.
- `Graphify` produces local code references and can be run manually; its agent hooks aren't automatically installed, and `--graph` does not automatically regenerate the graph.
- A ChatGPT tool can still inspect connected GitHub/projects under separately authorized plugin permissions, but this **local CLI cannot itself open your ChatGPT account or run GPT**.

## Next acceptance gates

1. Pick one non-sports project for a truly scoped proof. Confirm its source/owner, operator credentials, and exact task before choosing agents.
2. Run Graphify code-only on the authorized project; compare graph commit to its source; manually inspect file/symbol names before sharing the brief.
3. Integrate `fast-check`, `MSW`, `Playwright` and `Zod` into an actual project test suite with correct dependency/version and CI evidence—currently cataloged/limited.
4. Evaluate private-memory and multi-agent forks (`claude-mem`, `OpenBot`, `prime-agent`, `ruflo`, `omniroute`) only in a separate lab with explicit account/privacy/budget permissions.
5. Release user-facing FORGE UI through the actual, owner-controlled Command Center—not through an unverified substitute.

Truth is more important than the count of registered repos.
