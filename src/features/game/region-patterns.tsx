/**
 * Color-blind aid (Settings → Color-blind patterns): paints every region's color plus its own pattern, so two
 * regions never differ by color alone. One SVG for the whole board (2 paths per region), drawn under the cells.
 * Pattern order follows REGION_COLOR_NAMES; gray (index 4) stays plain, which is itself distinct.
 */
import { memo, useMemo, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, G, Path, Pattern } from 'react-native-svg';

import type { Puzzle } from '@/engine';

/** Each pattern is drawn in a 12×12 tile. */
const TILE = 12;
const SHAPES: ((ink: string) => ReactNode)[] = [
  (ink) => <Circle cx={6} cy={6} r={1.7} fill={ink} />, // purple: dots
  (ink) => <Path d="M-3 3 3 -3M0 12 12 0M9 15 15 9" stroke={ink} strokeWidth={1.4} />, // orange: diagonal /
  (ink) => <Path d="M0 6H12" stroke={ink} strokeWidth={1.4} />, // blue: horizontal
  (ink) => <Path d="M6 0V12" stroke={ink} strokeWidth={1.4} />, // green: vertical
  () => null, // gray: plain
  (ink) => <Path d="M-3 9 3 15M0 0 12 12M9 -3 15 3" stroke={ink} strokeWidth={1.4} />, // red: diagonal \
  (ink) => <Path d="M0 6H12M6 0V12" stroke={ink} strokeWidth={1.1} />, // yellow: grid
  (ink) => <Circle cx={6} cy={6} r={3} fill="none" stroke={ink} strokeWidth={1.2} />, // teal: rings
  (ink) => <Path d="M0 0 12 12M12 0 0 12" stroke={ink} strokeWidth={1.1} />, // pink: x-hatch
  (ink) => <Path d="M6 2.5 9.5 9H2.5Z" fill={ink} />, // brown: triangles
  (ink) => <Path d="M0 8 3 4 6 8 9 4 12 8" fill="none" stroke={ink} strokeWidth={1.3} />, // lime: zigzag
];

interface Props {
  puzzle: Puzzle;
  size: number;
  colors: readonly string[];
  ink: string;
}

export const RegionPatterns = memo(function RegionPatterns({ puzzle, size, colors, ink }: Props) {
  const { n, regions } = puzzle;
  const cell = size / n;
  // Three tiles per cell whatever the grid size, so the pattern reads the same on 5×5 and 11×11.
  const scale = cell / (TILE * 3);

  const paths = useMemo(() => {
    const byRegion: string[] = Array.from({ length: n }, () => '');
    regions.forEach((r, i) => {
      const x = (i % n) * cell;
      const y = Math.floor(i / n) * cell;
      byRegion[r] += `M${x} ${y}h${cell + 0.5}v${cell + 0.5}h${-cell - 0.5}Z`;
    });
    return byRegion;
  }, [n, regions, cell]);

  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        {SHAPES.map((shape, i) => (
          <Pattern
            key={i}
            id={`crowns-pattern-${i}`}
            patternUnits="userSpaceOnUse"
            width={TILE}
            height={TILE}
            patternTransform={`scale(${scale})`}>
            <G opacity={0.3}>{shape(ink)}</G>
          </Pattern>
        ))}
      </Defs>
      {paths.map((d, r) => (
        <G key={r}>
          <Path d={d} fill={colors[r]} />
          {r !== 4 && <Path d={d} fill={`url(#crowns-pattern-${r % SHAPES.length})`} />}
        </G>
      ))}
    </Svg>
  );
});
