# ATLAS original Command Center source — unified slate read-only UI patch

Date: 2026-10-30.

**Scope:** recovered served-source snapshot from GitHub draft PR #6, **NOT** the original editable ChatGPT Sites deployment. Preserve source custody. Do not mistake Vercel's Shadow Command Center for the original.

## Implemented in the recovered original interface
- `command-center/index.html` now includes one additional deferred `slate-sources.js` and a small `#slate-sources` read-only panel on the existing Run the Slate screen.
- `command-center/slate-sources.js` binds `#continue-slate` and a manual `#slate-source-refresh` control. It does **not** change the existing `slate.js` local draft, user approvals, prompt launcher, Final Gate, existing ledger, or candidate imports.
- The single read goes to the existing authenticated backend `https://lhliqbbooproqtslmgqi.supabase.co/functions/v1/atlas-site-runtime?mode=slate_sources&league=NBA&slate_date=...`. **No paid Odds API fetch in the browser.**
- The existing `slate_sources` v13 read endpoint was independently verified live in PR #19. Browser displays canonical matchup identity, source states, a few fresh DK reference prices, and native candidate count. It does **not** turn sportsbook quotes or Flaim fantasy information into candidate approvals.
- Source supports NBA/NFL. Other sports continue using the unchanged local draft workflow.
- Browser code uses textContent / DOM createElement, never provider strings in innerHTML, never persists auth, no localStorage/sessionStorage secrets.
- No operator credential is hardcoded or shipped. A trusted same-origin private operator session provider must inject `window.AtlasSlateSourcesConfig = { getSessionHeaders: async () => ({ Authorization: 'Bearer <operator session JWT>' }) }` outside this public repository. If absent, the UI explicitly says `ATLAS operator connection not configured` and remains read-only local.
- Since the original ChatGPT Sites authoring environment has not been recovered, this patch was **NOT deployed to the original website**. No production UI change is claimed.

## Integrity tests
`node --test command-center/tests/*.test.cjs` passes **119/119** in an isolated Vercel sandbox. Existing snapshot hashes of `app.js`, `slate.js`, `slate-engine.js`, `pricing.js`, and `styles.css` remain exactly preserved, and the HTML provenance test strips only explicitly reviewed bounded additions before reproducing the original SHA-256 digest.

## Release acceptance remains
1. Recover authoritative editor/deployment ownership of `https://atlas-command-center-operator-t.tyrollclimaco09.chatgpt.site`.
2. Review the exact source revision of the live site's current deployed assets versus the recovered snapshot. Do not overwrite any newer UI changes.
3. Wire approved private operator session provider; never publish a site-reader token, service-role key or secret.
4. Test real authenticated click for NBA Oct 29 (stale DK reference withheld), Oct 30 (empty verified slate), and a fresh quota-guarded priced slate. Test unauthorized response 401 and stale local TTL too.
5. Update original deployment only with owner permission and staged review; do not replace with another dashboard.

References: draft PR #19 (runtime v13), draft PR #17 (DK pricing), draft PR #18 (Flaim optional SCOUT/VERIFY), GitHub issue #8 (original site parity).

## Final follow-up evidence
- `slate-sources.js` also renders optional, sanitized Flaim fantasy leads by exact professional team matchup. They remain explicitly *fantasy research*, with professional source verification required; forged official claims and private owner/credential data are filtered out.
- **125/125 tests passed in GitHub Actions** (latest tested commit `d1a10990b3d8f66a1552b50278ebfe7f34d6fa94`), workflow `ATLAS recovered original Command Center slate source wiring`, run **41093001905**, job **124191447194**. Raw CI logs checked: 125 tests, 125 pass, 0 fail.
- The frontend source was verified only in a **recovered snapshot** from the original site. Publishing to that original site has not occurred; the connected browser is unavailable, and project/team-scoped Vercel authorization for an unrelated existing project is not established. Do not infer Vercel deployment authority over the original ChatGPT Sites domain.
- The Vercel daily DraftKings refresh remains disabled, so **zero scheduled paid API calls** have been enabled in this integration step. Supabase v13 read mode remains deployed independently.
