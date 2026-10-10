/**
 * Ads on phones: AdMob for the App Store / Google Play builds, Adivery for the Cafe Bazaar build, none in the
 * ad-free build (ADS_OFF).
 * Only the chosen network's module is loaded, so the other SDK (left out of that build) is never touched.
 */
import { ADS_OFF, STORE } from '@/constants/store';

type AdsModule = typeof import('./ad-networks/admob');

/* eslint-disable @typescript-eslint/no-require-imports -- lazy: only the chosen SDK is loaded */
const ads: AdsModule = ADS_OFF
  ? require('./ad-networks/none')
  : STORE === 'bazaar'
    ? require('./ad-networks/adivery')
    : require('./ad-networks/admob');

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
