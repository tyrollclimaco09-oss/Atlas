#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"
python3 scripts/omniroute/prepare-cloud.py
printf '%s\n' 'Next: bash scripts/omniroute/install.sh'
printf '%s\n' 'Start in a persistent terminal: bash scripts/omniroute/start-cloud.sh'
printf '%s\n' 'Validate locally: python3 scripts/omniroute/prepare-cloud.py --lockdown'
