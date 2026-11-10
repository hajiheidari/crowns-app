/**
 * Path puzzle board: the grid, the numbered checkpoints, walls and the player's line. Drag from checkpoint 1 (or from
 * any point of the line) to draw; dragging back over the previous cell takes a step back. One stroke = one undo step.
 */
import { useMemo, useRef, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Circle, Line, Polyline } from "react-native-svg";

import { Text } from "@/components/text";
import { canExtend, clueNumber, type PathPuzzle } from "@/engine";
import { usePalette } from "@/hooks/use-palette";

export const PATH_INK = "#D9A82E";

/** Add one cell to the line, or take the last one back when the finger returns to the cell before it. */
export function stepLine(
  p: PathPuzzle,
  line: number[],
  cell: number,
): number[] {
  if (line.length >= 2 && cell === line[line.length - 2])
    return line.slice(0, -1);
  return canExtend(p, line, cell) ? [...line, cell] : line;
}

/** Walk from the line's head towards a cell the finger reached diagonally or by skipping: row first, then column. */
function walkTo(p: PathPuzzle, line: number[], target: number): number[] {
  const n = p.n;
  let out = line;
  for (
    let guard = 0;
    guard < 2 * n && out[out.length - 1] !== target;
    guard++
  ) {
    const head = out[out.length - 1];
    const [hr, hc, tr, tc] = [
      Math.floor(head / n),
      head % n,
      Math.floor(target / n),
      target % n,
    ];
    const options = [
      hr !== tr ? head + Math.sign(tr - hr) * n : -1,
      hc !== tc ? head + Math.sign(tc - hc) : -1,
    ].filter((x) => x >= 0);
    const next = options.map((x) => stepLine(p, out, x)).find((l) => l !== out);
    if (!next) break;
    out = next;
  }
  return out;
}

interface Props {
  puzzle: PathPuzzle;
  line: number[];
  locked: boolean;
  /** A finished stroke: the new line. */
  onStroke: (line: number[]) => void;
  onStep?: () => void;
  /** Cells to point at (hint). */
  highlight?: number[];
}

