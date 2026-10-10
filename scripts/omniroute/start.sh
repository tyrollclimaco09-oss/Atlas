#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OMNIROUTE_HOME="${REPO_ROOT}/.omniroute"
RUNTIME_DIR="${REPO_ROOT}/.omniroute-runtime"
LOG_DIR="${OMNIROUTE_HOME}/logs"
PID_FILE="${OMNIROUTE_HOME}/omniroute.pid"

mkdir -p "${LOG_DIR}"

if [[ ! -f "${OMNIROUTE_HOME}/.env" ]]; then
  printf '%s\n' "Missing runtime env at ${OMNIROUTE_HOME}/.env." >&2
  exit 1
fi

if [[ ! -d "${RUNTIME_DIR}/node_modules" ]]; then
  printf '%s\n' "OmniRoute is not installed. Run scripts/omniroute/install.sh first." >&2
  exit 1
fi

cp "${OMNIROUTE_HOME}/.env" "${RUNTIME_DIR}/.env"

cd "${RUNTIME_DIR}"
if ! node -p "require('./node_modules/omniroute/package.json').version" >/dev/null 2>&1; then
  printf '%s\n' "OmniRoute package is not properly installed." >&2
  exit 1
fi

if [[ -f "${PID_FILE}" ]]; then
  OLD_PID="$(cat "${PID_FILE}")"
  if kill -0 "${OLD_PID}" 2>/dev/null; then
    printf '%s\n' "OmniRoute is already running (PID ${OLD_PID})." >&2
    printf '%s\n' "Stop it with: kill ${OLD_PID}" >&2
    exit 1
  fi
fi

if npx omniroute serve --help 2>/dev/null | grep -q -- '--no-open'; then
  START_CMD=(npx omniroute serve --no-open)
else
  START_CMD=(npx omniroute serve)
fi

set +e
"${START_CMD[@]}" > "${LOG_DIR}/omniroute.log" 2>&1 &
OMNIROUTE_PID=$!
PID_CAPTURE_RESULT=$?
set -e

if [[ ${PID_CAPTURE_RESULT} -ne 0 ]]; then
  printf '%s\n' "Failed to start OmniRoute process." >&2
  exit 1
fi

echo "${OMNIROUTE_PID}" > "${PID_FILE}"
printf 'Started OmniRoute PID %s\n' "${OMNIROUTE_PID}"

for attempt in $(seq 1 60); do
  if kill -0 "${OMNIROUTE_PID}" 2>/dev/null; then
    if curl -fsS http://127.0.0.1:20128/healthz >/dev/null 2>&1; then
      printf 'OmniRoute gateway started successfully on http://127.0.0.1:20128\n'
      exit 0
    fi
  else
    printf '%s\n' "OmniRoute process ${OMNIROUTE_PID} terminated unexpectedly." >&2
    printf '%s\n' "Inspect .omniroute/logs/omniroute.log for startup errors." >&2
    rm -f "${PID_FILE}"
    exit 1
  fi
  sleep 1
done

printf '%s\n' "Startup did not report a healthy /healthz response within 60 seconds." >&2
printf '%s\n' "Process ${OMNIROUTE_PID} is still running but not responding." >&2
printf '%s\n' "Inspect .omniroute/logs/omniroute.log for details." >&2
exit 1
