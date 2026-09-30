/**
 * Firebase Analytics. Does nothing until the Firebase config files are added (firebase/README.md),
 * so the app works the same without a Firebase project.
 */
import Constants from 'expo-constants';

import { toFirebaseParams, type EventName, type EventParams } from '@/features/analytics/events';

type FirebaseAnalytics = typeof import('@react-native-firebase/analytics');

// Loaded only in builds that include Firebase: without its native module, importing
// @react-native-firebase throws and crashes the app on start (seen in the 0.8.1 APK).
let lib: FirebaseAnalytics | null | undefined;

function firebase(): FirebaseAnalytics | null {
  if (lib !== undefined) return lib;
  lib = null;
  if (Constants.expoConfig?.extra?.firebaseEnabled !== true) return lib;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    lib = require('@react-native-firebase/analytics') as FirebaseAnalytics;
  } catch {
    lib = null;
  }
  return lib;
}

function analytics() {
  const f = firebase();
  if (!f) return null;
  try {
    return f.getAnalytics();
  } catch {
    return null; // Firebase not configured in this build
  }
}

export function track<E extends EventName>(name: E, ...params: EventParams<E> extends undefined ? [] : [EventParams<E>]): void {
  const a = analytics();
  if (!a) return;
  try {
    Promise.resolve(firebase()!.logEvent(a, name, toFirebaseParams(params[0] as Record<string, string | number | boolean> | undefined))).catch(() => {});
  } catch {
    // Never let analytics break the game.
  }
}

/** Called after the ad consent flow: usage stats are always anonymous; ad signals follow the player's choice. */
export function setAdConsent(personalizedAds: boolean): void {
  const a = analytics();
  if (!a) return;
  firebase()!.setConsent(a, {
    analytics_storage: true,
    ad_storage: personalizedAds,
    ad_user_data: personalizedAds,
    ad_personalization: personalizedAds,
  }).catch(() => {});
}
