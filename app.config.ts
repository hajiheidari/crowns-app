/**
 * Adds Firebase to the native config only when its files exist (firebase/README.md). Everything else
 * lives in app.json.
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';

type Plugin = NonNullable<ExpoConfig['plugins']>[number];

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { firebaseEnabled, IOS_FILE, ANDROID_FILE } = require('./firebase-config');

export default ({ config }: ConfigContext): ExpoConfig => {
  const base = config as ExpoConfig;
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

/** Firebase needs static iOS frameworks: merged into the expo-build-properties entry from app.json. */
function withStaticFrameworks(plugin: Plugin): Plugin {
  if (!Array.isArray(plugin) || plugin[0] !== 'expo-build-properties') return plugin;
  const props = (plugin[1] ?? {}) as { ios?: object };
  return ['expo-build-properties', { ...props, ios: { ...props.ios, useFrameworks: 'static' } }];
}
