/** Player-board helpers: conflicts, auto-cross, win check. */
import { attackedBy, neighbors8, rowOf, colOf } from './grid';
import { CROSS, CROWN, EMPTY, type Board, type Mark, type Puzzle } from './types';

type Shape = Pick<Puzzle, 'n' | 'regions'>;

export function emptyBoard(n: number): Board {
  return new Array<Mark>(n * n).fill(EMPTY);
}

/** Cycle used by a single tap: empty → ✕ → crown → empty. */
export function nextMark(m: Mark): Mark {
  return m === EMPTY ? CROSS : m === CROSS ? CROWN : EMPTY;
}

/** Crowns that break a rule (same row/column/region, or touching). */
export function findConflicts(p: Shape, board: Board): Set<number> {
  const { n, regions } = p;
  const crowns: number[] = [];
  board.forEach((m, i) => m === CROWN && crowns.push(i));
  const bad = new Set<number>();
  for (let a = 0; a < crowns.length; a++) {
    for (let b = a + 1; b < crowns.length; b++) {
      const x = crowns[a];
      const y = crowns[b];
      const clash =
        rowOf(x, n) === rowOf(y, n) ||
        colOf(x, n) === colOf(y, n) ||
        regions[x] === regions[y] ||
        neighbors8(x, n).includes(y);
      if (clash) {
        bad.add(x);
        bad.add(y);
      }
    }
  }
  return bad;
}

/**
 * Cells that are implicitly "out" because of a crown already placed.
 * The UI draws these as faint ✕ when the "Auto-✕" setting is on; they are
 * never written into the board, so undo/redo stays clean.
 */
export function autoCrossCells(p: Shape, board: Board): Set<number> {
  const out = new Set<number>();
  board.forEach((m, i) => {
    if (m !== CROWN) return;
    for (const a of attackedBy(i, p.n, p.regions)) if (board[a] === EMPTY) out.add(a);
  });
  return out;
}

export function isSolved(p: Shape, board: Board): boolean {
  let k = 0;
  for (const m of board) if (m === CROWN) k++;
  return k === p.n && findConflicts(p, board).size === 0;
}

/** Wrong marks vs. the known solution: misplaced crowns and ✕ on a crown cell. */
export function findMistakes(p: Puzzle, board: Board): number[] {
  const out: number[] = [];
  board.forEach((m, i) => {
    const isSolutionCell = p.solution[rowOf(i, p.n)] === colOf(i, p.n);
    if (m === CROWN && !isSolutionCell) out.push(i);
    if (m === CROSS && isSolutionCell) out.push(i);
  });
  return out;
}
