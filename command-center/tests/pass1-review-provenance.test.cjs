'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { createHash } = require('node:crypto');

const root = join(__dirname, '..');
const manifest = JSON.parse(readFileSync(join(root, 'PASS0_REVIEW_PROVENANCE.json'), 'utf8'));
const original = JSON.parse(readFileSync(join(root, 'SOURCE_PROVENANCE.json'), 'utf8'));
function gitBlob(bytes) {
  return createHash('sha1').update(Buffer.concat([Buffer.from('blob ' + bytes.length + '\0'), bytes])).digest('hex');
}
test('Pass 1: review blob custody matches the exact committed bytes', async t => {
  assert.equal(manifest.status, 'REVIEW_ONLY_NOT_DEPLOYED');
  assert.equal(manifest.baselineCommit, '510e22c7a4c9259ec4e1f7b651cd21ac6cb9df9b');
  for (const [name, sha] of Object.entries(manifest.files)) {
    await t.test(name, () => assert.equal(gitBlob(readFileSync(join(root, name))), sha));
  }
});
test('Pass 1: original recovered snapshot provenance remains separate', () => {
  assert.equal(original.files.length, 6);
  assert.equal(original.reviewDerivatives.length, 1);
  assert.equal(original.reviewDerivatives[0].status, 'REVIEW_ONLY_NOT_DEPLOYED');
  assert.equal(original.originalSite, 'https://atlas-command-center-operator-t.tyrollclimaco09.chatgpt.site');
});
