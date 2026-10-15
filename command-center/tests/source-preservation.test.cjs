'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');

const sourceDirectory = join(__dirname, '..');
const originalSite = 'https://atlas-command-center-operator-t.tyrollclimaco09.chatgpt.site';
const originalHTMLHash = '558cb6e93dcce2e9b404aff7b5a2c0c17a48f3c7183068a6a0caea2ccaa2d3ad';

// Independently checked against the retrieved HTTPS snapshot when these tests
// were authored. Runtime verification depends only on committed repository files.
const originalAssetHashes = Object.freeze({
  'app.js': '707c5e8c2ad98bddf35e9c6af85f39294ec38cead330842895afbd5bc2b549f1',
  'slate.js': '48de637c0b2198457160bb2effef4da785cf588ac3b6adfcb3a929a4d7a26538',
  'slate-engine.js': '7561654b603b0473fe064f287256885435635644c787ac9b0137cc81d74a8097',
  'pricing.js': '504377e34fe1f3a22d2677f77d0df3f13b65da39eab3c6a044c2a4aec6f22f63',
  'styles.css': '789bc143dae6331cbc8e31f4f763b7763daa78ccefcd47e62328a39b9388d3af',
});

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function readProvenance() {
  return JSON.parse(readFileSync(join(sourceDirectory, 'SOURCE_PROVENANCE.json'), 'utf8'));
}

test('recovered assets retain exact snapshot bytes after reversing only the pinned review derivative', async (t) => {
  for (const [filename, expectedHash] of Object.entries(originalAssetHashes)) {
    await t.test(filename, () => {
      let bytes = readFileSync(join(sourceDirectory, filename));
      if (filename === 'slate-engine.js') {
        const derivatives = readProvenance().reviewDerivatives;
        // Pin the complete exception, including exact before/after bytes. Keep
        // the original snapshot hash independent of the reviewed derivative.
        assert.equal(sha256(JSON.stringify(derivatives)), '8c7e2235e10d81e0f4e76dcae39bedc01032eedf8a2daab49b42a1ab28bc5094');
        assert.equal(derivatives.length, 1);
        const derivative = derivatives[0];
        assert.equal(derivative.recoveredFile, filename);
        assert.equal(derivative.status, 'REVIEW_ONLY_NOT_DEPLOYED');
        assert.equal(derivative.baseSha256, expectedHash);
        assert.equal(sha256(bytes), derivative.reviewSha256);
        let source = bytes.toString('utf8');
        for (const change of [...derivative.changes].reverse()) {
          assert.ok(change.after.length > 0);
          assert.equal(source.split(change.after).length - 1, 1, 'each reviewed change must occur exactly once');
          source = source.replace(change.after, change.before);
        }
        bytes = Buffer.from(source);
      }
      assert.equal(sha256(bytes), expectedHash);
    });
  }
});

test('recovered HTML differs from the original only by the three bounded bridge additions', () => {
  let html = readFileSync(join(sourceDirectory, 'index.html'), 'utf8');
  const additions = [
    '  <script src="canonical-read.js" defer></script>\n',
    '  <script src="canonical-resume.js" defer></script>\n',
    '        <div id="canonical-resume" class="draft-toolbar" role="status" aria-live="polite"></div>\n',
  ];
  for (const addition of additions) {
    assert.equal(html.split(addition).length - 1, 1, 'each reviewed HTML addition must appear exactly once');
    html = html.replace(addition, '');
  }
  assert.equal(sha256(html), originalHTMLHash);
});

test('source provenance maps exactly the six recovered original assets to verified hashes', () => {
  const provenance = readProvenance();
  assert.equal(provenance.originalSite, originalSite);
  assert.equal(provenance.files.length, 6);
  const entries = new Map(provenance.files.map((entry) => [entry.recoveredFile, entry]));
  assert.equal(entries.size, 6, 'original assets must not have duplicate provenance entries');
  assert.deepEqual([...entries.keys()].sort(), ['index.html', ...Object.keys(originalAssetHashes)].sort());
  assert.equal(entries.get('index.html').servedPath, '/');
  assert.equal(entries.get('index.html').originalSha256, originalHTMLHash);
  for (const [filename, expectedHash] of Object.entries(originalAssetHashes)) {
    assert.equal(entries.get(filename).servedPath, `/${filename}`);
    assert.equal(entries.get(filename).originalSha256, expectedHash);
  }
});
