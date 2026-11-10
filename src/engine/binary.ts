/**
 * Sun & moon puzzle: fill every cell with a sun or a moon so that
 *  - every row and every column has as many suns as moons,
 *  - no three suns or three moons sit next to each other in a row or column,
 *  - cells joined by "=" are the same, cells joined by "×" are different.
 *
 * Every puzzle is solved by the logic solver below from its givens alone, so it has exactly one solution and never
 * needs a guess; the same steps power the hints. Pure TypeScript, deterministic from a seed.
 */
import type { Difficulty } from './types';
import { hashString, mulberry32, type Rng } from './rng';

export const SUN = 1;
export const MOON = 2;
export type Sky = 0 | 1 | 2;

export interface BinarySign {
  a: number;
  b: number;
  /** true: "=" (same), false: "×" (different) */
  same: boolean;
}

export interface BinaryPuzzle {
  id: string;
  n: number;
  difficulty: Difficulty;
  /** Fixed cells: 0 = empty, 1 = sun, 2 = moon. */
  givens: Sky[];
  signs: BinarySign[];
  solution: Sky[];
}

/** Grid size, how many signs, and which reasoning the puzzle may need. */
export const BINARY_LEVELS: Record<Difficulty, { n: number; signs: number; deep: boolean; extra: number }> = {
  easy: { n: 6, signs: 4, deep: false, extra: 4 },
  medium: { n: 6, signs: 6, deep: false, extra: 0 },
  hard: { n: 6, signs: 8, deep: true, extra: 0 },
  expert: { n: 8, signs: 10, deep: true, extra: 0 },
};

const other = (v: Sky): Sky => (v === SUN ? MOON : SUN);

/** Rows then columns, each as its list of cells. */
export function binaryLines(n: number): { kind: 'row' | 'column'; index: number; cells: number[] }[] {
  const out: { kind: 'row' | 'column'; index: number; cells: number[] }[] = [];
  for (let r = 0; r < n; r++) out.push({ kind: 'row', index: r, cells: Array.from({ length: n }, (_, c) => r * n + c) });
  for (let c = 0; c < n; c++) out.push({ kind: 'column', index: c, cells: Array.from({ length: n }, (_, r) => r * n + c) });
  return out;
}

/** A (maybe partial) line breaks a rule: more than half of the full line `n` of one kind, or three alike in a row. */
function lineBroken(values: Sky[], n: number): boolean {
  const half = n / 2;
  let suns = 0;
  let moons = 0;
  for (let i = 0; i < values.length; i++) {
    if (values[i] === SUN) suns++;
    if (values[i] === MOON) moons++;
    if (i >= 2 && values[i] && values[i] === values[i - 1] && values[i] === values[i - 2]) return true;
  }
  return suns > half || moons > half;
}

/** Cells that break a rule now (for red marks on the board). */
export function binaryConflicts(p: Pick<BinaryPuzzle, 'n' | 'signs'>, cells: Sky[]): Set<number> {
  const bad = new Set<number>();
  const n = p.n;
  for (const line of binaryLines(n)) {
    const v = line.cells.map((x) => cells[x]);
    for (let i = 2; i < n; i++) if (v[i] && v[i] === v[i - 1] && v[i] === v[i - 2]) [i - 2, i - 1, i].forEach((k) => bad.add(line.cells[k]));
    for (const kind of [SUN, MOON]) {
      if (v.filter((x) => x === kind).length > n / 2) line.cells.forEach((x) => cells[x] === kind && bad.add(x));
    }
  }
  for (const s of p.signs) {
    const [x, y] = [cells[s.a], cells[s.b]];
    if (x && y && (x === y) !== s.same) [s.a, s.b].forEach((c) => bad.add(c));
  }
  return bad;
}

export function isBinarySolved(p: BinaryPuzzle, cells: Sky[]): boolean {
  return cells.every((v, i) => v === p.solution[i]);
}

/** A random full grid that keeps every rule (balanced lines, no three alike, no two equal rows or columns). */
export function randomGrid(n: number, rng: Rng): Sky[] | null {
  // Build it row by row from the valid rows, checking the columns as they grow.
  const patterns = lineFillings(new Array(n).fill(0));
  const rows: Sky[][] = [];
  let steps = 0;
  const colsOk = () => {
    for (let c = 0; c < n; c++) if (lineBroken(rows.map((row) => row[c]), n)) return false;
    if (rows.length < n) return true;
    const cols = new Set(Array.from({ length: n }, (_, c) => rows.map((row) => row[c]).join('')));
    return cols.size === n;
  };
  const place = (): boolean => {
    if (++steps > 50000) return false;
    if (rows.length === n) return true;
    const order = [...patterns];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    for (const row of order) {
      if (rows.some((r) => r.join('') === row.join(''))) continue;
      rows.push(row);
      if (colsOk() && place()) return true;
      rows.pop();
    }
    return false;
  };
  return place() ? rows.flat() : null;
}

// ── Logic solver ─────────────────────────────────────────────────────────────────────────────────────────────────

