/**
 * The first-launch tutorial: short looping animations on a real 5×5 puzzle,
 * one rule or control per slide (like a tiny video, no reading required).
 */
import { applyHint, CROSS, CROWN, EMPTY, getHint, unpackPuzzle, type Mark, type Puzzle } from '@/engine';

export interface Frame {
  board: Mark[];
  highlight?: number[];
  danger?: number[];
  finger?: number;
  autoCross?: boolean;
}

export interface Slide {
  title: string;
  body: string;
  frames: Frame[];
}

export const TUTORIAL_PUZZLE: Puzzle = unpackPuzzle({ i: 'tutorial', n: 5, d: 'e', r: '1002412224122243324433444', s: '20314' });

const { n, regions, solution } = TUTORIAL_PUZZLE;
const empty = (): Mark[] => new Array<Mark>(n * n).fill(EMPTY);
const at = (r: number, c: number) => r * n + c;
const range = (k: number) => Array.from({ length: k }, (_, i) => i);
const crownCells = solution.map((c, r) => at(r, c));
const withCrowns = (cells: number[], base: Mark[] = empty()): Mark[] => {
  const b = base.slice();
  cells.forEach((c) => (b[c] = CROWN));
  return b;
};
const full = withCrowns(crownCells);
const hold = (f: Frame, times: number): Frame[] => range(times).map(() => f);

const rowSlide: Slide = {
  title: 'One crown in every row',
  body: 'Each row gets exactly one crown.',
  frames: [
    { board: empty() },
    ...range(n).map((r) => ({ board: withCrowns(crownCells.slice(0, r + 1)), highlight: range(n).map((c) => at(r, c)) })),
    ...hold({ board: full }, 2),
  ],
};

const columnSlide: Slide = {
  title: 'One in every column',
  body: 'Each column gets exactly one crown too.',
  frames: [
    ...range(n).map((c) => ({ board: full, highlight: range(n).map((r) => at(r, c)) })),
    { board: full },
  ],
};

const regionSlide: Slide = {
  title: 'One in every color',
  body: 'And each colored region gets exactly one crown.',
  frames: [
    ...range(n).map((g) => {
      const cells = regions.map((x, i) => (x === g ? i : -1)).filter((i) => i >= 0);
      return { board: withCrowns(crownCells.filter((c) => regions[c] <= g)), highlight: cells };
    }),
    { board: full },
  ],
};

const center = at(2, 2);
const around = [at(1, 1), at(1, 2), at(1, 3), at(2, 1), at(2, 3), at(3, 1), at(3, 2), at(3, 3)];
const touchSlide: Slide = {
  title: 'Crowns never touch',
  body: 'Not even corner to corner. A crown also rules out its row, column and color, shown with small ✕.',
  frames: [
    { board: withCrowns([center]) },
    { board: withCrowns([center]), danger: around },
    { board: withCrowns([center, at(3, 3)]), danger: [at(3, 3)] },
    { board: withCrowns([center]) },
    { board: withCrowns([center]), autoCross: true },
    { board: withCrowns([center]), autoCross: true },
  ],
};

const tapCell = at(1, 3);
const dragRow = 4;
const dragFrames: Frame[] = range(4).map((k) => {
  const b = empty();
  for (let c = 0; c <= k; c++) b[at(dragRow, c)] = CROSS;
  return { board: b, finger: at(dragRow, k) };
});
const controlSlide: Slide = {
  title: 'Tap to mark',
  body: 'Tap once for ✕ (no crown here), twice for a crown, again to clear. Hold for a crown. Drag to ✕ many cells.',
  frames: [
    { board: empty(), finger: tapCell },
    { board: withCrowns([], markAt(tapCell, CROSS)), finger: tapCell },
    { board: withCrowns([tapCell]), finger: tapCell },
    { board: empty(), finger: tapCell },
    { board: empty() },
    ...dragFrames,
    { board: dragFrames[dragFrames.length - 1].board },
  ],
};

function markAt(cell: number, m: Mark): Mark[] {
  const b = empty();
  b[cell] = m;
  return b;
}

// A real hint from the engine, on a board with two crowns placed.
const hintStart = withCrowns([crownCells[0], crownCells[1]]);
const hint = getHint(TUTORIAL_PUZZLE, hintStart);
const hintFocus = hint.kind === 'step' ? hint.step.focus : [];
const hintSlide: Slide = {
  title: 'Stuck? Ask for a hint',
  body: 'A hint shows where to look, explains why, and can make the move for you.',
  frames: [
    { board: hintStart },
    { board: hintStart, highlight: hintFocus },
    { board: hintStart, highlight: hintFocus },
    { board: applyHint(TUTORIAL_PUZZLE, hintStart, hint) },
    { board: applyHint(TUTORIAL_PUZZLE, hintStart, hint) },
  ],
};

export const SLIDES: Slide[] = [rowSlide, columnSlide, regionSlide, touchSlide, controlSlide, hintSlide];

