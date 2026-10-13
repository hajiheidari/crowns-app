/**
 * Board textures for shop styles (Amir 2026-10-13: khatam inlay, colored metal, marble, galaxy, toy bricks, football).
 * Like RegionPatterns: one SVG under the cells, one path per region in its color, then the texture as an SVG pattern
 * whose tile is exactly one cell (two for marble/galaxy, so they look less repetitive). Regions keep their hue, so hint
 * texts ("the purple region") stay true.
 */
import { memo, useMemo, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, Path, Pattern, Polygon, Rect } from 'react-native-svg';

export type TextureId = 'khatam' | 'metal' | 'marble' | 'galaxy' | 'toy' | 'football';

/** Texture drawn in a 24-unit cell (`span` cells per tile). */
const TEXTURES: Record<TextureId, { span: number; draw: () => ReactNode; opacity?: number }> = {
  khatam: {
    span: 1,
    opacity: 0.7,
    draw: () => (
      <G>
        {/* Eight-pointed star of Persian inlay: two crossed squares, with gold and ivory lines. */}
        <Polygon points="12,3.5 20.5,12 12,20.5 3.5,12" fill="rgba(255,255,255,0.10)" stroke="#F2D27A" strokeWidth={0.8} />
        <Rect x={6} y={6} width={12} height={12} fill="rgba(255,255,255,0.08)" stroke="#F2D27A" strokeWidth={0.8} />
        <Polygon points="12,8 16,12 12,16 8,12" fill="#F2D27A" opacity={0.85} />
        <Circle cx={12} cy={12} r={1.4} fill="#FFF6DD" />
        {[[0, 0], [24, 0], [0, 24], [24, 24]].map(([x, y]) => (
          <Polygon key={`${x}${y}`} points={`${x},${y - 3} ${x + 3},${y} ${x},${y + 3} ${x - 3},${y}`} fill="#FFF6DD" opacity={0.9} />
        ))}
        <Path d="M0 12H3.5M20.5 12H24M12 0V3.5M12 20.5V24" stroke="#FFF6DD" strokeWidth={0.6} opacity={0.8} />
      </G>
    ),
  },
  metal: {
    span: 1,
    draw: () => (
      <G>
        {/* Brushed metal plate: bright bevel top-left, shade bottom-right, fine brush lines and a rivet. */}
        <Polygon points="0,0 24,0 0,24" fill="#FFFFFF" opacity={0.22} />
        <Polygon points="24,24 24,4 4,24" fill="#000000" opacity={0.12} />
        {[3, 6, 9, 12, 15, 18, 21].map((y) => (
          <Path key={y} d={`M0 ${y}H24`} stroke="#FFFFFF" strokeWidth={0.35} opacity={0.18} />
        ))}
        <Rect x={1} y={1} width={22} height={22} fill="none" stroke="#FFFFFF" strokeWidth={0.6} opacity={0.4} />
        <Circle cx={20.5} cy={3.5} r={1} fill="#FFFFFF" opacity={0.55} />
      </G>
    ),
  },
  marble: {
    span: 2,
    draw: () => (
      <G>
        <Path d="M0 10C9 6 17 19 28 12S42 3 48 9" fill="none" stroke="#FFFFFF" strokeWidth={0.9} opacity={0.6} />
        <Path d="M0 11C9 8 16 21 27 14" fill="none" stroke="#FFFFFF" strokeWidth={0.35} opacity={0.5} />
        <Path d="M4 48C12 36 20 41 29 29S41 21 48 27" fill="none" stroke="#000000" strokeWidth={0.5} opacity={0.18} />
        <Path d="M30 29C34 33 36 40 44 41" fill="none" stroke="#FFFFFF" strokeWidth={0.45} opacity={0.5} />
        {[[8, 30], [37, 8], [20, 40], [42, 36], [14, 20]].map(([x, y]) => (
          <Circle key={`${x}${y}`} cx={x} cy={y} r={0.5} fill="#FFFFFF" opacity={0.45} />
        ))}
      </G>
    ),
  },
  galaxy: {
    span: 2,
    draw: () => (
      <G>
        <Ellipse cx={30} cy={18} rx={16} ry={7} fill="#FFFFFF" opacity={0.07} transform="rotate(-25 30 18)" />
        <Ellipse cx={14} cy={36} rx={10} ry={5} fill="#C9B8FF" opacity={0.08} />
        {[
          [5, 6, 0.7], [17, 3, 0.4], [29, 10, 0.5], [41, 5, 0.8], [9, 19, 0.35], [23, 22, 0.9], [37, 26, 0.45],
          [45, 17, 0.35], [4, 33, 0.5], [18, 44, 0.6], [31, 38, 0.35], [43, 43, 0.7], [26, 31, 0.3], [12, 28, 0.3],
        ].map(([x, y, r]) => (
          <Circle key={`${x}${y}`} cx={x} cy={y} r={r} fill="#FFFFFF" opacity={0.9} />
        ))}
        <Path d="M23 19.5V24.5M20.5 22H25.5" stroke="#FFFFFF" strokeWidth={0.35} opacity={0.8} />
      </G>
    ),
  },
  toy: {
    span: 1,
    draw: () => (
      <G>
        {/* A toy brick seen from above: bevelled edge and a round stud with its shadow. */}
        <Polygon points="0,0 24,0 22,2 2,2 2,22 0,24" fill="#FFFFFF" opacity={0.28} />
        <Polygon points="24,24 0,24 2,22 22,22 22,2 24,0" fill="#000000" opacity={0.18} />
        <Circle cx={12.8} cy={12.8} r={6.2} fill="#000000" opacity={0.2} />
        <Circle cx={12} cy={12} r={6.2} fill="#FFFFFF" opacity={0.16} />
        <Circle cx={12} cy={12} r={6.2} fill="none" stroke="#000000" strokeWidth={0.6} opacity={0.15} />
        <Path d="M8.2 10.2A4.6 4.6 0 0 1 12.6 7.4" stroke="#FFFFFF" strokeWidth={1} opacity={0.55} fill="none" />
      </G>
    ),
  },
  football: {
    span: 1,
    opacity: 0.75,
    draw: () => (
      <G>
        {/* Pitch stripes with a ball-panel pattern. */}
        <Rect x={0} y={0} width={12} height={24} fill="#FFFFFF" opacity={0.08} />
        <Polygon points="12,7.5 16.3,10.6 14.7,15.6 9.3,15.6 7.7,10.6" fill="#1A1A1A" opacity={0.28} />
        <Path
          d="M12 7.5V2M16.3 10.6 21.5 8.8M14.7 15.6 18 20.5M9.3 15.6 6 20.5M7.7 10.6 2.5 8.8"
          stroke="#FFFFFF"
          strokeWidth={0.7}
          opacity={0.6}
        />
        <Circle cx={12} cy={12} r={9.6} fill="none" stroke="#FFFFFF" strokeWidth={0.5} opacity={0.35} />
      </G>
    ),
  },
};

interface Props {
  n: number;
  regions: readonly number[];
  size: number;
  colors: readonly string[];
  texture: TextureId;
}

export const BoardTexture = memo(function BoardTexture({ n, regions, size, colors, texture }: Props) {
  const cell = size / n;
  const t = TEXTURES[texture];
  // Unique per texture and cell size: on the web the first pattern with an id wins for every SVG on the page.
  const id = `tiaro-texture-${texture}-${Math.round(cell * 10)}`;
  const paths = useMemo(() => {
    const byRegion: string[] = Array.from({ length: Math.max(n, ...regions.map((r) => r + 1)) }, () => '');
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
        <Pattern id={id} patternUnits="userSpaceOnUse" width={24 * t.span} height={24 * t.span} patternTransform={`scale(${cell / 24})`}>
          <G opacity={t.opacity ?? 1}>{t.draw()}</G>
        </Pattern>
      </Defs>
      {paths.map((d, r) =>
        d ? (
          <G key={r}>
            <Path d={d} fill={colors[r]} />
            <Path d={d} fill={`url(#${id})`} />
          </G>
        ) : null,
      )}
    </Svg>
  );
});
