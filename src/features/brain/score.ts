/**
 * Weekly "brain score": a light, honest progress number (not an IQ) that rewards playing often, harder puzzles,
 * speed and solving without hints. Rolling 7 days, compared with the 7 days before.
 */
import { addDays, type Difficulty } from '@/engine';
import { jalaliFromKey, toGregorian } from '@/utils/jalali';

/** One finished puzzle, kept in the store's `log`. */
export interface SolveLog {
  /** Local date key of the solve. */
  day: string;
  d: Difficulty;
  /** Seconds taken. */
  s: number;
  /** Hints used. */
  h: number;
  daily: boolean;
}

const BASE: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 35, expert: 50 };
/** A "good" time per difficulty: faster earns up to 1.5×, slower down to 0.6×. */
const PAR: Record<Difficulty, number> = { easy: 120, medium: 300, hard: 600, expert: 900 };

export function solvePoints(l: SolveLog): number {
  const speed = Math.min(1.5, Math.max(0.6, PAR[l.d] / Math.max(1, l.s)));
  const hints = l.h === 0 ? 1.2 : Math.max(0.5, 1 - 0.15 * l.h);
  return Math.round(BASE[l.d] * speed * hints + (l.daily ? 5 : 0));
}

/** Points per day for the 7 days ending today (oldest first). */
export function dayScores(log: SolveLog[], today: string): number[] {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  return days.map((day) => log.filter((l) => l.day === day).reduce((sum, l) => sum + solvePoints(l), 0));
}

export function weekScore(log: SolveLog[], today: string): { score: number; previous: number; days: number[] } {
  const days = dayScores(log, today);
  const previous = dayScores(log, addDays(today, -7)).reduce((a, b) => a + b, 0);
  return { score: days.reduce((a, b) => a + b, 0), previous, days };
}

/** Percent change vs the week before; null when there is nothing to compare with. */
export function weekChange(score: number, previous: number): number | null {
  return previous > 0 ? Math.round(((score - previous) / previous) * 100) : null;
}

export type BrainLevel = 'resting' | 'warming' | 'sharp' | 'brilliant' | 'genius';

export function brainLevel(score: number): BrainLevel {
  if (score === 0) return 'resting';
  if (score < 40) return 'warming';
  if (score < 120) return 'sharp';
  if (score < 250) return 'brilliant';
  return 'genius';
}

/** First day of the league week: Saturday in Persian, Monday in English and Arabic (Amir 2026-10-11). */
export type WeekFirst = 'sat' | 'mon';
export const weekFirstFor = (lang: string): WeekFirst => (lang === 'fa' ? 'sat' : 'mon');

/** Key of the day this league week started on (everyone starts from zero then). */
export function weekStart(today: string, first: WeekFirst = 'sat'): string {
  const day = new Date(Date.parse(`${today}T00:00:00Z`)).getUTCDay(); // 0 = Sunday … 6 = Saturday
  return addDays(today, -(first === 'sat' ? (day + 1) % 7 : (day + 6) % 7));
}

/** Brain points since this league week started (the league score). */
export function leaguePoints(log: SolveLog[], today: string, first: WeekFirst = 'sat'): number {
  const start = weekStart(today, first);
  return log.filter((l) => l.day >= start && l.day <= today).reduce((sum, l) => sum + solvePoints(l), 0);
}

/** Brain points per local day (all time; unlike `log` it is never trimmed). */
export type DayPoints = Record<string, number>;

export function pointsFromLog(log: SolveLog[]): DayPoints {
  const out: DayPoints = {};
  for (const l of log) out[l.day] = (out[l.day] ?? 0) + solvePoints(l);
  return out;
}

/** Month and year follow the player's calendar: Jalali in Persian, Gregorian otherwise. */
export type Calendar = 'jalali' | 'gregorian';
export const calendarFor = (lang: string): Calendar => (lang === 'fa' ? 'jalali' : 'gregorian');

const pad = (n: number) => String(n).padStart(2, '0');

/** First day (date key) of the month or year that `today` falls in. */
export function periodStart(today: string, period: 'month' | 'year', calendar: Calendar = 'gregorian'): string {
  if (calendar === 'gregorian') return period === 'month' ? `${today.slice(0, 8)}01` : `${today.slice(0, 5)}01-01`;
  const { jy, jm } = jalaliFromKey(today);
  const g = toGregorian(jy, period === 'month' ? jm : 1, 1);
  return `${g.gy}-${pad(g.gm)}-${pad(g.gd)}`;
}

/** Brain points this week (rolling 7 days), this month, this year and since the first solve. */
export function periodScores(points: DayPoints, today: string, calendar: Calendar = 'gregorian') {
  const month = periodStart(today, 'month', calendar);
  const year = periodStart(today, 'year', calendar);
  const week = addDays(today, -6);
  const out = { week: 0, month: 0, year: 0, all: 0 };
  for (const [day, p] of Object.entries(points)) {
    if (day > today) continue;
    out.all += p;
    if (day >= year) out.year += p;
    if (day >= month) out.month += p;
    if (day >= week) out.week += p;
  }
  return out;
}
