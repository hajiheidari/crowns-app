import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ScreenHeader } from '@/components/screen-header';
import { dateKey, DIFFICULTIES, formatTime } from '@/engine';
import { BrainTotals } from '@/features/brain/brain-totals';
import { MonthCalendar } from '@/features/stats/month-calendar';
import { Sparkline } from '@/features/stats/sparkline';
import { usePalette } from '@/hooks/use-palette';
import { currentStreak, useGameStore } from '@/store/game-store';
import { DIFFICULTY_LABEL, S } from '@/strings';
import { Text } from '@/components/text';

export default function StatsScreen() {
  const { c } = usePalette();
  const router = useRouter();
  const daily = useGameStore((s) => s.daily);
  const stats = useGameStore((s) => s.stats);
  const streak = currentStreak(daily, dateKey());

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
      <ScreenHeader title={S.stats} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <BrainTotals />
        <Button label={S.certOpen} variant="secondary" onPress={() => router.push('/certificates')} />
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.tiles}>
            <Tile label={S.currentStreak} value={`🔥 ${streak}`} />
            <Tile label={S.bestStreak} value={String(daily.bestStreak)} />
            <Tile label={S.dailiesSolved} value={String(Object.keys(daily.solved).length)} />
          </View>
          <MonthCalendar solved={daily.solved} />
        </View>

        <Text style={[styles.section, { color: c.text }]}>{S.byDifficulty}</Text>
        {DIFFICULTIES.map((d) => {
          const st = stats[d];
          const avg = st.solved ? st.totalSeconds / st.solved : null;
          return (
            <View key={d} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={styles.diffHead}>
                <Text style={[styles.diffTitle, { color: c.text }]}>{DIFFICULTY_LABEL[d]}</Text>
                {!st.solved && <Text style={[styles.muted, { color: c.textSecondary }]}>{S.noSolvesYet}</Text>}
              </View>
              {st.solved > 0 && (
                <>
                  <View style={styles.facts}>
                    <Fact label={S.solvedLabel} value={String(st.solved)} />
                    <Fact label={S.bestTime} value={st.bestSeconds === null ? '–' : formatTime(st.bestSeconds)} />
                    <Fact label={S.averageTime} value={avg === null ? '–' : formatTime(avg)} />
                    <Fact label={S.hintFree} value={String(st.hintFree)} />
                  </View>
                  {st.recent.length > 0 && (
                    <View style={styles.trend}>
                      <Text style={[styles.muted, { color: c.textSecondary }]}>{S.lastTen}</Text>
                      <Sparkline values={st.recent} />
                    </View>
                  )}
                </>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  const { c } = usePalette();
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileValue, { color: c.text }]}>{value}</Text>
      <Text style={[styles.tileLabel, { color: c.textSecondary }]}>{label}</Text>
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const { c } = usePalette();
  return (
    <View style={styles.fact}>
      <Text style={[styles.factLabel, { color: c.textSecondary }]}>{label}</Text>
      <Text style={[styles.factValue, { color: c.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 12, maxWidth: 560, width: '100%', alignSelf: 'center' },
  card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 14 },
  tiles: { flexDirection: 'row' },
  tile: { flex: 1, alignItems: 'center', gap: 2 },
  tileValue: { fontSize: 24, fontWeight: '700', fontVariant: ['tabular-nums'] },
  tileLabel: { fontSize: 12, textAlign: 'center' },
  section: { fontSize: 20, fontWeight: '700', marginTop: 8 },
  diffHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  diffTitle: { fontSize: 17, fontWeight: '700' },
  muted: { fontSize: 13 },
  facts: { flexDirection: 'row' },
  fact: { flex: 1, gap: 2 },
  factLabel: { fontSize: 12 },
  factValue: { fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  trend: { gap: 4 },
});
