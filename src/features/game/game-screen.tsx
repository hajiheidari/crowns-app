import { useIsFocused, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { Button } from '@/components/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { applyHint, CROWN, dateKey, explainStep, formatTime, getHint, isSolved, type Hint, type Mark } from '@/engine';
import { Board } from '@/features/game/board';
import { HintCard } from '@/features/game/hint-card';
import { useGameTimer } from '@/features/game/use-game-timer';
import { WinOverlay } from '@/features/game/win-overlay';
import { ZOOM_MIN_N } from '@/features/game/zoom';
import { interstitialAllowed } from '@/features/monetization/policy';
import { streakMilestone } from '@/features/analytics/events';
import { shareChallenge, shareInvite, shareNote } from '@/features/share/actions';
import { ShareSheet } from '@/features/share/share-sheet';
import { getPuzzle, puzzleInfo, unlimitedId } from '@/features/puzzles/catalog';
import { usePalette } from '@/hooks/use-palette';
import { haptics } from '@/services/haptics';
import { enableDailyReminder, remindersSupported } from '@/services/notifications';
import { showInterstitial } from '@/services/ads';
import { track } from '@/services/analytics';
import { maybeAskForReview } from '@/services/review';
import { currentStreak, spendHint, tapCycle, useGameStore, type WinResult } from '@/store/game-store';
import { getLanguage, S } from '@/strings';
import { Text } from '@/components/text';

export function GameScreen({ id, versus }: { id: string; versus?: number }) {
  const { c } = usePalette();
  const router = useRouter();
  const focused = useIsFocused();
  const puzzle = useMemo(() => getPuzzle(id), [id]);
  const info = useMemo(() => puzzleInfo(id), [id]);

  const game = useGameStore((s) => s.games[id]);
  const settings = useGameStore((s) => s.settings);
  const reminderAsked = useGameStore((s) => s.meta.reminderAsked);
  const hintCredits = useGameStore((s) => s.meta.hintCredits);
  const { startGame, commit, undo, redo, clear, tick, complete, updateSettings, addHint } = useGameStore.getState();

  const [paused, setPaused] = useState(false);
  const [challengeNote, setChallengeNote] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [win, setWin] = useState<WinResult | null>(null);
  const [sharing, setSharing] = useState(false);
  const [hint, setHint] = useState<{ hint: Hint; stage: 1 | 2; board: Mark[]; hidden?: boolean } | null>(null);
  const [noHints, setNoHints] = useState(false);
  const [hintNote, setHintNote] = useState<string | null>(null);

  useEffect(() => {
    if (!puzzle || !info) return;
    const isNew = !useGameStore.getState().games[puzzle.id];
    startGame(puzzle.id, puzzle.n);
    if (isNew) track('puzzle_start', { mode: info.mode, difficulty: puzzle.difficulty, n: puzzle.n });
    return () => {
      // Leaving a puzzle with marks on it but unsolved counts as abandoning it (it can still be resumed).
      const g = useGameStore.getState().games[puzzle.id];
      if (!g || g.solved || !g.board.some((m) => m)) return;
      const crowns = g.board.filter((m) => m === CROWN).length;
      track('puzzle_abandon', { mode: info.mode, difficulty: puzzle.difficulty, progress: Math.round((crowns / puzzle.n) * 100) / 100 });
    };
  }, [puzzle, info, startGame]);

  const solved = !!game?.solved;
  const locked = solved || paused;
  const onTick = useCallback(() => tick(id), [id, tick]);
  useGameTimer(!!game && !solved && !paused && focused, onTick);

  /** Run a board change, then check for the win right away. */
  const act = useCallback(
    (change: () => void) => {
      change();
      const g = useGameStore.getState().games[id];
      if (!puzzle || !g || g.solved || !isSolved(puzzle, g.board)) return;
      const result = complete(id, puzzle.difficulty);
      if (!result) return;
      const mode = puzzleInfo(id)?.mode ?? 'unlimited';
      track('puzzle_complete', { mode, difficulty: puzzle.difficulty, n: puzzle.n, seconds: result.seconds, hints: result.hints });
      const milestone = result.streak !== undefined ? streakMilestone(result.streak) : null;
      if (milestone) track('streak_milestone', { days: milestone });
      if (useGameStore.getState().settings.haptics) haptics.success();
      setWin(result);
    },
    [complete, id, puzzle],
  );
  const set = useCallback((cells: number[], to: Mark[]) => act(() => commit(id, cells, to)), [act, commit, id]);
  const onTap = useCallback(
    (cell: number) => {
      const board = useGameStore.getState().games[id]?.board;
      if (!board) return;
      if (settings.haptics) haptics.tap();
      set([cell], [tapCycle(board[cell], settings.tapOrder)]);
    },
    [id, set, settings.haptics, settings.tapOrder],
  );
  const onLongPress = useCallback(
    (cell: number) => {
      const board = useGameStore.getState().games[id]?.board;
      if (!board) return;
      if (settings.haptics) haptics.tap();
      set([cell], [board[cell] === CROWN ? 0 : CROWN]);
    },
    [id, set, settings.haptics],
  );
  const onDragTick = useCallback(() => {
    if (settings.haptics) haptics.tick();
  }, [settings.haptics]);

  if (!puzzle || !info) {
    return (
      <SafeAreaView style={[styles.root, styles.center, { backgroundColor: c.background }]}>
        <Text style={{ color: c.text }}>{S.notFound}</Text>
        <Button label={S.backHome} onPress={() => router.replace('/')} />
      </SafeAreaView>
    );
  }

  const title = info.mode === 'daily' ? S.daily(info.number) : S.unlimitedTitle(info.difficulty, info.number);
  const board = game?.board ?? [];
  const crowns = board.filter((m) => m === CROWN).length;

  // A hint belongs to the board it was asked on; any move makes it stale.
  const freshHint = hint && !solved && sameBoard(hint.board, board) ? hint : null;
  const activeHint = freshHint && !paused && !freshHint.hidden ? freshHint : null;

  // Hints are earned by sharing and inviting (no ads): asking for one spends a free hint; its "why" and "apply"
  // steps are then included.
  const askHint = () => {
    if (activeHint) return;
    // Closed it a moment ago on this same board: show it again without spending another.
    if (freshHint) return setHint({ ...freshHint, hidden: false });
    const h = getHint(puzzle, board);
    if (h.kind === 'solved') return;
    if (!spendHint()) {
      setNoHints(true);
      return;
    }
    addHint(id);
    track('hint_used', { stage: 1, level: puzzle.difficulty, via_ad: false });
    setHint({ hint: h, stage: 1, board });
  };
  const applyActiveHint = () => {
    if (!activeHint) return;
    track('hint_used', { stage: 3, level: puzzle.difficulty, via_ad: false });
    applyHintNow();
  };
  const inviteForHint = async () => {
    setNoHints(false);
    setHintNote(shareNote(await shareInvite(), S.inviteCopied));
  };
  const applyHintNow = () => {
    if (!activeHint) return;
    const next = applyHint(puzzle, board, activeHint.hint);
    const cells = next.map((_, i) => i).filter((i) => next[i] !== board[i]);
    setHint(null);
    act(() => commit(id, cells, cells.map((i) => next[i])));
  };

  let card: { title: string; body: string; primary: { label: string; onPress: () => void } } | null = null;
  let highlight: Set<number> | undefined;
  let danger: Set<number> | undefined;
  if (activeHint) {
    const h = activeHint.hint;
    if (h.kind === 'mistake') {
      danger = new Set(h.cells);
      card = { title: S.hintMistakeTitle, body: S.hintMistakeBody(h.cells.length), primary: { label: S.hintRemove, onPress: applyActiveHint } };
    } else if (h.kind === 'reveal') {
      highlight = new Set([h.cell]);
      card = { title: S.hintRevealTitle, body: S.hintRevealBody, primary: { label: S.hintApply, onPress: applyActiveHint } };
    } else if (h.kind === 'step') {
      highlight = new Set(h.step.focus);
      if (activeHint.stage === 1) {
        card = {
          title: S.hintLookTitle,
          body: S.hintLookBody,
          primary: {
            label: S.hintWhy,
            onPress: () => {
              track('hint_used', { stage: 2, level: puzzle.difficulty, via_ad: false });
              setHint({ ...activeHint, stage: 2 });
            },
          },
        };
      } else {
        const e = explainStep(h.step, { lang: getLanguage() });
        card = { title: e.title, body: e.body, primary: { label: S.hintApply, onPress: applyActiveHint } };
      }
    }
  }

  const reminderOffer =
    win && info.mode === 'daily' && remindersSupported && !reminderAsked
      ? {
          hour: settings.reminder.hour,
          onAnswer: async (yes: boolean) => {
            const s = useGameStore.getState();
            s.updateMeta({ reminderAsked: true });
            if (yes && (await enableDailyReminder(settings.reminder.hour, 0))) {
              track('reminder_enabled');
              s.updateSettings({ reminder: { ...settings.reminder, enabled: true } });
            }
          },
        }
      : undefined;

  // Result to share: the win just now, or a puzzle that was solved earlier.
  const shareResult = solved
    ? {
        puzzleId: id,
        seconds: win?.seconds ?? game?.seconds ?? 0,
        hints: win?.hints ?? game?.hints ?? 0,
        streak: win?.streak ?? (info.mode === 'daily' ? currentStreak(useGameStore.getState().daily, dateKey()) : undefined),
      }
    : null;
  const challenge = async () => {
    if (shareResult) setChallengeNote(shareNote(await shareChallenge(shareResult), S.challengeCopied));
  };

  const goHome = () => {
    if (win) maybeAskForReview();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  const goNext = async () => {
    if (info.mode !== 'unlimited') return;
    const s = useGameStore.getState();
    // Interstitials only ever show here: after a finished Unlimited puzzle, once "Next" is tapped.
    if (interstitialAllowed(s.meta, 'unlimited', Date.now()) && (await showInterstitial())) {
      s.updateMeta({ winsSinceInterstitial: 0, lastInterstitialAt: Date.now() });
    } else {
      maybeAskForReview();
    }
    const next = unlimitedId(info.difficulty, useGameStore.getState().unlimitedIndex[info.difficulty]);
    router.replace({ pathname: '/play/[id]', params: { id: next } });
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
      <View style={styles.topBar}>
        <BackButton onPress={goHome} />
        <View style={styles.titleBox}>
          <Text style={[styles.title, { color: c.text }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={settings.showTimer ? S.hideTimer : S.showTimer}
            onPress={() => updateSettings({ showTimer: !settings.showTimer })}
            hitSlop={8}>
            <Text style={[styles.timer, { color: c.textSecondary }]} maxFontSizeMultiplier={1.3}>
              {settings.showTimer ? formatTime(game?.seconds ?? 0) : '⏱'}
            </Text>
          </Pressable>
        </View>
        <IconButton
          label={paused ? '▶' : 'Ⅱ'}
          a11y={paused ? S.resume : S.pause}
          onPress={() => setPaused(!paused)}
          color={c.text}
          disabled={solved}
        />
      </View>

      <View style={styles.body}>
        <Text style={[styles.status, { color: c.textSecondary }]}>
          {solved ? S.solvedIn(formatTime(game?.seconds ?? 0)) : S.crownsCount(crowns, puzzle.n)}
        </Text>
        <View style={styles.boardBox}>
          {game && (
            <Board
              puzzle={puzzle}
              board={board}
              settings={settings}
              locked={locked}
              onTap={onTap}
              onLongPress={onLongPress}
              onDrag={set}
              onDragTick={onDragTick}
              highlight={highlight}
              danger={danger}
            />
          )}
          {paused && (
            <View style={[StyleSheet.absoluteFill, styles.pausedCover, { backgroundColor: c.surfaceMuted }]}>
              <Text style={[styles.pausedText, { color: c.text }]}>{S.paused}</Text>
              <Button label={S.resume} onPress={() => setPaused(false)} />
            </View>
          )}
        </View>
        {card ? (
          <HintCard title={card.title} body={card.body} primary={card.primary} closeLabel={S.hintClose} onClose={() => setHint(hint && { ...hint, hidden: true })} />
        ) : (
          !solved && (
            <Text style={[styles.help, { color: c.textSecondary }]}>
              {hintNote ?? (puzzle.n >= ZOOM_MIN_N ? S.controlsZoom : S.controls)}
            </Text>
          )
        )}
        {solved && !win && (
          <View style={styles.solvedActions}>
            <Button label={S.shareResult} variant="secondary" onPress={() => setSharing(true)} style={styles.flex} />
            <Button label={S.challengeFriend} variant="secondary" onPress={challenge} style={styles.flex} />
          </View>
        )}
        {solved && !win && challengeNote && (
          <Text selectable style={[styles.help, { color: c.textSecondary }]}>
            {challengeNote}
          </Text>
        )}
      </View>

      <View style={styles.toolbar}>
        <ToolButton label={S.undo} glyph="↶" onPress={() => act(() => undo(id))} disabled={locked || !game?.undo.length} />
        <ToolButton label={S.redo} glyph="↷" onPress={() => act(() => redo(id))} disabled={locked || !game?.redo.length} />
        <ToolButton label={S.hint} glyph="💡" onPress={askHint} disabled={locked} badge={String(hintCredits)} />
        <ToolButton label={S.clear} glyph="⌫" onPress={() => setConfirmClear(true)} disabled={locked || !board.some((m) => m)} />
      </View>

      <ConfirmDialog
        visible={noHints}
        title={S.noHintsTitle}
        body={S.noHintsBody}
        confirmLabel={S.inviteFriends}
        onCancel={() => setNoHints(false)}
        onConfirm={inviteForHint}
      />
      <ConfirmDialog
        visible={confirmClear}
        title={S.clearTitle}
        body={S.clearBody}
        confirmLabel={S.clear}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clear(id);
          setConfirmClear(false);
        }}
      />
      {win && !sharing && (
        <WinOverlay
          result={win}
          isDaily={info.mode === 'daily'}
          onNext={goNext}
          onHome={goHome}
          onShare={() => setSharing(true)}
          onArchive={() => router.replace('/archive')}
          onChallenge={challenge}
          challengeNote={challengeNote}
          versus={versus}
          reminderOffer={reminderOffer}
        />
      )}
      {shareResult && <ShareSheet visible={sharing} puzzle={puzzle} result={shareResult} onClose={() => setSharing(false)} />}
    </SafeAreaView>
  );
}

function sameBoard(a: Mark[], b: Mark[]): boolean {
  return a.length === b.length && a.every((m, i) => m === b[i]);
}

function IconButton(p: { label: string; a11y: string; onPress: () => void; color: string; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={p.a11y}
      onPress={p.onPress}
      disabled={p.disabled}
      hitSlop={8}
      style={({ pressed }) => [styles.iconButton, { opacity: p.disabled ? 0.3 : pressed ? 0.6 : 1 }]}>
      <Text style={[styles.iconText, { color: p.color }]} maxFontSizeMultiplier={1.2}>{p.label}</Text>
    </Pressable>
  );
}

function ToolButton(p: { label: string; glyph: string; onPress: () => void; disabled?: boolean; badge?: string }) {
  const { c } = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={p.label}
      onPress={p.onPress}
      disabled={p.disabled}
      style={({ pressed }) => [styles.tool, { backgroundColor: c.surfaceMuted, opacity: p.disabled ? 0.35 : pressed ? 0.7 : 1 }]}>
      <Text style={[styles.toolGlyph, { color: c.text }]} maxFontSizeMultiplier={1.2}>{p.glyph}</Text>
      <Text style={[styles.toolLabel, { color: c.text }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{p.label}</Text>
      {p.badge && (
        <Text style={[styles.toolBadge, { backgroundColor: c.gold, color: '#1F1B16' }]} maxFontSizeMultiplier={1.2}>{p.badge}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 4,
    minHeight: 56,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 26, fontWeight: '500' },
  titleBox: { flex: 1, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  timer: { fontSize: 15, fontVariant: ['tabular-nums'], marginTop: 2 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, gap: 12 },
  status: { fontSize: 15, fontWeight: '600' },
  boardBox: { width: '100%', maxWidth: 560 },
  pausedCover: { alignItems: 'center', justifyContent: 'center', gap: 16, borderRadius: 6 },
  pausedText: { fontSize: 22, fontWeight: '700' },
  help: { fontSize: 13, textAlign: 'center' },
  solvedActions: { flexDirection: 'row', gap: 10, width: '100%', maxWidth: 420 },
  flex: { flex: 1 },
  toolbar: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 12, justifyContent: 'center' },
  tool: { flex: 1, maxWidth: 140, height: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toolGlyph: { fontSize: 20 },
  toolBadge: {
    position: 'absolute',
    top: 4,
    right: 6,
    fontSize: 10,
    fontWeight: '800',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  toolLabel: { fontSize: 13, fontWeight: '600', marginTop: 2 },
});
