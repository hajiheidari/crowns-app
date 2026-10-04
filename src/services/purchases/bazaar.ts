/**
 * Cafe Bazaar build: Google Play billing / RevenueCat are not allowed there. Bazaar's own billing
 * (Poolakey) needs the app's RSA key from the Bazaar panel; until it is added, purchases stay hidden.
 */
import { REMOVE_ADS_FALLBACK_PRICE } from '@/constants/monetization';

import type { BuyResult, RestoreResult } from '../iap-types';

export const iapMode: 'store' | 'unavailable' | 'test' = 'unavailable';

export async function initPurchases(): Promise<void> {}

export async function getRemoveAdsPrice(): Promise<string> {
  return REMOVE_ADS_FALLBACK_PRICE;
}

export async function buyRemoveAds(): Promise<BuyResult> {
  return 'unavailable';
}

export async function restorePurchases(): Promise<RestoreResult> {
  return 'unavailable';
}

export function undoTestPurchase(): void {}
