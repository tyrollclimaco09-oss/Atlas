# ATLAS FORGE — Verified offline Graphify code map (October 30, 2026)

**Scope:** a genuine code-only Graphify fork execution against the public ATLAS Fork Arsenal directory, inside an isolated disposable Vercel sandbox. Not production, not a deployed site, not an LLM call.

## Provenance

- Actual fork: `tyrollclimaco09-oss/graphify`, pinned commit `c588b72d936927790a87ad009955078ed40562a3`.
- ATLAS branch snapshot scanned: `review/atlas-gpt-fork-workspace-2026-10-30`, commit **`fbb0aaba3929fe0cd42cd1c7587cc415bf8e6827`** at extraction.
- Graphify was locally installed in an isolated virtual environment from the pinned fork source. No project credentials or tokens were passed.
- After installing the package and cloning public sources, sandbox network policy was explicitly replaced with `deny-all` before extraction.
- Environment: `GRAPHIFY_BACKEND=none`, `GRAPHIFY_QUERY_LOG_DISABLE=1`. No remote LLM or docs/PDF/image extraction.
- Command:

```sh
GRAPHIFY_BACKEND=none GRAPHIFY_QUERY_LOG_DISABLE=1 \
  graphify extract /vercel/Atlas/integrations/forks --code-only --no-viz
```

## Actual observed results

```text
[graphify extract] scanning /vercel/Atlas/integrations/forks
[graphify extract] --code-only: skipping 1 non-code file(s) (1 docs, 0 papers, 0 images) — no LLM extraction
[graphify extract] found 10 code, 0 docs, 0 papers, 0 images
[graphify extract] AST extraction on 10 code files...
[graphify extract] wrote /vercel/Atlas/integrations/forks/graphify-out/graph.json: 75 nodes, 126 edges, 10 communities
```

The generated graph's recorded `built_at_commit` matched the frozen ATLAS source SHA above. Examples of top connected symbols/files: `workspace-cli.mjs` (19 graph relationships), `scout-arsenal.mjs` (15), `workspace-cli.test.mjs` (13), `screenForkObservation()` (8), and `route()` (7).

**These are code-structure connections**, not verified architectural correctness or source behavior. No live NBA statistics, sportsbook odds, private files, GPT inference, source deployment, provider calls or betting activity were involved.

## GPT/Codex integration

The safe, dependency-free `integrations/forks/graph-context.mjs` reads **an already locally generated** `graph.json` and emits a short list of source symbols and source locations. It excludes raw function bodies, source contents, and non-code/LLM nodes.

The local workspace briefing command now supports:

```sh
# On a project with Graphify already installed and approved:
GRAPHIFY_BACKEND=none GRAPHIFY_QUERY_LOG_DISABLE=1 \
  graphify extract ./integrations/forks --code-only --no-viz

node integrations/forks/workspace-cli.mjs brief \
  --project development --workspace "ATLAS" \
  --goal "understand current code connections and continue work" \
  --graph integrations/forks/graphify-out/graph.json
```

Graph generation is a **separate explicit action**; the FORGE CLI never runs it automatically. Before sharing a generated brief, inspect potentially sensitive symbol/file names even though bodies aren't included. A graph from an older commit is reference evidence, **not the current deployment's truth**.

## Repeatability

An opt-in `workflow_dispatch` GitHub Actions workflow `.github/workflows/atlas-forge-codegraph.yml` pins the exact Graphify fork SHA, uses the local code-only backend, and generates an artifact for the current public source. It is manual and does not run on every slate refresh, avoiding unnecessary installation and quota use.

## Remaining holds

- No original live ChatGPT Sites frontend deployment is proven by this result.
- No private project repository was analyzed.
- No automatic GPT API integration, Codex session takeover or autonomous source scan was created.
- The other untested forks remain discoverable, not operational.
