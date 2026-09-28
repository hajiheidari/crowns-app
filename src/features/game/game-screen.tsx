import { useIsFocused, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { applyHint, CROWN, explainStep, formatTime, getHint, isSolved, type Hint, type Mark } from '@/engine';
import { Board } from '@/features/game/board';
import { HintCard } from '@/features/game/hint-card';
import { useGameTimer } from '@/features/game/use-game-timer';
import { WinOverlay } from '@/features/game/win-overlay';
import { getPuzzle, puzzleInfo, unlimitedId } from '@/features/puzzles/catalog';
import { usePalette } from '@/hooks/use-palette';
import { haptics } from '@/services/haptics';
import { tapCycle, useGameStore, type WinResult } from '@/store/game-store';
import { S } from '@/strings';

export function GameScreen({ id }: { id: string }) {
  const { c } = usePalette();
  const router = useRouter();
  const focused = useIsFocused();
  const puzzle = useMemo(() => getPuzzle(id), [id]);
  const info = useMemo(() => puzzleInfo(id), [id]);

  const game = useGameStore((s) => s.games[id]);
  const settings = useGameStore((s) => s.settings);
  const { startGame, commit, undo, redo, clear, tick, complete, updateSettings, addHint } = useGameStore.getState();

  const [paused, setPaused] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [win, setWin] = useState<WinResult | null>(null);
  const [hint, setHint] = useState<{ hint: Hint; stage: 1 | 2; board: Mark[] } | null>(null);

  useEffect(() => {
    if (puzzle) startGame(puzzle.id, puzzle.n);
  }, [puzzle, startGame]);

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
  const activeHint = hint && !solved && !paused && sameBoard(hint.board, board) ? hint : null;

  const askHint = () => {
    const h = getHint(puzzle, board);
    if (h.kind !== 'solved') setHint({ hint: h, stage: 1, board });
  };
  const applyActiveHint = () => {
    if (!activeHint) return;
    const next = applyHint(puzzle, board, activeHint.hint);
    const cells = next.map((_, i) => i).filter((i) => next[i] !== board[i]);
    if (activeHint.stage === 1) addHint(id);
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
              addHint(id);
              setHint({ ...activeHint, stage: 2 });
            },
          },
        };
      } else {
        const e = explainStep(h.step);
        card = { title: e.title, body: e.body, primary: { label: S.hintApply, onPress: applyActiveHint } };
      }
    }
  }

  const goHome = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const goNext = () => {
    if (info.mode !== 'unlimited') return;
    const next = unlimitedId(info.difficulty, useGameStore.getState().unlimitedIndex[info.difficulty]);
    router.replace({ pathname: '/play/[id]', params: { id: next } });
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
      <View style={styles.topBar}>
        <IconButton label="‹" a11y={S.back} onPress={goHome} color={c.text} />
        <View style={styles.titleBox}>
          <Text style={[styles.title, { color: c.text }]}>{title}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={settings.showTimer ? 'Hide timer' : 'Show timer'}
            onPress={() => updateSettings({ showTimer: !settings.showTimer })}
            hitSlop={8}>
            <Text style={[styles.timer, { color: c.textSecondary }]}>
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
          <HintCard title={card.title} body={card.body} primary={card.primary} closeLabel={S.hintClose} onClose={() => setHint(null)} />
        ) : (
          !solved && <Text style={[styles.help, { color: c.textSecondary }]}>{S.controls}</Text>
        )}
      </View>

      <View style={styles.toolbar}>
        <ToolButton label={S.undo} glyph="↶" onPress={() => act(() => undo(id))} disabled={locked || !game?.undo.length} />
        <ToolButton label={S.redo} glyph="↷" onPress={() => act(() => redo(id))} disabled={locked || !game?.redo.length} />
        <ToolButton label={S.hint} glyph="💡" onPress={askHint} disabled={locked} />
        <ToolButton label={S.clear} glyph="⌫" onPress={() => setConfirmClear(true)} disabled={locked || !board.some((m) => m)} />
      </View>

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
      {win && <WinOverlay result={win} isDaily={info.mode === 'daily'} onNext={goNext} onHome={goHome} />}
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
      <Text style={[styles.iconText, { color: p.color }]}>{p.label}</Text>
    </Pressable>
  );
}

function ToolButton(p: { label: string; glyph: string; onPress: () => void; disabled?: boolean }) {
  const { c } = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={p.label}
      onPress={p.onPress}
      disabled={p.disabled}
      style={({ pressed }) => [styles.tool, { backgroundColor: c.surfaceMuted, opacity: p.disabled ? 0.35 : pressed ? 0.7 : 1 }]}>
      <Text style={[styles.toolGlyph, { color: c.text }]}>{p.glyph}</Text>
      <Text style={[styles.toolLabel, { color: c.text }]}>{p.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingTop: 4, height: 56 },
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
  toolbar: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 12, justifyContent: 'center' },
  tool: { flex: 1, maxWidth: 140, height: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toolGlyph: { fontSize: 20 },
  toolLabel: { fontSize: 13, fontWeight: '600', marginTop: 2 },
});
