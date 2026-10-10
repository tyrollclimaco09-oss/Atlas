#!/usr/bin/env python3
"""Initialize local secrets/config, then optionally lock down a running gateway."""
import argparse
import http.cookiejar
import json
import os
from pathlib import Path
import re
import secrets
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
LOCAL = ROOT / '.omniroute'
BASE = 'http://127.0.0.1:20128'
MODEL = 'atlas-unconfigured-probe'
os.umask(0o077)
LOCAL.mkdir(exist_ok=True)
LOCAL.chmod(0o700)
(LOCAL / 'logs').mkdir(exist_ok=True)
env_path = LOCAL / '.env'
if not env_path.exists():
    values = {
        'PORT': '20128', 'HOSTNAME': '127.0.0.1', 'APP_BIND_HOST': '127.0.0.1',
        'DATA_DIR': str(LOCAL / 'data'), 'BASE_URL': BASE, 'NEXT_PUBLIC_BASE_URL': BASE,
        'JWT_SECRET': secrets.token_hex(48), 'API_KEY_SECRET': secrets.token_hex(32),
        'INITIAL_PASSWORD': secrets.token_hex(24), 'REQUIRE_API_KEY': 'true',
        'AUTH_COOKIE_SECURE': 'false', 'NODE_ENV': 'production',
        'OMNIROUTE_DISABLE_BACKGROUND_SERVICES': 'true',
        'OMNIROUTE_DISABLE_CREDENTIAL_HEALTH_CHECK': 'true',
        'OMNIROUTE_DISABLE_CONNECTION_RECOVERY': 'true',
        'OMNIROUTE_EMERGENCY_FALLBACK': 'false', 'NEXT_TELEMETRY_DISABLED': '1',
    }
    env_path.write_text(''.join(f'{k}={v}\n' for k, v in values.items()))
env_path.chmod(0o600)
agent = LOCAL / 'pi'
agent.mkdir(exist_ok=True)
config = {'providers': {'atlas-omniroute': {
    'baseUrl': BASE + '/v1', 'api': 'openai-completions',
    'apiKey': 'ATLAS_OMNIROUTE_API_KEY', 'authHeader': True,
    'compat': {'supportsDeveloperRole': False, 'supportsReasoningEffort': False},
    'models': [{'id': MODEL, 'name': 'Blocked integration probe (no provider)',
                'reasoning': False, 'input': ['text'], 'contextWindow': 8192, 'maxTokens': 64}],
}}}
for name, data in [('models.json', config), ('settings.json', {
    'defaultProvider': 'atlas-omniroute', 'defaultModel': MODEL,
    'retry': {'enabled': False}, 'packages': [],
})]:
    path = agent / name
    if path.exists():
        assert json.loads(path.read_text()) == data, f'{path}: preserve and review differing config'
    else:
        path.write_text(json.dumps(data, indent=2) + '\n')

parser = argparse.ArgumentParser()
checks = parser.add_mutually_exclusive_group()
checks.add_argument('--lockdown', action='store_true')
checks.add_argument('--verify', action='store_true')
checks.add_argument('--preview', action='store_true')
args = parser.parse_args()
if not (args.lockdown or args.verify or args.preview):
    print('Local secrets and Pi endpoint configuration initialized; values withheld.')
    raise SystemExit(0)

env = dict(line.split('=', 1) for line in env_path.read_text().splitlines())
jar = http.cookiejar.CookieJar()
client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

def call(path, data=None, method=None, headers=None):
    request = urllib.request.Request(BASE + path,
        data=json.dumps(data).encode() if data is not None else None,
        headers={'Content-Type': 'application/json', **(headers or {})}, method=method)
    try:
        with client.open(request, timeout=30) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as error:
        return error.code, error.read()

status, _ = call('/api/omniroute/status')
assert status in (401, 403), f'Anonymous management access must be rejected: {status}'
status, _ = call('/api/auth/login', {'password': env['INITIAL_PASSWORD']})
assert status == 200, f'Management login failed: {status}'
status, body = call('/api/omniroute/status')
assert status == 200, f'Authenticated status failed: {status}'
state = json.loads(body)
assert state['providers']['configured'] == 0, 'Existing providers require separate cost review'
blocked = set()
provider_dir = ROOT / '.omniroute-runtime/node_modules/omniroute/src/shared/constants/providers'
for path in provider_dir.rglob('*.ts'):
    blocked.update(re.findall(r'\b(?:id|alias):\s*[\"\']([^\"\']+)', path.read_text()))
