/**
 * Web preview stand-in for AdMob (ads.native.ts): no real ads, but a short fake ad shows where
 * a rewarded or interstitial ad would appear, so the flow can be tried in a browser.
 */
import { showMockAd } from '@/features/monetization/ad-ui';

export const adsSupported = false;
export const AD_UNIT_IDS = { banner: '', interstitial: '', rewarded: '' };
export const adRequestOptions = () => ({ requestNonPersonalizedAdsOnly: false });
export const adsReady = () => true;

export async function initAds(): Promise<void> {}

export async function showInterstitial(): Promise<boolean> {
  await showMockAd('interstitial');
  return true;
}

export function showRewarded(): Promise<boolean> {
  return showMockAd('rewarded');
}
