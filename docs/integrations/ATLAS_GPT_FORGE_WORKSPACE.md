# ATLAS FORGE — one catalog for every GPT project

**Status:** review-only working CLI and catalog. No production agent swarm, plugin installation, additional website deployment, or LLM connection is implied.

## Why this exists

The connected GitHub account owns **42 repositories: Atlas, Atlas-0.0, and 40 actual forks**. The earlier Fork Arsenal PR #23 executed four sports/research forked source codebases in isolated tests, with Graphify later executed as a fifth code-only fork (`nba_api`, `sports-skills`, `nflreadpy`, and `shin`). This phase indexes **all 40** and makes them discoverable for ATLAS sports and unrelated coding, study, research, product and operations work.

Instead of manually hunting GitHub repos, use the same local router to decide which projects need data, skills, codebase maps, testing, memory or an isolated AI-agent experiment.

## Commands that really run now

```sh
# First verify ALL 40 registrations, source labels and safe defaults
node integrations/forks/workspace-cli.mjs doctor

# See eight project-specific starting stacks
node integrations/forks/workspace-cli.mjs projects

# Browse the inventory (all 40, or filter)
node integrations/forks/workspace-cli.mjs list
node integrations/forks/workspace-cli.mjs list --project development
node integrations/forks/workspace-cli.mjs list --status CODE_SMOKE

# Find the best existing-source candidates for a task
node integrations/forks/workspace-cli.mjs route --project atlas-sports --goal "run the NBA slate"
node integrations/forks/workspace-cli.mjs route --project product --goal "test my dashboard with a browser"

# Get a staged implementation/release plan
node integrations/forks/workspace-cli.mjs plan --project data --goal "build a reproducible dataset"

# Create a copy-ready handoff for GPT/Codex about ANY named project
node integrations/forks/workspace-cli.mjs brief --project gpt-workspace --workspace "My Other App" --goal "resume coding and keep the relevant decisions"

# For scripts and other tooling
node integrations/forks/workspace-cli.mjs route --project development --goal "test frontend" --json
```

**What the CLI does NOT do:** It makes no network requests, doesn't invoke an LLM, doesn't install packages, doesn't execute any fork's agent or arbitrary scripts, doesn't save a private memory, doesn't mutate a project, and doesn't move funds. It is a deterministic source-aware **discovery, triage, and GPT briefing tool**.

## Reusable GPT workflow profiles

| Profile | Examples | Relevant forks |
|---|---|---|
| `atlas-sports` | Run Slate, NBA/NFL research, odds hypotheses and postgame | nba_api, sports-skills, nflreadpy, shin, mcp-sports-hub |
| `gpt-workspace` | GPT/Codex project briefs, resumed work, tool discovery | graphify, superpowers, claude-mem, skills, awesome-agent-skills |
| `development` | Debug, write code, refactor and test | Zod, fast-check, MSW, Playwright, Testcontainers, Graphify |
| `product` | Websites, Command Center and app UX | TanStack Query, Playwright, MSW, Supabase |
| `data` | Engineering pipelines, schema validation, backtests | data-engineer-handbook, goto_conversion, Supabase, nflreadpy |
| `research` | Experimental forecasting, alternative models, worlds | AlphaPy, penaltyblog, NBA movements, MiroFish (lab only) |
| `operations` | Skills, documentation, reliable handoffs | superpowers, knowledge-work-plugins, graphify, claude-mem |
| `security` | API, browser, injection and health failure tests | fast-check, MSW, Testcontainers, Playwright, Zod |

The entire 40-fork roster, including all source names and licenses/rights flags, is in `integrations/forks/workspace-catalog.json`. Original repos are represented as capabilities rather than installed software. `BLOCKED` candidates are excluded by default, and `LAB` agents require `--include-lab` to be shown.

## Status labels and what is REAL

