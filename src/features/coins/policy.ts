/**
 * Coins (Amir 2026-10-13): the one currency of the game. Earned by coming back every day, winning daily and hard
 * puzzles, friends opening the player's links and (where an ad network exists) watching a rewarded ad. Spent on hints,
 * shop items (board themes, crowns), old archive days and streak repairs. Plain functions, tested in tests/app/coins.test.ts.
 */
import { addDays, type Difficulty } from '@/engine';

export const COINS = {
  /** Daily login: day 1 of a run of days in a row … day 7 and after. */
  login: [10, 13, 16, 20, 23, 26, 30],
  dailyWin: 10,
  win: { easy: 0, medium: 0, hard: 5, expert: 10 } as Record<Difficulty, number>,
  /** Most coins from wins (daily included) in one day. */
  winCapPerDay: 50,
  rewardedAd: 20,
  adsPerDay: 5,
  /** A friend opened one of the player's links (checked by the server, at most 5 a day). */
  perFriend: 25,
  hint: 30,
  streakRepair: 100,
  archiveDay: 20,
} as const;

/** What was earned today, so the daily caps hold. Reset when the day changes. */
export interface CoinDay {
  day: string;
  wins: number;
  ads: number;
}

export const freshDay = (day: string): CoinDay => ({ day, wins: 0, ads: 0 });
const today = (d: CoinDay | null, day: string) => (d && d.day === day ? d : freshDay(day));

/**
 * Coins for opening the app today. `lastKey` is the last day a login reward was paid, `streak` the run of days in a
 * row it was paid on. Null when today was already paid.
 */
export function loginReward(lastKey: string | null, streak: number, day: string): { coins: number; streak: number } | null {
  if (lastKey === day) return null;
  const run = lastKey === addDays(day, -1) ? streak + 1 : 1;
  return { coins: COINS.login[Math.min(run, COINS.login.length) - 1], streak: run };
}

/** Coins for a solved puzzle, within the daily cap. */
export function winReward(difficulty: Difficulty, daily: boolean, d: CoinDay | null, day: string): { coins: number; next: CoinDay } {
  const cur = today(d, day);
  const want = daily ? COINS.dailyWin : COINS.win[difficulty];
  const coins = Math.max(0, Math.min(want, COINS.winCapPerDay - cur.wins));
  return { coins, next: { ...cur, wins: cur.wins + coins } };
}

/** Whether another rewarded ad pays today. */
export function adAllowed(d: CoinDay | null, day: string): boolean {
  return today(d, day).ads < COINS.adsPerDay;
}

export function adReward(d: CoinDay | null, day: string): { coins: number; next: CoinDay } {
  const cur = today(d, day);
  if (cur.ads >= COINS.adsPerDay) return { coins: 0, next: cur };
  return { coins: COINS.rewardedAd, next: { ...cur, ads: cur.ads + 1 } };
}
