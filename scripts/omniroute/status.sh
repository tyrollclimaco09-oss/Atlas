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

if [[ ! -f "${OMNIROUTE_HOME}/omniroute.pid" ]]; then
  printf '%s\n' "OmniRoute process ID not found at ${OMNIROUTE_HOME}/omniroute.pid." >&2
  printf '%s\n' "Hint: Run scripts/omniroute/start.sh first." >&2
  exit 1
fi

PID="$(cat "${OMNIROUTE_HOME}/omniroute.pid")"
if ! kill -0 "${PID}" 2>/dev/null; then
  printf '%s\n' "OmniRoute process ${PID} is not running." >&2
  printf '%s\n' "Inspect .omniroute/logs/omniroute.log for errors." >&2
  exit 1
fi

printf '%s\n' "OmniRoute process ${PID} is alive."

printf '\n===== GET /healthz =====\n'
if ! HTTP_CODE=$(curl -s -o /tmp/healthz.json -w '%{http_code}' http://127.0.0.1:${PORT}/healthz); then
  printf '%s\n' "Failed to reach /healthz." >&2
  exit 1
fi

if [[ "${HTTP_CODE}" != "200" ]]; then
  printf '%s\n' "Unexpected HTTP ${HTTP_CODE} from /healthz." >&2
  cat /tmp/healthz.json >&2
  exit 1
fi

cat /tmp/healthz.json
printf '\n'

printf '%s\n' '===== Unauthenticated GET /api/omniroute/status ====='
HTTP_CODE=$(curl -s -o /tmp/status-unauth.json -w '%{http_code}' http://127.0.0.1:${PORT}/api/omniroute/status)
if [[ "${HTTP_CODE}" == "401" || "${HTTP_CODE}" == "403" ]]; then
  printf 'PASS: Anonymous access rejected (HTTP %s)\n' "${HTTP_CODE}"
elif [[ "${HTTP_CODE}" == "200" ]]; then
  printf 'UNEXPECTED: Anonymous access accepted (HTTP 200)\n'
  cat /tmp/status-unauth.json
  printf '\n'
else
  printf 'FAIL: Unexpected HTTP %s\n' "${HTTP_CODE}"
  cat /tmp/status-unauth.json
  printf '\n'
fi

if [[ -z "${OMNIROUTE_MGMT_KEY}" ]]; then
  printf '\n%s\n' '===== Authenticated status check ====='
  printf '%s\n' 'BLOCKED: No OMNIROUTE_MGMT_KEY provided. Set environment variable to authenticate.'
  printf '%s\n' 'Example: export OMNIROUTE_MGMT_KEY=your-bearer-token-here'
  exit 0
fi

printf '\n%s\n' '===== Authenticated GET /api/omniroute/status ====='
HTTP_CODE=$(curl -s -o /tmp/status-auth.json -w '%{http_code}' \
  -H "Authorization: Bearer ${OMNIROUTE_MGMT_KEY}" \
  http://127.0.0.1:${PORT}/api/omniroute/status)

if [[ "${HTTP_CODE}" != "200" ]]; then
  printf '%s\n' "Failed to authenticate: HTTP ${HTTP_CODE}" >&2
  cat /tmp/status-auth.json >&2
  printf '\n'
  exit 1
fi

cat /tmp/status-auth.json
printf '\n'
printf 'PASS: Authenticated status retrieved.\n'
