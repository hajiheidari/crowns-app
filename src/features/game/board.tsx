/**
 * The puzzle board: plain Views (max 121 cells) + one gesture detector.
 *  - tap        → cycle the cell's mark
 *  - long-press → toggle a crown
 *  - drag       → start on empty: paint ✕ on empty cells; start on ✕: erase ✕. Never touches crowns.
 * A drag is previewed locally and committed as ONE move (one undo step) when the finger lifts.
 * Screen readers get one element per cell ("Row 3, column 4, purple region, crown"): double-tap cycles the mark,
 * the "Toggle crown" action places or removes a crown.
 */
import { memo, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View, type AccessibilityActionEvent, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { CrownIcon } from '@/components/crown-icon';
import { autoCrossCells, CROSS, CROWN, EMPTY, findConflicts, REGION_COLOR_NAMES, type Mark, type Puzzle } from '@/engine';
import { RegionPatterns } from '@/features/game/region-patterns';
import { usePalette } from '@/hooks/use-palette';
import type { Settings } from '@/store/game-store';
import { S } from '@/strings';

interface Props {
  puzzle: Puzzle;
  board: Mark[];
  settings: Settings;
  locked: boolean;
  onTap: (cell: number) => void;
  onLongPress: (cell: number) => void;
  onDrag: (cells: number[], to: Mark[]) => void;
  onDragTick: () => void;
  /** Cells outlined in gold (hint focus). */
  highlight?: Set<number>;
  /** Cells outlined in red (mistakes, touching cells in the tutorial). */
  danger?: Set<number>;
  /** Cell showing a fingertip (tutorial demos). */
  finger?: number;
  /** Demo board (tutorial): hidden from screen readers. */
  decorative?: boolean;
}

type DragMode = 'paint' | 'erase';

export function Board({ puzzle, board, settings, locked, onTap, onLongPress, onDrag, onDragTick, highlight, danger, finger, decorative }: Props) {
  const { c, regions: regionColors, dark } = usePalette();
  const { n, regions } = puzzle;
  const [width, setWidth] = useState(0);
  const cellSize = width / n;
  const [preview, setPreview] = useState<Map<number, Mark> | null>(null);
  const drag = useRef<{ start: number; mode: DragMode | null; changed: Map<number, Mark>; last: { x: number; y: number } } | null>(
    null,
  );

  const shown = useMemo(() => {
    if (!preview) return board;
    const b = board.slice();
    preview.forEach((m, i) => (b[i] = m));
    return b;
  }, [board, preview]);

  const auto = useMemo(() => (settings.autoCross ? autoCrossCells(puzzle, shown) : new Set<number>()), [puzzle, shown, settings.autoCross]);
  const conflicts = useMemo(
    () => (settings.highlightConflicts ? findConflicts(puzzle, shown) : new Set<number>()),
    [puzzle, shown, settings.highlightConflicts],
  );

  const cellAt = (x: number, y: number) => {
    if (!cellSize) return -1;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    return row < 0 || col < 0 || row >= n || col >= n ? -1 : row * n + col;
  };

  const visit = (cell: number) => {
    const d = drag.current;
    if (!d?.mode || cell < 0 || d.changed.has(cell)) return;
    const want: Mark = d.mode === 'paint' ? EMPTY : CROSS;
    if (board[cell] !== want) return;
    d.changed.set(cell, d.mode === 'paint' ? CROSS : EMPTY);
    setPreview(new Map(d.changed));
    onDragTick();
  };

  // Gesture callbacks run on touch events, not during render, so reading the drag ref there is safe.
  /* eslint-disable react-hooks/refs */
  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .runOnJS(true)
      .enabled(!locked && settings.dragToMark)
      .minDistance(8)
      .onBegin((e) => {
        drag.current = { start: cellAt(e.x, e.y), mode: null, changed: new Map(), last: { x: e.x, y: e.y } };
      })
      .onStart(() => {
        const d = drag.current;
        if (!d || d.start < 0) return;
        const m = board[d.start];
        d.mode = m === EMPTY ? 'paint' : m === CROSS ? 'erase' : null;
        visit(d.start);
      })
      .onUpdate((e) => {
        const d = drag.current;
        if (!d?.mode) return;
        // Sample along the finger's path so fast swipes don't skip cells.
        const dx = e.x - d.last.x;
        const dy = e.y - d.last.y;
        const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (cellSize / 3)));
        for (let s = 1; s <= steps; s++) visit(cellAt(d.last.x + (dx * s) / steps, d.last.y + (dy * s) / steps));
        d.last = { x: e.x, y: e.y };
      })
      .onEnd(() => {
        const d = drag.current;
        if (d && d.changed.size) onDrag([...d.changed.keys()], [...d.changed.values()]);
      })
      .onFinalize(() => {
        drag.current = null;
        setPreview(null);
      });

    const longPress = Gesture.LongPress()
      .runOnJS(true)
      .enabled(!locked)
      .minDuration(380)
      .onStart((e) => {
        const cell = cellAt(e.x, e.y);
        if (cell >= 0) onLongPress(cell);
      });

    const tap = Gesture.Tap()
      .runOnJS(true)
      .enabled(!locked)
      .onEnd((e, success) => {
        const cell = cellAt(e.x, e.y);
        if (success && cell >= 0) onTap(cell);
      });

    return Gesture.Race(pan, longPress, tap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, locked, settings.dragToMark, cellSize, onTap, onLongPress, onDrag, onDragTick]);
  /* eslint-enable react-hooks/refs */

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View
      style={[styles.frame, { borderColor: c.gridThick }]}
      accessibilityLabel={decorative ? undefined : S.boardLabel(n)}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}>
      <GestureDetector gesture={gesture}>
        <View style={styles.grid} onLayout={onLayout}>
          {width > 0 && settings.patterns && (
            <RegionPatterns puzzle={puzzle} size={width} colors={regionColors} ink={dark ? '#FFFFFF' : '#2B2620'} />
          )}
          {width > 0 &&
            shown.map((mark, i) => {
              const row = Math.floor(i / n);
              const col = i % n;
              return (
                <Cell
                  key={i}
                  index={i}
                  label={decorative ? undefined : S.cellLabel(row + 1, col + 1, REGION_COLOR_NAMES[regions[i]], cellState(mark, auto.has(i), conflicts.has(i)))}
                  onTap={locked ? undefined : onTap}
                  onLongPress={locked ? undefined : onLongPress}
                  left={col * cellSize}
                  top={row * cellSize}
                  size={cellSize}
                  bg={settings.patterns ? 'transparent' : regionColors[regions[i]]}
                  mark={mark}
                  auto={auto.has(i)}
                  conflict={conflicts.has(i)}
                  highlight={highlight?.has(i) ?? false}
                  danger={danger?.has(i) ?? false}
                  finger={finger === i}
                  goldColor={c.gold}
                  rightThick={col < n - 1 && regions[i] !== regions[i + 1]}
                  rightLine={col < n - 1}
                  bottomThick={row < n - 1 && regions[i] !== regions[i + n]}
                  bottomLine={row < n - 1}
                  thickColor={c.gridThick}
                  thinColor={c.gridThin}
                  markColor={c.mark}
                  autoColor={c.autoMark}
                  dangerColor={c.danger}
                />
              );
            })}
        </View>
      </GestureDetector>
    </View>
  );
}

