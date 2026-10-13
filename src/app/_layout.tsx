// First import: installs the on-screen error alert before anything else can throw.
import { describeError } from '@/services/crash-alert';

import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AdHost } from '@/features/monetization/ad-host';
import { usePalette } from '@/hooks/use-palette';
import { initAds } from '@/services/ads';
import { enableDailyReminder, remindersSupported } from '@/services/notifications';
import { APP_VERSION } from '@/constants/version';
import { dateKey } from '@/engine';
import { useGameStore, useHydrated } from '@/store/game-store';
import { LANGUAGES, setLanguage, type Language } from '@/i18n';
import { dirStyle, S } from '@/strings';
import { Text } from '@/components/text';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Web: the landing pages link to the game with ?lang=en|fa|ar to open it in that language. */
function languageFromUrl(): Language | null {
  const search = typeof location === 'undefined' ? '' : location.search;
  const lang = new URLSearchParams(search).get('lang');
  return LANGUAGES.includes(lang as Language) ? (lang as Language) : null;
}

const VAZIRMATN = {
  'Vazirmatn-Regular': require('../../assets/fonts/Vazirmatn-Regular.ttf'),
  'Vazirmatn-Medium': require('../../assets/fonts/Vazirmatn-Medium.ttf'),
  'Vazirmatn-SemiBold': require('../../assets/fonts/Vazirmatn-SemiBold.ttf'),
  'Vazirmatn-Bold': require('../../assets/fonts/Vazirmatn-Bold.ttf'),
};

export default function RootLayout() {
  const { c, dark } = usePalette();
  const hydrated = useHydrated();
  const language = useGameStore((s) => s.settings.language);
  // Persian text uses Vazirmatn (see components/text.tsx); English keeps the system font.
  const [fontsLoaded, fontError] = useFonts(VAZIRMATN);

  useEffect(() => {
    if (!hydrated) return;
    SplashScreen.hideAsync().catch(() => {});
    // First run (on any screen, e.g. opened from a challenge link): remember the install date.
    // Saves from before v0.4.0 have progress but no install date, so they are treated as
    // updated from 0.3.1 and see "What's new".
    const s = useGameStore.getState();
    s.updateMeta({ sessions: s.meta.sessions + 1 });
    const asked = languageFromUrl();
    if (asked) s.updateSettings({ language: asked });
    initAds();
    // The daily reminder is on by default (Amir 2026-10-11): ask for notification permission once, at the first
    // launch, and keep it on only if the player allows it. Settings can turn it off or change the time.
    if (remindersSupported && !s.meta.reminderAsked) {
      s.updateMeta({ reminderAsked: true });
      const { hour, minute } = s.settings.reminder;
      void enableDailyReminder(hour, minute).then((on) => {
        const st = useGameStore.getState();
        st.updateSettings({ reminder: { ...st.settings.reminder, enabled: on } });
      });
    }
    if (s.meta.installedKey) return;
    const hadProgress = Object.keys(s.games).length > 0 || s.meta.wins > 0;
    s.updateMeta({ installedKey: dateKey(), lastSeenVersion: hadProgress ? '0.3.1' : APP_VERSION });
  }, [hydrated]);

  // Saved games must be loaded before any screen reads or writes them.
  if (!hydrated || (!fontsLoaded && !fontError)) return null;

  // Text reads the language at render time; remounting on change (key) redraws every screen.
  // Pass `language` explicitly: the React Compiler would cache a no-argument call here forever.
  setLanguage(language);
  const dir = dirStyle(language);

  return (
    <GestureHandlerRootView key={language} style={[{ flex: 1, backgroundColor: c.background }, dir]}>
      <Stack screenOptions={{ headerShown: false, contentStyle: [{ backgroundColor: c.background }, dir] }} />
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
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F1B16' }}>{S.crashTitle}</Text>
      <Text style={{ marginTop: 8, color: '#1F1B16' }}>{S.crashScreenBody}</Text>
      <ScrollView style={{ marginTop: 16, flex: 1 }}>
        <Text selectable style={{ fontFamily: 'monospace', fontSize: 12, color: '#1F1B16' }}>
          {describeError(error)}
        </Text>
      </ScrollView>
      <Text onPress={retry} style={{ paddingVertical: 20, fontSize: 16, fontWeight: '600', color: '#8A6D0B' }}>
        {S.tryAgain}
      </Text>
    </View>
  );
}
