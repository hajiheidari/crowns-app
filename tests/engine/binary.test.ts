/// <reference types="node" />
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  addDays, BINARY_LEVELS, binaryConflicts, binaryHint, dailyDifficulty, DIFFICULTIES, generateBinaryPuzzle, isBinarySolved,
  MOON, packBinary, solveBinary, SUN, unpackBinary, type PackedBinary, type Sky,
} from '../../src/engine';

test('sun & moon: logic alone solves every level, deterministic, pack round trip', () => {
  for (const difficulty of DIFFICULTIES) {
    const p = generateBinaryPuzzle({ seed: 't1', difficulty, id: 'x' });
    assert.equal(p.n, BINARY_LEVELS[difficulty].n);
    const r = solveBinary(p, BINARY_LEVELS[difficulty].deep);
    assert.ok(r.solved);
    assert.deepEqual(r.cells, p.solution);
    assert.equal(binaryConflicts(p, p.solution).size, 0);
    assert.deepEqual(generateBinaryPuzzle({ seed: 't1', difficulty, id: 'x' }), p);
    assert.deepEqual(unpackBinary(packBinary(p)), p);
  }
  // Hard levels need whole-line reasoning; easier ones do not.
  const hard = generateBinaryPuzzle({ seed: 't2', difficulty: 'hard', id: 'x' });
  assert.ok(!solveBinary(hard, false).solved);
});

test('sun & moon: conflicts, mistakes and steps', () => {
  const p = generateBinaryPuzzle({ seed: 't3', difficulty: 'medium', id: 'x' });
  const n = p.n;
  const three: Sky[] = new Array(n * n).fill(0);
  three[0] = three[1] = three[2] = SUN;
  assert.ok(binaryConflicts(p, three).has(1));
  const wrong = [...p.givens];
  const empty = wrong.findIndex((v) => !v);
  wrong[empty] = p.solution[empty] === SUN ? MOON : SUN;
  assert.deepEqual(binaryHint(p, wrong), { kind: 'mistake', cells: [empty] });
  const h = binaryHint(p, [...p.givens]);
  assert.equal(h.kind, 'step');
  if (h.kind === 'step') h.step.cells.forEach((x, i) => assert.equal(h.step.values[i], p.solution[x]));
  assert.ok(isBinarySolved(p, p.solution));
});

const dir = join(__dirname, '..', '..', 'assets', 'packs');
test('sun & moon packs: dates, schedule, logic-solvable (sampled)', { skip: !existsSync(join(dir, 'binary-daily.json')) }, () => {
  const daily = JSON.parse(readFileSync(join(dir, 'binary-daily.json'), 'utf8')) as { epoch: string; puzzles: PackedBinary[] };
  daily.puzzles.forEach((pp, i) => {
    const key = addDays(daily.epoch, i);
    assert.equal(pp.i, `binary-${key}`);
    assert.equal(unpackBinary(pp).difficulty, dailyDifficulty(key));
  });
  for (let i = 0; i < daily.puzzles.length; i += 53) {
    const p = unpackBinary(daily.puzzles[i]);
    assert.deepEqual(solveBinary(p, true).cells, p.solution);
  }
});
