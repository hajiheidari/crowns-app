/// <reference types="node" />
/** Verifies the bundled packs (sampled for speed). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIFFICULTIES, addDays, countSolutions, dailyDifficulty, solveLogically, unpackPuzzle, type PackedPuzzle } from '../../src/engine';

const dir = join(__dirname, '..', '..', 'assets', 'packs');

test('packs: daily ids, difficulty schedule, uniqueness (sampled)', { skip: !existsSync(join(dir, 'daily.json')) }, () => {
  const daily = JSON.parse(readFileSync(join(dir, 'daily.json'), 'utf8')) as { epoch: string; puzzles: PackedPuzzle[] };
  daily.puzzles.forEach((pp, i) => {
    const key = addDays(daily.epoch, i);
    assert.equal(pp.i, `daily-${key}`);
    assert.equal(unpackPuzzle(pp).difficulty, dailyDifficulty(key));
  });
  for (let i = 0; i < daily.puzzles.length; i += 37) {
    const p = unpackPuzzle(daily.puzzles[i]);
    assert.equal(countSolutions(p.n, p.regions, 2), 1);
    assert.ok(solveLogically(p.n, p.regions).solved);
  }
});

test('packs: pools have the right difficulty and no duplicates', { skip: !existsSync(join(dir, 'pool-easy.json')) }, () => {
  const all = new Set<string>();
  for (const d of DIFFICULTIES) {
    const pool = JSON.parse(readFileSync(join(dir, `pool-${d}.json`), 'utf8')) as PackedPuzzle[];
    assert.ok(pool.length > 0);
    pool.forEach((pp, i) => {
      assert.equal(unpackPuzzle(pp).difficulty, d);
      assert.ok(!all.has(pp.r), 'duplicate puzzle');
      all.add(pp.r);
      if (i % 25 === 0) assert.equal(countSolutions(pp.n, unpackPuzzle(pp).regions, 2), 1);
    });
  }
});
