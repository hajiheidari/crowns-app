/**
 * Ad network ids and the archive/streak rules (1.1: rewarded ads only, coins instead of purchases).
 * Adivery = Cafe Bazaar build only. Ids from Amir's Adivery panel, 2026-10-04 (only `rewarded` is used now).
 */
export const ADIVERY = {
  appId: 'eb0611ca-efe8-463b-9353-7682f5af4c76',
  banner: '486c4704-1c19-4e93-9748-b50dfb3686da',
  interstitial: 'a18bb148-7401-45ec-9d90-307a03f62d23',
  rewarded: 'cf7d0f94-8597-4a07-b97e-2fb2fd358cf8',
};

export const AD_RULES = {
  /** Archive days newer than this are free. */
  freeArchiveDays: 7,
  /** A broken streak can be repaired once per this many days. */
  streakRepairCooldownDays: 7,
};

/** Free hints a new player starts with (hints are also bought with coins, see features/coins/policy.ts). */
export const HINT_REWARDS = { start: 0 };

/**
 * Cafe Bazaar in-app billing (Poolakey): the app's public RSA key from the Bazaar panel (Amir, 2026-10-08).
 * A public key, safe to ship. Kept for coin packs in a later version (Poolakey).
 */
export const BAZAAR_RSA_KEY =
  'MIHNMA0GCSqGSIb3DQEBAQUAA4G7ADCBtwKBrwCmzC9TlV8GlLjmERBp/F3/hO6Q5AjFK+A6pmYWQucPCCd8NIRxjGEL8JoCJ4kgPotk9ETpEzeVlJNbbnum137+Qff1gDLs+yvfJYm6RtnKXBwcwocrXJyrDBhyadYxvDL9dYAggf8aoIuXepZcM22fQgmcJ2N54DJqryO1fsqqLEoWJckVx5tM1REa3gzs7nxFr2knMVLjqsc66m+S5m/a6w1qxiRhmsRiIYyUsu0CAwEAAQ==';
