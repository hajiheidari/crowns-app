/** Builds without an ad network: no "watch an ad" offers. */
export const rewardedAvailable: boolean = false;
export async function initAds(): Promise<void> {}
export async function showRewarded(): Promise<boolean> {
  return false;
}
