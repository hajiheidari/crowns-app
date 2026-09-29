import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AdHost } from '@/features/monetization/ad-host';
import { usePalette } from '@/hooks/use-palette';
import { initAds } from '@/services/ads';
import { initPurchases } from '@/services/iap';
import { APP_VERSION } from '@/constants/version';
import { dateKey } from '@/engine';
import { useGameStore, useHydrated } from '@/store/game-store';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { c, dark } = usePalette();
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated) return;
    SplashScreen.hideAsync().catch(() => {});
    // First run (on any screen, e.g. opened from a challenge link): remember the install date.
    // Saves from before v0.4.0 have progress but no install date, so they are treated as
    // updated from 0.3.1 and see "What's new".
    const s = useGameStore.getState();
    s.updateMeta({ sessions: s.meta.sessions + 1 });
    initPurchases();
    initAds();
    if (s.meta.installedKey) return;
    const hadProgress = Object.keys(s.games).length > 0 || s.meta.wins > 0;
    s.updateMeta({ installedKey: dateKey(), lastSeenVersion: hadProgress ? '0.3.1' : APP_VERSION });
  }, [hydrated]);

  // Saved games must be loaded before any screen reads or writes them.
  if (!hydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: c.background }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }} />
      <AdHost />
      <StatusBar style={dark ? 'light' : 'dark'} />
    </GestureHandlerRootView>
  );
}
