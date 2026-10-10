import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addDays, dailyDifficulty } from '../../src/engine';
import { dailyId, dailyIdFor, getPuzzle, puzzleInfo, starterCap } from '../../src/features/puzzles/catalog';

const RANK = { easy: 0, medium: 1, hard: 2, expert: 3 } as const;

test('first week ramps easy → medium → hard, then the weekly schedule', () => {
  const install = '2026-10-10'; // a Saturday (expert)
  const caps = [0, 1, 2, 3, 4, 5, 6, 7].map((d) => starterCap(addDays(install, d), install));
  assert.deepEqual(caps, ['easy', 'easy', 'medium', 'medium', 'hard', 'hard', 'hard', null]);
  assert.equal(starterCap(addDays(install, -1), install), null); // archive days before install
  assert.equal(starterCap(install, null), null);
  assert.equal(dailyIdFor(addDays(install, 7), install), dailyId(addDays(install, 7)));
});

test('starter dailies are capped, deterministic and numbered like the real day', () => {
  const install = '2026-10-10';
  for (let d = 0; d < 7; d++) {
    const key = addDays(install, d);
    const id = dailyIdFor(key, install);
    const p = getPuzzle(id)!;
    const cap = starterCap(key, install)!;
    assert.ok(RANK[p.difficulty] <= RANK[cap], `${id}: ${p.difficulty} > ${cap}`);
    assert.equal(p.id, id);
    const info = puzzleInfo(id)!;
    assert.equal(info.mode, 'daily');
    assert.equal(info.mode === 'daily' && info.key, key);
    assert.equal(info.difficulty, p.difficulty);
    // Regular id only when the schedule is already easy enough.
    assert.equal(id === dailyId(key), RANK[dailyDifficulty(key)] <= RANK[cap]);
  }
  assert.equal(getPuzzle('daily-2026-10-10-easy')!.difficulty, 'easy');
  assert.equal(puzzleInfo('daily-2026-10-10-expert'), null);
});
