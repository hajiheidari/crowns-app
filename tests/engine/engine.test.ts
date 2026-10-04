/// <reference types="node" />
/**
 * Engine tests — run with:  npm run test:engine
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CROSS, CROWN, DIFFICULTIES, addDays, applyHint, buildShareText, countSolutions, dailyNumber,
  decodeChallenge, emptyBoard, encodeChallenge, explainStep, findConflicts, generateDaily,
  generatePuzzle, getHint, isSolved, neighbors4, neighbors8, packPuzzle, rngFromSeed,
  solveLogically, unpackPuzzle, DAILY_EPOCH, type Board, type Puzzle,
} from '../../src/engine';

function assertValidPuzzle(p: Puzzle) {
  const { n, regions, solution } = p;
  assert.equal(regions.length, n * n);
  // n regions, each non-empty and 4-connected
  for (let g = 0; g < n; g++) {
    const cells = regions.map((x, i) => (x === g ? i : -1)).filter((i) => i >= 0);
    assert.ok(cells.length > 0, `region ${g} empty`);
    const seen = new Set([cells[0]]);
    const stack = [cells[0]];
    while (stack.length) {
      const c = stack.pop()!;
      for (const nb of neighbors4(c, n)) if (regions[nb] === g && !seen.has(nb)) { seen.add(nb); stack.push(nb); }
    }
    assert.equal(seen.size, cells.length, `region ${g} not contiguous`);
  }
  // solution obeys all rules
  assert.equal(new Set(solution).size, n, 'columns unique');
  const crownCells = solution.map((c, r) => r * n + c);
  assert.equal(new Set(crownCells.map((i) => regions[i])).size, n, 'regions unique');
  for (const a of crownCells) for (const b of neighbors8(a, n)) assert.ok(!crownCells.includes(b), 'crowns touch');
  // unique + logic-solvable
  assert.equal(countSolutions(n, regions, 2), 1, 'solution not unique');
  const res = solveLogically(n, regions);
  assert.ok(res.solved, 'not solvable by logic');
}

test('rng is deterministic', () => {
  const a = rngFromSeed('x');
  const b = rngFromSeed('x');
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
});

test('generator: every difficulty produces valid, unique, logic-only puzzles', () => {
  for (const d of DIFFICULTIES) {
    for (let k = 0; k < 4; k++) {
      const p = generatePuzzle({ seed: `t-${d}-${k}`, difficulty: d, maxAttempts: 3000 });
      assertValidPuzzle(p);
      assert.equal(p.difficulty, d, `wanted ${d}, got ${p.difficulty} (seed t-${d}-${k})`);
    }
  }
});

test('generator is deterministic per seed', () => {
  const a = generatePuzzle({ seed: 'same', difficulty: 'medium' });
  const b = generatePuzzle({ seed: 'same', difficulty: 'medium' });
  assert.deepEqual(a, b);
});

test('hints alone can solve every puzzle, and every hint has an explanation', () => {
  for (const d of DIFFICULTIES) {
    const p = generatePuzzle({ seed: `hint-${d}`, difficulty: d, maxAttempts: 3000 });
    let board: Board = emptyBoard(p.n);
    let guard = 0;
    while (!isSolved(p, board)) {
      assert.ok(guard++ < p.n * p.n * 2, 'hint loop did not finish');
      const h = getHint(p, board);
      assert.notEqual(h.kind, 'mistake');
      assert.notEqual(h.kind, 'reveal', 'hint had to reveal (logic gap)');
      if (h.kind === 'step') {
        for (const lang of ['en', 'fa', 'ar'] as const) {
          const e = explainStep(h.step, { lang });
          assert.ok(e.title.length > 0 && e.body.length > 20);
          assert.ok(!/undefined|NaN|#\d/.test(e.body), e.body);
          if (lang !== 'en') assert.ok(!/[a-z]{3}/.test(e.body), `${lang} hint has English: ${e.body}`);
        }
        assert.ok(h.step.focus.length > 0);
      }
      board = applyHint(p, board, h);
    }
    assert.deepEqual(findConflicts(p, board).size, 0);
  }
});

test('hints report mistakes first', () => {
  const p = generatePuzzle({ seed: 'mistake', difficulty: 'easy' });
  const board = emptyBoard(p.n);
  const wrong = 0 * p.n + ((p.solution[0] + 2) % p.n); // row 0, wrong column
  board[wrong] = CROWN;
  const right = 1 * p.n + p.solution[1];
  board[right] = CROSS; // cross on a real crown cell
  const h = getHint(p, board);
  assert.equal(h.kind, 'mistake');
  if (h.kind === 'mistake') assert.deepEqual(new Set(h.cells), new Set([wrong, right]));
});

test('conflicts detect touching crowns', () => {
  const p = generatePuzzle({ seed: 'conf', difficulty: 'easy' });
  const b = emptyBoard(p.n);
  b[0] = CROWN;
  b[p.n + 1] = CROWN; // diagonal touch
  const c = findConflicts(p, b);
  assert.ok(c.has(0) && c.has(p.n + 1));
});

test('daily: deterministic and numbered from epoch', () => {
  assert.equal(dailyNumber(DAILY_EPOCH), 1);
  assert.equal(dailyNumber(addDays(DAILY_EPOCH, 99)), 100);
  const a = generateDaily('2026-10-05');
  const b = generateDaily('2026-10-05');
  assert.deepEqual(a, b);
  assertValidPuzzle(a);
});

test('share text + challenge codes', () => {
  const t = buildShareText({ appName: 'Crowns', dailyNumber: 12, difficultyLabel: 'Hard', seconds: 102, hintsUsed: 0, streak: 5, link: 'https://x.y/c/abc' });
  assert.match(t, /#12/);
  assert.match(t, /1:42/);
  assert.match(t, /5-day streak/);
  const code = encodeChallenge({ puzzleId: 'hard-0042', seconds: 102, ref: 'amir01' });
  assert.deepEqual(decodeChallenge(code), { puzzleId: 'hard-0042', seconds: 102, ref: 'amir01' });
  assert.equal(decodeChallenge('bad code!'), null);
});

test('pack round-trip', () => {
  const p = generatePuzzle({ seed: 'pack', difficulty: 'expert', maxAttempts: 3000 });
  assert.deepEqual(unpackPuzzle(packPuzzle(p)), p);
});
