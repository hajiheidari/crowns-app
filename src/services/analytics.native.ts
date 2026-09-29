/**
 * Firebase Analytics. Does nothing until the Firebase config files are added (firebase/README.md),
 * so the app works the same without a Firebase project.
 */
import { getAnalytics, logEvent, setConsent } from '@react-native-firebase/analytics';

import { toFirebaseParams, type EventName, type EventParams } from '@/features/analytics/events';

function analytics() {
  try {
    return getAnalytics();
  } catch {
    return null; // Firebase not configured in this build
  }
}

export function track<E extends EventName>(name: E, ...params: EventParams<E> extends undefined ? [] : [EventParams<E>]): void {
  const a = analytics();
  if (!a) return;
  try {
    Promise.resolve(logEvent(a, name, toFirebaseParams(params[0] as Record<string, string | number | boolean> | undefined))).catch(() => {});
  } catch {
    // Never let analytics break the game.
  }
}

/** Called after the ad consent flow: usage stats are always anonymous; ad signals follow the player's choice. */
export function setAdConsent(personalizedAds: boolean): void {
  const a = analytics();
  if (!a) return;
  setConsent(a, {
    analytics_storage: true,
    ad_storage: personalizedAds,
    ad_user_data: personalizedAds,
    ad_personalization: personalizedAds,
  }).catch(() => {});
}
