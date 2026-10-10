/**
 * Ad-free build (ADS_OFF): nothing to buy. Hints and past puzzles are free through ADS_OFF itself, never by saving
 * meta.removeAds, so players do not keep a free Remove-Ads when a later update brings ads.
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