function cellState(mark: Mark, auto: boolean, conflict: boolean): string {
  if (mark === CROWN) return conflict ? S.cellConflict : S.cellCrown;
  if (mark === CROSS) return S.cellCross;
  return auto ? S.cellAutoCross : S.cellEmpty;
}

const A11Y_ACTIONS = [{ name: 'activate' }, { name: 'longpress', label: S.cellToggleCrown }];

interface CellProps {
  index: number;
  label?: string;
  onTap?: (cell: number) => void;
  onLongPress?: (cell: number) => void;
  left: number;
  top: number;
  size: number;
  bg: string;
  mark: Mark;
  auto: boolean;
  conflict: boolean;
  highlight: boolean;
  danger: boolean;
  finger: boolean;
  goldColor: string;
  rightThick: boolean;
  rightLine: boolean;
  bottomThick: boolean;
  bottomLine: boolean;
  thickColor: string;
  thinColor: string;
  markColor: string;
  autoColor: string;
  dangerColor: string;
}

const THICK = 2.5;
const THIN = 1;

const Cell = memo(function Cell(p: CellProps) {
  const icon = p.size * 0.6;
  const onAction = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === 'activate') p.onTap?.(p.index);
    if (e.nativeEvent.actionName === 'longpress') p.onLongPress?.(p.index);
  };
  return (
    <View
      accessible={!!p.label}
      accessibilityRole={p.onTap ? 'button' : undefined}
      accessibilityLabel={p.label}
      accessibilityActions={p.onTap ? A11Y_ACTIONS : undefined}
      onAccessibilityAction={p.onTap ? onAction : undefined}
      style={[
        styles.cell,
        {
          left: p.left,
          top: p.top,
          width: p.size,
          height: p.size,
          backgroundColor: p.bg,
          borderRightWidth: p.rightLine ? (p.rightThick ? THICK : THIN) : 0,
          borderBottomWidth: p.bottomLine ? (p.bottomThick ? THICK : THIN) : 0,
          borderRightColor: p.rightThick ? p.thickColor : p.thinColor,
          borderBottomColor: p.bottomThick ? p.thickColor : p.thinColor,
        },
      ]}>
      {p.conflict && <View style={[StyleSheet.absoluteFill, { backgroundColor: p.dangerColor, opacity: 0.22 }]} />}
      {p.mark === CROWN && <CrownIcon size={icon} color={p.conflict ? p.dangerColor : p.markColor} />}
      {p.mark === CROWN && p.conflict && <ConflictBadge size={p.size} color={p.dangerColor} />}
      {p.mark === CROSS && <CrossIcon size={p.size * 0.32} color={p.markColor} width={2} />}
      {p.mark === EMPTY && p.auto && <CrossIcon size={p.size * 0.26} color={p.autoColor} width={1.5} />}
      {p.highlight && <View pointerEvents="none" style={[styles.ring, { borderColor: p.goldColor }]} />}
      {p.danger && <View pointerEvents="none" style={[styles.ring, { borderColor: p.dangerColor }]} />}
      {p.finger && (
        <View
          pointerEvents="none"
          style={[styles.finger, { width: p.size * 0.5, height: p.size * 0.5, borderRadius: p.size * 0.25 }]}
        />
      )}
    </View>
  );
});

