/**
 * Human-style logic solver.
 *
 * It only uses deductions a person can make, ordered from easiest to hardest.
 * It is used for three things:
 *   1. Grading: a puzzle's difficulty = the hardest rule needed to solve it.
 *   2. Quality gate: a puzzle that can't be solved by these rules is REJECTED,
 *      so players never have to guess (the #1 complaint about competitors).
 *   3. Hints: the next step from the player's current position, with a reason.
 */
import { buildAttackTable, buildUnits, colOf, rowOf } from './grid';
import type { Unit, UnitRef } from './types';

export type RuleId = 'lastCell' | 'confinement' | 'blocksUnit' | 'group' | 'contradiction';

export const RULE_LEVEL: Record<RuleId, number> = {
  lastCell: 1, // a row/column/region has only one free cell left
  confinement: 2, // a region lives in one row/column (or vice versa)
  blocksUnit: 3, // a crown here would wipe out another unit completely
  group: 4, // k regions squeezed into k rows/columns (or vice versa)
  contradiction: 5, // short "what if" chain ends in a dead end
};

/** Cell states inside the solver. */
export const S_UNKNOWN = 0;
export const S_OUT = 1;
export const S_CROWN = 2;
export type SolverState = Uint8Array;

export interface Step {
  rule: RuleId;
  level: number;
  /** Cells that must hold a crown. */
  place: number[];
  /** Cells that can be crossed out. */
  eliminate: number[];
  /** Cells to highlight while explaining the reasoning. */
  focus: number[];
  /** Units the explanation talks about (first one is the "main" unit). */
  units: UnitRef[];
  /** For blocksUnit / contradiction: the cell that was tested. */
  trigger?: number;
}

export interface Ctx {
  n: number;
  regions: number[];
  units: Unit[];
  attacks: number[][];
}

export function makeCtx(n: number, regions: number[]): Ctx {
  return { n, regions, units: buildUnits(n, regions), attacks: buildAttackTable(n, regions) };
}

export function newState(ctx: Ctx): SolverState {
  return new Uint8Array(ctx.n * ctx.n);
}

/** Place a crown and cross out everything it attacks. */
export function placeCrown(ctx: Ctx, st: SolverState, cell: number): void {
  st[cell] = S_CROWN;
  for (const a of ctx.attacks[cell]) if (st[a] === S_UNKNOWN) st[a] = S_OUT;
}

export function applyStep(ctx: Ctx, st: SolverState, step: Step): void {
  for (const c of step.eliminate) if (st[c] === S_UNKNOWN) st[c] = S_OUT;
  for (const c of step.place) placeCrown(ctx, st, c);
}

function unitHasCrown(st: SolverState, u: Unit): boolean {
  for (const c of u.cells) if (st[c] === S_CROWN) return true;
  return false;
}

function unitUnknown(st: SolverState, u: Unit): number[] {
  const out: number[] = [];
  for (const c of u.cells) if (st[c] === S_UNKNOWN) out.push(c);
  return out;
}

function inUnit(ctx: Ctx, u: UnitRef, cell: number): boolean {
  if (u.kind === 'row') return rowOf(cell, ctx.n) === u.index;
  if (u.kind === 'column') return colOf(cell, ctx.n) === u.index;
  return ctx.regions[cell] === u.index;
}

const ref = (u: Unit): UnitRef => ({ kind: u.kind, index: u.index });

/** Returns the first unit that can no longer get a crown, or null. */
export function findDeadUnit(ctx: Ctx, st: SolverState): UnitRef | null {
  for (const u of ctx.units) {
    if (!unitHasCrown(st, u) && unitUnknown(st, u).length === 0) return ref(u);
  }
  return null;
}

export function crownCount(st: SolverState): number {
  let k = 0;
  for (let i = 0; i < st.length; i++) if (st[i] === S_CROWN) k++;
  return k;
}

// Units ordered regions → rows → columns (regions read most naturally in hints).
function orderedUnits(ctx: Ctx): Unit[] {
  const n = ctx.n;
  return [...ctx.units.slice(2 * n), ...ctx.units.slice(0, 2 * n)];
}

