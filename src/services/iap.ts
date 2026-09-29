/**
 * Web preview stand-in for the Remove-Ads purchase (iap.native.ts): a test purchase that costs
 * nothing, so the ad-free app can be tried in a browser.
 */
import { REMOVE_ADS_FALLBACK_PRICE } from '@/constants/monetization';
import { useGameStore } from '@/store/game-store';

import type { BuyResult, RestoreResult } from './iap-types';

export const iapMode: 'store' | 'unavailable' | 'test' = 'test';

export async function initPurchases(): Promise<void> {}

export async function getRemoveAdsPrice(): Promise<string> {
  return REMOVE_ADS_FALLBACK_PRICE;
}

export async function buyRemoveAds(): Promise<BuyResult> {
  useGameStore.getState().updateMeta({ removeAds: true });
  return 'purchased';
}

export async function restorePurchases(): Promise<RestoreResult> {
  return useGameStore.getState().meta.removeAds ? 'restored' : 'none';
}

export function undoTestPurchase(): void {
  useGameStore.getState().updateMeta({ removeAds: false });
}
