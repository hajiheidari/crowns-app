/// <reference types="node" />
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import {
  addDays, canExtend, countPathSolutions, dailyDifficulty, DIFFICULTIES, generatePathPuzzle, isPathSolved, packPath,
  pathHint, PATH_LEVELS, unpackPath, type PackedPath,
} from '../../src/engine';

test('path puzzles: unique, solution valid, deterministic, pack round trip', () => {
  for (const difficulty of DIFFICULTIES) {
    const p = generatePathPuzzle({ seed: 't1', difficulty, id: 'x' });
    assert.equal(p.n, PATH_LEVELS[difficulty].n);
    assert.equal(p.solution.length, p.n * p.n);
    assert.ok(isPathSolved(p, p.solution));
    assert.equal(countPathSolutions(p.n, p.clues, p.walls), 1);
    assert.deepEqual(generatePathPuzzle({ seed: 't1', difficulty, id: 'x' }), p);
    assert.deepEqual(unpackPath(packPath(p)), p);
  }
});

test('path rules: walls block, a line must not revisit, hints keep the right part', () => {
  const p = generatePathPuzzle({ seed: 't2', difficulty: 'medium', id: 'x' });
  const [a, b] = p.walls[0];
  assert.ok(!canExtend(p, [a], b));
  assert.ok(!canExtend(p, [p.solution[0], p.solution[1]], p.solution[0]));
  assert.ok(canExtend(p, [p.solution[0]], p.solution[1]));
  assert.ok(!isPathSolved(p, p.solution.slice(0, -1)));
  const h = pathHint(p, p.solution.slice(0, 4));
  assert.equal(h.keep, 4);
  assert.deepEqual(h.next, p.solution.slice(4, 7));
  const wrong = [p.solution[0], ...p.solution.slice(1, 3).reverse()];
  assert.equal(pathHint(p, wrong).keep, 1);
});

const dir = join(__dirname, '..', '..', 'assets', 'packs');
test('path packs: dates, difficulty schedule, uniqueness (sampled)', { skip: !existsSync(join(dir, 'path-daily.json')) }, () => {
  const daily = JSON.parse(readFileSync(join(dir, 'path-daily.json'), 'utf8')) as { epoch: string; puzzles: PackedPath[] };
  daily.puzzles.forEach((pp, i) => {
    const key = addDays(daily.epoch, i);
    assert.equal(pp.i, `path-${key}`);
    assert.equal(unpackPath(pp).difficulty, dailyDifficulty(key));
  });
  for (let i = 0; i < daily.puzzles.length; i += 61) {
    const p = unpackPath(daily.puzzles[i]);
    assert.ok(isPathSolved(p, p.solution));
    assert.equal(countPathSolutions(p.n, p.clues, p.walls, 2, 2_000_000), 1);
  }
});
