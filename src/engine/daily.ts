/**
 * Daily puzzle. Everyone in the world gets the same puzzle for a given local
 * date. Prefer the pre-built pack (packs/daily.json); generateDaily() is the
 * deterministic fallback for dates beyond the pack.
 */
import { generatePuzzle } from './generator';
import type { Difficulty, Puzzle } from './types';

/** Puzzle #1 date. Change ONLY before launch. */
export const DAILY_EPOCH = '2026-10-01';

/** Weekly rhythm: gentle Monday, hardest Saturday (like classic newspaper puzzles). */
export const DAILY_SCHEDULE: Record<number, Difficulty> = {
  0: 'hard', // Sun
  1: 'easy', // Mon
  2: 'easy', // Tue
  3: 'medium', // Wed
  4: 'medium', // Thu
  5: 'hard', // Fri
  6: 'expert', // Sat
};

/** Local calendar date as YYYY-MM-DD. */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const utc = (key: string) => Date.parse(`${key}T00:00:00Z`);

/** 1-based puzzle number shown to users ("Crowns #123"). */
export function dailyNumber(key: string): number {
  return Math.round((utc(key) - utc(DAILY_EPOCH)) / 86400000) + 1;
}

export function addDays(key: string, days: number): string {
  return new Date(utc(key) + days * 86400000).toISOString().slice(0, 10);
}

export function dailyDifficulty(key: string): Difficulty {
  return DAILY_SCHEDULE[new Date(utc(key)).getUTCDay()];
}

export function generateDaily(key: string): Puzzle {
  return generatePuzzle({
    seed: `daily:v1:${key}`,
    difficulty: dailyDifficulty(key),
    id: `daily-${key}`,
    maxAttempts: 2000,
  });
}