export type BinaryRule = 'pair' | 'gap' | 'balance' | 'sign' | 'line';

export interface BinaryStep {
  rule: BinaryRule;
  /** Cells that become known, and their values. */
  cells: number[];
  values: Sky[];
  /** Cells that explain the step (the pair, the line, the sign). */
  focus: number[];
  line?: { kind: 'row' | 'column'; index: number };
}

/** All balanced, rule-keeping fillings of a line that agree with what is known. */
function lineFillings(known: Sky[]): Sky[][] {
  const n = known.length;
  const out: Sky[][] = [];
  const cur: Sky[] = new Array(n).fill(0);
  const go = (i: number, suns: number, moons: number) => {
    if (suns > n / 2 || moons > n / 2) return;
    if (i === n) return void out.push([...cur]);
    for (const v of [SUN, MOON] as Sky[]) {
      if (known[i] && known[i] !== v) continue;
      if (i >= 2 && cur[i - 1] === v && cur[i - 2] === v) continue;
      cur[i] = v;
      go(i + 1, suns + (v === SUN ? 1 : 0), moons + (v === MOON ? 1 : 0));
    }
    cur[i] = 0;
  };
  go(0, 0, 0);
  return out;
}

/** The easiest next step from these cells, or null when stuck. `deep` allows whole-line reasoning. */
export function nextBinaryStep(p: Pick<BinaryPuzzle, 'n' | 'signs'>, cells: Sky[], deep = true): BinaryStep | null {
  const n = p.n;
  const lines = binaryLines(n);
  // Two alike side by side, or the same on both sides of a gap: the neighbour / the gap is the other kind.
  for (const line of lines) {
    const v = line.cells.map((x) => cells[x]);
    for (let i = 0; i + 1 < n; i++) {
      if (!v[i] || v[i] !== v[i + 1]) continue;
      for (const j of [i - 1, i + 2]) {
        if (j >= 0 && j < n && !v[j]) {
          return { rule: 'pair', cells: [line.cells[j]], values: [other(v[i])], focus: [line.cells[i], line.cells[i + 1]], line };
        }
      }
    }
    for (let i = 0; i + 2 < n; i++) {
      if (v[i] && v[i] === v[i + 2] && !v[i + 1]) {
        return { rule: 'gap', cells: [line.cells[i + 1]], values: [other(v[i])], focus: [line.cells[i], line.cells[i + 2]], line };
      }
    }
  }
  // A sign with one side known.
  for (const s of p.signs) {
    const [x, y] = [cells[s.a], cells[s.b]];
    if (x && !y) return { rule: 'sign', cells: [s.b], values: [s.same ? x : other(x)], focus: [s.a, s.b] };
    if (y && !x) return { rule: 'sign', cells: [s.a], values: [s.same ? y : other(y)], focus: [s.a, s.b] };
  }
  // A line that already has half of one kind: the rest is the other kind.
  for (const line of lines) {
    const v = line.cells.map((x) => cells[x]);
    for (const kind of [SUN, MOON] as Sky[]) {
      const empty = line.cells.filter((x) => !cells[x]);
      if (empty.length && v.filter((x) => x === kind).length === n / 2) {
        return { rule: 'balance', cells: empty, values: empty.map(() => other(kind)), focus: line.cells, line };
      }
    }
  }
  if (!deep) return null;
  // Every way to finish a line (with its signs inside the line) agrees on some cell.
  for (const line of lines) {
    if (line.cells.every((x) => cells[x])) continue;
    const inside = p.signs.filter((s) => line.cells.includes(s.a) && line.cells.includes(s.b));
    const fills = lineFillings(line.cells.map((x) => cells[x])).filter((f) =>
      inside.every((s) => (f[line.cells.indexOf(s.a)] === f[line.cells.indexOf(s.b)]) === s.same),
    );
    if (!fills.length) continue;
    const found: number[] = [];
    const values: Sky[] = [];
    line.cells.forEach((x, i) => {
      if (!cells[x] && fills.every((f) => f[i] === fills[0][i])) {
        found.push(x);
        values.push(fills[0][i]);
      }
    });
    if (found.length) return { rule: 'line', cells: found, values, focus: line.cells, line };
  }
  return null;
}

/** Solve from the givens with logic only. `solved` is false when it gets stuck or hits a contradiction. */
export function solveBinary(p: Pick<BinaryPuzzle, 'n' | 'signs' | 'givens'>, deep = true): { solved: boolean; cells: Sky[]; usedDeep: boolean } {
  const cells = [...p.givens];
  let usedDeep = false;
  for (let guard = 0; guard < p.n * p.n * 4; guard++) {
    const step = nextBinaryStep(p, cells, deep);
    if (!step) break;
    if (step.rule === 'line') usedDeep = true;
    step.cells.forEach((x, i) => (cells[x] = step.values[i]));
    if (binaryConflicts(p, cells).size) return { solved: false, cells, usedDeep };
  }
  return { solved: cells.every((v) => v !== 0), cells, usedDeep };
}

