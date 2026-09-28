import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CrownIcon } from '@/components/crown-icon';
import { dateKey, DIFFICULTIES, formatTime, type Difficulty } from '@/engine';
import { dailyId, getPuzzle, puzzleInfo, unlimitedId } from '@/features/puzzles/catalog';
import { usePalette } from '@/hooks/use-palette';
import { currentStreak, useGameStore } from '@/store/game-store';
import { DIFFICULTY_LABEL, DIFFICULTY_SIZES, S } from '@/strings';

const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function untilMidnight(now: Date): number {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return Math.ceil((next.getTime() - now.getTime()) / 1000);
}

export default function HomeScreen() {
  const { c } = usePalette();
  const router = useRouter();
  const now = useNow();
  const today = dateKey(now);
  const todayId = dailyId(today);

  const daily = useGameStore((s) => s.daily);
  const todayGame = useGameStore((s) => s.games[todayId]);
  const unlimitedIndex = useGameStore((s) => s.unlimitedIndex);

  const info = puzzleInfo(todayId);
  const puzzle = getPuzzle(todayId);
  const streak = currentStreak(daily, today);

  const state = todayGame?.solved ? 'solved' : todayGame && todayGame.seconds > 0 ? 'continue' : 'play';
  const cta =
    state === 'solved'
      ? `${S.solved} ✓ ${formatTime(todayGame!.seconds)}`
      : state === 'continue'
        ? `${S.continue} ${formatTime(todayGame!.seconds)}`
        : S.play;

  const open = (id: string) => router.push({ pathname: '/play/[id]', params: { id } });

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <CrownIcon size={30} color={c.gold} />
            <Text style={[styles.wordmark, { color: c.text }]}>{S.appName}</Text>
          </View>
          <View
            accessible
            accessibilityLabel={S.streakDays(streak)}
            style={[styles.streak, { backgroundColor: c.surfaceMuted }]}>
            <Text style={styles.flame}>🔥</Text>
            <Text style={[styles.streakText, { color: streak ? c.flame : c.textSecondary }]}>{streak}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.cardEyebrow, { color: c.textSecondary }]}>{S.today.toUpperCase()}</Text>
          <Text style={[styles.cardTitle, { color: c.text }]}>{S.daily(info?.number ?? 0)}</Text>
          {puzzle && (
            <View style={styles.chips}>
              <Chip text={DIFFICULTY_LABEL[puzzle.difficulty]} />
              <Chip text={`${puzzle.n}×${puzzle.n}`} />
            </View>
          )}
          <Button label={cta} variant={state === 'solved' ? 'secondary' : 'primary'} onPress={() => open(todayId)} />
          <Text style={[styles.countdown, { color: c.textSecondary }]}>
            {S.nextDailyIn} {formatTime(untilMidnight(now))}
          </Text>
        </View>

        <Text style={[styles.section, { color: c.text }]}>{S.unlimited}</Text>
        <View style={styles.grid}>
          {DIFFICULTIES.map((d) => (
            <DifficultyTile
              key={d}
              difficulty={d}
              solved={unlimitedIndex[d]}
              onPress={() => open(unlimitedId(d, unlimitedIndex[d]))}
            />
          ))}
        </View>

        <Text style={[styles.rules, { color: c.textSecondary }]}>{S.rules}</Text>
        <Button
          label={S.howToPlay}
          variant="secondary"
          icon={<Text style={[styles.howIcon, { color: c.text }]}>?</Text>}
          onPress={() => router.push('/tutorial')}
        />
        <Text style={[styles.footer, { color: c.textSecondary }]}>v{Constants.expoConfig?.version ?? '?'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({ text }: { text: string }) {
  const { c } = usePalette();
  return (
    <View style={[styles.chip, { backgroundColor: c.surfaceMuted }]}>
      <Text style={[styles.chipText, { color: c.text }]}>{text}</Text>
    </View>
  );
}

function DifficultyTile({ difficulty, solved, onPress }: { difficulty: Difficulty; solved: number; onPress: () => void }) {
  const { c, regions } = usePalette();
  const accent = { easy: regions[3], medium: regions[2], hard: regions[1], expert: regions[0] }[difficulty];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${DIFFICULTY_LABEL[difficulty]}, ${S.solvedCount(solved)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.tile, { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? 0.75 : 1 }]}>
      <View style={[styles.tileAccent, { backgroundColor: accent }]} />
      <Text style={[styles.tileTitle, { color: c.text }]}>{DIFFICULTY_LABEL[difficulty]}</Text>
      <Text style={[styles.tileSub, { color: c.textSecondary }]}>{DIFFICULTY_SIZES[difficulty]}</Text>
      <Text style={[styles.tileSub, { color: c.textSecondary }]}>{S.solvedCount(solved)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 20, gap: 16, maxWidth: 560, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmark: { fontFamily: serif, fontSize: 32, fontWeight: '600' },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  flame: { fontSize: 16 },
  streakText: { fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  card: { borderRadius: 20, borderWidth: 1, padding: 20, gap: 10 },
  cardEyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  cardTitle: { fontFamily: serif, fontSize: 30, fontWeight: '600' },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 13, fontWeight: '600' },
  countdown: { fontSize: 13, textAlign: 'center', fontVariant: ['tabular-nums'] },
  section: { fontSize: 20, fontWeight: '700', marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { flexBasis: '47%', flexGrow: 1, borderRadius: 16, borderWidth: 1, padding: 16, gap: 2, overflow: 'hidden' },
  tileAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  tileTitle: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  tileSub: { fontSize: 13 },
  rules: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  howIcon: { fontSize: 17, fontWeight: '800' },
  footer: { textAlign: 'center', fontSize: 12 },
});
