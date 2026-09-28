/**
 * Puzzle generator.
 *
 * Pipeline:
 *   1. Random valid crown layout (one per row/column, never touching).
 *   2. Grow n contiguous regions outward from the crowns.
 *   3. Repair until the solution is UNIQUE: find an alternative solution and
 *      move one of its crown cells into a neighbouring region, which breaks
 *      that alternative without touching the real solution.
 *   4. Grade with the human logic solver; reject anything that needs guessing.
 *
 * Fully deterministic for a given seed (no Date / Math.random / time limits).
 */
import { neighbors4 } from './grid';
import { solveLogically } from './logic';
import { randInt, rngFromSeed, shuffle, type Rng } from './rng';
import { DIFFICULTIES, type Difficulty, type Puzzle } from './types';

// ------------------------------------------------------------ solutions
function randomLayout(n: number, rng: Rng): number[] | null {
  const cols: number[] = [];
  const used = new Array<boolean>(n).fill(false);
  let budget = 20000;
  const rec = (r: number): boolean => {
    if (r === n) return true;
    if (--budget < 0) return false;
    const order = shuffle(rng, Array.from({ length: n }, (_, i) => i));
    for (const c of order) {
      if (used[c]) continue;
      if (r > 0 && Math.abs(cols[r - 1] - c) <= 1) continue;
      used[c] = true;
      cols[r] = c;
      if (rec(r + 1)) return true;
      used[c] = false;
    }
    return false;
  };
  return rec(0) ? cols.slice() : null;
}

/**
 * Enumerate solutions (up to `limit`). Returns solution arrays
 * (solution[row] = column).
 */
export function findSolutions(n: number, regions: number[], limit = 2): number[][] {
  const out: number[][] = [];
  const cols: number[] = new Array(n).fill(-1);
  let colMask = 0;
  let regMask = 0;
  const rec = (r: number): boolean => {
    if (r === n) {
      out.push(cols.slice());
      return out.length >= limit;
    }
    for (let c = 0; c < n; c++) {
      if (colMask & (1 << c)) continue;
      const g = regions[r * n + c];
      if (regMask & (1 << g)) continue;
      if (r > 0 && Math.abs(cols[r - 1] - c) <= 1) continue;
      cols[r] = c;
      colMask |= 1 << c;
      regMask |= 1 << g;
      const stop = rec(r + 1);
      colMask &= ~(1 << c);
      regMask &= ~(1 << g);
      if (stop) return true;
    }
    return false;
  };
  rec(0);
  return out;
}

export function countSolutions(n: number, regions: number[], limit = 2): number {
  return findSolutions(n, regions, limit).length;
}

// -------------------------------------------------------------- regions
function growRegions(n: number, sol: number[], rng: Rng): number[] {
  const N = n * n;
  const regions = new Array<number>(N).fill(-1);
  // Random per-region growth weights → varied, organic region sizes.
  const weight = Array.from({ length: n }, () => 0.35 + rng() * 1.3);
  const frontier: Array<[number, number]> = []; // [cell, region]
  for (let r = 0; r < n; r++) {
    const cell = r * n + sol[r];
    regions[cell] = r;
    for (const nb of neighbors4(cell, n)) frontier.push([nb, r]);
  }
  let assigned = n;
  while (assigned < N && frontier.length) {
    // Weighted pick from frontier.
    let total = 0;
    for (const [, g] of frontier) total += weight[g];
    let x = rng() * total;
    let idx = 0;
    for (; idx < frontier.length - 1; idx++) {
      x -= weight[frontier[idx][1]];
      if (x <= 0) break;
    }
    const [cell, g] = frontier[idx];
    frontier[idx] = frontier[frontier.length - 1];
    frontier.pop();
    if (regions[cell] !== -1) continue;
    regions[cell] = g;
    assigned++;
    for (const nb of neighbors4(cell, n)) if (regions[nb] === -1) frontier.push([nb, g]);
  }
  return regions;
}

function connectedWithout(n: number, regions: number[], g: number, removed: number): boolean {
  const cells: number[] = [];
  for (let i = 0; i < n * n; i++) if (regions[i] === g && i !== removed) cells.push(i);
  if (cells.length === 0) return false;
  const seen = new Set<number>([cells[0]]);
  const stack = [cells[0]];
  while (stack.length) {
    const c = stack.pop()!;
    for (const nb of neighbors4(c, n)) {
      if (nb !== removed && regions[nb] === g && !seen.has(nb)) {
        seen.add(nb);
        stack.push(nb);
      }
    }
  }
  return seen.size === cells.length;
}

