/**
 * Path puzzle ("Tiaro Path"): draw ONE line that starts at checkpoint 1, passes the numbered checkpoints in order,
 * visits every cell of the grid exactly once and ends on the last checkpoint. Thin walls between two cells cannot be
 * crossed.
 *
 * Pure TypeScript, deterministic from a seed (like the crowns generator), so packs and challenge links rebuild the
 * same puzzle everywhere. Puzzles are accepted only with exactly one solution.
 */
import type { Difficulty } from './types';
import { hashString, mulberry32, type Rng } from './rng';

export interface PathPuzzle {
  id: string;
  /** Grid size (5..8). */
  n: number;
  difficulty: Difficulty;
  /** Checkpoint cells in order: clues[0] is "1" (start), the last one is the end. */
  clues: number[];
  /** Walls as pairs of neighbouring cells [a, b] with a < b. */
  walls: [number, number][];
  /** The solution: every cell once, from clues[0] to the last clue. */
  solution: number[];
}

/** Grid size and how hard the search for checkpoints is pushed, per difficulty. */
export const PATH_LEVELS: Record<Difficulty, { n: number; walls: number; minimal: boolean; extra: number }> = {
  easy: { n: 5, walls: 0, minimal: true, extra: 2 },
  medium: { n: 6, walls: 2, minimal: true, extra: 1 },
  hard: { n: 7, walls: 3, minimal: true, extra: 0 },
  expert: { n: 8, walls: 4, minimal: true, extra: 0 },
};

const wallKey = (a: number, b: number) => (a < b ? a * 256 + b : b * 256 + a);

/** Neighbours of a cell (up, down, left, right), without walls. */
export function gridNeighbours(n: number, cell: number): number[] {
  const r = Math.floor(cell / n);
  const c = cell % n;
  const out: number[] = [];
  if (r > 0) out.push(cell - n);
  if (r < n - 1) out.push(cell + n);
  if (c > 0) out.push(cell - 1);
  if (c < n - 1) out.push(cell + 1);
  return out;
}

/** Neighbour lists with walls removed. */
export function pathAdjacency(n: number, walls: [number, number][]): number[][] {
  const blocked = new Set(walls.map(([a, b]) => wallKey(a, b)));
  return Array.from({ length: n * n }, (_, cell) => gridNeighbours(n, cell).filter((x) => !blocked.has(wallKey(cell, x))));
}

/** A random path through every cell (backbite moves from a snake), so every shape of path can come out. */
export function randomHamiltonianPath(n: number, rng: Rng): number[] {
  let path: number[] = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) path.push(r * n + (r % 2 ? n - 1 - c : c));
  const moves = n * n * 40;
  for (let m = 0; m < moves; m++) {
    if (rng() < 0.5) path.reverse();
    const end = path[path.length - 1];
    const options = gridNeighbours(n, end).filter((x) => x !== path[path.length - 2]);
    const x = options[Math.floor(rng() * options.length)];
    const i = path.indexOf(x);
    path = path.slice(0, i + 1).concat(path.slice(i + 1).reverse());
  }
  return path;
}

/**
 * Count solutions (stops at `limit`). Returns -1 when the search gives up after `budget` steps, which the generator
 * treats as "not proven unique".
 */
