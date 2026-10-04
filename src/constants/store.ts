/**
 * Which store this build is for. EAS sets EXPO_PUBLIC_STORE=bazaar for the Cafe Bazaar build (eas.json);
 * every other build (App Store, Google Play, web preview) is "global".
 */
export type StoreTarget = 'global' | 'bazaar';
export const STORE: StoreTarget = process.env.EXPO_PUBLIC_STORE === 'bazaar' ? 'bazaar' : 'global';

/**
 * The public web game on playtiaro.com (built by scripts/build-site.mjs with EXPO_PUBLIC_SITE=1).
 * It has no ads and no purchases; the web preview artifact keeps its fake ads to show the flow.
 */
export const PUBLIC_SITE = process.env.EXPO_PUBLIC_SITE === '1';
