/**
 * Apple Game Center (1.1, Amir 2026-10-13): worldwide leaderboards and achievements on iPhone/iPad. Uses the local
 * module in modules/tiaro-game-center; everywhere else (Android, web, older builds) every call is a quiet no-op.
 * The leaderboards and achievements below must exist in App Store Connect with the same ids.
 */
import GameCenter from '../../modules/tiaro-game-center';

import { dateKey, DIFFICULTIES } from '@/engine';
import { brainLevel, leaguePoints, periodScores, weekScore } from '@/features/brain/score';
import { useGameStore } from '@/store/game-store';

export const LEADERBOARDS = {
  /** Brain points since Monday (recurring leaderboard, resets every Monday 00:00 UTC). Apple has no monthly
   * recurrence, so the monthly table lives only in the friends league. */
  week: 'tiaro.week',
  /** All brain points since the first solve. */
  allTime: 'tiaro.alltime',
  bestStreak: 'tiaro.beststreak',
};

export const ACHIEVEMENTS = {
  firstSolve: 'tiaro.first_solve',
  streak7: 'tiaro.streak7',
  streak30: 'tiaro.streak30',
  streak100: 'tiaro.streak100',
  expert10: 'tiaro.expert10',
  genius: 'tiaro.genius',
  noHints25: 'tiaro.nohints25',
};

export const gameCenterAvailable = GameCenter !== null;

let signIn: Promise<boolean> | null = null;

/** Sign in once per launch (Apple shows its own small banner; a sheet only the very first time). */
export function initGameCenter(): Promise<boolean> {
  if (!GameCenter) return Promise.resolve(false);
  signIn ??= GameCenter.authenticate().catch(() => false);
  return signIn;
}

/** Send the current scores and earned achievements (after a win, and when Home opens). */
export async function reportGameCenter(): Promise<void> {
  const gc = GameCenter;
  if (!gc || !(await initGameCenter())) return;
  const { points, log, daily, stats } = useGameStore.getState();
  const today = dateKey();
  const totals = periodScores(points, today);
  // Points since Monday, like the leaderboard's own week; the level uses the rolling 7 days as on Home.
  const week = leaguePoints(log, today, 'mon');
  const level = brainLevel(weekScore(log, today).score);
  const scores: [string, number][] = [
    [LEADERBOARDS.week, week],
    [LEADERBOARDS.allTime, totals.all],
    [LEADERBOARDS.bestStreak, daily.bestStreak],
  ];
  const solved = DIFFICULTIES.reduce((n, d) => n + stats[d].solved, 0);
  const hintFree = DIFFICULTIES.reduce((n, d) => n + stats[d].hintFree, 0);
  const earned: [string, number][] = [
    [ACHIEVEMENTS.firstSolve, solved >= 1 ? 100 : 0],
    [ACHIEVEMENTS.streak7, Math.min(100, (daily.bestStreak / 7) * 100)],
    [ACHIEVEMENTS.streak30, Math.min(100, (daily.bestStreak / 30) * 100)],
    [ACHIEVEMENTS.streak100, Math.min(100, daily.bestStreak)],
    [ACHIEVEMENTS.expert10, Math.min(100, stats.expert.solved * 10)],
    [ACHIEVEMENTS.genius, level === 'genius' ? 100 : 0],
    [ACHIEVEMENTS.noHints25, Math.min(100, (hintFree / 25) * 100)],
  ];
  try {
    await Promise.all([
      ...scores.filter(([, s]) => s > 0).map(([id, s]) => gc.submitScore(Math.round(s), id)),
      ...earned.filter(([, p]) => p > 0).map(([id, p]) => gc.reportAchievement(id, Math.round(p))),
    ]);
  } catch {
    // Game Center trouble never affects the game.
  }
}

/** Opens Apple's Game Center leaderboards. False when not signed in / not available. */
export async function openGameCenter(): Promise<boolean> {
  const gc = GameCenter;
  if (!gc || !(await initGameCenter())) return false;
  return gc.showDashboard().catch(() => false);
}
