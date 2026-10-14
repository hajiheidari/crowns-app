import { Platform, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

/** Gold coin (the 🪙 emoji is silver on iPhone). Text shows it in place of every 🪙 (components/text.tsx). */
export function CoinIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="coinGold" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FCE7A0" />
          <Stop offset="0.5" stopColor="#E6B93A" />
          <Stop offset="1" stopColor="#B8891A" />
        </LinearGradient>
      </Defs>
      <Circle cx={12} cy={12} r={11} fill="#A87C12" />
      <Circle cx={12} cy={12} r={9.6} fill="url(#coinGold)" />
      <Circle cx={12} cy={12} r={7.4} fill="none" stroke="#A87C12" strokeWidth={0.9} />
      {/* A small crown stamped in the middle. */}
      <Path d="M7.2 14.6 6.6 9.4l2.7 2.1L12 7.6l2.7 3.9 2.7-2.1-.6 5.2Z M7.3 15.4h9.4v1.2H7.3Z" fill="#8A6408" />
    </Svg>
  );
}

// Inline views sit on the text baseline on iOS and Android, but react-native-web places them higher, so only the web
// needs the nudge down (on phones it put the coin below the digits).
const NUDGE = Platform.OS === 'web' ? 0.16 : 0;

/** The coin as an inline piece of text, sized and nudged to sit on the text line. */
export function InlineCoin({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size, transform: [{ translateY: size * NUDGE }] }}>
      <CoinIcon size={size} />
    </View>
  );
}
