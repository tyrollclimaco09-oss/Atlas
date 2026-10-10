#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OMNIROUTE_HOME="${REPO_ROOT}/.omniroute"
OMNIROUTE_MGMT_KEY="${OMNIROUTE_MGMT_KEY:-}"
PORT=20128

if [[ ! -f "${OMNIROUTE_HOME}/.env" ]]; then
  printf '%s\n' "Missing runtime env at ${OMNIROUTE_HOME}/.env." >&2
  exit 1
fi

if [[ -z "${OMNIROUTE_MGMT_KEY}" ]]; then
  printf '%s\n' "BLOCKED: OMNIROUTE_MGMT_KEY not set." >&2
  printf '%s\n' "Set the environment variable to authenticate with the gateway." >&2
  printf '%s\n' "Example: export OMNIROUTE_MGMT_KEY=your-bearer-token-here" >&2
  exit 1
fi

cat <<'JSON' >/tmp/omniroute-routing-preview.json
{
  "mode": "preview",
  "allowPaidProviders": false,
  "allowUnknownCostProviders": false,
  "allowAutomaticFallback": false,
  "candidates": [
    {
      "providerId": "synthetic-a",
      "modelId": "synthetic-mini-v1",
      "capabilityScore": 0.95,
      "allocation": {
        "tokenBudget": 1000,
        "costBudget": 0.0,
        "rateLimitTokensPerMin": 100
      },
      "healthScore": 1.0,
      "circuit": {
        "state": "closed",
        "consecutiveFailures": 0,
        "successCount": 0
      },
      "quota": {
        "remaining": 1000,
        "resetAt": "2026-10-10T23:59:59Z",
        "costRemaining": 0.0
      },
      "description": "Synthetic preview candidate; no upstream model request will execute."
    },
    {
      "providerId": "synthetic-b",
      "modelId": "synthetic-mini-v2",
      "capabilityScore": 0.90,
      "allocation": {
        "tokenBudget": 500,
        "costBudget": 0.0,
        "rateLimitTokensPerMin": 50
      },
      "healthScore": 1.0,
      "circuit": {
        "state": "closed",
        "consecutiveFailures": 0,
        "successCount": 0
      },
      "quota": {
        "remaining": 500,
        "resetAt": "2026-10-10T23:59:59Z",
        "costRemaining": 0.0
      },
      "description": "Second synthetic fallback candidate for preview-only routing."
    },
    {
      "providerId": "allocation-denied",
      "modelId": "denied-model",
      "capabilityScore": 0.0,
      "allocation": {
        "tokenBudget": 0,
        "costBudget": -1.0,
        "rateLimitTokensPerMin": 0
      },
      "healthScore": 0.0,
      "circuit": {
        "state": "open",
        "consecutiveFailures": 10,
        "successCount": 0
      },
      "quota": {
        "remaining": 0,
        "resetAt": "2026-10-10T23:59:59Z",
        "costRemaining": 0.0
      },
      "description": "Denied candidate to verify ineligibility filtering."
    }
  ]
}
JSON

printf '%s\n' '===== POST /api/omniroute/route/preview ====='
HTTP_CODE=$(curl -s -o /tmp/routing-preview.json -w '%{http_code}' \
  -X POST \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${OMNIROUTE_MGMT_KEY}" \
  --data @/tmp/omniroute-routing-preview.json \
  http://127.0.0.1:${PORT}/api/omniroute/route/preview)

if [[ "${HTTP_CODE}" != "200" ]]; then
  printf '%s\n' "Failed to call route preview: HTTP ${HTTP_CODE}" >&2
  cat /tmp/routing-preview.json >&2
  printf '\n'
  exit 1
fi

cat /tmp/routing-preview.json
printf '\n'

printf '%s\n' '===== Preview validation ====='
if jq -e '.liveRequestExecuted == false' /tmp/routing-preview.json >/dev/null 2>&1; then
  printf 'PASS: liveRequestExecuted is false (no upstream model call executed)\n'
else
  printf '%s\n' 'FAIL: liveRequestExecuted is not false' >&2
  jq '.liveRequestExecuted' /tmp/routing-preview.json >&2
  exit 1
fi

if jq -e '.selected' /tmp/routing-preview.json >/dev/null 2>&1; then
  SELECTED=$(jq -r '.selected.providerId' /tmp/routing-preview.json)
  printf 'Selected provider: %s\n' "${SELECTED}"
  if [[ "${SELECTED}" == "allocation-denied" ]]; then
    printf '%s\n' 'FAIL: Ineligible candidate was selected' >&2
    exit 1
  fi
else
  printf '%s\n' 'Note: No candidate selected in preview response.'
fi

printf 'PASS: Routing preview validation complete. Synthetic-only routing confirmed.\n'
