import Svg, { Circle, Path, Rect } from 'react-native-svg';

export function StatsIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={4} y={12} width={4} height={8} rx={1.5} fill={color} />
      <Rect x={10} y={6} width={4} height={14} rx={1.5} fill={color} />
      <Rect x={16} y={9} width={4} height={11} rx={1.5} fill={color} />
    </Svg>
  );
}

export function SettingsIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 7h16M4 12h16M4 17h16" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={9} cy={7} r={2.6} fill={color} />
      <Circle cx={15} cy={12} r={2.6} fill={color} />
      <Circle cx={8} cy={17} r={2.6} fill={color} />
    </Svg>
  );
}

/** Back chevron, centred in its box (a text "‹" sits off-centre in most fonts). `flip` points it right (RTL). */
export function BackIcon({ size, color, flip }: { size: number; color: string; flip?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={flip ? 'M8.5 5l7 7-7 7' : 'M15.5 5l-7 7 7 7'}
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
