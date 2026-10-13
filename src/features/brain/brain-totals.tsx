/**
 * Brain points this week, month, year and since the first solve (Amir 2026-10-13: long-time players keep credit).
 * Month and year follow the player's calendar (Jalali in Persian).
 */
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { dateKey } from '@/engine';
import { useGameStore } from '@/store/game-store';
import { getLanguage, S } from '@/strings';

import { BRAIN_GOLD } from './brain-card';
import { calendarFor, periodScores } from './score';

const INK = '#1F1B16';

export function BrainTotals() {
  const points = useGameStore((s) => s.points);
  const t = periodScores(points, dateKey(), calendarFor(getLanguage()));
  const items = [
    [S.brainWeek, t.week],
    [S.brainMonth, t.month],
    [S.brainYear, t.year],
    [S.brainAll, t.all],
  ] as const;
  return (
    <LinearGradient colors={BRAIN_GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <Text style={styles.title}>🧠 {S.brainTotalsTitle}</Text>
      <View style={styles.row}>
        {items.map(([label, value]) => (
          <View key={label} style={styles.item}>
            <Text style={styles.value} maxFontSizeMultiplier={1.3}>{value}</Text>
            <Text style={styles.label} maxFontSizeMultiplier={1.3}>{label}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, padding: 16, gap: 12 },
  title: { fontSize: 15, fontWeight: '800', color: INK },
  row: { flexDirection: 'row' },
  item: { flex: 1, alignItems: 'center', gap: 2 },
  value: { fontSize: 24, fontWeight: '800', color: INK, fontVariant: ['tabular-nums'], textAlign: 'center' },
  label: { fontSize: 12, fontWeight: '600', color: '#5C4A12', textAlign: 'center' },
});
