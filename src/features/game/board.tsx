/**
 * The puzzle board: plain Views (max 121 cells) + one gesture detector.
 *  - tap        → cycle the cell's mark
 *  - long-press → toggle a crown
 *  - drag       → start on empty: paint ✕ on empty cells; start on ✕: erase ✕. Never touches crowns.
 * A drag is previewed locally and committed as ONE move (one undo step) when the finger lifts.
 */
import { memo, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';

import { CrownIcon } from '@/components/crown-icon';
import { autoCrossCells, CROSS, CROWN, EMPTY, findConflicts, type Mark, type Puzzle } from '@/engine';
import { usePalette } from '@/hooks/use-palette';
import type { Settings } from '@/store/game-store';

interface Props {
  puzzle: Puzzle;
  board: Mark[];
  settings: Settings;
  locked: boolean;
  onTap: (cell: number) => void;
  onLongPress: (cell: number) => void;
  onDrag: (cells: number[], to: Mark[]) => void;
  onDragTick: () => void;
}

type DragMode = 'paint' | 'erase';

export function Board({ puzzle, board, settings, locked, onTap, onLongPress, onDrag, onDragTick }: Props) {
  const { c, regions: regionColors } = usePalette();
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
    <View style={[styles.frame, { borderColor: c.gridThick }]}>
      <GestureDetector gesture={gesture}>
        <View style={styles.grid} onLayout={onLayout}>
          {width > 0 &&
            shown.map((mark, i) => {
              const row = Math.floor(i / n);
              const col = i % n;
              return (
                <Cell
                  key={i}
                  left={col * cellSize}
                  top={row * cellSize}
                  size={cellSize}
                  bg={regionColors[regions[i]]}
                  mark={mark}
                  auto={auto.has(i)}
                  conflict={conflicts.has(i)}
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

interface CellProps {
  left: number;
  top: number;
  size: number;
  bg: string;
  mark: Mark;
  auto: boolean;
  conflict: boolean;
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
  return (
    <View
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
      {p.mark === CROSS && <CrossIcon size={p.size * 0.32} color={p.markColor} width={2} />}
      {p.mark === EMPTY && p.auto && <CrossIcon size={p.size * 0.26} color={p.autoColor} width={1.5} />}
    </View>
  );
});

function CrossIcon({ size, color, width }: { size: number; color: string; width: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10">
      <Path d="M1 1 9 9M9 1 1 9" stroke={color} strokeWidth={width * (10 / size) * 1.4} strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 1, borderWidth: THICK + 0.5, borderRadius: 6, overflow: 'hidden' },
  grid: { flex: 1 },
  cell: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
