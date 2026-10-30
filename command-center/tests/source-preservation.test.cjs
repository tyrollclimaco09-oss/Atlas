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

test('recovered original JavaScript and CSS retain their exact snapshot bytes', async (t) => {
  for (const [filename, expectedHash] of Object.entries(originalAssetHashes)) {
    await t.test(filename, () => {
      assert.equal(sha256(readFileSync(join(sourceDirectory, filename))), expectedHash);
    });
  }
});

test('recovered HTML differs from original only by named source-read and canonical bridge additions', () => {
  let html = readFileSync(join(sourceDirectory, 'index.html'), 'utf8');
  const readOnlyBlock = html.match(/        <section id="slate-sources" class="panel" aria-labelledby="slate-sources-title">[\s\S]*?        <\/section>\n/);
  assert.ok(readOnlyBlock, 'a single read-only source panel must be recognizable');
  assert.equal(html.split('id="slate-sources"').length - 1, 1, 'source panel must appear once');
  assert.equal(readOnlyBlock[0].includes('id="slate-source-refresh"'), true);
  assert.equal(readOnlyBlock[0].includes('src="'), false, 'no injected executable content in source panel');
  html = html.replace(readOnlyBlock[0], '');
  const additions = [
    '  <script src="slate-sources.js" defer></script>\n',
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
