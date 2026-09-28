import Constants from 'expo-constants';
import { Platform, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import manifest from '@/assets/packs/manifest.json';
import { Colors } from '@/constants/theme';

const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });

/** Home screen placeholder (M0). The daily card and Unlimited buttons arrive in M1. */
export default function HomeScreen() {
  const c = Colors[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const version = Constants.expoConfig?.version ?? '?';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
      <View style={styles.center}>
        <Text style={[styles.crown, { color: c.gold }]}>♛</Text>
        <Text style={[styles.title, { color: c.text }]}>Crowns</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>Daily logic puzzles</Text>
      </View>
      <Text style={[styles.footer, { color: c.textSecondary }]}>
        v{version} · {manifest.counts.daily.toLocaleString('en-US')} daily puzzles ready
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  crown: { fontSize: 56 },
  title: { fontFamily: serif, fontSize: 44, fontWeight: '600' },
  subtitle: { fontSize: 17 },
  footer: { textAlign: 'center', fontSize: 13, paddingBottom: 16 },
});
