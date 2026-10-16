'use strict';
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Slate = require('../slate-engine.js');

test('Pass 0: review capacity is larger than research packet transport', () => {
  const run = Slate.newRun({date:'2026-10-16',timezone:'UTC'},Date.parse('2026-10-16T12:00:00Z'));
  assert.equal(run.limit,16);
  const prompt=Slate.prompt(run,'research');
  assert.match(prompt,/Max 8 candidates in this transport batch/);
  assert.match(prompt,/Game Sense competing scripts/);
  assert.match(prompt,/Outcome Intelligence split outcomes/);
  assert.match(prompt,/NOT capped by this batch size/);
  assert.match(prompt,/No invented simulation/);
});

test('Pass 0: pricing still requires frozen research and singles-only Final Gate', () => {
  const source=fs.readFileSync(path.join(__dirname,'..','slate-engine.js'),'utf8');
  assert.match(source,/t\.expression==='Single'/);
  assert.match(source,/data\.candidates\.length>8/);
  assert.match(source,/Research can only be reused for future events/);
});

test('Pass 0: UI expands review workspace but does not silently discard restored history', () => {
  const source=fs.readFileSync(path.join(__dirname,'..','slate.js'),'utf8');
  assert.match(source,/\[3,5,8,16,32,64\]/);
  assert.match(source,/d\.candidates\.length>64/);
  assert.doesNotMatch(source,/d\.history\.slice\(-300\)/);
  assert.match(source,/re-review required/);
});
