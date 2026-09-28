/** Geometry helpers shared by generator, solver and UI. */
import type { Unit, UnitRef } from './types';

export const rowOf = (cell: number, n: number): number => Math.floor(cell / n);
export const colOf = (cell: number, n: number): number => cell % n;
export const cellAt = (row: number, col: number, n: number): number => row * n + col;

/** 8-connected neighbours (the "no touching" rule). */
export function neighbors8(cell: number, n: number): number[] {
  const r = rowOf(cell, n);
  const c = colOf(cell, n);
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const rr = r + dr;
      const cc = c + dc;
      if (rr >= 0 && rr < n && cc >= 0 && cc < n) out.push(rr * n + cc);
    }
  }
  return out;
}

/** 4-connected neighbours (used for region contiguity). */
export function neighbors4(cell: number, n: number): number[] {
  const r = rowOf(cell, n);
  const c = colOf(cell, n);
  const out: number[] = [];
  if (r > 0) out.push(cell - n);
  if (r < n - 1) out.push(cell + n);
  if (c > 0) out.push(cell - 1);
  if (c < n - 1) out.push(cell + 1);
  return out;
}

/** All 3n units: rows, then columns, then regions. */
export function buildUnits(n: number, regions: number[]): Unit[] {
  const units: Unit[] = [];
  for (let r = 0; r < n; r++) {
    const cells: number[] = [];
    for (let c = 0; c < n; c++) cells.push(r * n + c);
    units.push({ kind: 'row', index: r, cells });
  }
  for (let c = 0; c < n; c++) {
    const cells: number[] = [];
    for (let r = 0; r < n; r++) cells.push(r * n + c);
    units.push({ kind: 'column', index: c, cells });
  }
  const byRegion: number[][] = Array.from({ length: n }, () => []);
  for (let i = 0; i < n * n; i++) byRegion[regions[i]].push(i);
  for (let g = 0; g < n; g++) units.push({ kind: 'region', index: g, cells: byRegion[g] });
  return units;
}

/**
 * Cells that can no longer hold a crown if a crown is placed on `cell`:
 * same row, same column, same region, and the 8 touching cells.
 */
export function attackedBy(cell: number, n: number, regions: number[]): number[] {
  const r = rowOf(cell, n);
  const c = colOf(cell, n);
  const g = regions[cell];
  const seen = new Set<number>();
  for (let i = 0; i < n; i++) {
    seen.add(r * n + i);
    seen.add(i * n + c);
  }
  for (let i = 0; i < n * n; i++) if (regions[i] === g) seen.add(i);
  for (const nb of neighbors8(cell, n)) seen.add(nb);
  seen.delete(cell);
  return [...seen];
}

/** Precomputed attack lists for every cell (hot path in the solver). */
export function buildAttackTable(n: number, regions: number[]): number[][] {
  const table: number[][] = [];
  for (let i = 0; i < n * n; i++) table.push(attackedBy(i, n, regions));
  return table;
}

export function sameUnit(a: UnitRef, b: UnitRef): boolean {
  return a.kind === b.kind && a.index === b.index;
}