// ---------------------------------------------------------------- level 1
function ruleLastCell(ctx: Ctx, st: SolverState): Step | null {
  for (const u of orderedUnits(ctx)) {
    if (unitHasCrown(st, u)) continue;
    const unk = unitUnknown(st, u);
    if (unk.length === 1) {
      return { rule: 'lastCell', level: 1, place: unk, eliminate: [], focus: unk, units: [ref(u)] };
    }
  }
  return null;
}

// ---------------------------------------------------------------- level 2
function ruleConfinement(ctx: Ctx, st: SolverState): Step | null {
  const { n, regions } = ctx;
  // (a) A region whose free cells all sit in one row / column.
  for (const u of ctx.units.slice(2 * n)) {
    if (unitHasCrown(st, u)) continue;
    const unk = unitUnknown(st, u);
    if (unk.length === 0) continue;
    for (const kind of ['row', 'column'] as const) {
      const lines = new Set(unk.map((c) => (kind === 'row' ? rowOf(c, n) : colOf(c, n))));
      if (lines.size !== 1) continue;
      const line = [...lines][0];
      const lineUnit = ctx.units[(kind === 'row' ? 0 : n) + line];
      const elim = unitUnknown(st, lineUnit).filter((c) => regions[c] !== u.index);
      if (elim.length) {
        return {
          rule: 'confinement', level: 2, place: [], eliminate: elim, focus: unk,
          units: [ref(u), ref(lineUnit)],
        };
      }
    }
  }
  // (b) A row / column whose free cells all belong to one region.
  for (const u of ctx.units.slice(0, 2 * n)) {
    if (unitHasCrown(st, u)) continue;
    const unk = unitUnknown(st, u);
    if (unk.length === 0) continue;
    const regs = new Set(unk.map((c) => regions[c]));
    if (regs.size !== 1) continue;
    const g = [...regs][0];
    const regionUnit = ctx.units[2 * n + g];
    const elim = unitUnknown(st, regionUnit).filter((c) => !inUnit(ctx, u, c));
    if (elim.length) {
      return {
        rule: 'confinement', level: 2, place: [], eliminate: elim, focus: unk,
        units: [ref(u), ref(regionUnit)],
      };
    }
  }
  return null;
}

