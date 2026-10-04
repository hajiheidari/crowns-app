/**
 * Remove-Ads purchase through RevenueCat (non-consumable, spec §5). The result is cached in the
 * store (meta.removeAds) so the app stays ad-free offline; the store is re-checked on each launch.
 */
import { Platform } from 'react-native';
import Purchases, { PRODUCT_CATEGORY, type CustomerInfo, type PurchasesStoreProduct } from 'react-native-purchases';

import { REMOVE_ADS_ENTITLEMENT, REMOVE_ADS_FALLBACK_PRICE, REMOVE_ADS_PRODUCT, REVENUECAT_KEYS } from '@/constants/monetization';
import { useGameStore } from '@/store/game-store';

import type { BuyResult, RestoreResult } from '../iap-types';

const apiKey = Platform.OS === 'ios' ? REVENUECAT_KEYS.ios : REVENUECAT_KEYS.android;
/** 'test' exists only in the web preview. */
export const iapMode: 'store' | 'unavailable' | 'test' = apiKey ? 'store' : 'unavailable';

let configured = false;
let product: PurchasesStoreProduct | null = null;

function sync(info: CustomerInfo): boolean {
  const owned = info.entitlements.active[REMOVE_ADS_ENTITLEMENT] !== undefined;
  // Only ever turn it on from here: a refund or a store hiccup must not flip a paying player back to ads silently.
  if (owned) useGameStore.getState().updateMeta({ removeAds: true });
  return owned;
}

export async function initPurchases(): Promise<void> {
  if (!apiKey || configured) return;
  Purchases.configure({ apiKey });
  configured = true;
  Purchases.addCustomerInfoUpdateListener(sync);
  try {
    sync(await Purchases.getCustomerInfo());
  } catch {
    // Offline: keep the cached value.
  }
}

async function loadProduct(): Promise<PurchasesStoreProduct | null> {
  if (!configured) return null;
  if (!product) {
    const found = await Purchases.getProducts([REMOVE_ADS_PRODUCT], PRODUCT_CATEGORY.NON_SUBSCRIPTION).catch(() => []);
    product = found[0] ?? null;
  }
  return product;
}

export async function getRemoveAdsPrice(): Promise<string> {
  return (await loadProduct())?.priceString ?? REMOVE_ADS_FALLBACK_PRICE;
}

export async function buyRemoveAds(): Promise<BuyResult> {
  const p = await loadProduct();
  if (!p) return 'unavailable';
  try {
    const { customerInfo } = await Purchases.purchaseStoreProduct(p);
    return sync(customerInfo) ? 'purchased' : 'failed';
  } catch (e) {
    return (e as { userCancelled?: boolean }).userCancelled ? 'cancelled' : 'failed';
  }
}

export async function restorePurchases(): Promise<RestoreResult> {
  if (!configured) return 'unavailable';
  try {
    return sync(await Purchases.restorePurchases()) ? 'restored' : 'none';
  } catch {
    return 'failed';
  }
}

/** Web preview only. */
export function undoTestPurchase(): void {}