/** Mutates `regions` until `sol` is the only solution. */
function makeUnique(n: number, regions: number[], sol: number[], rng: Rng, maxIter = 300): boolean {
  for (let it = 0; it < maxIter; it++) {
    const sols = findSolutions(n, regions, 2);
    const alt = sols.find((s) => s.some((c, r) => c !== sol[r]));
    if (!alt) return true;
    const rows = shuffle(rng, alt.map((_, r) => r).filter((r) => alt[r] !== sol[r]));
    let moved = false;
    for (const r of rows) {
      // x is a crown of the alternative solution, never of the real one.
      const x = r * n + alt[r];
      const g = regions[x];
      const targets = shuffle(rng, [...new Set(neighbors4(x, n).map((nb) => regions[nb]))].filter((t) => t !== g));
      if (targets.length === 0 || !connectedWithout(n, regions, g, x)) continue;
      // The alternative now has two crowns in the target region → invalid.
      regions[x] = targets[0];
      moved = true;
      break;
    }
    if (!moved) return false;
  }
  return false;
}

// -------------------------------------------------------------- grading
/**
 * Difficulty from how many steps of each rule level the solver needed.
 * levelCounts[i] = number of steps at level i (1..5).
 */
export function gradeFromCounts(levelCounts: number[]): Difficulty {
  const l3 = levelCounts[3] ?? 0;
  const l4 = levelCounts[4] ?? 0;
  const l5 = levelCounts[5] ?? 0;
  if (l5 > 0 || l4 >= 2) return 'expert';
  if (l4 === 1 || l3 > 6) return 'hard';
  if (l3 > 0) return 'medium';
  return 'easy';
}

export interface Graded {
  regions: number[];
  solution: number[];
  difficulty: Difficulty;
  levelCounts: number[];
}

/** Rejection counters (diagnostics for the pack builder). */
export const genStats = { candidates: 0, noLayout: 0, notUnique: 0, needsGuess: 0 };

export function generateCandidate(n: number, rng: Rng): Graded | null {
  genStats.candidates++;
  const sol = randomLayout(n, rng);
  if (!sol) {
    genStats.noLayout++;
    return null;
  }
  const regions = growRegions(n, sol, rng);
  if (!makeUnique(n, regions, sol, rng)) {
    genStats.notUnique++;
    return null;
  }
  const res = solveLogically(n, regions, 5);
  if (!res.solved) {
    genStats.needsGuess++; // would require guessing → reject
    return null;
  }
  return { regions, solution: sol, difficulty: gradeFromCounts(res.levelCounts), levelCounts: res.levelCounts };
}

/** Grid sizes used for each difficulty. */
export const SIZE_RANGE: Record<Difficulty, [number, number]> = {
  easy: [5, 6],
  medium: [7, 8],
  hard: [8, 9],
  expert: [9, 11],
};

export interface GenerateOptions {
  seed: string;
  difficulty: Difficulty;
  /** Force a size; otherwise picked from SIZE_RANGE by the seed. */
  n?: number;
  id?: string;
  maxAttempts?: number;
}

/**
 * Generate a puzzle of the requested difficulty. Deterministic per seed.
 * If the exact grade isn't hit within maxAttempts, returns the closest one.
 */
export function generatePuzzle(opts: GenerateOptions): Puzzle {
  const rng = rngFromSeed(opts.seed);
  const [lo, hi] = SIZE_RANGE[opts.difficulty];
  const n = opts.n ?? lo + randInt(rng, hi - lo + 1);
  const target = DIFFICULTIES.indexOf(opts.difficulty);
  const maxAttempts = opts.maxAttempts ?? 400;
  let best: Graded | null = null;
  for (let a = 0; a < maxAttempts; a++) {
    const g = generateCandidate(n, rng);
    if (!g) continue;
    if (g.difficulty === opts.difficulty) {
      best = g;
      break;
    }
    const dist = (x: Graded) => Math.abs(DIFFICULTIES.indexOf(x.difficulty) - target);
    if (!best || dist(g) < dist(best)) best = g;
  }
  if (!best) throw new Error(`Could not generate puzzle for seed ${opts.seed}`);
  return {
    id: opts.id ?? opts.seed,
    n,
    regions: best.regions,
    solution: best.solution,
    difficulty: best.difficulty,
  };
}
