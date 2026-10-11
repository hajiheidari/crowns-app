/**
 * Home card: this week's brain score, its level, the friends-league rank, the change vs the week before and a 7-day
 * bar chart. Always gold (both themes, like the iPhone widget) so it stands out. It takes the free height on Home:
 * on tall phones it grows and the score, bars and padding scale with it (`onLayout`).
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { syncWidget } from '@/services/widget';
import { useGameStore } from '@/store/game-store';
import { getLanguage, S } from '@/strings';

import { brainLevel, weekChange, weekFirstFor, weekScore, weekStart } from './score';

/** Shared with the widget (src/widgets/brain-widget.tsx keeps its own copy: widgets can't import). */
export const BRAIN_GOLD = ['#F8DE7E', '#E9BC36', '#C9971F'] as const;
const INK = '#1F1B16';

export function BrainCard({
  today,
  streak,
  solvedToday,
  onPress,
}: {
  today: string;
  streak: number;
  solvedToday: boolean;
  onPress: () => void;
}) {
  const log = useGameStore((s) => s.log);
  const rank = useGameStore((s) => s.meta.leagueRank);
  const [height, setHeight] = useState(0);
  const { score, previous, days } = weekScore(log, today);
  const change = weekChange(score, previous);
  const max = Math.max(...days, 1);
  const level = S.brainLevels[brainLevel(score)];
  const changeText = score === 0 && previous === 0 ? S.brainStart : change === null ? '' : S.brainChange(change);
  const league = rank && rank.week === weekStart(today, weekFirstFor(getLanguage())) && rank.total > 1 ? S.leagueRank(rank.rank, rank.total) : S.leagueOpen;

  // Keep the iPhone home-screen widget in step with what Home shows.
  useEffect(() => {
    syncWidget({ score, level, change: changeText, streak, solvedToday, days });
  }, [score, level, changeText, streak, solvedToday, days]);

  // Grow with the space Home gives the card (110 at least, about 260 on the tallest phones).
  const big = Math.min(1, Math.max(0, (height - 92) / 160));
  const scoreSize = 26 + big * 28;
  const barsHeight = 42 + big * 74;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${S.brainTitle}: ${score}, ${level}, ${league}`}
      onPress={onPress}
      onLayout={(e) => setHeight(Math.round(e.nativeEvent.layout.height))}
      style={({ pressed }) => [styles.press, { opacity: pressed ? 0.85 : 1 }]}>
      <LinearGradient colors={BRAIN_GOLD} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, { paddingVertical: 8 + big * 14 }]}>
        <View style={[styles.text, { gap: 2 + big * 6 }]}>
          <Text style={styles.title} numberOfLines={1}>
            🧠 {S.brainTitle}
          </Text>
          <View style={styles.scoreRow}>
            <Text style={[styles.score, { fontSize: scoreSize, lineHeight: scoreSize * 1.2 }]}>{score}</Text>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{level}</Text>
            </View>
          </View>
          <View style={styles.chipRow}>
            <View style={[styles.chip, styles.leagueChip]}>
              <Text style={styles.chipText} numberOfLines={1}>
                {league}
              </Text>
            </View>
          </View>
          <Text style={[styles.change, { color: change !== null && change < 0 ? '#8A2A00' : '#14532D' }]} numberOfLines={2}>
            {changeText || ' '}
          </Text>
        </View>
        {/* Oldest day first, today last; a timeline reads left to right in every language. */}
        <View style={[styles.bars, { height: barsHeight }]}>
          {days.map((v, i) => (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  height: 6 + (v / max) * (barsHeight - 6),
                  width: 8 + big * 4,
                  backgroundColor: i === 6 ? '#FFFFFF' : v > 0 ? INK : 'rgba(31,27,22,0.18)',
                  opacity: i === 6 || v === 0 ? 1 : 0.75,
                },
              ]}
            />
          ))}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  press: { flexGrow: 1, minHeight: 92, borderRadius: 18, overflow: 'hidden' },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#B8891A',
    paddingHorizontal: 16,
    gap: 12,
  },
  text: { flexShrink: 1 },
  title: { fontSize: 13, fontWeight: '800', color: 'rgba(31,27,22,0.75)' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  score: { fontWeight: '800', fontVariant: ['tabular-nums'], color: INK },
  chipRow: { flexDirection: 'row' },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  leagueChip: { backgroundColor: 'rgba(31,27,22,0.12)' },
  chipText: { fontSize: 13, fontWeight: '800', color: INK },
  change: { fontSize: 12, fontWeight: '700' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, direction: 'ltr' },
  bar: { borderRadius: 3 },
});
