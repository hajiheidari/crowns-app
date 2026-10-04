/**
 * Adivery ads for the Cafe Bazaar build: same contract as admob.ts (see src/services/ads.native.ts).
 * No consent form: Adivery serves Iran, where the GDPR/US consent flow does not apply.
 * Rewarded ads still pay out when none can be shown (spec §5).
 */
import { Adivery } from 'adivery';

import { ADIVERY } from '@/constants/monetization';

export const adsSupported = true;
export const AD_UNIT_IDS = { banner: ADIVERY.banner, interstitial: ADIVERY.interstitial, rewarded: ADIVERY.rewarded };
export const adRequestOptions = () => ({ requestNonPersonalizedAdsOnly: false });

let ready = false;
let initPromise: Promise<void> | null = null;
/** Resolvers for the ad currently on screen, keyed by placement. */
const closing = new Map<string, (rewarded: boolean) => void>();

export const adsReady = () => ready;

export function initAds(): Promise<void> {
  initPromise ??= (async () => {
    try {
      Adivery.configure(ADIVERY.appId);
      Adivery.addGlobalListener({
        onInterstitialAdClosed: (placement) => settle(placement, true),
        onRewardedAdClosed: (placement, isRewarded) => settle(placement, isRewarded),
        onError: (placement) => settle(placement, true),
      });
      Adivery.prepareInterstitialAd(ADIVERY.interstitial);
      Adivery.prepareRewardedAd(ADIVERY.rewarded);
      ready = true;
    } catch {
      ready = false;
    }
  })();
  return initPromise;
}

function settle(placement: string, value: boolean) {
  const resolve = closing.get(placement);
  closing.delete(placement);
  resolve?.(value);
  // Have the next one ready.
  if (placement === ADIVERY.interstitial) Adivery.prepareInterstitialAd(placement);
  if (placement === ADIVERY.rewarded) Adivery.prepareRewardedAd(placement);
}

function show(placement: string, timeoutValue: boolean): Promise<boolean> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(v);
    };
    // If Adivery never reports back (no fill, slow network), don't keep the player waiting.
    const timer = setTimeout(() => {
      closing.delete(placement);
      finish(timeoutValue);
    }, 60000);
    closing.set(placement, finish);
    Adivery.showAd(placement);
  });
}

/** Shows a loaded interstitial; false if none was ready. */
export async function showInterstitial(): Promise<boolean> {
  if (!ready || !(await Adivery.isLoaded(ADIVERY.interstitial).catch(() => false))) return false;
  return show(ADIVERY.interstitial, true);
}

/** True when the reward is earned, or when no ad could be shown (the player gets it anyway). */
export async function showRewarded(): Promise<boolean> {
  if (!ready || !(await Adivery.isLoaded(ADIVERY.rewarded).catch(() => false))) {
    if (ready) Adivery.prepareRewardedAd(ADIVERY.rewarded);
    return true;
  }
  return show(ADIVERY.rewarded, true);
}

export async function privacyOptionsRequired(): Promise<boolean> {
  return false;
}

export async function showPrivacyOptions(): Promise<void> {}
