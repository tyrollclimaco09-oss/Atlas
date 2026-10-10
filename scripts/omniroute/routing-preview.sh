#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OMNIROUTE_HOME="${REPO_ROOT}/.omniroute"
PORT=20128

if [[ ! -f "${OMNIROUTE_HOME}/.env" ]]; then
  printf '%s\n' "Missing runtime env at ${OMNIROUTE_HOME}/.env." >&2
  exit 1
fi

PASSWORD="$(grep '^INITIAL_PASSWORD=' "${OMNIROUTE_HOME}/.env" | cut -d= -f2-)"

cat <<'JSON' >/tmp/omniroute-routing-candidates.json
{
  "mode": "preview",
  "allowPaidProviders": false,
  "allowUnknownCostProviders": false,
  "allowAutomaticFallback": false,
  "candidates": [
    {
      "id": "synthetic-a",
      "provider": "synthetic",
      "model": "synthetic-mini",
      "cost": 0,
      "priority": 1,
      "latencyMs": 1,
      "reliability": 1,
      "description": "Synthetic preview candidate; no upstream model request should execute."
    },
    {
      "id": "synthetic-b",
      "provider": "synthetic",
      "model": "synthetic-mini-b",
      "cost": 0,
      "priority": 2,
      "latencyMs": 1,
      "reliability": 1,
      "description": "Second synthetic preview candidate used only for route selection preview."
    }
  ]
}
JSON

printf '%s\n' '===== POST /api/omniroute/route/preview ====='
curl -sS -u "admin:${PASSWORD}" \
  -H 'Content-Type: application/json' \
  -X POST \
  --data @/tmp/omniroute-routing-candidates.json \
  http://127.0.0.1:${PORT}/api/omniroute/route/preview || true

printf '\n\n===== preview validation hints =====\n'
printf '%s\n' 'Expected: synthetic-only routing selection with no liveRequestExecuted=true.'
printf '%s\n' 'This is a preview check only; do not enable provider credentials or upstream model calls.'
