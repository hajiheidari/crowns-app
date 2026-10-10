/**
 * The ad rules from spec §5 as plain functions, so they can be tested without a phone.
 * Hard limits: no interstitial in the first session, the first puzzles, on the daily, or mid-puzzle.
 */
import { AD_RULES } from '@/constants/monetization';
import { addDays, DAILY_EPOCH } from '@/engine';

export interface AdCounters {
  removeAds: boolean;
  /** App launches, including this one. */
  sessions: number;
  /** Puzzles completed since install. */
  wins: number;
  /** Puzzles completed since the last interstitial (or since install). */
  winsSinceInterstitial: number;
  lastInterstitialAt: number | null;
}

/** Called when the player taps "Next puzzle" in Unlimited mode. */
export function interstitialAllowed(c: AdCounters, mode: 'daily' | 'unlimited', now: number): boolean {
  if (c.removeAds || mode !== 'unlimited') return false;
  if (c.sessions <= 1 || c.wins <= AD_RULES.interstitialAfterWins) return false;
  if (c.winsSinceInterstitial < AD_RULES.interstitialEvery) return false;
  return c.lastInterstitialAt === null || now - c.lastInterstitialAt >= AD_RULES.interstitialMinGapMs;
}

/** First day shown in the archive. Before launch the last 30 days are shown as previews. */
export function archiveStart(today: string): string {
  return today <= DAILY_EPOCH ? addDays(today, -30) : DAILY_EPOCH;
}

/** Past dailies: the last week is free, older days need a rewarded ad once. */
export function archiveLocked(key: string, today: string, removeAds: boolean, unlocked: string[]): boolean {
  if (removeAds || key >= addDays(today, -AD_RULES.freeArchiveDays)) return false;
  return !unlocked.includes(key);
}

/**
 * A streak broken by exactly one missed day can be repaired with a rewarded ad,
 * at most once per week. Returns the streak that would come back, or null.
 */
export function streakRepairOffer(
  daily: { streak: number; lastSolvedKey: string | null },
  today: string,
  lastRepairKey: string | null,
): number | null {
  if (!daily.lastSolvedKey || daily.streak < 2) return null;
  if (daily.lastSolvedKey !== addDays(today, -2)) return null;
  if (lastRepairKey && today < addDays(lastRepairKey, AD_RULES.streakRepairCooldownDays)) return null;
  return daily.streak;
}
