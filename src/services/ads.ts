/**
 * Web: no real ads. The preview (the Artifact Amir plays) shows a short stand-in for a rewarded ad so the coin flow can
 * be tried; the public site (tiaro.espadna.com) offers no ads at all.
 */
import { PUBLIC_SITE } from '@/constants/store';
import { showMockAd } from '@/features/monetization/ad-ui';

export const rewardedAvailable = !PUBLIC_SITE;

export async function initAds(): Promise<void> {}

/** True when the player watched to the end (and earns the reward). */
export function showRewarded(): Promise<boolean> {
  return PUBLIC_SITE ? Promise.resolve(false) : showMockAd();
}
