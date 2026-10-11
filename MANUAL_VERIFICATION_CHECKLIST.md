# ATLAS × OmniRoute verification evidence

Branch: `feature/omniroute-codespaces-gateway`.
Preserved ATLAS canonical baseline: `8338d69cf07ab947109fb122ed290edc3aeac870`.
OmniRoute source fix: `d4f39e2189f1ef189ab1fd7838e555c1a8e23c1d`,
branch `review/atlas-routing-preview-fix`.

PASS means the named check completed. FAIL means its observed behavior is
incorrect. BLOCKED means a prerequisite or supported platform action is absent.
Source tests, published-runtime checks, and fresh-task restoration are separate.

## Reconciliation evidence (2026-10-11)

The complete [A–G audit](docs/RECONCILIATION_2026-10-11.md) separates the
user-reported ChatGPT site prototype from the development-only checkout. Its
absence here does not establish that it never existed. Actual site/backend
contracts, deployment, RC9 205/205, and sports-stage behavior remain unverified.

| Check | Outcome | Current evidence |
|---|---|---|
| Original review history on GitHub | PASS | Remote ATLAS 3d6a929 and OmniRoute d4f39e2 match; main/release base unchanged |
| Narrow connection guard regression | PASS | Initial: 4 pass / 2 fail; lookup case also failed before correction; final: 7/7; all I/O stubbed |
| Declared port forwarding | PASS | forwardPorts empty; 20128 onAutoForward ignore retained; no claim about uninspected platform settings |
| Published package distinction | PASS | npm 3.8.51 integrity matches; npm 3.8.52 still E404; fork metadata is 3.8.52 |
| Current listener, health, management | PASS | 127.0.0.1:20128 only; health 200; authenticated management/policy check exit 0 |
| Current published preview | FAIL | Synthetic authenticated HTTP preview still 500, script exit 1 |
| Fork source regression | PASS | 8/8 route tests; 6/6 ranking/quota tests; no upstream fetch |
| Pi after guard change | PASS transport | Fresh process cwd /workspace/Atlas; local request; expected unavailable-model HTTP 400 |
| Real model/coding result | BLOCKED | No approved free provider; ordinary agent invocation refused; no coding response |
| Supabase authentication | BLOCKED | MCP enabled, auth Unknown; initialization Auth required; discovery is not login |
| Optional skill provenance | PASS | 40 files match public upstream c9be0e9; two entry points; generic examples only |
| Independent fresh-task restore | BLOCKED | Draft save and same-machine replay do not publish or run a fresh task |

The running gateway was preserved without restart or package modification. Its
previous preload remains loaded; the new guard was tested in isolation and in
a fresh Pi process. Zero provider connections/usage/call-log rows remain a local
gateway observation, not a statement about Supabase data.

## Historical stabilization evidence (2026-10-10)

