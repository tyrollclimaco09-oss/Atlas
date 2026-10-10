#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
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

printf 'Runtime environment ready at %s\n' "${OMNIROUTE_HOME}/.env"
printf 'Runtime directory: %s\n' "${RUNTIME_DIR}"
printf 'Logs: %s\n' "${LOG_DIR}"

if [[ ! -d "${RUNTIME_DIR}/node_modules" ]]; then
  bash "${REPO_ROOT}/scripts/omniroute/install.sh"
fi

printf '\nCodespaces OmniRoute environment ready.\n'
