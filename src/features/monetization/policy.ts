/**
 * Archive and streak-repair rules as plain functions, so they can be tested without a phone.
 * (1.1: ads are rewarded only, so the interstitial rules are gone.)
 */
import { AD_RULES } from '@/constants/monetization';
import { addDays, DAILY_EPOCH } from '@/engine';

/** First day shown in the archive. Before launch the last 30 days are shown as previews. */
export function archiveStart(today: string): string {
  return today <= DAILY_EPOCH ? addDays(today, -30) : DAILY_EPOCH;
}

/** Past dailies: the last week is free, older days are unlocked once with coins. */
export function archiveLocked(key: string, today: string, unlocked: string[]): boolean {
  if (key >= addDays(today, -AD_RULES.freeArchiveDays)) return false;
  return !unlocked.includes(key);
}

/**
 * A streak broken by exactly one missed day can be repaired with coins,
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
