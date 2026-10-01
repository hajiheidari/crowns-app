// First import: installs the on-screen error alert before anything else can throw.
import { describeError } from '@/services/crash-alert';

import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
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

/** Shown instead of a blank screen when a screen fails to render, so testers can screenshot the error. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  SplashScreen.hideAsync().catch(() => {});
  return (
    <View style={{ flex: 1, backgroundColor: '#FAF7F0', paddingTop: 64, paddingHorizontal: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F1B16' }}>Crowns hit an error</Text>
      <Text style={{ marginTop: 8, color: '#1F1B16' }}>Please send a screenshot of this screen.</Text>
      <ScrollView style={{ marginTop: 16, flex: 1 }}>
        <Text selectable style={{ fontFamily: 'monospace', fontSize: 12, color: '#1F1B16' }}>
          {describeError(error)}
        </Text>
      </ScrollView>
      <Text onPress={retry} style={{ paddingVertical: 20, fontSize: 16, fontWeight: '600', color: '#8A6D0B' }}>
        Try again
      </Text>
    </View>
  );
}
