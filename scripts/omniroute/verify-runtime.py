#!/usr/bin/env python3
"""Verify pinned archives and installed JS/TS/JSON files, not native dependencies."""
import base64
import hashlib
from pathlib import Path
import tarfile

ROOT = Path(__file__).resolve().parents[2]
RUNTIME = ROOT / '.omniroute-runtime'
RELEASES = [
    (RUNTIME / 'artifacts/omniroute-3.8.51.tgz',
     RUNTIME / 'node_modules/omniroute',
     'VwwSt+bP9lJiPJXFJMz0nNGGuoewPZU3nFe1SLuO11ADgdSwTegGCxhg8Ov75+31m/cocPxHiO63zygn1XQ0MQ=='),
    (RUNTIME / 'artifacts/mariozechner-pi-coding-agent-0.73.1.tgz',
     RUNTIME / 'agent/node_modules/@mariozechner/pi-coding-agent',
     'gXQh3SaZmWTfVMc4Ao5+LGbVeKvzyO7tolok0nLsZgq9nGjZx/EEU3NM8C+qUnB4Nvs2rswG5qOVgLzQkq0fHQ=='),
]
for artifact, installed, expected in RELEASES:
    digest = hashlib.sha512()
    with artifact.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    if base64.b64encode(digest.digest()).decode() != expected:
        raise SystemExit(f'FAIL: pinned archive integrity mismatch: {artifact.name}')
    checked = 0
    with tarfile.open(artifact) as archive:
        for member in archive:
            if not member.isfile() or Path(member.name).suffix not in ('.js', '.cjs', '.mjs', '.ts', '.json'):
                continue
            relative = Path(member.name).relative_to('package')
            if '..' in relative.parts:
                raise SystemExit('FAIL: unsafe archive path')
            target = installed / relative
            source = archive.extractfile(member)
            if not target.is_file() or target.read_bytes() != source.read():
                raise SystemExit(f'FAIL: installed package code differs: {installed.name}/{relative}')
            checked += 1
    if checked == 0:
        raise SystemExit('FAIL: archive contains no verified code')
    print(f'PASS: {artifact.name} SHA-512 and {checked} packaged JS/TS/JSON files match.')
