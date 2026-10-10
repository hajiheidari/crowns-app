/**
 * Remove-Ads purchase on phones: RevenueCat (App Store / Google Play) or the Cafe Bazaar module; none in the
 * ad-free build (ADS_OFF: there is nothing to remove).
 * Only the chosen one is loaded, so the Bazaar build never touches RevenueCat (left out of that build).
 */
import { ADS_OFF, STORE } from '@/constants/store';

type IapModule = typeof import('./purchases/revenuecat');

/* eslint-disable @typescript-eslint/no-require-imports -- lazy: only the chosen SDK is loaded */
const iap: IapModule = ADS_OFF
  ? require('./purchases/none')
  : STORE === 'bazaar'
    ? require('./purchases/bazaar')
    : require('./purchases/revenuecat');

export const { iapMode, initPurchases, getRemoveAdsPrice, buyRemoveAds, restorePurchases, undoTestPurchase } = iap;
