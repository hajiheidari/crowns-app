import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Alert, AppState, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { CrownIcon } from '@/components/crown-icon';
import { SettingsIcon, StatsIcon } from '@/components/icons';
import { dateKey, DIFFICULTIES, formatTime, type Difficulty } from '@/engine';
import { dailyIdFor, getPuzzle, puzzleInfo, unlimitedId } from '@/features/puzzles/catalog';
import { BrainCard } from '@/features/brain/brain-card';
import { CoinsSheet } from '@/features/coins/coins-sheet';
import { COINS } from '@/features/coins/policy';
import { streakRepairOffer } from '@/features/monetization/policy';
import { rewardedAvailable } from '@/services/ads';
import { reportGameCenter } from '@/services/game-center';

import { usePalette } from '@/hooks/use-palette';
import { shareInvite, shareNote } from '@/features/share/actions';
import { checkCertificates, claimLoginCoins, currentStreak, loadLeague, noteInvitedBy, spendCoins, syncBackup, syncEarnedCoins, useGameStore, watchAdForCoins } from '@/store/game-store';
import { DIFFICULTY_LABEL, DIFFICULTY_SIZES, isRTL, S } from '@/strings';
import { APP_VERSION } from '@/constants/version';
import { Text } from '@/components/text';

/** Unlimited Puzzles tile height: one row of four needs TILE_MIN; two rows of two share all the free height. */
const TILE_MIN = 76;
/** Two rows of two only when each row gets at least this (big tiles hold bigger text, Persian lines are tall). */
const TILE_BIG = 112;
// The brain card on squeezed phones: its smallest height that still fits Vazirmatn's tall lines.
const BRAIN_COMPACT = 112;

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
  const [coinsSheet, setCoinsSheet] = useState<number | null | undefined>(undefined); // undefined = closed
  const [dailyHeight, setDailyHeight] = useState(0);
  const [gridHeight, setGridHeight] = useState(0);
  const [newCert, setNewCert] = useState<string | null>(null);

  // Opened from an invite link (<LINK_BASE>/?r=<code>).
  useEffect(() => noteInvitedBy(invitedBy), [invitedBy]);

  // Daily login coins (once a day, more for days in a row), then friends who opened this player's links since the
  // last look (checked by the server) turn into coins.
  useEffect(() => {
    const check = async () => {
      // First: on a reinstalled iPhone this brings the old progress back (keychain key) before anything else runs.
      await syncBackup();
      if (useGameStore.getState().meta.restoredAuto) {
        useGameStore.getState().updateMeta({ restoredAuto: false });
        Alert.alert(S.backupWelcomeTitle, S.backupWelcomeBody);
      }
      const login = claimLoginCoins();
      if (login) setInviteNote(S.loginBonus(login.coins, login.streak));
      void loadLeague(); // keeps the league rank on the brain card fresh
      void reportGameCenter();
      const n = await syncEarnedCoins();
      if (n > 0) setInviteNote(S.hintEarned(n / COINS.perFriend));
      // Say so once, when a new certificate shows up.
      if ((await checkCertificates()) > 0) {
        const { certs } = useGameStore.getState().meta;
        if (certs.length) setNewCert(S.certHeads[certs[certs.length - 1].kind]);
      }
    };
    void check();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && void check());
    return () => sub.remove();
  }, []);

  const info = puzzleInfo(todayId);
  const puzzle = getPuzzle(todayId);
  const streak = currentStreak(daily, today);
  const repairable = streakRepairOffer(daily, today, meta.lastRepairKey);
  const repair = () => {
    if (spendCoins(COINS.streakRepair)) useGameStore.getState().repairStreak(dateKey());
    else setCoinsSheet(COINS.streakRepair);
  };
  const watchAd = async () => {
    const r = await watchAdForCoins();
    setInviteNote(r === 'earned' ? S.coinsEarned(COINS.rewardedAd) : r === 'limit' ? S.coinsAdLimit : r === 'unavailable' ? S.coinsAdUnavailable : null);
  };
  // Unlimited tiles: one row of four, or two rows of two when the screen leaves enough height (Amir: as big as possible).
  // Never scroll on a phone: if the content still comes out taller than the screen (fonts, languages, safe areas
  // differ per phone), squeeze step by step: 1 = one row of tiles, 2 = no coins description, 3 = a compact brain card,
  // 4 = no note under the invite button, 5 = tiles without the solved count, 6 = no version line (it is in Settings too)
  // (Amir 2026-10-13).
  const [squeeze, setSqueeze] = useState(0);
  const [viewH, setViewH] = useState(0);
  const [contentH, setContentH] = useState(0);
  // Both sizes can arrive in either order, and a step that changes nothing sends no new size: so after each step wait a
  // moment for the new content height, then squeeze again if it still overflows.
  useEffect(() => {
    if (!(viewH > 0 && contentH > viewH && squeeze < 6)) return;
    const t = setTimeout(() => setSqueeze((q) => Math.min(6, q + 1)), 60);
    return () => clearTimeout(t);
  }, [viewH, contentH, squeeze]);
  const twoRows = squeeze === 0 && gridHeight >= 2 * TILE_BIG + 8;

  const state = todayGame?.solved ? 'solved' : todayGame && todayGame.seconds > 0 ? 'continue' : 'play';
  const cta =
    state === 'solved'
      ? `${S.solved} ✓ ${formatTime(todayGame!.seconds)}`
      : state === 'continue'
        ? `${S.continue} ${formatTime(todayGame!.seconds)}`
        : S.play;

  // Small phones (iPhone SE 1st gen, compact Androids): tighter header so the streak pill never overlaps the name.
  const { width: screenW, height: screenH } = useWindowDimensions();
  const narrow = screenW < 360;
  // Short phones (iPhone SE, 667 pt): the coins card drops its description so Home still fits.
  const short = screenH < 720 || squeeze >= 2;
  const open = (id: string) => router.push({ pathname: '/play/[id]', params: { id } });

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
      {/*
        Home layout (Amir asked for this many times, keep it): one screen, no scrolling, no gaps. The brain card is exactly
        as tall as the daily card (1.1); the Unlimited Puzzles tiles take all the free height (flexGrow), in one row of four
        or, when there is room, two rows of two. The page only scrolls when the content really can't fit (tiny phones,
        huge fonts), and never bounces when it fits.
      */}
      <ScrollView
        contentContainerStyle={[styles.scroll, narrow && styles.scrollNarrow]}
        alwaysBounceVertical={false}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        onLayout={(e) => setViewH(Math.round(e.nativeEvent.layout.height))}
        onContentSizeChange={(_w, h) => setContentH(Math.round(h))}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <CrownIcon size={narrow ? 24 : 30} color={c.gold} />
            <Text style={[styles.wordmark, narrow && styles.wordmarkSmall, { color: c.text }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
              {S.appName}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={S.coinsCardTitle(meta.coins)}
              onPress={() => setCoinsSheet(null)}
              hitSlop={4}
              style={({ pressed }) => [styles.streak, { backgroundColor: c.gold + '2E', opacity: pressed ? 0.7 : 1 }]}>
              <Text style={styles.flame}>🪙</Text>
              <Text style={[styles.streakText, { color: c.text }]}>{meta.coins}</Text>
            </Pressable>
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

        <View
          style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
          onLayout={(e) => setDailyHeight(Math.round(e.nativeEvent.layout.height))}>
          <View style={styles.cardHead}>
            <View style={styles.flexShrink}>
              <Text style={[styles.cardEyebrow, { color: c.textSecondary }]}>{S.today.toUpperCase()}</Text>
              <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit>
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
          <Button label={cta} variant={state === 'solved' ? 'secondary' : 'primary'} onPress={() => open(todayId)} style={styles.compactButton} />
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
              <Button label={S.streakRepair} variant="ghost" onPress={repair} />
            </View>
          )}
        </View>

        <BrainCard
          today={today}
          streak={streak}
          solvedToday={!!todayGame?.solved}
          onPress={() => router.push('/league')}
          height={squeeze >= 3 ? BRAIN_COMPACT : repairable === null && dailyHeight > 0 ? dailyHeight : undefined}
        />

        <View style={[styles.hints, { backgroundColor: c.gold + '24', borderColor: c.gold }]}>
          <View style={styles.coinsHead}>
            <Text style={[styles.hintsTitle, { color: c.text }]}>{S.coinsCardTitle(meta.coins)}</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/shop')} hitSlop={10}>
              {({ pressed }) => (
                <Text style={[styles.archiveLink, { color: c.text, opacity: pressed ? 0.6 : 1 }]}>🛍 {S.shopTitle}</Text>
              )}
            </Pressable>
          </View>
          {!short && <Text style={[styles.hintsBody, { color: c.textSecondary }]} numberOfLines={2}>{S.coinsCardBody}</Text>}
          <View style={styles.coinsButtons}>
            <Button
              label={`🎁 ${S.inviteFriends}`}
              onPress={async () => setInviteNote(shareNote(await shareInvite(), S.inviteCopied))}
              style={[styles.compactButton, styles.flex]}
            />
            {rewardedAvailable && (
              <Button label={`▶ +${COINS.rewardedAd} 🪙`} variant="secondary" onPress={watchAd} style={styles.compactButton} />
            )}
          </View>
          {/* How coins are earned, always under the buttons; replaced by the latest reward or share result. */}
          {(squeeze < 4 || inviteNote) && (
            <Text selectable style={[styles.hintsNote, { color: inviteNote ? c.text : c.textSecondary }]}>
              {inviteNote ?? S.hintPending}
            </Text>
          )}
        </View>

        <View style={styles.unlimited}>
          <Text style={[styles.section, { color: c.text }]}>{S.unlimited}</Text>
          <View style={styles.grid} onLayout={(e) => setGridHeight(Math.round(e.nativeEvent.layout.height))}>
            {(twoRows ? [DIFFICULTIES.slice(0, 2), DIFFICULTIES.slice(2)] : [DIFFICULTIES]).map((row) => (
              <View key={row.join()} style={[styles.gridRow, twoRows ? { minHeight: TILE_BIG } : { maxHeight: TILE_MIN + 24 }]}>
                {row.map((d) => (
                  <DifficultyTile
                    key={d}
                    difficulty={d}
                    solved={unlimitedIndex[d]}
                    big={twoRows}
                    compact={squeeze >= 5}
                    onPress={() => open(unlimitedId(d, unlimitedIndex[d]))}
                  />
                ))}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottom}>
          <Button label={S.howToPlay} variant="secondary" onPress={() => router.push('/tutorial')} style={styles.howTo} />
          {squeeze < 6 && <Text style={[styles.footer, { color: c.textSecondary }]}>v{APP_VERSION}</Text>}
        </View>
      </ScrollView>
      <ConfirmDialog
        visible={newCert !== null}
        title={S.certEarnedTitle}
        body={S.certEarnedBody(newCert ?? '')}
        confirmLabel={S.certView}
        onCancel={() => setNewCert(null)}
        onConfirm={() => {
          setNewCert(null);
          router.push('/certificates');
        }}
      />
      <CoinsSheet visible={coinsSheet !== undefined} need={coinsSheet ?? undefined} onClose={() => setCoinsSheet(undefined)} />
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

function DifficultyTile({ difficulty, solved, big, compact, onPress }: { difficulty: Difficulty; solved: number; big: boolean; compact: boolean; onPress: () => void }) {
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
      <Text style={[styles.tileTitle, big && styles.tileTitleBig, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.3}>{DIFFICULTY_LABEL[difficulty]}</Text>
      <Text style={[styles.tileSub, big && styles.tileSubBig, { color: c.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.2}>
        {DIFFICULTY_SIZES[difficulty]}
      </Text>
      {!compact && (
        <Text style={[styles.tileSub, big && styles.tileSubBig, { color: c.textSecondary }]} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.2}>
          {S.solvedCount(solved)}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // Sized so the whole Home fits one phone screen without scrolling (still scrolls on tiny phones / big fonts).
  scroll: { flexGrow: 1, paddingHorizontal: 18, paddingVertical: 8, gap: 8, maxWidth: 680, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scrollNarrow: { paddingHorizontal: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  repair: { borderRadius: 14, padding: 10, gap: 4, alignItems: 'center' },
  repairText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  flexShrink: { flexShrink: 1 },
  wordmark: { fontFamily: serif, fontSize: 28, fontWeight: '600', flexShrink: 1 },
  wordmarkSmall: { fontSize: 24 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  flame: { fontSize: 16 },
  streakText: { fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  card: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 9, gap: 7 },
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
  // Takes the free height; its tiles grow with it.
  unlimited: { flexGrow: 1, gap: 6 },
  grid: { flexGrow: 1, minHeight: TILE_MIN, gap: 8 },
  gridRow: { flex: 1, flexDirection: 'row', gap: 8, minHeight: TILE_MIN },
  bottom: { gap: 2 },
  howTo: { minHeight: 42 },
  compactButton: { minHeight: 44 },
  tile: { flex: 1, justifyContent: 'center', borderRadius: 14, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 11, gap: 1, overflow: 'hidden' },
  tileAccent: { position: 'absolute', top: 0, bottom: 0, width: 6 },
  tileTitle: { fontSize: 15, fontWeight: '700' },
  tileTitleBig: { fontSize: 22 },
  tileSub: { fontSize: 11 },
  tileSubBig: { fontSize: 14 },
  coinsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  coinsButtons: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  footer: { textAlign: 'center', fontSize: 12 },
  hints: { borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 8, gap: 5 },
  hintsTitle: { fontSize: 17, fontWeight: '800' },
  hintsBody: { fontSize: 13, lineHeight: 18 },
  hintsNote: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
