/**
 * Adds Firebase to the native config only when its files exist (firebase/README.md). Everything else
 * lives in app.json.
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';

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
      ...(base.plugins ?? []),
      ['@react-native-firebase/app', { ios: { disableSPM: true } }],
      ['expo-build-properties', { ios: { useFrameworks: 'static' } }],
    ],
  };
};
