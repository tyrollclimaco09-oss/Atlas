# ATLAS development through OmniRoute

OmniRoute is development infrastructure. It does not change SCOUT, ORACLE,
EDGE THIEF, FORENSICS, SENTINEL, TACTICIAN, FINAL GATE, LEDGER, or the canonical
architecture. This workflow does not authorize bets, merges, Supabase mutations,
production deployments, paid providers, or automatic paid fallback.

## Repository and release

- ATLAS working directory: `/workspace/Atlas`.
- Integration branch: `feature/omniroute-codespaces-gateway`.
- Preserved checkpoint: `8338d69cf07ab947109fb122ed290edc3aeac870`.
- Source fork: `https://github.com/tyrollclimaco09-oss/omniroute`.
- Fork base: `4ea24a2f8e1faf8a606c8b8dce45e5b1ab6c9bb0`, source version 3.8.52.
- Corrected fork commit: `d4f39e2189f1ef189ab1fd7838e555c1a8e23c1d`, on
  `review/atlas-routing-preview-fix`. Its source fix is separate from the npm runtime.
- Runtime: npm `omniroute@3.8.51`, not a build of the fork's moving HEAD.
- Registry SHA-512: `sha512-VwwSt+bP9lJiPJXFJMz0nNGGuoewPZU3nFe1SLuO11ADgdSwTegGCxhg8Ov75+31m/cocPxHiO63zygn1XQ0MQ==`.
- Local coding CLI: `@mariozechner/pi-coding-agent@0.73.1` (deprecated package
  name, but the installed pinned CLI runs on Node 24).

The standard installer now delegates to the verified `3.8.51` cloud installer,
and `postCreate.sh` resolves ATLAS correctly and generates the guarded local
configuration. The fork's `3.8.52` version still returns 404 from npm. Source
version and published runtime version must not be treated as interchangeable.

## Setup and private startup

Use the existing checkout; cloud tasks are already isolated. Do not create a
Git worktree unless the user explicitly asks for one.

```bash
cd /workspace/Atlas
bash scripts/omniroute/install-cloud.sh
# In a persistent terminal / managed background session:
bash scripts/omniroute/start-cloud.sh > .omniroute/logs/cloud.log 2>&1
# In another terminal, once /healthz returns 200:
python3 scripts/omniroute/prepare-cloud.py --lockdown
```

`install-cloud.sh` checks the pinned registry integrity values, reuses installed
versions, and initializes ignored local config. Pass `--refresh` to reinstall
with `npm ci` from existing runtime locks. Conflicting retained versions/integrity stop installation;
the resulting package versions and packaged JS/TS/JSON files are checked against
pinned SHA-512-verified archives. Native dependencies and assets are outside
that file comparison; npm retains its normal dependency integrity checks.
The runtime and CLI locks live under
ignored `.omniroute-runtime/`; ATLAS application dependency files are unchanged.

Secrets are generated locally under `.omniroute/.env` with mode 0600. Do not
print, commit, share, or copy them into environment setup instructions. Pi's
inference-only gateway key is stored in `.omniroute/inference-key`; it is
different from management authentication. The helper authenticates management
with the generated initial password and an in-memory session cookie.

Startup forces **127.0.0.1:20128**. There is no public port, tunnel, or preview.
Background provider checks and emergency fallback are disabled. Lockdown blocks
all 529 static provider IDs/aliases, disables anonymous credential fallback,
sets strict free access, hides paid and automatic-combo models, and exposes only
an intentionally nonexistent model. There are no configured provider accounts.
The Node preload rejects non-loopback fetch/socket connections as an additional
defense; it is not a kernel firewall or a sandbox for native libraries.

## Exact agent configuration

Ignored repository-local file: `.omniroute/pi/models.json`.

```json
{
  "providers": {
    "atlas-omniroute": {
      "baseUrl": "http://127.0.0.1:20128/v1",
      "api": "openai-completions",
      "apiKey": "ATLAS_OMNIROUTE_API_KEY",
      "authHeader": true,
      "compat": {
        "supportsDeveloperRole": false,
        "supportsReasoningEffort": false
      },
      "models": [{
        "id": "atlas-unconfigured-probe",
        "name": "Blocked integration probe (no provider)",
        "reasoning": false,
        "input": ["text"],
        "contextWindow": 8192,
        "maxTokens": 64
      }]
    }
  }
}
```

`PI_CODING_AGENT_DIR=/workspace/Atlas/.omniroute/pi`. The wrapper supplies
`ATLAS_OMNIROUTE_API_KEY` from the private local key file without printing it.
It changes directory to ATLAS and permits only `feature/*` or `review/*`
branches. Probe tools are restricted to `read,grep,find,ls`; extension, skill,
prompt-template, and theme discovery are disabled. No autonomous write tools
are enabled. Configuring Pi does not redirect this hosted Codex session's model.

## ATLAS task → local coding CLI → OmniRoute

1. Start from the integration branch. Create a new `review/<task>` branch in
   the existing ATLAS checkout for a future implementation task.