export function PathBoard({
  puzzle,
  line,
  locked,
  onStroke,
  onStep,
  highlight,
}: Props) {
  const { c, dark } = usePalette();
  const n = puzzle.n;
  const [width, setWidth] = useState(0);
  const [live, setLive] = useState<number[] | null>(null);
  const drag = useRef<{
    line: number[];
    last: { x: number; y: number };
  } | null>(null);
  const shown = live ?? line;
  const cell = width / n;

  const cellAt = (x: number, y: number) => {
    const col = Math.floor(x / cell);
    const row = Math.floor(y / cell);
    return col < 0 || row < 0 || col >= n || row >= n ? -1 : row * n + col;
  };

  // Gesture callbacks run on touch events, not during render, so reading the drag ref there is safe.
  /* eslint-disable react-hooks/refs */
  const gesture = useMemo(() => {
    const begin = (x: number, y: number) => {
      const at = cellAt(x, y);
      if (at < 0) return null;
      if (at === puzzle.clues[0]) return [at];
      const i = line.indexOf(at);
      return i >= 0 ? line.slice(0, i + 1) : null;
    };
    const pan = Gesture.Pan()
      .runOnJS(true)
      .minDistance(0)
      .enabled(!locked && width > 0)
      .onBegin((e) => {
        const start = begin(e.x, e.y);
        drag.current = start ? { line: start, last: { x: e.x, y: e.y } } : null;
        if (start) setLive(start);
      })
      .onUpdate((e) => {
        const d = drag.current;
        if (!d) return;
        // Sample the finger's way in small steps so a fast stroke does not skip cells.
        const dx = e.x - d.last.x;
        const dy = e.y - d.last.y;
        const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (cell / 4)));
        let out = d.line;
        for (let s = 1; s <= steps; s++) {
          const at = cellAt(
            d.last.x + (dx * s) / steps,
            d.last.y + (dy * s) / steps,
          );
          if (at < 0 || at === out[out.length - 1]) continue;
          out = walkTo(puzzle, out, at);
        }
        d.last = { x: e.x, y: e.y };
        if (out !== d.line) {
          d.line = out;
          setLive(out);
          onStep?.();
        }
      })
      .onFinalize(() => {
        const d = drag.current;
        drag.current = null;
        setLive(null);
        if (
          d &&
          (d.line.length !== line.length ||
            d.line.some((x, i) => x !== line[i]))
        )
          onStroke(d.line);
      });
    return pan;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle, line, locked, width, onStroke, onStep]);
  /* eslint-enable react-hooks/refs */

  const onLayout = (e: LayoutChangeEvent) =>
    setWidth(Math.round(e.nativeEvent.layout.width));
  const center = (x: number) => ({
    x: (x % n) * cell + cell / 2,
    y: Math.floor(x / n) * cell + cell / 2,
  });
  const used = new Set(shown);
  const hinted = new Set(highlight ?? []);
  const grid = dark ? "#3A352F" : "#E4DCCB";

  return (
    <View
      style={[
        styles.board,
        { borderColor: c.text, backgroundColor: c.surface },
      ]}
    >
      <GestureDetector gesture={gesture}>
        <View
          style={styles.inner}
          onLayout={onLayout}
          accessibilityLabel={`${shown.length} / ${n * n}`}
        >
          {width > 0 && (
            <>
              {Array.from({ length: n * n }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.cell,
                    {
                      left: (i % n) * cell,
                      top: Math.floor(i / n) * cell,
                      width: cell,
                      height: cell,
                      borderColor: grid,
                      backgroundColor: hinted.has(i)
                        ? "#7FD1AE"
                        : used.has(i)
                          ? PATH_INK + (dark ? "38" : "2E")
                          : "transparent",
                    },
                  ]}
                />
              ))}
              <Svg
                width={width}
                height={width}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              >
                {shown.length > 1 && (
                  <Polyline
                    points={shown
                      .map((x) => `${center(x).x},${center(x).y}`)
                      .join(" ")}
                    fill="none"
                    stroke={PATH_INK}
                    strokeWidth={cell * 0.36}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {shown.length === 1 && (
                  <Circle
                    cx={center(shown[0]).x}
                    cy={center(shown[0]).y}
                    r={cell * 0.18}
                    fill={PATH_INK}
                  />
                )}
                {puzzle.walls.map(([a, b]) => {
                  // A wall sits on the edge the two cells share.
                  const [ra, ca, rb, cb] = [
                    Math.floor(a / n),
                    a % n,
                    Math.floor(b / n),
                    b % n,
                  ];
                  const vertical = ra === rb;
                  const x = vertical ? Math.max(ca, cb) * cell : ca * cell;
                  const y = vertical ? ra * cell : Math.max(ra, rb) * cell;
                  return (
                    <Line
                      key={`${a}-${b}`}
                      x1={x}
                      y1={y}
                      x2={vertical ? x : x + cell}
                      y2={vertical ? y + cell : y}
                      stroke={c.text}
                      strokeWidth={Math.max(4, cell * 0.11)}
                      strokeLinecap="round"
                    />
                  );
                })}
              </Svg>
              {puzzle.clues.map((x) => (
                <View
                  key={x}
                  pointerEvents="none"
                  style={[
                    styles.clue,
                    {
                      left: center(x).x - cell * 0.3,
                      top: center(x).y - cell * 0.3,
                      width: cell * 0.6,
                      height: cell * 0.6,
                      borderRadius: cell * 0.3,
                      backgroundColor: c.text,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.clueText,
                      { color: c.background, fontSize: cell * 0.3 },
                    ]}
                    maxFontSizeMultiplier={1}
                  >
                    {clueNumber(puzzle, x)}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    width: "100%",
    aspectRatio: 1,
    borderWidth: 2,
    borderRadius: 6,
    overflow: "hidden",
    direction: "ltr",
  },
  inner: { flex: 1 },
  cell: { position: "absolute", borderWidth: StyleSheet.hairlineWidth },
  clue: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  clueText: { fontWeight: "800", textAlign: "center" },
});
