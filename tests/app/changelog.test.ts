/// <reference types="node" />
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { OUT, parseChangelog, renderChangelog, ROOT } from '../../scripts/changelog';

test('changelog: generated file matches CHANGELOG.md (run `npm run changelog`)', () => {
  const md = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8');
  assert.equal(readFileSync(OUT, 'utf8'), renderChangelog(parseChangelog(md)));
});

test('changelog: newest entry matches the app version', () => {
  const app = JSON.parse(readFileSync(join(ROOT, 'app.json'), 'utf8'));
  const [newest] = parseChangelog(readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8'));
  assert.equal(newest.version, app.expo.version);
});