export function countPathSolutions(n: number, clues: number[], walls: [number, number][], limit = 2, budget = 400000): number {
  const adj = pathAdjacency(n, walls);
  const total = n * n;
  const clueAt = new Int16Array(total).fill(-1);
  clues.forEach((cell, i) => (clueAt[cell] = i));
  const visited = new Uint8Array(total);
  const end = clues[clues.length - 1];
  let found = 0;
  let steps = 0;
  const stack: number[] = new Array(total);
  const seen = new Uint8Array(total);

  // The cells left must still be reachable as one piece from the head, and no cell may be a dead end.
  const feasible = (head: number, left: number): boolean => {
    for (let cell = 0; cell < total; cell++) {
      if (visited[cell]) continue;
      let free = 0;
      for (const x of adj[cell]) if (!visited[x] || x === head) free++;
      if (free === 0) return false;
      if (free === 1 && cell !== end) {
        // Only fine if its one way in is the head itself (it must be the very next step) — and then only one such cell.
        if (!adj[cell].includes(head)) return false;
      }
    }
    seen.fill(0);
    let top = 0;
    let reached = 0;
    for (const x of adj[head]) {
      if (!visited[x] && !seen[x]) {
        seen[x] = 1;
        stack[top++] = x;
      }
    }
    while (top) {
      const cell = stack[--top];
      reached++;
      for (const x of adj[cell]) {
        if (!visited[x] && !seen[x]) {
          seen[x] = 1;
          stack[top++] = x;
        }
      }
    }
    return reached === left;
  };

  const dfs = (head: number, count: number, nextClue: number): boolean => {
    if (++steps > budget) return true;
    if (count === total) {
      if (head === end) found++;
      return found >= limit;
    }
    if (head === end) return false;
    if (!feasible(head, total - count)) return false;
    for (const x of adj[head]) {
      if (visited[x]) continue;
      const ci = clueAt[x];
      if (ci >= 0 && ci !== nextClue) continue;
      visited[x] = 1;
      const stop = dfs(x, count + 1, ci >= 0 ? nextClue + 1 : nextClue);
      visited[x] = 0;
      if (stop) return true;
    }
    return false;
  };

  visited[clues[0]] = 1;
  dfs(clues[0], 1, 1);
  return steps > budget ? -1 : found;
}

/** Make a path puzzle from a seed. Deterministic. */
export function generatePathPuzzle(opts: { seed: string; difficulty: Difficulty; id: string }): PathPuzzle {
  const level = PATH_LEVELS[opts.difficulty];
  const rng = mulberry32(hashString(`path:${opts.seed}`));
  for (let attempt = 0; attempt < 50; attempt++) {
    const p = tryGenerate(level, rng, opts);
    if (p) return p;
  }
  throw new Error(`path puzzle: no unique puzzle for ${opts.id}`);
}

function tryGenerate(level: (typeof PATH_LEVELS)[Difficulty], rng: Rng, opts: { difficulty: Difficulty; id: string }): PathPuzzle | null {
  const { n } = level;
  const path = randomHamiltonianPath(n, rng);
  const order = new Map(path.map((cell, i) => [cell, i]));

  // Walls only between neighbours the line does not join, so the solution stays valid.
  const walls: [number, number][] = [];
  for (let tries = 0; walls.length < level.walls && tries < 200; tries++) {
    const a = Math.floor(rng() * n * n);
    const nb = gridNeighbours(n, a);
    const b = nb[Math.floor(rng() * nb.length)];
    if (Math.abs(order.get(a)! - order.get(b)!) === 1) continue;
    if (walls.some(([x, y]) => wallKey(x, y) === wallKey(a, b))) continue;
    walls.push(a < b ? [a, b] : [b, a]);
  }

  // Checkpoints are positions along the solution; 0 and the last are always there.
  const last = n * n - 1;
  const marks = new Set([0, last]);
  const cluesOf = () => [...marks].sort((x, y) => x - y).map((i) => path[i]);
  let count = countPathSolutions(n, cluesOf(), walls);
  while (count !== 1) {
    // Split the longest stretch without a checkpoint, near its middle.
    const sorted = [...marks].sort((x, y) => x - y);
    let best = 0;
    for (let i = 1; i < sorted.length; i++) if (sorted[i] - sorted[i - 1] > sorted[best + 1] - sorted[best]) best = i - 1;
    const gap = sorted[best + 1] - sorted[best];
    if (gap < 2) return null;
    const mid = sorted[best] + Math.max(1, Math.min(gap - 1, Math.round(gap / 2 + (rng() - 0.5) * gap * 0.5)));
    marks.add(mid);
    count = countPathSolutions(n, cluesOf(), walls);
  }

  if (level.minimal) {
    // Take away every checkpoint that is not needed, in random order.
    const inner = [...marks].filter((i) => i !== 0 && i !== last);
    for (let i = inner.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [inner[i], inner[j]] = [inner[j], inner[i]];
    }
    for (const i of inner) {
      marks.delete(i);
      if (countPathSolutions(n, cluesOf(), walls) !== 1) marks.add(i);
    }
  }
  // Easier levels get a few extra checkpoints to guide the eye.
  for (let k = 0; k < level.extra; k++) {
    const i = 1 + Math.floor(rng() * (last - 1));
    marks.add(i);
  }
  return { id: opts.id, n, difficulty: opts.difficulty, clues: cluesOf(), walls, solution: path };
}

