/**
 * Build-dependent config on top of app.json:
 * - Firebase only when its files exist (firebase/README.md).
 * - Cafe Bazaar build (EXPO_PUBLIC_STORE=bazaar, eas.json profile "bazaar"): Persian name, no Google ads plugin,
 *   no Firebase, and Google Play billing / ad-id permissions blocked (react-native.config.js drops their modules).
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';

type Plugin = NonNullable<ExpoConfig['plugins']>[number];

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { firebaseEnabled, IOS_FILE, ANDROID_FILE } = require('./firebase-config');

const bazaar = process.env.EXPO_PUBLIC_STORE === 'bazaar';

export default ({ config }: ConfigContext): ExpoConfig => {
  if (bazaar) return bazaarConfig(config as ExpoConfig);
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
  const isGoogleAds = (p: Plugin) => (Array.isArray(p) ? p[0] : p) === 'react-native-google-mobile-ads';
  return {
    ...config,
    name: 'تیارو',
    extra: { ...config.extra, firebaseEnabled: false },
    plugins: (config.plugins ?? []).filter((p) => !isGoogleAds(p)),
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

/** Firebase needs static iOS frameworks: merged into the expo-build-properties entry from app.json. */
function withStaticFrameworks(plugin: Plugin): Plugin {
  if (!Array.isArray(plugin) || plugin[0] !== 'expo-build-properties') return plugin;
  const props = (plugin[1] ?? {}) as { ios?: object };
  return ['expo-build-properties', { ...props, ios: { ...props.ios, useFrameworks: 'static' } }];
}
