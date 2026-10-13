/**
 * Adivery rewarded ads for the Cafe Bazaar build (same contract as none.ts, see src/services/ads.native.ts).
 * No consent form: Adivery serves Iran, where the GDPR/US consent flow does not apply.
 */
import { Adivery } from 'adivery';

import { ADIVERY } from '@/constants/monetization';

export const rewardedAvailable: boolean = true;

let ready = false;
let initPromise: Promise<void> | null = null;
/** Resolves the ad currently on screen. */
let closing: ((rewarded: boolean) => void) | null = null;

export function initAds(): Promise<void> {
  initPromise ??= (async () => {
    try {
      Adivery.configure(ADIVERY.appId);
      Adivery.addGlobalListener({
        onRewardedAdClosed: (_placement, isRewarded) => settle(isRewarded),
        onError: () => settle(false),
      });
      Adivery.prepareRewardedAd(ADIVERY.rewarded);
      ready = true;
    } catch {
      ready = false;
    }
  })();
  return initPromise;
}

function settle(value: boolean) {
  const resolve = closing;
  closing = null;
  resolve?.(value);
  // Have the next one ready.
  Adivery.prepareRewardedAd(ADIVERY.rewarded);
}

/** True when the player watched to the end. False when no ad could be shown (the screen says "try again later"). */
export async function showRewarded(): Promise<boolean> {
  await initAds();
  if (!ready || !(await Adivery.isLoaded(ADIVERY.rewarded).catch(() => false))) {
    if (ready) Adivery.prepareRewardedAd(ADIVERY.rewarded);
    return false;
  }
  return new Promise((resolve) => {
    let done = false;
    const finish = (v: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(v);
    };
    // If Adivery never reports back, don't keep the player waiting.
    const timer = setTimeout(() => {
      closing = null;
      finish(false);
    }, 90000);
    closing = finish;
    Adivery.showAd(ADIVERY.rewarded);
  });
}
