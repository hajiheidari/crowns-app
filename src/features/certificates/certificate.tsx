/**
 * A certificate like the printed award certificates Amir sent (2026-10-13): portrait, Instagram-story size
 * (9:16, shared at 1080×1920), deep green with gold corner shapes and dots, a gold medal with laurels and ribbons,
 * "Proudly presented to", the name in a script font, what was achieved, a signature and a verification number.
 * The same in both themes. Sized by `width`.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef } from 'react';
import { Platform, Text as RNText, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Path, Polygon, Rect, Stop, LinearGradient as SvgGradient, Text as SvgText } from 'react-native-svg';

import { MONO, Text } from '@/components/text';
import { LINK_BASE } from '@/constants/links';
import type { Cert } from '@/store/game-store';
import { dirStyle, getLanguage, S } from '@/strings';

const GOLD = '#E2C27A';
const WHITE = '#F7F3EA';
const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });

/** One line, shrunk to fit, on phones; react-native-web clips such lines (descenders, Persian marks), so there they wrap. */
const FIT = Platform.OS === 'web' ? {} : ({ numberOfLines: 1, adjustsFontSizeToFit: true } as const);

export const CERT_PIXELS = { width: 1080, height: 1920 };
export const CERT_RATIO = 16 / 9;

/** Latin names get the script font; Persian/Arabic/Cyrillic names keep the app font. */
const isLatin = (s: string) => /^[\u0000-ɏ\s]+$/.test(s);

