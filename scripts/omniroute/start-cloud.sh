#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
umask 077
test -f .omniroute/.env
test "$(node -p "require('./.omniroute-runtime/node_modules/omniroute/package.json').version")" = 3.8.51
mkdir -p .omniroute/logs
set -a
source .omniroute/.env
set +a
export HOSTNAME=127.0.0.1 APP_BIND_HOST=127.0.0.1 PORT=20128
export OMNIROUTE_DISABLE_BACKGROUND_SERVICES=true OMNIROUTE_EMERGENCY_FALLBACK=false
export NODE_OPTIONS="--require=$ROOT/scripts/omniroute/local-only.cjs"
exec node .omniroute-runtime/node_modules/omniroute/dist/server.js
