# IPHONE_SETUP.md
# ATLAS × OmniRoute on GitHub Codespaces (iPhone)

## 1) Open the repository in GitHub Codespaces

1. On your iPhone, open:
   https://github.com/tyrollclimaco09-oss/Atlas
2. Tap the green `Code` button.
3. Select `Codespaces`.
4. Create a new Codespace from the branch `feature/omniroute-codespaces-gateway`.
5. Allow the Node.js 24 devcontainer to finish building.

## 2) Keep port 20128 private

In the Codespaces Ports panel:

- Find port `20128`
- Set visibility to `Private`
- Do not set it to `Public`
- Do not use a public tunnel or cloud deployment

## 3) Initialize the runtime env

Run:

```bash
bash .devcontainer/postCreate.sh
```

This creates `.omniroute/.env` with runtime-generated secrets. The file is ignored by git and is never committed.

## 4) Install the pinned OmniRoute release

Run:

```bash
bash scripts/omniroute/install.sh
```

This verifies `omniroute@3.8.52` is available in npm before installation.

## 5) Start the local gateway

Run:

```bash
bash scripts/omniroute/start.sh
```

The server binds to `127.0.0.1:20128` and does not open a public endpoint.

## 6) Check health and auth behavior

Run:

```bash
bash scripts/omniroute/status.sh
```

Then inspect the actual endpoints:

```bash
curl -fsS http://127.0.0.1:20128/healthz
curl -fsS http://127.0.0.1:20128/api/omniroute/status
curl -fsS -u "admin:$(grep '^INITIAL_PASSWORD=' .omniroute/.env | cut -d= -f2-)" \
  http://127.0.0.1:20128/api/omniroute/status
```

## 7) Run a synthetic-only routing preview

Run:

```bash
bash scripts/omniroute/routing-preview.sh
```

This uses only synthetic candidates and must not trigger any live upstream model request.

## 8) Stop after verification

Once checks are complete:

```bash
kill "$(cat .omniroute/omniroute.pid)"
```

This keeps the Codespace usage minimal and avoids paid overages.

## 9) Important safeguards

- Do not add provider API keys
- Do not enable paid inference or fallback
- Do not deploy outside the Codespace
- Do not expose port 20128 publicly
- Do not commit `.omniroute/.env`
