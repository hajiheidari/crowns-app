/**
 * Ad and purchase settings (spec §5). Real ids come from Amir's AdMob / RevenueCat accounts;
 * until they are filled in, Google's test ads are used and the purchase shows as unavailable.
 */
export const REMOVE_ADS_PRODUCT = 'remove_ads';
export const REMOVE_ADS_ENTITLEMENT = 'remove_ads';
/** Shown until the store reports the real, localized price. */
export const REMOVE_ADS_FALLBACK_PRICE = '$3.99';

/** RevenueCat public SDK keys (Project settings → API keys). Empty = purchases unavailable. */
export const REVENUECAT_KEYS = { ios: '', android: '' };

/** Real AdMob ad unit ids. Used only in production builds (EXPO_PUBLIC_ADS_ENV=production in eas.json). */
export const AD_UNITS = {
  ios: { banner: '', interstitial: '', rewarded: '' },
  android: { banner: '', interstitial: '', rewarded: '' },
};

export const AD_RULES = {
  /** Interstitial: at most one per this many completed puzzles… */
  interstitialEvery: 3,
  /** …at least this far apart… */
  interstitialMinGapMs: 3 * 60 * 1000,
  /** …and never during the first puzzles after install. */
  interstitialAfterWins: 3,
  /** Archive days newer than this are free. */
  freeArchiveDays: 7,
  /** A broken streak can be repaired once per this many days. */
  streakRepairCooldownDays: 7,
};
