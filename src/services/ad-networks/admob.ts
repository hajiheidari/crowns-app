/**
 * AdMob for the App Store / Google Play builds (react-native-google-mobile-ads v17, classic API). Consent first (Google UMP, then Apple ATT),
 * then initialize. Rewarded ads always pay out if they fail to load (spec §5).
 */
import * as Tracking from 'expo-tracking-transparency';
import { Platform } from 'react-native';
import mobileAds, {
  AdEventType,
  AdsConsent,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

import { AD_UNITS } from '@/constants/monetization';
import { showTrackingExplainer } from '@/features/monetization/ad-ui';
import { setAdConsent } from '@/services/analytics';

export const adsSupported = true;

const useRealIds = !__DEV__ && process.env.EXPO_PUBLIC_ADS_ENV === 'production';
const units = Platform.OS === 'ios' ? AD_UNITS.ios : AD_UNITS.android;
export const AD_UNIT_IDS = {
  banner: (useRealIds && units.banner) || TestIds.ADAPTIVE_BANNER,
  interstitial: (useRealIds && units.interstitial) || TestIds.INTERSTITIAL,
  rewarded: (useRealIds && units.rewarded) || TestIds.REWARDED,
};

let ready = false;
let nonPersonalized = false;
let initPromise: Promise<void> | null = null;
let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;

export const adRequestOptions = () => ({ requestNonPersonalizedAdsOnly: nonPersonalized });
export const adsReady = () => ready;

/** Consent + SDK start. Safe to call more than once. */
export function initAds(): Promise<void> {
  initPromise ??= (async () => {
    let canRequest = false;
    try {
      canRequest = (await AdsConsent.gatherConsent()).canRequestAds;
    } catch {
      // Offline or form error: fall back to what was agreed last time.
      canRequest = (await AdsConsent.getConsentInfo().catch(() => null))?.canRequestAds ?? false;
    }
    if (Platform.OS === 'ios') {
      let status = (await Tracking.getTrackingPermissionsAsync()).status;
      if (status === Tracking.PermissionStatus.UNDETERMINED) {
        await showTrackingExplainer();
        status = (await Tracking.requestTrackingPermissionsAsync()).status;
      }
      nonPersonalized = status !== Tracking.PermissionStatus.GRANTED;
    }
    setAdConsent(canRequest && !nonPersonalized);
    if (!canRequest) return;
    await mobileAds().initialize();
    ready = true;
    loadInterstitial();
  })();
  return initPromise;
}

/**
 * Where the law needs it (EEA, UK, some US states), players must be able to change their ad consent later;
 * Settings shows a "Privacy choices" row only when Google's consent SDK says so.
 */
export async function privacyOptionsRequired(): Promise<boolean> {
  try {
    return (await AdsConsent.getConsentInfo()).privacyOptionsRequirementStatus === 'REQUIRED';
  } catch {
    return false;
  }
}

/** Opens Google's consent form again; the ads SDK applies the new choice to later ad requests. */
export async function showPrivacyOptions(): Promise<void> {
  await AdsConsent.showPrivacyOptionsForm().catch(() => null);
}

function loadInterstitial() {
  if (!ready) return;
  interstitialLoaded = false;
  interstitial = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial, adRequestOptions());
  interstitial.addAdEventListener(AdEventType.LOADED, () => (interstitialLoaded = true));
  interstitial.addAdEventListener(AdEventType.ERROR, () => (interstitialLoaded = false));
  interstitial.load();
}

/** Shows a preloaded interstitial and resolves when it is closed. False if none was ready. */
export function showInterstitial(): Promise<boolean> {
  const ad = interstitial;
  if (!ready || !ad || !interstitialLoaded) return Promise.resolve(false);
  return new Promise((resolve) => {
    const done = (shown: boolean) => {
      offClose();
      offError();
      loadInterstitial();
      resolve(shown);
    };
    const offClose = ad.addAdEventListener(AdEventType.CLOSED, () => done(true));
    const offError = ad.addAdEventListener(AdEventType.ERROR, () => done(false));
    ad.show().catch(() => done(false));
  });
}

/**
 * Loads and shows a rewarded ad. Resolves true when the reward is earned, or when no ad could be
 * loaded (the player gets the reward anyway). False only if they closed the ad early.
 */
export function showRewarded(): Promise<boolean> {
  if (!ready) return Promise.resolve(true);
  return new Promise((resolve) => {
    let earned = false;
    let settled = false;
    const ad = RewardedAd.createForAdRequest(AD_UNIT_IDS.rewarded, adRequestOptions());
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribe.forEach((off) => off());
      resolve(value);
    };
    const timer = setTimeout(() => finish(true), 8000); // slow network: don't make the player wait
    const unsubscribe = [
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        clearTimeout(timer);
        ad.show().catch(() => finish(true));
      }),
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => (earned = true)),
      ad.addAdEventListener(AdEventType.CLOSED, () => finish(earned)),
      ad.addAdEventListener(AdEventType.ERROR, () => finish(true)),
    ];
    ad.load();
  });
}