2. Start the private gateway and run the management/lockdown checks above.
3. Run `bash scripts/omniroute/atlas-agent.sh --probe` from any directory. Its
   actual working directory and request endpoint are recorded without credentials
   or prompt contents in `.omniroute/agent-request-audit.jsonl`.
4. The probe must receive an unavailable-model rejection. This exercises the
   agent transport without upstream inference. Pi's exit code alone is not proof
   of success: inspect JSON `stopReason` and `errorMessage`.
5. **Stop here.** The user selected “Keep inference blocked.” Normal agent
   invocation is refused. Enabling a real coding task requires independently
   verifying a genuinely zero-cost model/provider and obtaining explicit approval,
   then a separate reviewed change to this guarded configuration and launcher.
   Do not remove protections or infer approval from a provider's “free” label.
6. For approved future work, validate a real response and tool behavior on ATLAS
   before claiming coding integration, and review the diff before any commit or
   merge. No merges or deployment are authorized by these instructions.

## Current evidence (2026-10-10)

| Check | Observed result |
|---|---|
| Node | 24.19.0; pinned runtime and Pi CLI installed |
| Artifact | Downloaded npm tarball SHA-512 equals registry value above |
| Startup / bind | Gateway started; listener exclusively 127.0.0.1:20128 |
| Health | `GET /healthz`: 200, body `ok` |
| Anonymous management | `GET /api/omniroute/status`: 401 |
| Management login / status | Login: 200; authenticated status: 200 |
| Inference key / management | Inference credential rejected by management |
| Synthetic HTTP preview | **FAIL:** authenticated request returns 500 |
| Direct ranking algorithm | PASS: synthetic-a selected; denied candidate ineligible |
| Pi transport | POST `/v1/chat/completions`, cwd `/workspace/Atlas`; gateway returns 400 for unavailable model |
| Coding result | **BLOCKED:** no approved model; no response, file read, edit, or coding task completed |
| Cost gate | Zero provider connections, usage-history rows, and call-log rows; inference blocked |
| Branch gate | Non-review branch rejected; ordinary inference invocation rejected |
| Repository preservation | Canonical architecture unchanged; authorized setup fixes plus reviewed helpers/docs/skills |

The `3.8.51` preview handler calls `rankCandidates(parsed.data)`, but
`rankCandidates` calls `.map` on its array parameter. The parsed value is an
object with a `candidates` property. This produces `TypeError: e.map is not a
function`. The original and cloud validation scripts must report this failure;
the direct algorithm check does not replace the failed HTTP check. The fork fix
now passes eight route-level regression tests and six existing ranking/quota
tests, with zero fetches and non-loopback Node connections blocked. Management
authentication is mocked only for those isolated tests. No production build
or replacement of the running published package was performed, so its live
preview failure remains. A verified corrected runtime build/release is needed
before claiming the live HTTP preview is fixed.

**Working private gateway and authenticated management are verified. Full
ATLAS coding-agent integration is not verified and inference remains blocked.**

## Supabase MCP

The global Codex MCP configuration includes `supabase` at:

`https://mcp.supabase.com/mcp?project_ref=lhliqbbooproqtslmgqi&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching`

`codex mcp login supabase` failed during OAuth discovery because the environment
proxy denied CONNECT to `mcp.supabase.com` with 403. This is a network blocker,
not authenticated MCP access. The domain addition is saved in the environment
draft; review/save and publish through environment settings, then retry login
and complete the browser flow. `/mcp` is an interactive Codex command, not a
shell executable; use it in a supported Codex UI after successful login.
`codex mcp list` currently reports enabled with authentication Unknown.

Optional Supabase skills are installed under `.agents/skills/supabase` and
`.agents/skills/supabase-postgres-best-practices`, with `skills-lock.json`.
Installation does not authenticate MCP or authorize Supabase changes.
The reviewed skill examples are generic placeholders; no production data or
credentials are committed. Do not run migrations, functions, writes, or read
sensitive production rows as part of stabilization.

## Restoration limits

A clean installation replay at `/workspace/scratch/atlas-install-replay` passed
from empty dependency directories using the retained lockfiles. Both pinned
archives and 25,143 OmniRoute / 384 Pi packaged JS/TS/JSON files matched. A
separate process on `127.0.0.1:20129` returned health 200, anonymous management
401, login/authenticated status 200, zero configured providers, and the expected
published preview 500. Only that replay process was stopped; the original
20128 gateway was preserved. Evidence: the local fixture
`install-replay.log` and `replay-evidence.json`. The first process probe used an
insufficient five-second timeout during cold initialization; repeating with
the supported 30-second management timeout passed.

The available environment tools save drafts; they cannot publish a snapshot or
start an independent fresh task. This replay is a current-machine check. Runtime authentication and running
processes must not be assumed to survive restoration. The user must publish
the reviewed environment through settings and start a fresh task for an actual
restoration check. Local review commits have not been pushed, and restoration
of local-only commits is not guaranteed by the platform; report this as blocked
until independently tested. Preserve all current files and do not reset/push
or replace the runtime as a workaround.
