/**
 * Ads on phones: AdMob for the App Store / Google Play builds, Adivery for the Cafe Bazaar build.
 * Only the chosen network's module is loaded, so the other SDK (left out of that build) is never touched.
 */
import { STORE } from '@/constants/store';

type AdsModule = typeof import('./ad-networks/admob');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ads: AdsModule = STORE === 'bazaar' ? require('./ad-networks/adivery') : require('./ad-networks/admob');

export const {
  adsSupported,
  AD_UNIT_IDS,
  adRequestOptions,
  adsReady,
  initAds,
  showInterstitial,
  showRewarded,
  privacyOptionsRequired,
  showPrivacyOptions,
} = ads;