// ── Generator ────────────────────────────────────────────────────────────────────────────────────────────────────

export function generateBinaryPuzzle(opts: { seed: string; difficulty: Difficulty; id: string }): BinaryPuzzle {
  const level = BINARY_LEVELS[opts.difficulty];
  const rng = mulberry32(hashString(`binary:${opts.seed}`));
  for (let attempt = 0; attempt < 200; attempt++) {
    const solution = randomGrid(level.n, rng);
    if (!solution) continue;
    const p = carve(level, solution, rng, opts);
    if (p) return p;
  }
  throw new Error(`binary puzzle: none for ${opts.id}`);
}

function carve(level: (typeof BINARY_LEVELS)[Difficulty], solution: Sky[], rng: Rng, opts: { difficulty: Difficulty; id: string }): BinaryPuzzle | null {
  const n = level.n;
  const shuffle = <T,>(a: T[]) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  // Signs on random neighbouring pairs.
  const pairs: [number, number][] = [];
  for (let c = 0; c < n * n; c++) {
    if (c % n < n - 1) pairs.push([c, c + 1]);
    if (c + n < n * n) pairs.push([c, c + n]);
  }
  const signs = shuffle(pairs)
    .slice(0, level.signs)
    .map(([a, b]) => ({ a, b, same: solution[a] === solution[b] }));
  // Remove givens one by one while the logic (of this level) still solves it.
  const givens: Sky[] = [...solution];
  for (const cell of shuffle(Array.from({ length: n * n }, (_, i) => i))) {
    const keep = givens[cell];
    givens[cell] = 0;
    const r = solveBinary({ n, signs, givens }, level.deep);
    if (!r.solved || r.cells.some((v, i) => v !== solution[i])) givens[cell] = keep;
  }
  // Hard levels must really need the deeper reasoning; easy ones get a few extra givens.
  if (level.deep && !solveBinary({ n, signs, givens }, true).usedDeep) return null;
  if (!level.deep && opts.difficulty !== 'easy' && givens.filter(Boolean).length > n * n * 0.4) return null;
  for (let k = 0; k < level.extra; k++) {
    const cell = Math.floor(rng() * n * n);
    givens[cell] = solution[cell];
  }
  return { id: opts.id, n, difficulty: opts.difficulty, givens, signs, solution };
}

/**
 * A hint for the player's cells: wrong cells first (any cell that differs from the solution), else the next logical
 * step with what it proves.
 */
export type BinaryHint = { kind: 'mistake'; cells: number[] } | { kind: 'step'; step: BinaryStep } | { kind: 'solved' };

export function binaryHint(p: BinaryPuzzle, cells: Sky[]): BinaryHint {
  const wrong = cells.map((v, i) => (v && v !== p.solution[i] ? i : -1)).filter((i) => i >= 0);
  if (wrong.length) return { kind: 'mistake', cells: wrong };
  if (isBinarySolved(p, cells)) return { kind: 'solved' };
  const step = nextBinaryStep(p, cells, true);
  if (step) return { kind: 'step', step };
  // Should not happen for a valid puzzle: reveal one cell.
  const cell = cells.findIndex((v) => !v);
  return { kind: 'step', step: { rule: 'line', cells: [cell], values: [p.solution[cell]], focus: [cell] } };
}

// ── Compact pack format ──────────────────────────────────────────────────────────────────────────────────────────

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export interface PackedBinary {
  i: string;
  n: number;
  d: 'e' | 'm' | 'h' | 'x';
  /** givens: '.' empty, 's' sun, 'm' moon */
  g: string;
  /** signs: 3 chars each (cell, cell, '=' or 'x') */
  t: string;
  /** solution: 's' / 'm' per cell */
  s: string;
}

const D2L: Record<Difficulty, PackedBinary['d']> = { easy: 'e', medium: 'm', hard: 'h', expert: 'x' };
const L2D: Record<PackedBinary['d'], Difficulty> = { e: 'easy', m: 'medium', h: 'hard', x: 'expert' };
const enc = (v: Sky) => (v === SUN ? 's' : v === MOON ? 'm' : '.');
const dec = (ch: string): Sky => (ch === 's' ? SUN : ch === 'm' ? MOON : 0);

export function packBinary(p: BinaryPuzzle): PackedBinary {
  return {
    i: p.id,
    n: p.n,
    d: D2L[p.difficulty],
    g: p.givens.map(enc).join(''),
    t: p.signs.map((s) => B64[s.a] + B64[s.b] + (s.same ? '=' : 'x')).join(''),
    s: p.solution.map(enc).join(''),
  };
}

export function unpackBinary(x: PackedBinary): BinaryPuzzle {
  const signs: BinarySign[] = [];
  for (let i = 0; i < x.t.length; i += 3) signs.push({ a: B64.indexOf(x.t[i]), b: B64.indexOf(x.t[i + 1]), same: x.t[i + 2] === '=' });
  return { id: x.i, n: x.n, difficulty: L2D[x.d], givens: [...x.g].map(dec), signs, solution: [...x.s].map(dec) };
}
