/**
 * Sun & moon board: tap a cell to cycle sun → moon → empty. Starting cells are fixed (shaded). "=" and "×" signs sit on
 * the border between two cells; cells that break a rule turn red.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Text } from '@/components/text';
import { binaryConflicts, MOON, SUN, type BinaryPuzzle, type Sky } from '@/engine';
import { usePalette } from '@/hooks/use-palette';

export const SUN_COLOR = '#F2A93B';
export const MOON_COLOR = '#5B7FD6';

export function SunIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <Path
            key={i}
            d={`M${12 + Math.cos(a) * 8} ${12 + Math.sin(a) * 8}L${12 + Math.cos(a) * 10.8} ${12 + Math.sin(a) * 10.8}`}
            stroke={SUN_COLOR}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        );
      })}
      <Circle cx={12} cy={12} r={5.6} fill={SUN_COLOR} />
    </Svg>
  );
}

export function MoonIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15.5 3.2A9 9 0 1 0 20.8 15 7.2 7.2 0 0 1 15.5 3.2Z" fill={MOON_COLOR} />
    </Svg>
  );
}

/** Small sun and moon together (Home buttons). */
export function SunMoonIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={8.5} cy={8.5} r={5.5} fill={SUN_COLOR} />
      <Path d="M17.5 9.5A6.5 6.5 0 1 0 21.4 19 5.2 5.2 0 0 1 17.5 9.5Z" fill={MOON_COLOR} />
    </Svg>
  );
}

interface Props {
  puzzle: BinaryPuzzle;
  cells: number[];
  locked: boolean;
  onChange: (cells: number[]) => void;
  onTap?: () => void;
  highlight?: number[];
}

export function BinaryBoard({ puzzle, cells, locked, onChange, onTap, highlight }: Props) {
  const { c, dark } = usePalette();
  const n = puzzle.n;
  const [width, setWidth] = useState(0);
  const size = width / n;
  const bad = binaryConflicts(puzzle, cells as Sky[]);
  const hinted = new Set(highlight ?? []);
  const grid = dark ? '#3A352F' : '#E4DCCB';

  const tap = (i: number) => {
    if (locked || puzzle.givens[i]) return;
    const next = [...cells];
    next[i] = cells[i] === 0 ? SUN : cells[i] === SUN ? MOON : 0;
    onTap?.();
    onChange(next);
  };

  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));

  return (
    <View style={[styles.board, { borderColor: c.text, backgroundColor: c.surface }]}>
      <View style={styles.inner} onLayout={onLayout}>
        {width > 0 &&
          cells.map((v, i) => {
            const given = !!puzzle.givens[i];
            const label = v === SUN ? '☀' : v === MOON ? '☾' : '·';
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={`${Math.floor(i / n) + 1}, ${(i % n) + 1}: ${label}`}
                onPress={() => tap(i)}
                style={[
                  styles.cell,
                  {
                    left: (i % n) * size,
                    top: Math.floor(i / n) * size,
                    width: size,
                    height: size,
                    borderColor: grid,
                    backgroundColor: hinted.has(i)
                      ? '#7FD1AE'
                      : bad.has(i)
                        ? '#E8575A44'
                        : given
                          ? c.surfaceMuted
                          : 'transparent',
                  },
                ]}>
                {v === SUN && <SunIcon size={size * 0.66} />}
                {v === MOON && <MoonIcon size={size * 0.6} />}
              </Pressable>
            );
          })}
        {width > 0 &&
          puzzle.signs.map((s) => {
            // A small badge on the middle of the border the two cells share.
            const horizontal = s.b === s.a + 1;
            const x = (s.a % n) * size + (horizontal ? size : size / 2);
            const y = Math.floor(s.a / n) * size + (horizontal ? size / 2 : size);
            const d = Math.max(18, size * 0.36);
            return (
              <View
                key={`${s.a}-${s.b}`}
                pointerEvents="none"
                style={[styles.sign, { left: x - d / 2, top: y - d / 2, width: d, height: d, borderRadius: d / 2, backgroundColor: c.background, borderColor: c.text }]}>
                <Text style={[styles.signText, { color: c.text, fontSize: d * 0.62, lineHeight: d * 0.9 }]} maxFontSizeMultiplier={1}>
                  {s.same ? '=' : '×'}
                </Text>
              </View>
            );
          })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  board: { width: '100%', aspectRatio: 1, borderWidth: 2, borderRadius: 6, overflow: 'hidden', direction: 'ltr' },
  inner: { flex: 1 },
  cell: { position: 'absolute', borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  sign: { position: 'absolute', alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  signText: { fontWeight: '800', textAlign: 'center' },
});
