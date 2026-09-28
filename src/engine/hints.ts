/**
 * Hints that TEACH (competitors' hints just reveal a cell).
 *
 * UI flow (3 taps, each deeper):
 *   1. "Look here"  → highlight hint.step.focus
 *   2. "Why?"       → show explainStep(hint.step).body
 *   3. "Apply"      → apply place/eliminate to the board
 * Mistakes are always reported first, so hints never build on a wrong board.
 */
import { findMistakes } from './board';
import { crownCount, findStep, makeCtx, newState, placeCrown, S_OUT, S_UNKNOWN, type Step } from './logic';
import { colOf, rowOf } from './grid';
import { CROSS, CROWN, type Board, type Puzzle } from './types';

export type Hint =
  | { kind: 'mistake'; cells: number[] }
  | { kind: 'step'; step: Step }
  | { kind: 'reveal'; cell: number }
  | { kind: 'solved' };

export function getHint(p: Puzzle, board: Board): Hint {
  const mistakes = findMistakes(p, board);
  if (mistakes.length) return { kind: 'mistake', cells: mistakes };

  const ctx = makeCtx(p.n, p.regions);
  const st = newState(ctx);
  board.forEach((m, i) => {
    if (m === CROWN) placeCrown(ctx, st, i);
  });
  board.forEach((m, i) => {
    if (m === CROSS && st[i] === S_UNKNOWN) st[i] = S_OUT;
  });
  if (crownCount(st) === p.n) return { kind: 'solved' };

  const step = findStep(ctx, st, 5);
  if (step) return { kind: 'step', step };

  // Safety net (should not happen for graded puzzles): reveal one crown.
  for (let r = 0; r < p.n; r++) {
    const cell = r * p.n + p.solution[r];
    if (board[cell] !== CROWN) return { kind: 'reveal', cell };
  }
  return { kind: 'solved' };
}

/** Apply a hint's effect to a board (returns a new board). */
export function applyHint(p: Puzzle, board: Board, hint: Hint): Board {
  const next = board.slice();
  if (hint.kind === 'step') {
    for (const c of hint.step.eliminate) if (next[c] !== CROWN) next[c] = CROSS;
    for (const c of hint.step.place) next[c] = CROWN;
  } else if (hint.kind === 'reveal') {
    next[hint.cell] = CROWN;
  } else if (hint.kind === 'mistake') {
    for (const c of hint.cells) next[c] = 0;
  }
  return next;
}

export const cellLabel = (cell: number, n: number): string => `R${rowOf(cell, n) + 1}C${colOf(cell, n) + 1}`;
