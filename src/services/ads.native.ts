/**
 * Ads on phones are rewarded only (Amir 2026-10-13): the player chooses to watch one and earns coins. No banners and
 * no full-screen ads. The Cafe Bazaar build uses Adivery; the App Store / Google Play builds have no ad network yet
 * (Amir is picking one), so they offer no ads. Only the chosen network's module is loaded.
 */
import { STORE } from '@/constants/store';

type AdsModule = typeof import('./ad-networks/none');

/* eslint-disable @typescript-eslint/no-require-imports -- lazy: only the chosen SDK is loaded */
const ads: AdsModule = STORE === 'bazaar' ? require('./ad-networks/adivery') : require('./ad-networks/none');

export const { rewardedAvailable, initAds, showRewarded } = ads;