export const Certificate = forwardRef<View, { cert: Cert; name: string; width: number }>(function Certificate({ cert, name, width }, ref) {
  const u = width / 100;
  const H = width * CERT_RATIO;
  const shown = name || S.certPlayer;
  const latinName = isLatin(shown);
  const latinUi = getLanguage() === 'en' || getLanguage() === 'ru';
  const year = Number(cert.period.slice(0, 4));
  const host = LINK_BASE.replace(/^https?:\/\//, '');
  return (
    <View ref={ref} collapsable={false} style={{ width, height: H, overflow: 'hidden' }}>
      <LinearGradient colors={['#11574B', '#0A3B33', '#06231E']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
      <Decor width={width} height={H} year={year} />

      <View style={[styles.content, { paddingHorizontal: u * 11, paddingTop: H * 0.31, paddingBottom: H * 0.1 }, dirStyle()]}>
        <Text style={[styles.word, { fontSize: u * (latinUi ? 8.6 : 7.4), paddingVertical: u * 0.6, letterSpacing: latinUi ? u * 0.9 : 0 }]} {...FIT}>
          {latinUi ? S.certWord.toUpperCase() : S.certWord}
        </Text>
        <Text style={[styles.kicker, { fontSize: u * 3.4, lineHeight: u * 5.4, letterSpacing: latinUi ? u * 0.6 : 0, marginTop: u * 0.4 }]}>
          {latinUi ? S.certKicker.toUpperCase() : S.certKicker}
        </Text>
        <Text style={[styles.head, { fontSize: u * (latinUi ? 6.2 : 5.6), paddingVertical: u * 0.6, marginTop: u * 2.5 }]} {...FIT}>
          {S.certHeads[cert.kind]}
        </Text>
        <Text style={[styles.certify, { fontSize: u * 3, lineHeight: u * 5, letterSpacing: latinUi ? u * 0.5 : 0, marginTop: u * 2.5 }]}>
          {latinUi ? S.certCertify.toUpperCase() : S.certCertify}
        </Text>
        {latinName ? (
          <RNText style={[styles.script, { fontSize: u * 13, paddingVertical: u * 1, marginTop: 0 }]} {...FIT}>
            {shown}
          </RNText>
        ) : (
          <Text style={[styles.nameFa, { fontSize: u * 9, paddingVertical: u * 0.8, marginTop: 0 }]} {...FIT}>
            {shown}
          </Text>
        )}
        <View style={[styles.rule, { width: u * 52, marginTop: u * 1 }]} />
        <Text style={[styles.body, { fontSize: u * (latinUi ? 3.6 : 3.3), lineHeight: u * (latinUi ? 5.6 : 6), marginTop: u * 2.5 }]}>
          {(S.certBody[cert.kind] ?? (() => ''))(S.fullDate(cert.period))}
        </Text>

        <View style={[styles.sign, { marginTop: 'auto', gap: u * 0.6 }]}>
          <RNText style={[styles.signature, { fontSize: u * 9, lineHeight: u * 12.5 }]}>Tiaro</RNText>
          <View style={[styles.signLine, { width: u * 40 }]} />
          <Text style={[styles.small, { fontSize: u * 2.6, letterSpacing: latinUi ? u * 0.3 : 0 }]}>{S.certSigned}</Text>
        </View>
        <View style={[styles.footer, { marginTop: u * 3, gap: u * 0.4 }]}>
          <Text style={[styles.small, { fontSize: u * 2.6 }]}>
            {S.certNo} <Text style={[styles.small, styles.latin, { fontSize: u * 2.6 }]}>{(cert.id ?? '········').toUpperCase()}</Text>
          </Text>
          <Text style={[styles.small, styles.latin, { fontSize: u * 2.4 }]}>
            {host}/cert/{cert.id ?? ''}
          </Text>
        </View>
      </View>
    </View>
  );
});

/** Gold corner shapes, dots, a thin frame and the medal (drawn in a 100 × 177.8 box). */
function Decor({ width, height, year }: { width: number; height: number; year: number }) {
  const h = 177.8;
  const dots: [number, number][] = [];
  // Dots in the bottom-left corner, away from the text and the signature.
  for (let x = 6; x <= 26; x += 3.2) for (let y = 146; y <= 172; y += 3.2) if (x - 6 + (172 - y) < 24) dots.push([x, y]);
  return (
    <Svg width={width} height={height} viewBox={`0 0 100 ${h}`} style={StyleSheet.absoluteFill}>
      <Defs>
        <SvgGradient id="certGold" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#F6E3A6" />
          <Stop offset="0.55" stopColor="#D9B45A" />
          <Stop offset="1" stopColor="#A9802F" />
        </SvgGradient>
        <SvgGradient id="certMedal" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FBEAB5" />
          <Stop offset="1" stopColor="#C49A45" />
        </SvgGradient>
      </Defs>
      {/* Lighter green bands behind the gold, like the folded-paper look of the sample. */}
      <Polygon points="0,0 70,0 0,62" fill="#0E4C42" />
      <Polygon points="100,178 100,96 30,178" fill="#0D463D" />
      {/* Gold corners. */}
      <Polygon points="0,0 44,0 0,36" fill="url(#certGold)" />
      <Polygon points="100,178 100,140 56,178" fill="url(#certGold)" />
      {dots.map(([x, y]) => (
        <Circle key={`${x}-${y}`} cx={x} cy={y} r={0.55} fill={GOLD} opacity={0.85} />
      ))}
      {/* Thin gold frame. */}
      <Rect x={3} y={3} width={94} height={h - 6} fill="none" stroke={GOLD} strokeWidth={0.35} opacity={0.7} />

      {/* Medal: ribbons, scalloped rim, laurels, "TIARO" and the year. */}
      <G transform="translate(72 30)">
        <Path d="M-7 6 L-12 24 L-7.5 21 L-5 26 L-1.5 9 Z" fill="#D9B45A" />
        <Path d="M7 6 L12 24 L7.5 21 L5 26 L1.5 9 Z" fill="#C49A45" />
        <Circle r={13} fill="#A9802F" />
        <Circle r={11.6} fill="url(#certMedal)" />
        <Circle r={9.2} fill="#0B3E35" />
        <Circle r={8.4} fill="none" stroke={GOLD} strokeWidth={0.3} />
        {/* Each word gets a fixed length (textLength), because iPhones draw SVG text in a wider font than the web and
            the year ran into the rim. */}
        <SvgText x={0} y={-3.3} fontSize={1.7} fill={GOLD} textAnchor="middle" fontWeight="bold" textLength={7.6} lengthAdjust="spacingAndGlyphs">
          TIARO
        </SvgText>
        <SvgText x={0} y={2.1} fontSize={4} fill={GOLD} textAnchor="middle" fontWeight="bold" textLength={10.4} lengthAdjust="spacingAndGlyphs">
          {String(year)}
        </SvgText>
        <SvgText x={0} y={5.3} fontSize={1.3} fill={GOLD} textAnchor="middle" textLength={6.6} lengthAdjust="spacingAndGlyphs">
          AWARD
        </SvgText>
        {/* Two small stars beside "AWARD" instead of laurels, which crowded the year. */}
        <Circle cx={-5.2} cy={4.85} r={0.45} fill={GOLD} />
        <Circle cx={5.2} cy={4.85} r={0.45} fill={GOLD} />
      </G>
      {/* A small crown inside the top-left gold corner, clear of its diagonal edge. */}
      <G transform="translate(6.5 6) scale(0.45)">
        <Path d="M3.2 17.5 2 7.2l5.4 4.1L12 4.2l4.6 7.1L22 7.2l-1.2 10.3Z M3.4 19h17.2v2.2H3.4Z" fill="#0B3E35" />
      </G>
    </Svg>
  );
}


const styles = StyleSheet.create({
  content: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center' },
  word: { fontFamily: serif, fontWeight: '700', color: WHITE, textAlign: 'center' },
  kicker: { color: GOLD, fontWeight: '600', textAlign: 'center' },
  head: { fontFamily: serif, fontWeight: '700', color: GOLD, textAlign: 'center' },
  certify: { color: WHITE, fontWeight: '600', textAlign: 'center', opacity: 0.9 },
  script: { fontFamily: 'GreatVibes', color: GOLD, textAlign: 'center', paddingHorizontal: 8 },
  nameFa: { fontWeight: '700', color: GOLD, textAlign: 'center' },
  rule: { height: 1, backgroundColor: GOLD, opacity: 0.8 },
  body: { color: WHITE, textAlign: 'center', maxWidth: '92%' },
  sign: { alignItems: 'center' },
  signature: { fontFamily: 'GreatVibes', color: WHITE },
  signLine: { height: 1, backgroundColor: WHITE, opacity: 0.85 },
  small: { color: WHITE, opacity: 0.8, textAlign: 'center' },
  latin: { fontFamily: MONO },
  footer: { alignItems: 'center' },
});
