/**
 * Which store this build is for. EAS sets EXPO_PUBLIC_STORE=bazaar for the Cafe Bazaar build (eas.json);
 * every other build (App Store, Google Play, web preview) is "global".
 */
export type StoreTarget = 'global' | 'bazaar';
export const STORE: StoreTarget = process.env.EXPO_PUBLIC_STORE === 'bazaar' ? 'bazaar' : 'global';
