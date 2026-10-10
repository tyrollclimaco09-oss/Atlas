#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
case "$(git branch --show-current)" in
  feature/*|review/*) ;;
  *) echo 'Blocked: the ATLAS agent requires a feature/* or review/* branch.' >&2; exit 1 ;;
esac
if [[ "${1:-}" != --probe || $# != 1 ]]; then
  echo 'Blocked: no genuine free inference provider has been verified and approved.' >&2
  echo 'Only --probe is available; it uses an unavailable model and read-only tools.' >&2
  exit 1
fi
umask 077
export PI_CODING_AGENT_DIR="$ROOT/.omniroute/pi"
export ATLAS_OMNIROUTE_API_KEY="$(cat .omniroute/inference-key)"
export ATLAS_REQUEST_AUDIT="$ROOT/.omniroute/agent-request-audit.jsonl"
export NODE_OPTIONS="--require=$ROOT/scripts/omniroute/local-only.cjs"
exec node .omniroute-runtime/agent/node_modules/@mariozechner/pi-coding-agent/dist/cli.js \
  --provider atlas-omniroute --model atlas-unconfigured-probe \
  --tools read,grep,find,ls --no-extensions --no-skills --no-prompt-templates \
  --no-themes --no-session --mode json -p \
  'Read docs/ATLAS_CANONICAL_BASELINE.md and describe the architecture. Do not change files.'
