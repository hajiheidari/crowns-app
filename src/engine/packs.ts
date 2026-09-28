/**
 * Compact puzzle storage for the bundled packs (packs/*.json).
 * Puzzles are generated and verified OFFLINE by scripts/build-packs.ts, so the
 * app never generates hard puzzles on-device and daily puzzles never change
 * between app versions.
 */
import type { Difficulty, Puzzle } from './types';

export interface PackedPuzzle {
  /** id */
  i: string;
  /** size */
  n: number;
  /** difficulty letter: e | m | h | x */
  d: 'e' | 'm' | 'h' | 'x';
  /** regions, one base-36 char per cell */
  r: string;
  /** solution columns, one base-36 char per row */
  s: string;
}

const D2L: Record<Difficulty, PackedPuzzle['d']> = { easy: 'e', medium: 'm', hard: 'h', expert: 'x' };
const L2D: Record<PackedPuzzle['d'], Difficulty> = { e: 'easy', m: 'medium', h: 'hard', x: 'expert' };

export function packPuzzle(p: Puzzle): PackedPuzzle {
  return {
    i: p.id,
    n: p.n,
    d: D2L[p.difficulty],
    r: p.regions.map((g) => g.toString(36)).join(''),
    s: p.solution.map((c) => c.toString(36)).join(''),
  };
}

export function unpackPuzzle(x: PackedPuzzle): Puzzle {
  return {
    id: x.i,
    n: x.n,
    difficulty: L2D[x.d],
    regions: [...x.r].map((ch) => parseInt(ch, 36)),
    solution: [...x.s].map((ch) => parseInt(ch, 36)),
  };
}
