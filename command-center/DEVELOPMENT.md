# Command Center development ownership — Gate 04

The recovered **existing** Command Center is complete for independent static
development. This establishes custody of this snapshot in Git, not control of
the original ChatGPT Sites deployment or parity with its current revision.
The original editable Sites project remains **SOURCE ACCESS BLOCKED**.

## Required files and tools

Publishable runtime consists of these eight files together, retaining relative
paths and the script order in `index.html`:

| File | Existing responsibility |
| --- | --- |
| `index.html` | Original interface, hash navigation, dialogs, reviewed resume seam |
| `styles.css` | Desktop/mobile layout and system fonts |
| `pricing.js` | Pure odds and optional independent-probability scenario math |
| `slate-engine.js` | Research intake, frozen forecast, evaluation, local decision history |
| `app.js` | Navigation, architecture reference, calculator and historical examples |
| `slate.js` | Original manual handoff, private browser draft, export/restore, candidate review |
| `canonical-read.js` | Injectable read-only candidate identity/version contract bridge |
| `canonical-resume.js` | Ephemeral canonical-read status; live connection disabled |

There are no missing referenced assets, external scripts, CDN fonts, package
dependencies or compilation steps. The favicon is inline. Keep `README.md`,
this file, `SOURCE_PROVENANCE.json` and `tests/*.test.cjs` for maintenance and
verification; they are not runtime requirements. Preserve the recorded original
hashes as source evidence, and document intentional future changes explicitly.
Git history holds the review changes; provenance identifies the served snapshot.

Use a modern browser with JavaScript, localStorage, dialog and Blob/FileReader.
`crypto.randomUUID` is preferred but the original engine has a local ID fallback.
Node is needed only for the built-in test runner; Python is an
optional standard-library development server. Gate 04 exercised Node 24.19.0,
Python 3.12.14 and existing Playwright 1.62.0 with system Chromium. No npm
installation is required to build or run this dashboard. No build output exists.

## Run and test independently

From the existing ATLAS checkout, inspect `git status --short --branch` first.
Use `review/atlas-capability-hardening-2026-10-11` or a separately authorized review
branch. Preserve all existing changes. Do not reset the checkout or change main.

```sh
cd /workspace/Atlas
node --test command-center/tests/*.test.cjs
python3 -m http.server 4174 --bind 127.0.0.1 --directory command-center
```

The server is for local browser development only. Do not forward its port or
serve the repository root, which could expose ignored runtime files. Stop the
server you started when finished. Keep the same browser profile, loopback host
and port for continuity: localStorage belongs to an origin. A cloud shell's
localhost is not the user's laptop; do not create a tunnel to make it accessible.
Use a browser in that environment, or the same commands in a local checkout.

Tests cover the candidate wire contract, cancellation/version conflicts,
original-source preservation, untrusted intake, frozen revision bindings,
SENTINEL caps and mandatory independent Final Gate reviews. Synthetic fixtures
are not live records, genuine forecasts or SQL-type evidence. A local eligible
decision receipt still has `placed:false`.

Manual/browser regression checklist, using disposable synthetic drafts:

1. Check all six navigation screens on desktop and mobile; no horizontal
   overflow, blank page, missing asset, console error or framework overlay.
2. Create a slate, inspect the run-bound first-phase research prompt and manual
   copy fallback. Do not submit research or navigate to external providers for QA.
3. Apply valid research; reviews remain unchecked. Invalid JSON and wrong
   bindings must preserve candidates and pasted text. Review and freeze before
   requesting the separate price phase.
4. Edit and reload the local draft; identity and inputs survive, while final
   review flags and remote proof require a fresh check. Export and restore a
   synthetic draft; invalid files must leave the active draft intact, and imported
   reviews/approvals must require fresh human review.
5. Verify missing evidence blocks Final Gate even when consent is checked.
   WATCH requires a trigger/deadline; explicit PASS/reopen retains history.
   Invalid screenshots and unavailable storage show existing warnings.
6. Check valid/invalid pricing and reset. Keep Ledger's historical disclosure and
   Overview's disconnected-backend disclosure visible.
7. Run fixture-only canonical reads for 200 data/null, 400/401/403/500, identity
   mismatch and changed version; no local draft overwrite or persisted proof.

Browser QA must use an isolated profile, synthetic storage and blocked external
requests. Existing QA scripts/screenshots are outside Git under
`/workspace/audits/atlas-gate04-2026-10-11`; they are not deployed artifacts.

## Preserve the existing ownership boundaries

Golden Slate and Apply Research are represented in this snapshot by Run slate,
its manual two-phase handoff, and Add GPT response's validated local intake.
Candidate review and SENTINEL are local evaluation,
not proof of a canonical backend decision. Resume belongs to the original
`atlas.slate.draft.v1` draft; `atlas.chat.url.v1` is the existing conversation
preference. Add no competing state store or approval authority.

System Health in this snapshot is a static availability disclosure, not a live
backend probe. Ledger is explicitly a historical conversation reference plus
local working history; Forensics is a documented responsibility, not a connected
report. These backend gaps are future integration work, not evidence that the
historical Supabase implementation never existed. No replacements are added.

Draft exports contain private research, history, financial inputs and possibly
screenshots. Keep them private and outside Git/public deployment. Changing
origin does not transfer drafts. Use existing explicit export/restore, verify
identity/content, and re-review; never auto-import or overwrite.

## Recover original Sites authoring control

The published URL is
`https://atlas-command-center-operator-t.tyrollclimaco09.chatgpt.site`.
No supported authoring tool or editable artifact is available in this session.
Do not treat the served snapshot as the current deployable Sites project.

