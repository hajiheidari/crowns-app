import type { RewardedPlacement } from '@/features/analytics/events';
import { showRewarded } from '@/services/ads';
import { track } from '@/services/analytics';

/** Shows a rewarded ad for a placement and counts the offer and the payout. */
export async function watchRewarded(placement: RewardedPlacement): Promise<boolean> {
  track('rewarded_offer', { placement });
  const earned = await showRewarded();
  if (earned) track('rewarded_complete', { placement });
  return earned;
}
