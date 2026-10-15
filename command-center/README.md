# Existing ATLAS Command Center — recovered source and Gate02 read bridge

This directory preserves the six frontend files previously served by the existing [ChatGPT Sites Command Center](https://atlas-command-center-operator-t.tyrollclimaco09.chatgpt.site). It is not a replacement dashboard, deployed site or new canonical state owner. Source custody/hashes are in `SOURCE_PROVENANCE.json`; original editable Sites project and current deployment parity remain unverified. Four original JavaScript/CSS files are byte-identical. `slate-engine.js` has a review-only Arc II derivative: strict calendar validation and exact frozen-selection binding. Its original hash and three reversible source changes remain recorded and tested in the provenance file. `index.html` adds only two deferred scripts and one status container beside the original resume toolbar.

Gate02 status: **MOCK/CONTRACT VERIFIED — NOT CONNECTED**. No live transport, operator login, credential or configuration is shipped. The existing site's deployment, Supabase deployment and main are unchanged. The local review engine tightens validation; singles-only execution restrictions and mandatory Human Final Gate authority are preserved.

Gate04 independent development and ownership instructions are in
[DEVELOPMENT.md](DEVELOPMENT.md): exact runtime files, private local startup,
workflow checks, original Sites recovery, hosting comparison and the secure
connection plan. Recovered-source custody is established; original Sites
authoring/deployment control and current-live revision parity remain unverified.

## Source-to-contract mapping

| Existing source / new seam | Contract / behavior |
| --- | --- |
| `slate.js` private resume (`atlas.slate.draft.v1`, original automatic restoration and export/restore) | Original browser-local state owner. Existing local candidate UUID and run ID are not assumed to be canonical `candidate_key`. |
| `canonical-read.js` / `createBridge` | Injectable transport with frozen GET/candidate/candidate_key descriptor. No fetch, storage or credential handling. Default decoder implements the supplied actual candidate response envelope. |
| `canonical-read.js` / `candidateRequestURL` | Produces HTTPS original-project `/functions/v1/atlas-site-runtime?mode=candidate&candidate_key=<encoded, trimmed key>` only. It rejects other hosts/functions, auth/query fragments and missing key. It does not make a request. |
| `canonical-resume.js` / `#canonical-resume` | Ephemeral read status beside existing resume toolbar. Reads no draft fields/storage, imports no remote row, changes no approvals. Local controls continue to own the existing draft. |

The function contract was supplied by the operator after deployed-source inspection of **atlas-site-runtime v9**, not authenticated live HTTP testing:

- GET query `mode=candidate`, required trimmed string `candidate_key`; `verify_jwt=true`.
- Reads `atlas_unified_decision_packet_v1`, selects `candidate_key` and `state_version` among other fields, filters by candidate key and takes the first row or null.
- HTTP200 exact envelope: `{ "ok": true, "mode": "candidate", "human_final_gate_required": true, "execution_authority": false, "data": <object or null> }`. The placeholder is descriptive, not literal JSON. Decoder validates all fixed fields, data shape and own identity/version fields; it retains only identity/version.
- HTTP400 missing key;401/403 are authorization failures;500 database failure. Failed statuses never parse or publish potentially sensitive error bodies. No invented error-envelope schema is used.
- SQL types/nullability of selected fields are unverified. No version cast, parsing, automatic increment or numeric/string equivalence is performed. `validateStateVersion` is required and must return exactly `true` for the actual verified domain. The bridge supports immutable JSON scalar comparison tokens, rejects null/undefined, mutable/non-JSON values, nonfinite numbers and unsafe integers, and uses `Object.is` against the explicit expected version. These are client comparison limits, not claims about deployed SQL types. Unsupported/unknown domains remain blocked.
- Authorization supports a verified nonanonymous user with `app_metadata.atlas_operator === true`, or a legacy hashed credential. Gateway acceptance of legacy authentication is unverified and this bridge does not implement it. Advertised headers are authorization, apikey, x-client-info, content-type and x-atlas-site-token; advertised names are not proof of required live values or successful authentication. No service-role/privileged key, legacy credential, bearer token or browser authentication persistence is added.

## Injection and local/remote separation

The default page shows live integration disabled and disables the canonical check. An isolated fixture harness may define `globalThis.AtlasCanonicalResumeConfig` **before scripts execute**:

```js
// Fixture only: functions are supplied by the harness, not persisted or shipped.
globalThis.AtlasCanonicalResumeConfig = {
  enabled: true,
  evidence: 'mock',
  getBinding,             // returns { candidateKey, expectedStateVersion }
  validateStateVersion,  // actual domain remains unverified; fixtures label theirs
  transport              // fixture Response-like result; receives only a GET descriptor
};
```

Optional `decodeCandidate` is available for explicitly injected test protocols; the page normally uses the verified default decoder. `candidateKey` and `expectedStateVersion` are internal adapter inputs, not invented API fields. An owner must supply the explicit mapping/baseline. The bridge never derives a key from local run/candidate IDs or treats a version change as a new accepted baseline automatically.

Only a mock-labelled profile is supported by this review-only bootstrap. The label is not a security sandbox for arbitrary injected code; the provided tests use fixture-only transports and block all network requests. There is no live adapter or auth path to enable from this checkout.

| State | Meaning |
| --- | --- |
| `locally_saved` | Remote proof has not been established. Actual draft save/failure state remains shown by the unchanged original `#draft-state`; the bridge makes no extra storage claim. |
| `remote_confirmed` | Returned exact candidate identity/version match the explicit binding; fixture UI says MOCK/CONTRACT VERIFIED. This is not draft synchronization, server authorization or placement. |
| `stale_conflicting` | Wrong identity, changed/unsupported baseline version or invalidated binding/local view. No automatic overwrite or approval. |
| `unauthorized` |401/403; previous remote proof is revoked. |
| `unavailable` |400/500, network/JSON/schema/authority-flag failure, or missing contract injection. |
| `missing_candidate` | No requested identity, or a recognized200/null response. |

New reads clear previous proof; generations discard late old results. Local edits, selection/restore/review interactions and tab restoration invalidate ephemeral proof. The bridge holds no whole row, research, financial state or auth/error values. Status is rendered with textContent. It never writes localStorage/sessionStorage/cookies, replaces a draft, calls intake, mutates Human Final Gate or persists confirmations.

## Verification and remaining live gate

From repository root:

```sh
node --test command-center/tests/*.test.cjs
```

Tests cover actual success/null envelope, all required HTTP statuses, missing/mismatched identity, exact/changed versions, unsafe domain values, wrong authority flags, late requests, revoked proof, encoded candidate URL and preserved original files/HTML. Fixture values and test-only packets are explicitly synthetic; they establish client contract behavior, not live deployment acceptance.

Integrated browser QA uses existing Playwright/Chromium with locally fulfilled recovered files at the original hostname and all network blocked. It verifies displayed states, private draft preservation, normal local edit/resume, proof loss on reload, and unchanged incomplete-draft Final Gate rejection. No server, new dependency or public port is needed. Browser artifacts are outside Git under `/workspace/audits/atlas-gate02-2026-10-11`.

**Single remaining requirement for an authenticated nonproduction GET:** an existing authorized nonproduction operator read context—verified nonanonymous operator session at the permitted original origin, a known synthetic candidate key and expected state version with its verified domain. Supply authentication through the existing secure session mechanism; never paste credentials into chat or commit them. An approved bounded transport must have timeout/abort and preserve the project's JWT/CORS checks. The GET would then verify real gateway/handler authorization and response acceptance. No new database, auth service, migration, deployment, intake write, inference or bet is authorized by this batch.

Bridge rollback: remove the two bridge script tags/status container and bridge files on the review branch. The Arc II engine derivative is a separate review change; its exact before/after bytes are recorded in provenance and reconstruct the original snapshot hash in tests. Browser storage and remote deployments need no changes.
