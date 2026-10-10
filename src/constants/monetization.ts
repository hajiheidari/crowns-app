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

/**
 * Adivery (Cafe Bazaar build only; AdMob does not serve ads in Iran). Ids from Amir's Adivery panel, 2026-10-04.
 */
export const ADIVERY = {
  appId: 'eb0611ca-efe8-463b-9353-7682f5af4c76',
  banner: '486c4704-1c19-4e93-9748-b50dfb3686da',
  interstitial: 'a18bb148-7401-45ec-9d90-307a03f62d23',
  rewarded: 'cf7d0f94-8597-4a07-b97e-2fb2fd358cf8',
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

/**
 * Hints are earned, never bought (Amir 2026-10-10): a player gets a free hint each time a friend opens one of their
 * links (invite, challenge, shared result) on another device. The server (worker/index.js) checks that and caps it
 * at 5 friends a day, so sending links to yourself earns nothing.
 */
export const HINT_REWARDS = {
  /** Hints a new player starts with. */
  start: 0,
  /** Hints per friend who opens a link. */
  perFriend: 1,
};

/**
 * Cafe Bazaar in-app billing (Poolakey): the app's public RSA key from the Bazaar panel (Amir, 2026-10-08).
 * A public key, safe to ship. Used by `src/services/purchases/bazaar.ts` once Poolakey is added.
 */
export const BAZAAR_RSA_KEY =
  'MIHNMA0GCSqGSIb3DQEBAQUAA4G7ADCBtwKBrwCmzC9TlV8GlLjmERBp/F3/hO6Q5AjFK+A6pmYWQucPCCd8NIRxjGEL8JoCJ4kgPotk9ETpEzeVlJNbbnum137+Qff1gDLs+yvfJYm6RtnKXBwcwocrXJyrDBhyadYxvDL9dYAggf8aoIuXepZcM22fQgmcJ2N54DJqryO1fsqqLEoWJckVx5tM1REa3gzs7nxFr2knMVLjqsc66m+S5m/a6w1qxiRhmsRiIYyUsu0CAwEAAQ==';
