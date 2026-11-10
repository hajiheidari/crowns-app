/**
 * Play screen shared by the newer puzzle types (path, sun/moon): top bar with timer and pause, the board, a hint
 * card, undo / redo / hint / clear, and the win card. Each puzzle type supplies its board, its win check and its hint.
 */
import { useIsFocused, useRouter } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { Button } from '@/components/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Text } from '@/components/text';
import { formatTime, type Difficulty } from '@/engine';
import { CoinsSheet } from '@/features/coins/coins-sheet';
import { COINS } from '@/features/coins/policy';
import { HintCard } from '@/features/game/hint-card';
import { useGameTimer } from '@/features/game/use-game-timer';
import { WinOverlay } from '@/features/game/win-overlay';
import { shareChallenge, shareNote, shareResultText } from '@/features/share/actions';
import { usePalette } from '@/hooks/use-palette';
import { track } from '@/services/analytics';
import { haptics } from '@/services/haptics';
import { maybeAskForReview } from '@/services/review';
import { spendHint, syncBackup, syncLeague, useGameStore, type ExtraKind, type WinResult } from '@/store/game-store';
import { S } from '@/strings';

export interface ExtraHint {
  title: string;
  body: string;
  /** Cells to point at on the board. */
  highlight: number[];
  /** The game's cells after "Apply". */
  apply: number[];
}

interface Props {
  kind: ExtraKind;
  id: string;
  title: string;
  difficulty: Difficulty;
  /** Date key for a daily puzzle, null for Unlimited. */
  dailyKey: string | null;
  /** True when this is the next Unlimited puzzle in its sequence (solving it moves the sequence on). */
  isNextUnlimited: boolean;
  /** Cells of a fresh game. */
  initial: number[];
  status: (cells: number[]) => string;
  controls: string;
  solved: (cells: number[]) => boolean;
  hint: (cells: number[]) => ExtraHint | null;
  /** Id of the next Unlimited puzzle (after a win), or null for dailies. */
  nextId: () => string | null;
  route: '/path/[id]' | '/binary/[id]';
  versus?: number;
  board: (p: { cells: number[]; locked: boolean; highlight?: number[]; onChange: (cells: number[]) => void }) => ReactNode;
}

