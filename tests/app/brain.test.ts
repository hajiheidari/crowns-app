/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { brainLevel, solvePoints, weekChange, weekScore, type SolveLog } from '../../src/features/brain/score';

const solve = (day: string, d: SolveLog['d'], s: number, h = 0, daily = false): SolveLog => ({ day, d, s, h, daily });

test('brain score: harder, faster, hint-free and daily solves score more', () => {
  assert.ok(solvePoints(solve('2026-10-11', 'expert', 900)) > solvePoints(solve('2026-10-11', 'easy', 120)));
  assert.ok(solvePoints(solve('2026-10-11', 'hard', 300)) > solvePoints(solve('2026-10-11', 'hard', 1200)));
  assert.ok(solvePoints(solve('2026-10-11', 'medium', 300, 0)) > solvePoints(solve('2026-10-11', 'medium', 300, 2)));
  assert.equal(solvePoints(solve('2026-10-11', 'easy', 120, 0, true)) - solvePoints(solve('2026-10-11', 'easy', 120)), 5);
  // Speed is capped both ways: a 1-second solve is not worth more than 1.5×.
  assert.equal(solvePoints(solve('2026-10-11', 'easy', 1)), solvePoints(solve('2026-10-11', 'easy', 80)));
});

test('brain score: rolling 7 days vs the 7 before, per-day bars and levels', () => {
  const log = [
    solve('2026-10-11', 'easy', 120), // today
    solve('2026-10-05', 'easy', 120), // 6 days ago: still this week
    solve('2026-10-04', 'easy', 120), // 7 days ago: previous week
    solve('2026-09-20', 'expert', 900), // too old
  ];
  const w = weekScore(log, '2026-10-11');
  const p = solvePoints(log[0]);
  assert.equal(w.score, 2 * p);
  assert.equal(w.previous, p);
  assert.deepEqual(w.days, [p, 0, 0, 0, 0, 0, p]);
  assert.equal(weekChange(w.score, w.previous), 100);
  assert.equal(weekChange(10, 0), null);
  assert.deepEqual([0, 20, 80, 200, 400].map(brainLevel), ['resting', 'warming', 'sharp', 'brilliant', 'genius']);
});
