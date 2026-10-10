#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OMNIROUTE_HOME="${REPO_ROOT}/.omniroute"
PORT=20128

if [[ ! -f "${OMNIROUTE_HOME}/.env" ]]; then
  printf '%s\n' "Missing runtime env at ${OMNIROUTE_HOME}/.env." >&2
  exit 1
fi

printf '%s\n' '===== /healthz ====='
curl -fsS -D - http://127.0.0.1:${PORT}/healthz || true

printf '\n===== unauthenticated /api/omniroute/status =====\n'
curl -fsS -D - http://127.0.0.1:${PORT}/api/omniroute/status || true

printf '\n===== authenticated /api/omniroute/status =====\n'
PASSWORD="$(grep '^INITIAL_PASSWORD=' "${OMNIROUTE_HOME}/.env" | cut -d= -f2-)"
if [[ -n "${PASSWORD}" ]]; then
  curl -fsS -u "admin:${PASSWORD}" -D - http://127.0.0.1:${PORT}/api/omniroute/status || true
else
  printf '%s\n' 'INITIAL_PASSWORD not set in .omniroute/.env; expected after runtime generation.'
fi
