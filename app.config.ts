/**
 * Build-dependent config on top of app.json:
 * - Firebase only when its files exist (firebase/README.md).
 * - Cafe Bazaar build (EXPO_PUBLIC_STORE=bazaar, eas.json profile "bazaar"): Persian name, no Google ads plugin,
 *   no Firebase, and Google Play billing / ad-id permissions blocked (react-native.config.js drops their modules).
 * - Ad-free build (EXPO_PUBLIC_ADS=off): no AdMob plugin (react-native.config.js drops AdMob and RevenueCat).
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';

type Plugin = NonNullable<ExpoConfig['plugins']>[number];

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { firebaseEnabled, IOS_FILE, ANDROID_FILE } = require('./firebase-config');

const bazaar = process.env.EXPO_PUBLIC_STORE === 'bazaar';
const adsOff = process.env.EXPO_PUBLIC_ADS === 'off';

const pluginName = (p: Plugin) => (Array.isArray(p) ? p[0] : p);
const isGoogleAds = (p: Plugin) => pluginName(p) === 'react-native-google-mobile-ads';
/** Ad-only plugins: AdMob and Apple's tracking prompt (ATT). */
const isAdPlugin = (p: Plugin) => isGoogleAds(p) || pluginName(p) === 'expo-tracking-transparency';

export default ({ config }: ConfigContext): ExpoConfig => {
  if (bazaar) return bazaarConfig(config as ExpoConfig);
  // Ad-free build: no AdMob and no tracking prompt, so the binary has no NSUserTrackingUsageDescription
  // (App Store Connect otherwise asks which data "tracks" users).
  if (adsOff) config = withoutTracking({ ...(config as ExpoConfig), plugins: (config.plugins ?? []).filter((p) => !isAdPlugin(p)) });
  // The app reads extra.firebaseEnabled so it never loads the Firebase JS without its native side.
  const base = { ...(config as ExpoConfig), extra: { ...config.extra, firebaseEnabled } };
  if (!firebaseEnabled) return base;
  return {
    ...base,
    ios: { ...base.ios, googleServicesFile: IOS_FILE },
    android: { ...base.android, googleServicesFile: ANDROID_FILE },
    plugins: [
      ...(base.plugins ?? []).map(withStaticFrameworks),
      ['@react-native-firebase/app', { ios: { disableSPM: true } }],
    ],
  };
};

function bazaarConfig(config: ExpoConfig): ExpoConfig {
  return {
    ...config,
    name: 'تیارو',
    extra: { ...config.extra, firebaseEnabled: false },
    plugins: (config.plugins ?? []).filter((p) => !isGoogleAds(p)).map(withAdiveryProguard),
    android: {
      ...config.android,
      blockedPermissions: [
        ...(config.android?.blockedPermissions ?? []),
        'com.android.vending.BILLING',
        'com.google.android.gms.permission.AD_ID',
      ],
    },
  };
}

/**
 * Adivery's SDK refers to optional mediation networks (e.g. Mintegral) that are not bundled; R8 must not fail on them,
 * and Adivery's own classes are kept as its docs ask.
 */
const ADIVERY_PROGUARD = ['-keep class com.adivery.** { *; }', '-dontwarn com.adivery.**', '-dontwarn com.mbridge.**'].join('\n');

function withAdiveryProguard(plugin: Plugin): Plugin {
  if (!Array.isArray(plugin) || plugin[0] !== 'expo-build-properties') return plugin;
  const props = (plugin[1] ?? {}) as { android?: { extraProguardRules?: string } };
  const extra = [props.android?.extraProguardRules, ADIVERY_PROGUARD].filter(Boolean).join('\n');
  return ['expo-build-properties', { ...props, android: { ...props.android, extraProguardRules: extra } }];
}

/** Firebase needs static iOS frameworks: merged into the expo-build-properties entry from app.json. */
function withStaticFrameworks(plugin: Plugin): Plugin {
  if (!Array.isArray(plugin) || plugin[0] !== 'expo-build-properties') return plugin;
  const props = (plugin[1] ?? {}) as { ios?: object };
  return ['expo-build-properties', { ...props, ios: { ...props.ios, useFrameworks: 'static' } }];
}

/** Drops the ATT prompt text from the localized Info.plist strings (locales/*.json). */
function withoutTracking(config: ExpoConfig): ExpoConfig {
  const locales: Record<string, object> = {};
  for (const [lang, file] of Object.entries(config.locales ?? {})) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const data = typeof file === 'string' ? (require(file) as { ios?: Record<string, string> }) : (file as { ios?: Record<string, string> });
    const ios = { ...data.ios };
    delete ios.NSUserTrackingUsageDescription;
    locales[lang] = { ...data, ios };
  }
  return { ...config, locales };
}