export function ExtraScreen(props: Props) {
  const { kind, id, difficulty } = props;
  const { width: screenW, height: screenH } = useWindowDimensions();
  const boardMax = Math.max(280, Math.min(screenW - 24, screenH - (screenH > 900 ? 400 : 300), 760));
  const { c } = usePalette();
  const router = useRouter();
  const focused = useIsFocused();
  const game = useGameStore((s) => s.extra[id]);
  const hapticsOn = useGameStore((s) => s.settings.haptics);
  const showTimer = useGameStore((s) => s.settings.showTimer);
  const hintCredits = useGameStore((s) => s.meta.hintCredits);
  const { startExtra, setExtra, undoExtra, redoExtra, hintExtra, completeExtra, updateSettings } = useGameStore.getState();

  const [paused, setPaused] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [win, setWin] = useState<WinResult | null>(null);
  const [hint, setHint] = useState<{ hint: ExtraHint; cells: number[]; hidden?: boolean } | null>(null);
  const [noHints, setNoHints] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const isNew = !useGameStore.getState().extra[id];
    startExtra(id, props.initial);
    if (isNew) track('puzzle_start', { mode: props.dailyKey ? 'daily' : 'unlimited', difficulty, n: Math.round(Math.sqrt(props.initial.length || 1)) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const solved = !!game?.solved;
  const locked = solved || paused;
  const onTick = useCallback(() => useGameStore.getState().tickExtra(id), [id]);
  useGameTimer(!!game && !solved && !paused && focused, onTick);
  const cells = game?.cells ?? props.initial;

  const change = (next: number[]) => {
    setExtra(id, next);
    if (!props.solved(next)) return;
    const result = completeExtra(kind, id, difficulty, props.dailyKey, props.isNextUnlimited);
    if (!result) return;
    void syncLeague();
    void syncBackup(!!props.dailyKey);
    track('puzzle_complete', { mode: props.dailyKey ? 'daily' : 'unlimited', difficulty, n: 0, seconds: result.seconds, hints: result.hints });
    if (hapticsOn) haptics.success();
    setWin(result);
  };

  const sameCells = (a: number[], b: number[]) => a.length === b.length && a.every((x, i) => x === b[i]);
  const fresh = hint && !solved && sameCells(hint.cells, cells) ? hint : null;
  const active = fresh && !paused && !fresh.hidden ? fresh : null;

  const askHint = () => {
    if (active) return;
    if (fresh) return setHint({ ...fresh, hidden: false });
    const h = props.hint(cells);
    if (!h) return;
    if (!spendHint()) return setNoHints(true);
    hintExtra(id);
    track('hint_used', { stage: 1, level: difficulty, via_ad: false });
    setHint({ hint: h, cells });
  };

  const goHome = () => {
    if (win) maybeAskForReview();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };
  const goNext = () => {
    const next = props.nextId();
    if (!next) return goHome();
    maybeAskForReview();
    router.replace({ pathname: props.route, params: { id: next } });
  };
  const result = { puzzleId: id, seconds: win?.seconds ?? game?.seconds ?? 0, hints: win?.hints ?? game?.hints ?? 0 };
  const share = async () => setNote(shareNote(await shareResultText(result), S.challengeCopied));
  const challenge = async () => setNote(shareNote(await shareChallenge(result), S.challengeCopied));

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
      <View style={styles.topBar}>
        <BackButton onPress={goHome} />
        <View style={styles.titleBox}>
          <Text style={[styles.title, { color: c.text }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {props.title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showTimer ? S.hideTimer : S.showTimer}
            onPress={() => updateSettings({ showTimer: !showTimer })}
            hitSlop={8}>
            <Text style={[styles.timer, { color: c.textSecondary }]} maxFontSizeMultiplier={1.3}>
              {showTimer ? formatTime(game?.seconds ?? 0) : '⏱'}
            </Text>
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={paused ? S.resume : S.pause}
          onPress={() => setPaused(!paused)}
          disabled={solved}
          hitSlop={8}
          style={({ pressed }) => [styles.iconButton, { opacity: solved ? 0.3 : pressed ? 0.6 : 1 }]}>
          <Text style={[styles.iconText, { color: c.text }]} maxFontSizeMultiplier={1.2}>
            {paused ? '▶' : 'Ⅱ'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={[styles.status, { color: c.textSecondary }]}>
          {solved ? S.solvedIn(formatTime(game?.seconds ?? 0)) : props.status(cells)}
        </Text>
        <View style={[styles.boardBox, { maxWidth: boardMax }]}>
          {game && props.board({ cells, locked, highlight: active?.hint.highlight, onChange: change })}
          {paused && (
            <View style={[StyleSheet.absoluteFill, styles.pausedCover, { backgroundColor: c.surfaceMuted }]}>
              <Text style={[styles.pausedText, { color: c.text }]}>{S.paused}</Text>
              <Button label={S.resume} onPress={() => setPaused(false)} />
            </View>
          )}
        </View>
        {active ? (
          <HintCard
            title={active.hint.title}
            body={active.hint.body}
            primary={{
              label: S.hintApply,
              onPress: () => {
                setHint(null);
                track('hint_used', { stage: 3, level: difficulty, via_ad: false });
                change(active.hint.apply);
              },
            }}
            closeLabel={S.hintClose}
            onClose={() => setHint(hint && { ...hint, hidden: true })}
          />
        ) : (
          !solved && <Text style={[styles.help, { color: c.textSecondary }]}>{props.controls}</Text>
        )}
        {solved && !win && (
          <View style={styles.solvedActions}>
            <Button label={S.shareResult} variant="secondary" onPress={share} style={styles.flex} />
            <Button label={S.challengeFriend} variant="secondary" onPress={challenge} style={styles.flex} />
          </View>
        )}
        {solved && !win && note && (
          <Text selectable style={[styles.help, { color: c.textSecondary }]}>
            {note}
          </Text>
        )}
      </View>

      <View style={styles.toolbar}>
        <Tool label={S.undo} glyph="↶" onPress={() => undoExtra(id)} disabled={locked || !game?.undo.length} />
        <Tool label={S.redo} glyph="↷" onPress={() => redoExtra(id)} disabled={locked || !game?.redo.length} />
        <Tool label={S.hint} glyph="💡" onPress={askHint} disabled={locked} badge={hintCredits > 0 ? String(hintCredits) : `${COINS.hint}🪙`} />
        <Tool label={S.clear} glyph="⌫" onPress={() => setConfirmClear(true)} disabled={locked || sameCells(cells, props.initial)} />
      </View>

      <CoinsSheet visible={noHints} need={COINS.hint} onClose={() => setNoHints(false)} />
      <ConfirmDialog
        visible={confirmClear}
        title={S.clearTitle}
        body={S.clearBody}
        confirmLabel={S.clear}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          setExtra(id, props.initial);
          setConfirmClear(false);
        }}
      />
      {win && (
        <WinOverlay
          result={win}
          isDaily={!!props.dailyKey}
          onNext={goNext}
          onHome={goHome}
          onShare={share}
          onChallenge={challenge}
          challengeNote={note}
          versus={props.versus}
        />
      )}
    </SafeAreaView>
  );
}

function Tool(p: { label: string; glyph: string; onPress: () => void; disabled?: boolean; badge?: string }) {
  const { c } = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={p.label}
      onPress={p.onPress}
      disabled={p.disabled}
      style={({ pressed }) => [styles.tool, { backgroundColor: c.surfaceMuted, opacity: p.disabled ? 0.35 : pressed ? 0.7 : 1 }]}>
      <Text style={[styles.toolGlyph, { color: c.text }]} maxFontSizeMultiplier={1.2}>
        {p.glyph}
      </Text>
      <Text style={[styles.toolLabel, { color: c.text }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
        {p.label}
      </Text>
      {p.badge && (
        <Text style={[styles.toolBadge, { backgroundColor: c.gold, color: '#1F1B16' }]} maxFontSizeMultiplier={1.2}>
          {p.badge}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingTop: 4, minHeight: 56, width: '100%', maxWidth: 640, alignSelf: 'center' },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 26, fontWeight: '500' },
  titleBox: { flex: 1, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  timer: { fontSize: 15, fontVariant: ['tabular-nums'], marginTop: 2 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, gap: 12 },
  status: { fontSize: 15, fontWeight: '600' },
  boardBox: { width: '100%' },
  pausedCover: { alignItems: 'center', justifyContent: 'center', gap: 16, borderRadius: 6 },
  pausedText: { fontSize: 22, fontWeight: '700' },
  help: { fontSize: 13, textAlign: 'center' },
  solvedActions: { flexDirection: 'row', gap: 10, width: '100%', maxWidth: 420 },
  flex: { flex: 1 },
  toolbar: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 12, justifyContent: 'center' },
  tool: { flex: 1, maxWidth: 140, height: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toolGlyph: { fontSize: 20 },
  toolBadge: { position: 'absolute', top: 4, right: 6, fontSize: 10, fontWeight: '800', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1, overflow: 'hidden' },
  toolLabel: { fontSize: 13, fontWeight: '600', marginTop: 2 },
});