/** Is this line a full, correct solution (any line that obeys the rules counts, not only the stored one)? */
export function isPathSolved(p: Pick<PathPuzzle, 'n' | 'clues' | 'walls'>, line: number[]): boolean {
  const total = p.n * p.n;
  if (line.length !== total || line[0] !== p.clues[0] || line[total - 1] !== p.clues[p.clues.length - 1]) return false;
  if (new Set(line).size !== total) return false;
  const adj = pathAdjacency(p.n, p.walls);
  for (let i = 1; i < total; i++) if (!adj[line[i - 1]].includes(line[i])) return false;
  let next = 0;
  for (const cell of line) {
    const ci = p.clues.indexOf(cell);
    if (ci >= 0) {
      if (ci !== next) return false;
      next++;
    }
  }
  return next === p.clues.length;
}

/** Can the line go from its last cell to `cell` (neighbour, no wall, not used yet)? */
export function canExtend(p: Pick<PathPuzzle, 'n' | 'walls'>, line: number[], cell: number): boolean {
  if (line.includes(cell)) return false;
  const head = line[line.length - 1];
  return pathAdjacency(p.n, p.walls)[head].includes(cell);
}

/** Checkpoint number (1-based) on a cell, or 0. */
export function clueNumber(p: Pick<PathPuzzle, 'clues'>, cell: number): number {
  return p.clues.indexOf(cell) + 1;
}

/**
 * A hint: keep the part of the player's line that matches the solution and show the next few cells. `keep` is how
 * many cells of the player's line are right; `next` the cells to add.
 */
export function pathHint(p: PathPuzzle, line: number[], steps = 3): { keep: number; next: number[] } {
  let keep = 0;
  while (keep < line.length && line[keep] === p.solution[keep]) keep++;
  keep = Math.max(1, keep);
  return { keep, next: p.solution.slice(keep, keep + steps) };
}

// ── Compact pack format ──────────────────────────────────────────────────────────────────────────────────────────

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export interface PackedPath {
  i: string;
  n: number;
  d: 'e' | 'm' | 'h' | 'x';
  /** checkpoints, one char per cell */
  c: string;
  /** walls, two chars per wall */
  w: string;
  /** solution as moves U D L R from the first checkpoint */
  s: string;
}

const D2L: Record<Difficulty, PackedPath['d']> = { easy: 'e', medium: 'm', hard: 'h', expert: 'x' };
const L2D: Record<PackedPath['d'], Difficulty> = { e: 'easy', m: 'medium', h: 'hard', x: 'expert' };

export function packPath(p: PathPuzzle): PackedPath {
  let s = '';
  for (let i = 1; i < p.solution.length; i++) {
    const d = p.solution[i] - p.solution[i - 1];
    s += d === -p.n ? 'U' : d === p.n ? 'D' : d === -1 ? 'L' : 'R';
  }
  return {
    i: p.id,
    n: p.n,
    d: D2L[p.difficulty],
    c: p.clues.map((x) => B64[x]).join(''),
    w: p.walls.map(([a, b]) => B64[a] + B64[b]).join(''),
    s,
  };
}

export function unpackPath(x: PackedPath): PathPuzzle {
  const clues = [...x.c].map((ch) => B64.indexOf(ch));
  const walls: [number, number][] = [];
  for (let i = 0; i < x.w.length; i += 2) walls.push([B64.indexOf(x.w[i]), B64.indexOf(x.w[i + 1])]);
  const solution = [clues[0]];
  for (const m of x.s) solution.push(solution[solution.length - 1] + (m === 'U' ? -x.n : m === 'D' ? x.n : m === 'L' ? -1 : 1));
  return { id: x.i, n: x.n, difficulty: L2D[x.d], clues, walls, solution };
}