- `CODE_SMOKE` (**5**) — actual pinned fork source ran in CI with explicit fixture. It is **not** a full installed/live integration.
- `REVIEWED` (**11**) — source manifest/README purpose inspected, not demonstrated as an active tool.
- `REFERENCE` (**13**) — method or documentation reference, not deployed.
- `LAB` (**8**) — tool needs isolation, licensing, privacy or autonomy review.
- `BLOCKED` (**3**) — not appropriate for general-purpose auto execution.

**Production integrations created by this phase: zero.** The existing ATLAS unified slate backend from PR #19 remains separate; no backend modifications or full live website changes happen here.

## Why this makes GPT easier

1. Root `AGENTS.md` gives Codex/GPT coding agents a single local source-of-truth policy and a first command to run inside the repo.
2. `skills/atlas-forge-workspace/SKILL.md` provides a portable agent-skill pattern **to review and install consciously**, not something already active in ChatGPT.
3. `brief` exports a compact task-specific, copy-ready starting prompt for any named workspace. It carries source/status boundaries, the right tool stack, and a concise proof checklist.
4. `route` and `plan` reduce search/setup time, while preserving actual authorization. Read-only tooling can be used across different projects without moving their private files into the Atlas repository.

### Example: building a new GPT-assisted website

```sh
node integrations/forks/workspace-cli.mjs brief --project development --workspace "Study Planner" --goal "build a responsive website with tests and preserve handoffs"
```

Review Graphify, superpowers, Zod, MSW, Playwright, TanStack Query and Supabase only as appropriate. **Do not install them all**: first inspect existing source, tool overlap, licenses, runtime and test proofs.

### Example: running the NBA slate

```sh
node integrations/forks/workspace-cli.mjs plan --project atlas-sports --goal "Run the Slate and test postgame calibration"
```

Keep SCOUT/FILTER verification separate from market-derived pricing, ORACLE held-out predictive proof, and the **Human Final Gate**. No fake injuries, no stale quote promotion, no unlicensed scraping and no autonomous sportsbook access.

## Optional local Graphify context for GPT/Codex\n\nThe pinned `graphify` fork has actually been installed and executed **offline with network denied** against ten ATLAS integration files (75 AST nodes, 126 code edges and 10 communities). Source evidence: `docs/evidence/ATLAS_FORGE_GRAPHIFY_CODE_ONLY_PROOF_20261030.md`. No API or private code was uploaded.\n\nWhen you choose to use Graphify on your own repository, generate its code-only graph explicitly, then include a compact structural receipt in a GPT brief:\n\n```sh\nGRAPHIFY_BACKEND=none GRAPHIFY_QUERY_LOG_DISABLE=1 graphify extract ./integrations/forks --code-only --no-viz\nnode integrations/forks/workspace-cli.mjs brief --project development --workspace \"ATLAS Fork Lab\" --goal \"explain our code graph\" --graph integrations/forks/graphify-out/graph.json\n```\n\nThe brief includes **only AST symbols, file/line locations and graph counts**, not source bodies. Check symbol/file names before sharing them with any assistant. The workflow `.github/workflows/atlas-forge-codegraph.yml` is **manually triggered only** and produces a 7-day code-only graph artifact after branch approval; it does not run automatically on paid provider queries.\n\n## Real release gates for richer agent interaction

1. Connect the actual project's source/permissions through the authorized GitHub or product app; avoid exposing personal data in prompts.
2. In a bounded sandbox, reproduce one source/tool's actual outputs against point-in-time fixtures and negative cases.
3. Pin source SHA/dependencies and run supply-chain and license reviews, especially AGPL browser/simulation forks and autonomous agents.
4. Use model-routing, agent-memory and full computer-use forks **only after** credential separation, no-secret telemetry, permission scopes, tool budgets, stop controls and explicit release proof.
5. Wire a verified existing UI before building another dashboard. The original ChatGPT Sites Command Center authoring rights remain a separate unresolved dependency.

## What to report after a run

`INSPECTED | EXECUTED | TESTED | CONNECTED | DEPLOYED | COST | BLOCKED | NEXT`.

Do not report any cost, throughput, provider connection or model accuracy that was not actually measured.
