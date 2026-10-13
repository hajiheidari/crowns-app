/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { explainStep, regionColorName } from '../../src/engine';

test('Russian hints decline unit names (ряду 3, синей области)', () => {
  const step = { rule: 'confinement', units: [{ kind: 'region', index: 2 }, { kind: 'row', index: 2 }], focus: [] } as never;
  const e = explainStep(step, { lang: 'ru' });
  assert.equal(e.title, 'Область в одной линии');
  assert.match(e.body, /синей области лежат в ряду 3/);
  assert.equal(regionColorName(0, 'ru'), 'фиолетовая');
  const last = explainStep({ rule: 'lastCell', units: [{ kind: 'column', index: 0 }], focus: [] } as never, { lang: 'ru' });
  assert.match(last.body, /^В столбце 1 осталась/);
});
