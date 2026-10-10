# ATLAS × OmniRoute on GitHub Codespaces (iPhone)

1. Create the Codespace from ATLAS branch `feature/omniroute-codespaces-gateway`.
   Node 24 is required. Keep port 20128 private; do not create a public tunnel.
2. Initialize guarded repository-local configuration:

   ```bash
   bash .devcontainer/postCreate.sh
   ```

3. Install the published, integrity-verified release and guarded Pi CLI:

   ```bash
   bash scripts/omniroute/install.sh
   ```

   Runtime is npm `omniroute@3.8.51`. The fork source reports `3.8.52`, which
   currently returns 404 from npm. The fork's preview fix is a separate source
   review commit, not a replacement of the installed published package.
4. Start the localhost gateway in a persistent terminal:

   ```bash
   bash scripts/omniroute/start.sh
   ```

   This runs in the foreground and binds only `127.0.0.1:20128`. Use a second
   terminal for the checks below. Runtime logs and credentials stay local and
   ignored by Git.
5. Configure and verify the zero-inference policy:

   ```bash
   python3 scripts/omniroute/prepare-cloud.py --lockdown
   ```

   Management login uses the generated local password through an in-memory
   cookie session; no manually exported bearer token is needed. The inference
   key is separate and cannot authenticate management. This check currently
   exits 1 because the published package's synthetic preview still returns 500.
   Do not describe that failed HTTP check as passing.
6. Check health and authentication independently:

   ```bash
   bash scripts/omniroute/status.sh
   bash scripts/omniroute/routing-preview.sh
   ```

   Status is verified; preview retains the packaged HTTP 500 failure. The
   corrected fork source passes regression tests, but has not been built into
   the live package. See `docs/OMNIROUTE_DEVELOPMENT.md` for evidence.
7. Verify agent transport without inference:

   ```bash
   bash scripts/omniroute/atlas-agent.sh --probe
   ```

   The launcher runs inside ATLAS on a `feature/*` or `review/*` branch, with
   read-only tools. Expected result is the unavailable-model rejection, not a
   completed coding task. Normal inference remains blocked by user instruction.
8. Stop the server you started with Ctrl+C in its terminal, then stop the
   Codespace in GitHub when finished. Do not stop another user's server.

No paid or unknown-cost providers, automatic paid fallback, upstream inference,
public ports, committed secrets, autonomous bets, merges, Supabase writes, or
production deployments are authorized. OmniRoute remains development
infrastructure; the ATLAS canonical architecture is unchanged.
