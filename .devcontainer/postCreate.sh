#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [[ ! -f "${REPO_ROOT}/.devcontainer/devcontainer.json" ]]; then
  printf '%s\n' "ERROR: .devcontainer/devcontainer.json not found at ${REPO_ROOT}/.devcontainer/devcontainer.json" >&2
  printf '%s\n' "This script must be run from a valid ATLAS repository root." >&2
  exit 1
fi

if [[ ! -f "${REPO_ROOT}/scripts/omniroute/install.sh" ]]; then
  printf '%s\n' "ERROR: scripts/omniroute/install.sh not found at ${REPO_ROOT}/scripts/omniroute/install.sh" >&2
  printf '%s\n' "Setup structure is incomplete." >&2
  exit 1
fi

OMNIROUTE_HOME="${REPO_ROOT}/.omniroute"
RUNTIME_DIR="${REPO_ROOT}/.omniroute-runtime"
LOG_DIR="${OMNIROUTE_HOME}/logs"

mkdir -p "${OMNIROUTE_HOME}" "${LOG_DIR}" "${RUNTIME_DIR}"

if [[ ! -f "${OMNIROUTE_HOME}/.env" ]]; then
  {
    printf 'PORT=20128\n'
    printf 'APP_BIND_HOST=127.0.0.1\n'
    printf 'BASE_URL=http://127.0.0.1:20128\n'
    printf 'NEXT_PUBLIC_BASE_URL=http://127.0.0.1:20128\n'
    printf 'JWT_SECRET=%s\n' "$(openssl rand -base64 48)"
    printf 'API_KEY_SECRET=%s\n' "$(openssl rand -hex 32)"
    printf 'INITIAL_PASSWORD=%s\n' "$(openssl rand -hex 16)"
    printf 'REQUIRE_API_KEY=true\n'
    printf 'AUTH_COOKIE_SECURE=false\n'
    printf 'NODE_ENV=production\n'
  } > "${OMNIROUTE_HOME}/.env"
  chmod 600 "${OMNIROUTE_HOME}/.env"
fi

printf 'Codespaces OmniRoute environment initialized.\n'
printf 'Repository root: %s\n' "${REPO_ROOT}"
printf 'Runtime environment: %s\n' "${OMNIROUTE_HOME}/.env"
printf 'Runtime directory: %s\n' "${RUNTIME_DIR}"
printf 'Logs: %s\n' "${LOG_DIR}"
printf '\nRun the following steps:\n'
printf '  1. bash scripts/omniroute/install.sh\n'
printf '  2. bash scripts/omniroute/start.sh\n'
printf '  3. bash scripts/omniroute/status.sh\n'
printf '  4. bash scripts/omniroute/routing-preview.sh\n'
