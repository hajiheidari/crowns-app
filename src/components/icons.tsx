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