assert len(blocked) >= 190, 'Provider definitions missing; do not proceed'
settings = {
    'hidePaidModels': True, 'freeAccessPolicy': 'strict',
    'hideAutoCombos': True, 'requestRetry': 0, 'connectionAwareExpansion': False,
    'blockedProviders': sorted(blocked), 'noAuthFallbackDisabledProviders': sorted(blocked),
    'modelVisibilityAllowlist': [MODEL],
}
if args.lockdown:
    status, _ = call('/api/settings', settings, 'PATCH')
    assert status == 200, f'Lockdown failed: {status}'
status, body = call('/api/settings')
assert status == 200
saved = json.loads(body)
for key, value in settings.items():
    assert saved.get(key) == value, f'Lockdown setting was not retained: {key}'
key_path = LOCAL / 'inference-key'
if not key_path.exists():
    assert args.lockdown, 'Missing inference key; run --lockdown first'
    status, body = call('/api/keys', {
        'name': 'ATLAS local coding probe', 'scopes': ['chat'],
        'modelAccessMode': 'restricted', 'allowedModels': [MODEL],
        'allowedCombos': [], 'allowAutoCombos': False,
    })
    assert status == 201, f'Key creation failed: {status}'
    key_path.write_text(json.loads(body)['key'])
key_path.chmod(0o600)
status, body = call('/api/keys')
assert status == 200
matches = [k for k in json.loads(body)['keys'] if k['name'] == 'ATLAS local coding probe']
assert len(matches) == 1, 'Ambiguous probe keys; preserve and review existing local state'
key_id = matches[0]['id']
permissions = {'modelAccessMode': 'restricted', 'allowedModels': [MODEL],
               'allowedCombos': [], 'allowAutoCombos': False}
if args.lockdown:
    status, _ = call('/api/keys/' + key_id, permissions, 'PATCH')
    assert status == 200, f'Key restriction update failed: {status}'
status, body = call('/api/keys')
assert status == 200
metadata = next(k for k in json.loads(body)['keys'] if k['id'] == key_id)
for key, value in permissions.items():
    assert metadata.get(key) == value, f'Key restriction not retained: {key}'
# Verify that the inference credential cannot administer the gateway.
anonymous = urllib.request.build_opener()
req = urllib.request.Request(BASE + '/api/omniroute/status',
    headers={'Authorization': 'Bearer ' + key_path.read_text()})
try:
    with anonymous.open(req, timeout=30) as response:
        denied_status = response.status
except urllib.error.HTTPError as error:
    denied_status = error.code
assert denied_status in (401, 403), 'Inference key must not authorize management'
print(f'Management auth verified; {len(blocked)} provider IDs/aliases blocked; no provider connections.')
status, body = call('/healthz')
assert status == 200 and body.strip() == b'ok', 'Gateway health must return 200/ok'
if args.verify:
    print('PASS: private gateway health, management authentication, and inference restrictions.')
    raise SystemExit(0)
payload = {'candidates': [
    {'providerId': 'synthetic-a', 'modelId': 'test-a', 'capabilityScore': .95,
     'allocation': 'allow', 'healthScore': 1, 'circuit': 'closed', 'quota': 'healthy'},
    {'providerId': 'allocation-denied', 'modelId': 'test-denied', 'capabilityScore': .99,
     'allocation': 'deny', 'healthScore': 1, 'circuit': 'closed', 'quota': 'healthy'},
]}
status, body = call('/api/omniroute/route/preview', payload)
evidence = {'status': status, 'upstreamInferenceApproved': False}
if status == 200:
    preview = json.loads(body)
    assert preview['liveRequestExecuted'] is False
    assert preview['selected'] == 'synthetic-a'
    assert next(c for c in preview['candidates'] if c['providerId'] == 'allocation-denied')['eligible'] is False
    evidence['preview'] = preview
(LOCAL / 'validation.json').write_text(json.dumps(evidence, indent=2) + '\n')
print(f'Synthetic HTTP preview: {status}; inference remains blocked.')
if status != 200:
    raise SystemExit(1)
