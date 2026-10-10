#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# Published runtime: omniroute@3.8.51. Fork source 3.8.52 is not available on npm.
exec bash "${REPO_ROOT}/scripts/omniroute/install-cloud.sh" "$@"