The owner can use the original ChatGPT account to locate the creation
conversation/project by title or URL, reopen its Sites artifact, and verify the
deployment URL. Record the artifact/project identity, current revision and file
tree. Use only source copy/download controls actually exposed by that artifact;
no export/import capability has been established. If no editable/source control
is available, record that limitation and seek supported recovery through the
product. Do not rebuild from a narrative or request a nonexistent GitHub source.

Compare recovered files/hashes with that current source and identify intervening
changes before any update. Keep credentials, chat history and private drafts out
of the handoff. Verify owner permissions and deployment mapping; authorize a
separate bounded update only after review. No Sites update is performed here.

## Hosting fallback comparison — evaluation only

All choices would use these same eight runtime files and existing canonical
owners. No host/account/domain, workflow, deployment or autodeploy is configured.
Free hosting alone does not authorize an operator or make browser storage secure.

| Option | Free feasibility / Git integration | Authentication and privacy | HTTPS / rollback / maintenance |
| --- | --- | --- | --- |
| GitHub Pages | Static source fits; Git-backed publication. Official commercial transaction/SaaS restrictions need review for intended use. | Public frontend has no operator gate; private Pages requires Enterprise Cloud. Never host sensitive files. | HTTPS; restore a reviewed earlier commit via a separate publication. Lowest complexity, weaker private-dashboard fit. |
| Cloudflare Pages | Official Free limits: 500 builds/month and 20,000 files; GitHub integration. | Previews public by default. Access can protect previews; production/default `pages.dev` needs separate protection. Free Access entitlement/account eligibility unverified. | HTTPS hosting; successful production deployments support rollback. Additional access-policy maintenance. Conditional preferred private fallback. |
| Vercel | Static/Git hosting candidate; current Hobby eligibility, commercial conditions and account limits unverified here. | Production/preview protection and free entitlement require verification. Do not assume privacy from previews. | HTTPS/Git/rollback capabilities and plan-specific access remain to be verified. Defer selection. |

Direct documentation hosts were blocked by the managed proxy. Official
GitHub-hosted sources were retrieved with normal TLS/proxy verification:
[GitHub static hosting](https://raw.githubusercontent.com/github/docs/main/content/pages/getting-started-with-github-pages/what-is-github-pages.md),
[limits](https://raw.githubusercontent.com/github/docs/main/content/pages/getting-started-with-github-pages/github-pages-limits.md),
[private visibility](https://raw.githubusercontent.com/github/docs/main/content/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site.md),
[HTTPS](https://raw.githubusercontent.com/github/docs/main/content/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https.md),
[Cloudflare limits](https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/pages/platform/limits.mdx),
[Git integration](https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/pages/get-started/git-integration.mdx),
[preview Access](https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/pages/configuration/preview-deployments.mdx),
[rollbacks](https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/pages/configuration/rollbacks.mdx),
[production Access caveats](https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/pages/platform/known-issues.mdx).
Unverified Vercel references:
[Hobby](https://vercel.com/docs/plans/hobby),
[deployment protection](https://vercel.com/docs/deployment-protection),
[rollback](https://vercel.com/docs/instant-rollback).
Verify current eligibility, free allowances, host policy and no paid addons before
selection. Preserve default free domains unless a separate domain purchase is
authorized. Do not enable Git autodeploy before deployment authorization.

## Secure Supabase connection plan — still disabled

Keep the existing Gate 02 adapter and mock-only bootstrap. Use only the verified
candidate contract: GET `/functions/v1/atlas-site-runtime` with
`mode=candidate&candidate_key=<trimmed key>`, exact envelope and authority flags
documented in `README.md`. `run_id` is not an implemented query parameter.

Before adding a live transport, establish one existing authorized nonproduction
read context: supported network/browser environment, verified nonanonymous
Supabase operator session, authorized origin, synthetic canonical candidate key,
and verified SQL/JSON domain plus expected value of `state_version`. Management
MCP login does not supply an application operator session. Read metadata/source
through authorized access to establish the domain; do not infer it from fixtures,
invent a schema, create a role/candidate or read sensitive rows.

Use the existing project's supported operator authentication, with server-side
JWT verification and `app_metadata.atlas_operator === true`. Client claims alone
do not authorize access. An approved publishable/anon project key is a public
identifier, not operator authority. No service-role key, persistent legacy site
secret or privileged token may enter browser source, Git, URLs or logs. The legacy
credential path's gateway acceptance is unverified and is not the connection plan.
Reuse a supported session provider; do not add a second credential store. Keep
short-lived authorization out of draft exports and diagnostic artifacts.

A later reviewed transport should accept the bridge's frozen GET descriptor,
construct the existing endpoint, obtain supported session authorization, and
apply timeout/abort without logging headers or whole rows. Preserve generations,
explicit error states and exact identity/version equality with no casts. A
changed version revokes confirmation; it cannot silently become the new baseline.
Remote confirmation must never import state, approve a candidate or overwrite a
private local draft. Keep the current bootstrap disabled until the live path is
separately reviewed and accepted.

The permitted CORS origin is the original Sites origin. Localhost and fallback
origins are not authorized by static hosting or this plan. A replacement needs a
separate explicitly reviewed exact-origin CORS/auth-redirect configuration and
browser acceptance test. Do not spoof Origin, bypass CORS/JWT, add wildcard
preview origins or introduce a proxy. No production authentication/permissions
are changed here.

The minimal next integration proof is **one authorized read-only GET of an
existing synthetic canonical candidate**, plus unauthorized rejection and draft
preservation in an isolated operator context. Verify the actual returned identity,
version, `human_final_gate_required:true` and `execution_authority:false`. Until
all prerequisites exist: **MOCK/CONTRACT VERIFIED — NOT CONNECTED**. No intake
write, migration, inference or betting execution is part of this plan.
