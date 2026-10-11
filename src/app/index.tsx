import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ADS_OFF } from '@/constants/store';
import { Button } from '@/components/button';
import { CrownIcon } from '@/components/crown-icon';
import { SettingsIcon, StatsIcon } from '@/components/icons';
import { dateKey, DIFFICULTIES, formatTime, type Difficulty } from '@/engine';
import { dailyIdFor, getPuzzle, puzzleInfo, unlimitedId } from '@/features/puzzles/catalog';
import { AdBanner } from '@/features/monetization/ad-banner';
import { streakRepairOffer } from '@/features/monetization/policy';

import { usePalette } from '@/hooks/use-palette';
import { shareInvite, shareNote } from '@/features/share/actions';
import { currentStreak, noteInvitedBy, syncEarnedHints, useGameStore } from '@/store/game-store';
import { DIFFICULTY_LABEL, DIFFICULTY_SIZES, isRTL, S } from '@/strings';
import { APP_VERSION } from '@/constants/version';
import { watchRewarded } from '@/features/monetization/rewarded';
import { Text } from '@/components/text';

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

  const daily = useGameStore((s) => s.daily);
  const unlimitedIndex = useGameStore((s) => s.unlimitedIndex);
  const meta = useGameStore((s) => s.meta);
  // A new player's first week starts easy (see `dailyIdFor`).
  const todayId = dailyIdFor(today, meta.installedKey);
  const todayGame = useGameStore((s) => s.games[todayId]);
  const { r: invitedBy } = useLocalSearchParams<{ r?: string }>();
  const [inviteNote, setInviteNote] = useState<string | null>(null);

  // Opened from an invite link (<LINK_BASE>/?r=<code>).
  useEffect(() => noteInvitedBy(invitedBy), [invitedBy]);

  // Friends who opened this player's links since the last look turn into free hints (checked by the server).
  useEffect(() => {
    const check = async () => {
      const n = await syncEarnedHints();
      if (n > 0) setInviteNote(S.hintEarned(n));
    };
    void check();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && void check());
    return () => sub.remove();
  }, []);

  const info = puzzleInfo(todayId);
  const puzzle = getPuzzle(todayId);
  const streak = currentStreak(daily, today);
  const repairable = streakRepairOffer(daily, today, meta.lastRepairKey);
  const repair = async () => {
    if (await watchRewarded('streak_repair')) useGameStore.getState().repairStreak(dateKey());
  };

  const state = todayGame?.solved ? 'solved' : todayGame && todayGame.seconds > 0 ? 'continue' : 'play';
  const cta =
    state === 'solved'
      ? `${S.solved} ✓ ${formatTime(todayGame!.seconds)}`
      : state === 'continue'
        ? `${S.continue} ${formatTime(todayGame!.seconds)}`
        : S.play;

  // Small phones (iPhone SE 1st gen, compact Androids): tighter header so the streak pill never overlaps the name.
  const narrow = useWindowDimensions().width < 360;
  const open = (id: string) => router.push({ pathname: '/play/[id]', params: { id } });

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={[styles.scroll, narrow && styles.scrollNarrow]}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <CrownIcon size={narrow ? 24 : 30} color={c.gold} />
            <Text style={[styles.wordmark, narrow && styles.wordmarkSmall, { color: c.text }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
              {S.appName}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View
              accessible
              accessibilityLabel={S.streakDays(streak)}
              style={[styles.streak, { backgroundColor: c.surfaceMuted }]}>
              <Text style={styles.flame}>🔥</Text>
              <Text style={[styles.streakText, { color: streak ? c.flame : c.textSecondary }]}>{streak}</Text>
            </View>
            <HeaderButton label={S.stats} onPress={() => router.push('/stats')}>
              <StatsIcon size={22} color={c.text} />
            </HeaderButton>
            <HeaderButton label={S.settings} onPress={() => router.push('/settings')}>
              <SettingsIcon size={22} color={c.text} />
            </HeaderButton>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.cardHead}>
            <View style={styles.flexShrink}>
              <Text style={[styles.cardEyebrow, { color: c.textSecondary }]}>{S.today.toUpperCase()}</Text>
              <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>
                {S.daily(info?.number ?? 0)}
              </Text>
            </View>
            {puzzle && (
              <View style={styles.chips}>
                <Chip text={DIFFICULTY_LABEL[puzzle.difficulty]} />
                <Chip text={`${puzzle.n}×${puzzle.n}`} />
              </View>
            )}
          </View>
          <Button label={cta} variant={state === 'solved' ? 'secondary' : 'primary'} onPress={() => open(todayId)} />
          <View style={styles.cardFoot}>
            <Text style={[styles.countdown, { color: c.textSecondary }]}>
              {S.nextDailyIn} {formatTime(untilMidnight(now))}
            </Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/archive')} hitSlop={10}>
              {({ pressed }) => (
                <Text style={[styles.archiveLink, { color: c.text, opacity: pressed ? 0.6 : 1 }]}>{S.archive}</Text>
              )}
            </Pressable>
          </View>
          {repairable !== null && (
            <View style={[styles.repair, { backgroundColor: c.surfaceMuted }]}>
              <Text style={[styles.repairText, { color: c.text }]}>🔥 {S.streakBroken(repairable)}</Text>
              <Button label={ADS_OFF ? S.streakRepairFree : S.withAd(S.streakRepair)} variant="ghost" onPress={repair} />
            </View>
          )}
        </View>

        <View style={[styles.hints, { backgroundColor: c.gold + '24', borderColor: c.gold }]}>
          <Text style={[styles.hintsTitle, { color: c.text }]}>💡 {S.freeHintsTitle(meta.hintCredits)}</Text>
          <Text style={[styles.hintsBody, { color: c.textSecondary }]}>{S.freeHintsBody}</Text>
          <Button
            label={`🎁 ${S.inviteFriends}`}
            onPress={async () => setInviteNote(shareNote(await shareInvite(), S.inviteCopied))}
          />
          {inviteNote && <Text selectable style={[styles.hintsNote, { color: c.text }]}>{inviteNote}</Text>}
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

        <Button label={S.howToPlay} variant="secondary" onPress={() => router.push('/tutorial')} />
        <Text style={[styles.footer, { color: c.textSecondary }]}>v{APP_VERSION}</Text>
      </ScrollView>
      <AdBanner />
    </SafeAreaView>
  );
}

