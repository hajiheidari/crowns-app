/**
 * Every analytics event the app sends (spec §6). Parameters are game facts only: no ids, names,
 * dates of birth, free text or anything else that could identify a person.
 */
import type { Difficulty } from '@/engine';

type Mode = 'daily' | 'unlimited';
export type RewardedPlacement = 'coins';

export interface AnalyticsEvents {
  tutorial_begin: undefined;
  tutorial_complete: { skipped: boolean };
  puzzle_start: { mode: Mode; difficulty: Difficulty; n: number };
  puzzle_complete: { mode: Mode; difficulty: Difficulty; n: number; seconds: number; hints: number };
  puzzle_abandon: { mode: Mode; difficulty: Difficulty; progress: number };
  hint_used: { stage: 1 | 2 | 3; level: Difficulty; via_ad: boolean };
  rewarded_offer: { placement: RewardedPlacement };
  rewarded_complete: { placement: RewardedPlacement };
  share_result: { type: 'image' | 'text' };
  challenge_sent: undefined;
  challenge_opened: undefined;
  invite_sent: undefined;
  streak_milestone: { days: number };
  remove_ads_purchase: undefined;
  reminder_enabled: undefined;
  setting_changed: { name: string; value: string };
  shop_buy: { item: string; price: number };
}

export type EventName = keyof AnalyticsEvents;
export type EventParams<E extends EventName> = AnalyticsEvents[E];

/** Streak lengths worth celebrating (and counting). */
export const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];

export function streakMilestone(days: number): number | null {
  return STREAK_MILESTONES.includes(days) ? days : null;
}

/** Firebase limits: 40-char names, 100-char string values; booleans are sent as 0/1. */
export function toFirebaseParams(params: Record<string, string | number | boolean> | undefined) {
  if (!params) return undefined;
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    out[k.slice(0, 40)] = typeof v === 'boolean' ? Number(v) : typeof v === 'string' ? v.slice(0, 100) : v;
  }
  return out;
}