/** Two rotated bars: much cheaper than an SVG per cell when a big board is full of ✕ (low-end Android). */
function CrossIcon({ size, color, width }: { size: number; color: string; width: number }) {
  const bar = { position: 'absolute' as const, width: size * 1.13, height: width * 1.4, borderRadius: width, backgroundColor: color };
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[bar, { transform: [{ rotate: '45deg' }] }]} />
      <View style={[bar, { transform: [{ rotate: '-45deg' }] }]} />
    </View>
  );
}

/** "!" in the corner, so a broken rule is not shown by red alone. */
function ConflictBadge({ size, color }: { size: number; color: string }) {
  const d = Math.max(10, size * 0.3);
  return (
    <View pointerEvents="none" style={[styles.badge, { width: d, height: d, borderRadius: d / 2, backgroundColor: color }]}>
      <Text style={[styles.badgeText, { fontSize: d * 0.72, lineHeight: d }]} allowFontScaling={false}>
        !
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 1, borderWidth: THICK + 0.5, borderRadius: 6, overflow: 'hidden' },
  grid: { flex: 1 },
  cell: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderWidth: 3, borderRadius: 3 },
  badge: { position: 'absolute', top: 2, right: 2, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#FFFFFF', fontWeight: '800', textAlign: 'center' },
  finger: {
    position: 'absolute',
    backgroundColor: 'rgba(120, 120, 120, 0.35)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
});
