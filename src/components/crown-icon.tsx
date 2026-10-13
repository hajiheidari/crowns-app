import Svg, { Circle, Path } from 'react-native-svg';

/** The crown. `gem`: a small stone in the middle (shop crowns). */
export function CrownIcon({ size, color, gem }: { size: number; color: string; gem?: string | null }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3.2 17.5 2 7.2l5.4 4.1L12 4.2l4.6 7.1L22 7.2l-1.2 10.3Z" fill={color} />
      <Path d="M3.4 19h17.2v2.2H3.4Z" fill={color} />
      {gem && <Circle cx={12} cy={13.6} r={2.1} fill={gem} />}
    </Svg>
  );
}
