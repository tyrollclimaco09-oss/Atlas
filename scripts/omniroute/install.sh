#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OMNIROUTE_HOME="${REPO_ROOT}/.omniroute"
RUNTIME_DIR="${REPO_ROOT}/.omniroute-runtime"

mkdir -p "${OMNIROUTE_HOME}" "${RUNTIME_DIR}"

if [[ ! -f "${OMNIROUTE_HOME}/.env" ]]; then
  printf '%s\n' "Missing runtime env at ${OMNIROUTE_HOME}/.env. Run .devcontainer/postCreate.sh first." >&2
  exit 1
fi

node -v
npm -v

if ! npm view omniroute@3.8.52 version >/dev/null 2>&1; then
  printf '%s\n' 'ERROR: omniroute@3.8.52 is not available from npm in this environment.' >&2
  exit 1
fi

cd "${RUNTIME_DIR}"
if [[ ! -f package.json ]]; then
  npm init -y >/dev/null
fi

npm install --save-exact omniroute@3.8.52
cp "${OMNIROUTE_HOME}/.env" "${RUNTIME_DIR}/.env"

printf '\nInstalled OmniRoute version:\n'
node -p "require('./node_modules/omniroute/package.json').version"
