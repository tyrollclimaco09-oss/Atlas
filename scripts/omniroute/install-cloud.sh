#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
export npm_config_cache="$ROOT/.npm"
if [[ $# -gt 1 || ( $# -eq 1 && "$1" != --refresh ) ]]; then
  echo 'Usage: install-cloud.sh [--refresh]' >&2
  exit 2
fi
node -e 'if(Number(process.versions.node.split(".")[0])!==24)process.exit(1)'
mkdir -p .omniroute-runtime/artifacts
EXPECTED='sha512-VwwSt+bP9lJiPJXFJMz0nNGGuoewPZU3nFe1SLuO11ADgdSwTegGCxhg8Ov75+31m/cocPxHiO63zygn1XQ0MQ=='
test "$(npm view omniroute@3.8.51 dist.integrity)" = "$EXPECTED"
test "$(npm view @mariozechner/pi-coding-agent@0.73.1 dist.integrity)" = 'sha512-gXQh3SaZmWTfVMc4Ao5+LGbVeKvzyO7tolok0nLsZgq9nGjZx/EEU3NM8C+qUnB4Nvs2rswG5qOVgLzQkq0fHQ=='
if [[ ! -f .omniroute-runtime/artifacts/omniroute-3.8.51.tgz ]]; then
  npm pack omniroute@3.8.51 --pack-destination .omniroute-runtime/artifacts --silent
fi
if [[ ! -f .omniroute-runtime/artifacts/mariozechner-pi-coding-agent-0.73.1.tgz ]]; then
  npm pack @mariozechner/pi-coding-agent@0.73.1 --pack-destination .omniroute-runtime/artifacts --silent
fi
# Reject conflicting retained dependency declarations before refreshing them.
python3 - <<'PY'
import json
from pathlib import Path
for prefix, name, version, integrity in [
    (Path('.omniroute-runtime'), 'omniroute', '3.8.51',
     'sha512-VwwSt+bP9lJiPJXFJMz0nNGGuoewPZU3nFe1SLuO11ADgdSwTegGCxhg8Ov75+31m/cocPxHiO63zygn1XQ0MQ=='),
    (Path('.omniroute-runtime/agent'), '@mariozechner/pi-coding-agent', '0.73.1',
     'sha512-gXQh3SaZmWTfVMc4Ao5+LGbVeKvzyO7tolok0nLsZgq9nGjZx/EEU3NM8C+qUnB4Nvs2rswG5qOVgLzQkq0fHQ=='),
]:
    manifest = prefix / 'package.json'
    lock = prefix / 'package-lock.json'
    if manifest.exists():
        assert json.loads(manifest.read_text()).get('dependencies', {}).get(name) == version, \
            f'{manifest}: conflicting version; preserve local state and review'
    if lock.exists():
        entry = json.loads(lock.read_text())['packages']['node_modules/' + name]
        assert entry.get('version') == version and entry.get('integrity') == integrity, \
            f'{lock}: conflicting version or integrity; preserve local state and review'
PY
if [[ "${1:-}" != --refresh ]] && [[ -f .omniroute-runtime/node_modules/omniroute/package.json ]] &&
   [[ "$(node -p "require('./.omniroute-runtime/node_modules/omniroute/package.json').version")" == 3.8.51 ]]; then
  echo 'Reusing installed OmniRoute 3.8.51.'
elif [[ -f .omniroute-runtime/package-lock.json ]]; then
  npm ci --prefix .omniroute-runtime --no-audit --no-fund
else
  npm install --prefix .omniroute-runtime --save-exact omniroute@3.8.51 --no-audit --no-fund
fi
if [[ "${1:-}" != --refresh ]] && [[ -f .omniroute-runtime/agent/node_modules/@mariozechner/pi-coding-agent/package.json ]] &&
   [[ "$(node -p "require('./.omniroute-runtime/agent/node_modules/@mariozechner/pi-coding-agent/package.json').version")" == 0.73.1 ]]; then
  echo 'Reusing installed Pi 0.73.1.'
elif [[ -f .omniroute-runtime/agent/package-lock.json ]]; then
  npm ci --prefix .omniroute-runtime/agent --no-audit --no-fund
else
  npm install --prefix .omniroute-runtime/agent --save-exact @mariozechner/pi-coding-agent@0.73.1 --no-audit --no-fund
fi
# A successful installer exit is not enough: verify the resulting versions too.
test "$(node -p "require('./.omniroute-runtime/node_modules/omniroute/package.json').version")" = 3.8.51
test "$(node -p "require('./.omniroute-runtime/agent/node_modules/@mariozechner/pi-coding-agent/package.json').version")" = 0.73.1
python3 scripts/omniroute/verify-runtime.py
python3 scripts/omniroute/prepare-cloud.py
