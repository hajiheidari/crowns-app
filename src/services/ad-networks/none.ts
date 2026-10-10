/** Ad-free build (ADS_OFF): no ad SDK is loaded; rewards are given for free and interstitials never show. */
export const adsSupported = false;
export const AD_UNIT_IDS = { banner: '', interstitial: '', rewarded: '' };
export const adRequestOptions = () => ({ requestNonPersonalizedAdsOnly: true });
export const adsReady = () => false;
export async function initAds(): Promise<void> {}
export async function privacyOptionsRequired(): Promise<boolean> {
  return false;
}
export async function showPrivacyOptions(): Promise<void> {}
export async function showInterstitial(): Promise<boolean> {
  return false;
}
export async function showRewarded(): Promise<boolean> {
  return true;
}
