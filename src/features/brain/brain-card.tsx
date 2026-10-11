/** Home card: this week's brain score, its level, the change vs the week before and a 7-day bar chart. */
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { usePalette } from '@/hooks/use-palette';
import { useGameStore } from '@/store/game-store';
import { S } from '@/strings';

import { brainLevel, weekChange, weekScore } from './score';

export function BrainCard({ today, onPress }: { today: string; onPress: () => void }) {
  const { c } = usePalette();
  const log = useGameStore((s) => s.log);
  const { score, previous, days } = weekScore(log, today);
  const change = weekChange(score, previous);
  const max = Math.max(...days, 1);
  const level = S.brainLevels[brainLevel(score)];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${S.brainTitle}: ${score}, ${level}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? 0.8 : 1 }]}>
      <View style={styles.text}>
        <Text style={[styles.title, { color: c.textSecondary }]} numberOfLines={1}>
          🧠 {S.brainTitle}
        </Text>
        <View style={styles.scoreRow}>
          <Text style={[styles.score, { color: c.text }]}>{score}</Text>
          <View style={[styles.level, { backgroundColor: c.gold + '33' }]}>
            <Text style={[styles.levelText, { color: c.text }]}>{level}</Text>
          </View>
        </View>
        <Text style={[styles.change, { color: change === null ? c.textSecondary : change >= 0 ? c.success : c.flame }]} numberOfLines={1}>
          {score === 0 && previous === 0 ? S.brainStart : change === null ? ' ' : S.brainChange(change)}
        </Text>
      </View>
      {/* Oldest day first, today last; the board-like row stays left-to-right like a timeline. */}
      <View style={styles.bars}>
        {days.map((v, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              { height: 6 + (v / max) * 40, backgroundColor: i === 6 ? c.gold : v > 0 ? c.text : c.surfaceMuted, opacity: i === 6 || v === 0 ? 1 : 0.55 },
            ]}
          />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 18, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8, gap: 12 },
  text: { flexShrink: 1, gap: 0 },
  title: { fontSize: 13, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  score: { fontSize: 24, fontWeight: '800', fontVariant: ['tabular-nums'] },
  level: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  levelText: { fontSize: 13, fontWeight: '700' },
  change: { fontSize: 12, fontWeight: '600' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 46, direction: 'ltr' },
  bar: { width: 8, borderRadius: 3 },
});
