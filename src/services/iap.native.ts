/**
 * Remove-Ads purchase on phones: RevenueCat (App Store / Google Play) or the Cafe Bazaar module.
 * Only the chosen one is loaded, so the Bazaar build never touches RevenueCat (left out of that build).
 */
import { STORE } from '@/constants/store';

type IapModule = typeof import('./purchases/revenuecat');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const iap: IapModule = STORE === 'bazaar' ? require('./purchases/bazaar') : require('./purchases/revenuecat');

export const { iapMode, initPurchases, getRemoveAdsPrice, buyRemoveAds, restorePurchases, undoTestPurchase } = iap;