// ---------------------------------------------------------------- level 3
function ruleBlocksUnit(ctx: Ctx, st: SolverState): Step | null {
  const N = ctx.n * ctx.n;
  const open = orderedUnits(ctx)
    .filter((u) => !unitHasCrown(st, u))
    .map((u) => ({ u, unk: unitUnknown(st, u) }));
  const mark = new Uint8Array(N);
  for (let c = 0; c < N; c++) {
    if (st[c] !== S_UNKNOWN) continue;
    mark.fill(0);
    for (const a of ctx.attacks[c]) mark[a] = 1;
    for (const { u, unk } of open) {
      if (unk.length === 0 || inUnit(ctx, u, c)) continue;
      if (unk.every((x) => mark[x] === 1)) {
        return {
          rule: 'blocksUnit', level: 3, place: [], eliminate: [c], focus: unk,
          units: [ref(u)], trigger: c,
        };
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------- level 4
function* combinations<T>(arr: T[], k: number, start = 0, acc: T[] = []): Generator<T[]> {
  if (acc.length === k) {
    yield acc.slice();
    return;
  }
  for (let i = start; i <= arr.length - (k - acc.length); i++) {
    acc.push(arr[i]);
    yield* combinations(arr, k, i + 1, acc);
    acc.pop();
  }
}

const MAX_GROUP = 5;

function ruleGroup(ctx: Ctx, st: SolverState): Step | null {
  const { n, regions } = ctx;
  const openRegions = ctx.units.slice(2 * n).filter((u) => !unitHasCrown(st, u));
  const openRows = ctx.units.slice(0, n).filter((u) => !unitHasCrown(st, u));
  const openCols = ctx.units.slice(n, 2 * n).filter((u) => !unitHasCrown(st, u));
  const maxK = Math.min(MAX_GROUP, openRegions.length - 1);

  for (let k = 2; k <= maxK; k++) {
    // (a) k regions fit inside k rows/columns → rest of those lines is out.
    for (const combo of combinations(openRegions, k)) {
      const unk = combo.flatMap((u) => unitUnknown(st, u));
      const inCombo = new Set(combo.map((u) => u.index));
      for (const kind of ['row', 'column'] as const) {
        const lines = new Set(unk.map((c) => (kind === 'row' ? rowOf(c, n) : colOf(c, n))));
        if (lines.size !== k) continue;
        const lineUnits = [...lines].sort((a, b) => a - b).map((l) => ctx.units[(kind === 'row' ? 0 : n) + l]);
        const elim = lineUnits.flatMap((lu) => unitUnknown(st, lu)).filter((c) => !inCombo.has(regions[c]));
        if (elim.length) {
          return {
            rule: 'group', level: 4, place: [], eliminate: elim, focus: unk,
            units: [...combo.map(ref), ...lineUnits.map(ref)],
          };
        }
      }
    }
    // (b) k rows/columns only reach k regions → rest of those regions is out.
    for (const lines of [openRows, openCols]) {
      for (const combo of combinations(lines, k)) {
        const unk = combo.flatMap((u) => unitUnknown(st, u));
        const regs = new Set(unk.map((c) => regions[c]));
        if (regs.size !== k) continue;
        const regUnits = [...regs].sort((a, b) => a - b).map((g) => ctx.units[2 * n + g]);
        const elim = regUnits
          .flatMap((ru) => unitUnknown(st, ru))
          .filter((c) => !combo.some((lu) => inUnit(ctx, lu, c)));
        if (elim.length) {
          return {
            rule: 'group', level: 4, place: [], eliminate: elim, focus: unk,
            units: [...combo.map(ref), ...regUnits.map(ref)],
          };
        }
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------- level 5
const CHAIN_LIMIT = 12;

/**
 * "What if a crown were here?" Place it, follow only easy rules (levels 1–2),
 * and see if some unit dies. We pick the cell with the SHORTEST chain so the
 * explanation stays human-sized.
 */
function ruleContradiction(ctx: Ctx, st: SolverState): Step | null {
  let best: { cell: number; len: number; dead: UnitRef } | null = null;
  for (let c = 0; c < st.length; c++) {
    if (st[c] !== S_UNKNOWN) continue;
    const trial = st.slice();
    placeCrown(ctx, trial, c);
    let len = 0;
    let dead = findDeadUnit(ctx, trial);
    while (!dead && len < CHAIN_LIMIT) {
      const s = ruleLastCell(ctx, trial) ?? ruleConfinement(ctx, trial);
      if (!s) break;
      applyStep(ctx, trial, s);
      len++;
      dead = findDeadUnit(ctx, trial);
    }
    if (dead && (!best || len < best.len)) {
      best = { cell: c, len, dead };
      if (len === 0) break;
    }
  }
  if (!best) return null;
  const deadCells = ctx.units.find((u) => u.kind === best!.dead.kind && u.index === best!.dead.index)!.cells;
  return {
    rule: 'contradiction', level: 5, place: [], eliminate: [best.cell],
    focus: [best.cell, ...deadCells], units: [best.dead], trigger: best.cell,
  };
}

const RULES: Array<(ctx: Ctx, st: SolverState) => Step | null> = [
  ruleLastCell,
  ruleConfinement,
  ruleBlocksUnit,
  ruleGroup,
  ruleContradiction,
];

/** Next deduction using rules up to `maxLevel` (easiest rule first). */
export function findStep(ctx: Ctx, st: SolverState, maxLevel = 5): Step | null {
  for (let i = 0; i < Math.min(maxLevel, RULES.length); i++) {
    const s = RULES[i](ctx, st);
    if (s) return s;
  }
  return null;
}

export interface SolveResult {
  solved: boolean;
  /** Hardest rule level that was required (0 if trivially solved). */
  maxLevel: number;
  /** How many times each level was used, index = level. */
  levelCounts: number[];
  steps: number;
  state: SolverState;
}

export function solveLogically(n: number, regions: number[], maxLevel = 5): SolveResult {
  const ctx = makeCtx(n, regions);
  const st = newState(ctx);
  const levelCounts = [0, 0, 0, 0, 0, 0];
  let used = 0;
  let steps = 0;
  for (;;) {
    if (crownCount(st) === n) return { solved: true, maxLevel: used, levelCounts, steps, state: st };
    if (findDeadUnit(ctx, st)) break;
    const s = findStep(ctx, st, maxLevel);
    if (!s) break;
    applyStep(ctx, st, s);
    levelCounts[s.level]++;
    used = Math.max(used, s.level);
    steps++;
  }
  return { solved: false, maxLevel: used, levelCounts, steps, state: st };
}