| Check | Outcome | Evidence |
|---|---|---|
| Review pending ATLAS files | PASS | All initial 47 and final 56 modified/untracked files reviewed; credentials only variable references/placeholders; runtime/data paths ignored |
| Canonical architecture | PASS | File unchanged from checkpoint; SHA-256 dd323f190b6670280833815cf7139aaec9a623337ee6d6d27286ed8682862000 |
| Node and published runtime | PASS | Node 24.19.0; npm OmniRoute 3.8.51; Pi 0.73.1; exact artifact integrity checked |
| Retained package verification | PASS | 25,143 OmniRoute and 384 Pi packaged JS/TS/JSON files match SHA-512-verified archives |
| Installer/root correction | PASS | postCreate resolves ATLAS; standard installer delegates to verified 3.8.51; retained version conflicts fail before refresh |
| Live listener and health | PASS | Only 127.0.0.1:20128; /healthz 200/ok |
| Management authentication | PASS | Anonymous status 401; cookie login/status 200; inference key rejected by management |
| Live packaged routing preview | FAIL | HTTP 500: rankCandidates receives object rather than candidates array |
| Corrected fork source | PASS | Regression before: 4 failed/4 passed; after: 8/8 passed; existing ranking/quota tests: 6/6 passed; real commit hooks passed |
| No inference in source regression | PASS | Every test asserts zero fetches; passing tests also run with non-loopback Node connections blocked |
| Agent transport | PASS | Pi request reaches 127.0.0.1:20128/v1/chat/completions with cwd /workspace/Atlas; deliberately unavailable model rejected with 400 |
| Model inference / coding result | BLOCKED | User explicitly keeps inference blocked; no model response, coding task, or edit completed |
| Branch restriction | PASS | Non-feature/review branch rejected; ordinary inference invocation rejected |
| Cost gates | PASS | Provider connections, usage-history rows, and call-log rows zero; provider IDs/aliases blocked; combos and emergency fallback disabled |
| Supabase skills review | PASS | Upstream generic examples only; no production rows or credentials; no migrations or production writes executed |
| Supabase MCP transport | PASS | mcp.supabase.com public OAuth resource metadata 200; unauthenticated MCP endpoint 401 |
| Supabase MCP authentication | BLOCKED | Server enabled with auth Unknown; login retry fails at api.supabase.com OAuth metadata, proxy CONNECT 403 |
| Clean local installation/process replay | PASS | Empty dependencies installed from locks; private 20129 process passes health/auth; only replay process stopped |
| Fresh Codex task restoration | BLOCKED | Draft-save tools cannot publish/start a new task; fresh snapshot restoration, local-only commit retention, and runtime auth unverified |

See `docs/OMNIROUTE_DEVELOPMENT.md` for commands and limitations. No live
package replacement, paid inference, bets, merges, production changes, or
deployments were performed. The current working gateway is preserved.

## New cloud-instance review batch (2026-10-11)

The historical tables above retain their original scope. This new instance initially has no retained gateway/Pi runtime; its `/healthz` probe is connection-refused. See [the current capability supplement](docs/CAPABILITY_AUDIT_2026-10-11.md#current-cloud-reconciliation-and-health-input-batch) and [sanitized receipt](docs/evidence/2026-10-11-health-input-validation.json).

| Check | Result | Current evidence |
| --- | --- | --- |
| Existing checkpoint refs / canonical preservation | PASS | Native remote refs match; canonical SHA-256 unchanged |
| Original isolated hardening tests | PASS | 27/27, exit 0, no skips |
| Health-input regressions against original policy | FAIL, expected control | 22 pass / 9 fail, exit 1 |
| Real HTTP redirect regression against pre-redirect guard | FAIL, expected control | 0 pass / 1 fail, exit 1 |
| Final source + actual loopback HTTP suite | PASS | 42/42, exit 0; zero skips/cancellations |
| Changed CommonJS syntax / whitespace | PASS | `node --check` on all three changed/new JS files; `git diff --check` |
| Current gateway / published preview / Pi | BLOCKED / NOT TESTED | Runtime absent initially; localhost health connection-refused; no inference |
| Supabase / site / GitHub API | BLOCKED | Current HTTP/proxy 403; MCP config write rejected as read-only |
| SQL, RLS, grants, actual Human Final Gate/RC9 and original site contracts | NOT TESTED / UNKNOWN | Authenticated metadata and original source prerequisites missing |
| Deployment / publication / independent retained-runtime restoration | NOT TESTED | No live changes or publication performed |

Reproduce from `/workspace/Atlas`: `node --test --test-reporter=tap scripts/health/health-policy.test.cjs scripts/omniroute/tests/local-only.test.cjs scripts/omniroute/tests/fetch-redirect.test.cjs scripts/omniroute/tests/fetch-redirect.http.test.cjs`. Healthy valid-date/offset behavior and public health enum/thresholds remain intact. This command verifies review source and an isolated ephemeral HTTP boundary; it does not certify deployed compatibility.
