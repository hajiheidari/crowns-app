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

/** Shopping bag (Home header → Shop). */
export function ShopIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5.2 8.5h13.6l-1 11.2a1.6 1.6 0 0 1-1.6 1.5H7.8a1.6 1.6 0 0 1-1.6-1.5Z" fill={color} />
      <Path d="M8.8 10V7a3.2 3.2 0 0 1 6.4 0v3" stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
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

/** The ✕ mark as a bold drawn icon (the text ✕ is too thin in most fonts). */
export function CrossIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={3.2} strokeLinecap="round" />
    </Svg>
  );
}
