# ATLAS FORGE — evidence-backed GPT/Codex session handoff

**Date:** October 30, 2026. **Status:** read-only implementation in a stacked review branch. No changes to production, browser UI, memory database or betting systems.

## Why

The existing PR #24 FORGE `brief` selects 40 indexed fork references for a GPT project but doesn't carry a trustworthy summary of the *actual repository revision*, earlier test receipts and open blockers. ATLAS already has a populated Create State model and active saved handoff packages. It should not create another memory database or silently manufacture prior-session evidence.

This change adds a small, **operator-provided evidence receipt** and a deterministic, portable command that can be pasted into a new GPT/Codex conversation.

## Run the working proof

```bash
node integrations/forks/workspace-cli.mjs doctor
node integrations/forks/workspace-cli.mjs resume \
  --receipt integrations/forks/fixtures/handoff-synthetic.json \
  --now 2026-10-30T19:20:00.000Z

node --test integrations/forks/*.test.mjs
```

The example is marked `SYNTHETIC`: real GitHub PR/CI link shapes are included as *illustrations*, not evidence that the current branch still has the old SHA/test count. The explicit `--now` is for deterministic tests; omit it in ordinary use.

### Sample reviewed input

```json
{
  "contract": "ATLAS_FORGE_HANDOFF_INPUT_V1",
  "project": "gpt-workspace",
  "workspace": "My Project",
  "objective": "Continue code review and reproduce failing tests",
  "captured_at": "2026-10-30T19:15:00.000Z",
  "source": {
    "repository": "tyrollclimaco09-oss/Atlas",
    "branch": "review/atlas-gpt-fork-workspace-2026-10-30",
    "commit": "322821cb573e127c2a6d74c584f4e0a020c68542",
    "authority": "OPERATOR_REPORTED"
  },
  "evidence": [
    {
      "id": "PR24",
      "kind": "PR",
      "url": "https://github.com/tyrollclimaco09-oss/Atlas/pull/24",
      "summary": "Source reference to review, not a verified current state",
      "observed_at": "2026-10-30T19:12:00.000Z"
    }
  ],
  "tests": [],
  "blockers": [{"id":"SITE_ACCESS","detail":"Original site deployment remains unverified"}],
  "next_actions": [
    {"id":"RECHECK","goal":"Inspect current GitHub PR and commit before changing code","authority":"READ_ONLY"}
  ],
  "memory_reference": null
}
```

The `source.commit`, `tests[].passed` and `evidence[].summary` are **operator assertions**, not automatically retrieved facts. For genuine use, change those fields to actual independently inspected sources. A valid syntax/schema proves only a *well-formed handoff*, not a verified project.

## Data contract and safety

1. **Strict schema:** unknown top-level or nested receipt keys, missing evidence, empty next-action plan, unrecognized authority, duplicate IDs, invalid URL types, non-UTC timestamps, impossible dates and oversize files fail closed.
2. **Temporal truth:** evidence/CI observations cannot be dated after the claimed freeze; future-dated observations fail. Receipts older than 24 hours are displayed as `STALE_RECHECK_REQUIRED`, not silently modernized.
3. **Secrets/privacy:** short allowlisted fields only. The CLI rejects common API key/token/private-key patterns and never imports full chat messages, browsing histories, user identity data or source bodies. This is a *best-effort regex gate*, not a complete DLP/security guarantee; scrub manually and keep receipts private.
4. **Integrity:** the packet includes a SHA-256 digest that catches accidental post-generation mutation. This is **not** a signature, authorization token or proof a statement is true.
5. **Source truth:** GitHub CI tests, real deployment/health and source SHAs are always labeled `OPERATOR_REPORTED_NEEDS_RECHECK` until a connected source is queried separately. No fake test runs or auto-created checkpoints.
6. **Memory reuse:** optional `memory_reference` records `{provider:"CREATE_STATE",handoff_id:"<UUID>"}`. It does not read a previous handoff or grant access to saved memories. Existing populated Create State model remains the persistence owner.
7. **No execution:** the command only reads the explicitly selected local JSON file, validates it, chooses fork references through PR #24's existing router, and prints the handoff to stdout. No writes, network calls, shell invocation, LLM API calls, agent skills, paid services, external account access, software installation or wagers.

The connector's actual `listHandoffPackages` was called read-only for this pass and reported existing session packages including the October 29 ATLAS session. This established that FORGE should reuse previous handoff identifiers rather than copy the entire conversation into a new database. The CLI itself has no access to the connector.

## Fork assessment for this goal

| Fork | Current evidence | How to use |
| --- | --- | --- |
| **Graphify** | Previously installed and executed offline on a pinned fork (75 AST nodes, 126 edges in prior frozen 10-file research pass) | Optional `brief --graph` adds source-symbol references, not source contents |
| **superpowers** | Read repository's `verification-before-completion` and `writing-plans` skills in GitHub, read-only | Adopt *verification before claims*, bounded plans and fresh test receipts; do not auto-install untrusted skill text |
| **claude-mem** | Read repository security policy/README and confirmed potential persistent recording + local DB/worker | **Do not install for now**: Create State already provides authoritative ATLAS memory; privacy and double-write risks |
| **skills**, **knowledge-work-plugins**, **awesome-agent-skills** | Reviewed catalog and public documentation, not run | Future opt-in portable skill references after manual compatibility and security review |
| **ponytail**, **prime-agent**, **OpenBot**, **ruflo**, **omniroute** | Cataloged, agent/security features not tested in this pass | Keep the agent-orchestration and alternate-model providers in Lab with explicit budget, egress and permissions |
| **Playwright**, **fast-check**, **MSW**, **Zod** | Cataloged from PR #24; no new package installed | Good next test/replay coverage after selecting an actual project |

## Actual tests performed

- Initial isolated handoff suite: 24/25 passed, with a fixture ordering error (source omitted *and* timestamp omitted).
- Corrected the fixture, not the validation. Re-run: 25/25.
- Expanded with 8 regression cases for causality, GitHub PR/issue URL identity, impossible dates, minimum references and tamper rejection.
- Latest isolated handoff suite: **33/33**; full `integrations/forks/*.test.mjs` suite **97/97**, no failures.
- Existing pinned actual fork code tests are inherited from PR #23 and unaffected; this specific pass did not install any external agent or live provider.

## Limitations and next review step

- The current PR remains **draft and unmerged**; local runnable code works on the branch but is not automatically present in ChatGPT or an installed Codex skill.
- For a real next-session continuation, use current GitHub/read-only CI to construct a recent receipt, print a packet, then the next GPT session rechecks those sources before acting.
- An operator could optionally create a *genuine connected Create State handoff* using the already installed connector. That operation is separate from this local CLI. No duplicate SQL table or new long-term memory store is added.
- Original Command Center authoring access remains unverified; do not pretend the dashboard is updated.
