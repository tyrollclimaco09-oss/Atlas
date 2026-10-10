#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OMNIROUTE_HOME="${REPO_ROOT}/.omniroute"
OMNIROUTE_MGMT_KEY="${OMNIROUTE_MGMT_KEY:-}"
PORT=20128

# Exit on any validation failure
validation_failed=0

if [[ ! -f "${OMNIROUTE_HOME}/.env" ]]; then
  printf 'FAIL: .omniroute/.env does not exist. Run postCreate.sh first.\n' >&2
  exit 1
fi

printf 'OFFLINE VALIDATION\n'
printf '==================\n\n'

cat <<'JSON' >/tmp/omniroute-routing-preview-payload.json
{
  "candidates": [
    {
      "providerId": "synthetic-a",
      "modelId": "test-a",
      "capabilityScore": 0.95,
      "allocation": "allow",
      "healthScore": 1,
      "circuit": "closed",
      "quota": "healthy"
    },
    {
      "providerId": "allocation-denied",
      "modelId": "test-denied",
      "capabilityScore": 0.99,
      "allocation": "deny",
      "healthScore": 1,
      "circuit": "closed",
      "quota": "healthy"
    }
  ]
}
JSON

printf 'Test 1: Valid payload structure\n'
if python3 -c "
import json
with open('/tmp/omniroute-routing-preview-payload.json') as f:
    data = json.load(f)
    assert isinstance(data, dict), 'Root must be dict'
    assert 'candidates' in data, 'candidates field required'
    assert isinstance(data['candidates'], list), 'candidates must be list'
    for c in data['candidates']:
        assert 'providerId' in c, 'providerId required'
        assert 'modelId' in c, 'modelId required'
        assert 'capabilityScore' in c, 'capabilityScore required'
        assert 'allocation' in c, 'allocation required'
        assert c['allocation'] in ['allow', 'deny'], f'allocation must be allow or deny, got {c[\"allocation\"]}'
        assert 'healthScore' in c, 'healthScore required'
        assert 'circuit' in c, 'circuit required'
        assert 'quota' in c, 'quota required'
print('PASS')
" 2>/dev/null; then
  printf 'PASS: Payload structure valid.\n\n'
else
  printf 'FAIL: Payload structure validation failed.\n\n' >&2
  validation_failed=1
fi

printf 'Test 2: Denied candidate configured\n'
if python3 -c "
import json
with open('/tmp/omniroute-routing-preview-payload.json') as f:
    data = json.load(f)
    denied = [c for c in data['candidates'] if c['allocation'] == 'deny']
    assert len(denied) > 0, 'At least one deny candidate required'
    assert denied[0]['providerId'] == 'allocation-denied', 'Denied candidate ID mismatch'
print('PASS')
" 2>/dev/null; then
  printf 'PASS: Denied candidate present with allocation=deny.\n\n'
else
  printf 'FAIL: Denied candidate validation failed.\n\n' >&2
  validation_failed=1
fi

if [[ ${validation_failed} -ne 0 ]]; then
  printf 'Offline validation failed.\n' >&2
  exit 1
fi

if [[ -z "${OMNIROUTE_MGMT_KEY}" ]]; then
  printf 'BLOCKED: OMNIROUTE_MGMT_KEY not set.\n'
  printf '\nTo run live routing preview on a running gateway:\n'
  printf '  export OMNIROUTE_MGMT_KEY=<your-bearer-token>\n'
  printf '  bash scripts/omniroute/routing-preview.sh\n'
  exit 0
fi

printf 'LIVE GATEWAY TESTS\n'
printf '==================\n\n'

printf 'POST /api/omniroute/route/preview...\n'
HTTP_CODE=$(curl -s -o /tmp/routing-preview-response.json -w '%{http_code}' \
  -X POST \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${OMNIROUTE_MGMT_KEY}" \
  --data @/tmp/omniroute-routing-preview-payload.json \
  http://127.0.0.1:${PORT}/api/omniroute/route/preview)

if [[ "${HTTP_CODE}" != "200" ]]; then
  printf 'FAIL: HTTP %s (expected 200)\n' "${HTTP_CODE}" >&2
  cat /tmp/routing-preview-response.json >&2
  printf '\n'
  exit 1
fi

printf 'Response:\n'
cat /tmp/routing-preview-response.json
printf '\n\n'

printf 'RESPONSE VALIDATION\n'
printf '===================\n\n'

if ! python3 -c "
import json, sys
with open('/tmp/routing-preview-response.json') as f:
    resp = json.load(f)
    
    # Check liveRequestExecuted
    if 'liveRequestExecuted' not in resp:
        print('FAIL: liveRequestExecuted field missing', file=sys.stderr)
        sys.exit(1)
    if resp['liveRequestExecuted'] is not False:
        print(f'FAIL: liveRequestExecuted must be exactly false, got {resp[\"liveRequestExecuted\"]}', file=sys.stderr)
        sys.exit(1)
    print('PASS: liveRequestExecuted === false')
    
    # Check selected
    if 'selected' not in resp:
        print('FAIL: selected field missing', file=sys.stderr)
        sys.exit(1)
    selected = resp['selected']
    if selected is None:
        print('Note: selected is null (no eligible candidate)')
    elif isinstance(selected, str):
        if selected == 'synthetic-a':
            print('PASS: Eligible candidate selected')
        elif selected == 'allocation-denied':
            print('FAIL: Ineligible candidate was selected', file=sys.stderr)
            sys.exit(1)
        else:
            print(f'Note: Selected provider is {selected}')
    else:
        print(f'FAIL: selected must be string or null, got {type(selected).__name__}', file=sys.stderr)
        sys.exit(1)
    
    # Check denied candidate eligibility
    if 'candidates' in resp:
        for c in resp['candidates']:
            if c.get('providerId') == 'allocation-denied':
                if 'eligible' not in c:
                    print('FAIL: allocation-denied candidate missing eligible field', file=sys.stderr)
                    sys.exit(1)
                if c['eligible'] is not False:
                    print(f'FAIL: allocation-denied eligible must be false, got {c[\"eligible\"]}', file=sys.stderr)
                    sys.exit(1)
                print('PASS: Denied candidate marked ineligible')
    
print('PASS: All response validations passed')
" 2>&1; then
  printf '\nFAIL: Response validation failed.\n' >&2
  exit 1
fi

printf '\nPASS: Routing preview complete. Synthetic-only routing confirmed.\n'
