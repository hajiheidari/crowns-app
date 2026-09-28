/**
 * Core types for the Crowns puzzle engine.
 *
 * Puzzle rules (same family as "Star Battle" with one star):
 *  - An n×n grid is split into n colored regions.
 *  - Place exactly one crown in every row, every column and every region.
 *  - Two crowns may never touch, not even diagonally.
 *
 * The engine is pure TypeScript with zero dependencies so it runs in
 * React Native (Hermes), Node (tests / pack builder) and the web.
 */

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';
export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

/** Cell marks on the player's board. */
export const EMPTY = 0;
export const CROSS = 1; // player marked "no crown here" (✕)
export const CROWN = 2; // player placed a crown
export type Mark = 0 | 1 | 2;

/** Board = one Mark per cell, row-major, length n*n. */
export type Board = Mark[];

export interface Puzzle {
  /** Stable id, e.g. "daily-2026-10-01" or "hard-0042". */
  id: string;
  /** Grid size (5..11). */
  n: number;
  /** Region index (0..n-1) for each cell, row-major. */
  regions: number[];
  /** Solution: solution[row] = column of the crown in that row. */
  solution: number[];
  difficulty: Difficulty;
}

export type UnitKind = 'row' | 'column' | 'region';

export interface UnitRef {
  kind: UnitKind;
  index: number;
}

export interface Unit extends UnitRef {
  cells: number[];
}
