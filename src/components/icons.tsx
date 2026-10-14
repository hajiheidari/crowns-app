import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export function StatsIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={4} y={12} width={4} height={8} rx={1.5} fill={color} />
      <Rect x={10} y={6} width={4} height={14} rx={1.5} fill={color} />
      <Rect x={16} y={9} width={4} height={11} rx={1.5} fill={color} />
    </Svg>
  );
}

/** Shopping bag for the Shop button: purple-to-pink bag, gold handle and star (Amir chose it, 2026-10-14). */
export function ShopBagIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="shopBag" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#B07CF2" />
          <Stop offset="1" stopColor="#E05FA6" />
        </LinearGradient>
      </Defs>
      <Path d="M8.6 9V7a3.4 3.4 0 0 1 6.8 0v2" stroke="#D9A82E" strokeWidth={2} strokeLinecap="round" fill="none" />
      <Path d="M4.8 8.4h14.4l-1.1 11.6a1.8 1.8 0 0 1-1.8 1.6H7.7a1.8 1.8 0 0 1-1.8-1.6Z" fill="url(#shopBag)" />
      <Path d="M12 11.6l.9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3Z" fill="#FFE08A" />
    </Svg>
  );
}

/** Tint of the Shop button's frame. */
export const SHOP_TINT = '#8E5BD8';

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
