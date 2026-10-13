/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { brainLevel, periodScores, periodStart, pointsFromLog, solvePoints, weekChange, weekScore, type SolveLog } from '../../src/features/brain/score';

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

test('league week: starts on Saturday and counts only this week', async () => {
  const { weekStart, leaguePoints } = await import('../../src/features/brain/score');
  assert.equal(weekStart('2026-10-10'), '2026-10-10'); // Saturday
  assert.equal(weekStart('2026-10-11'), '2026-10-10'); // Sunday
  assert.equal(weekStart('2026-10-16'), '2026-10-10'); // Friday
  assert.equal(weekStart('2026-10-17'), '2026-10-17'); // next Saturday
  // English and Arabic weeks start on Monday.
  assert.equal(weekStart('2026-10-11', 'mon'), '2026-10-05'); // Sunday → the Monday before
  assert.equal(weekStart('2026-10-12', 'mon'), '2026-10-12'); // Monday
  assert.equal(weekStart('2026-10-17', 'mon'), '2026-10-12'); // Saturday
  const log = [solve('2026-10-09', 'easy', 120), solve('2026-10-10', 'easy', 120), solve('2026-10-12', 'hard', 600)];
  assert.equal(leaguePoints(log, '2026-10-12'), solvePoints(log[1]) + solvePoints(log[2]));
});

test('month/year totals follow the Gregorian or Jalali calendar and never forget old days', () => {
  const log: SolveLog[] = [
    { day: '2025-12-30', d: 'easy', s: 120, h: 1, daily: false },
    { day: '2026-03-25', d: 'easy', s: 120, h: 1, daily: false },
    { day: '2026-10-01', d: 'easy', s: 120, h: 1, daily: false },
    { day: '2026-10-23', d: 'easy', s: 120, h: 1, daily: false },
  ];
  const pts = pointsFromLog(log);
  const one = solvePoints(log[0]);
  assert.equal(periodStart('2026-10-23', 'month'), '2026-10-01');
  assert.equal(periodStart('2026-10-23', 'year'), '2026-01-01');
  // 1 Aban 1405 = 2026-10-23; 1 Farvardin 1405 = 2026-03-21.
  assert.equal(periodStart('2026-10-23', 'month', 'jalali'), '2026-10-23');
  assert.equal(periodStart('2026-10-23', 'year', 'jalali'), '2026-03-21');
  assert.deepEqual(periodScores(pts, '2026-10-23'), { week: one, month: 2 * one, year: 3 * one, all: 4 * one });
  assert.deepEqual(periodScores(pts, '2026-10-23', 'jalali'), { week: one, month: one, year: 3 * one, all: 4 * one });
});