function HeaderButton({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.headerButton, { opacity: pressed ? 0.6 : 1 }]}>
      {children}
    </Pressable>
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
      {/* On the reading side (right in Persian and Arabic); `start` is not flipped by react-native-web. */}
      <View style={[styles.tileAccent, isRTL() ? { right: 0 } : { left: 0 }, { backgroundColor: accent }]} />
      <Text style={[styles.tileTitle, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.5}>{DIFFICULTY_LABEL[difficulty]}</Text>
      <Text style={[styles.tileSub, { color: c.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit>
        {DIFFICULTY_SIZES[difficulty]} · {S.solvedCount(solved)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // Sized so the whole Home fits one phone screen without scrolling (still scrolls on tiny phones / big fonts).
  scroll: { paddingHorizontal: 18, paddingVertical: 10, gap: 10, maxWidth: 560, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scrollNarrow: { paddingHorizontal: 12, gap: 10 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  repair: { borderRadius: 14, padding: 10, gap: 4, alignItems: 'center' },
  repairText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  flexShrink: { flexShrink: 1 },
  wordmark: { fontFamily: serif, fontSize: 28, fontWeight: '600', flexShrink: 1 },
  wordmarkSmall: { fontSize: 24 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  flame: { fontSize: 16 },
  streakText: { fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  card: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  cardEyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  cardTitle: { fontFamily: serif, fontSize: 26, fontWeight: '600' },
  chips: { flexDirection: 'row', gap: 6, paddingBottom: 4 },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 13, fontWeight: '600' },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  countdown: { fontSize: 13, fontVariant: ['tabular-nums'], flexShrink: 1 },
  archiveLink: { fontSize: 15, fontWeight: '700' },
  section: { fontSize: 19, fontWeight: '700', marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { flexBasis: '47%', flexGrow: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 14, gap: 2, overflow: 'hidden' },
  tileAccent: { position: 'absolute', top: 0, bottom: 0, width: 6 },
  tileTitle: { fontSize: 17, fontWeight: '700' },
  tileSub: { fontSize: 13 },
  footer: { textAlign: 'center', fontSize: 12 },
  hints: { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  hintsTitle: { fontSize: 18, fontWeight: '800' },
  hintsBody: { fontSize: 14, lineHeight: 20 },
  hintsNote: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
});
