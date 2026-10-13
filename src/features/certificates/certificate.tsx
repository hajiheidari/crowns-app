/**
 * A certificate in the style of real ones (Amir 2026-10-13): cream paper, a double gold frame, "This certifies that",
 * the player's name, what they did, a gold crown seal, a signature line and a verification number. Always light
 * (paper) in both themes. Sized by `width` (4:3); the share image is captured at 1440×1080.
 */
import { forwardRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { CrownIcon } from '@/components/crown-icon';
import { MONO, Text } from '@/components/text';
import { LINK_BASE } from '@/constants/links';
import type { Cert } from '@/store/game-store';
import { dirStyle, S } from '@/strings';

const GOLD = '#B8901F';
const GOLD_DARK = '#8A6D0B';
const INK = '#1F1B16';
const PAPER = '#FFFCF4';
const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });

export const CERT_PIXELS = { width: 1440, height: 1080 };

export const Certificate = forwardRef<View, { cert: Cert; name: string; width: number }>(function Certificate({ cert, name, width }, ref) {
  const u = width / 100;
  const host = LINK_BASE.replace(/^https?:\/\//, '');
  return (
    <View ref={ref} collapsable={false} style={[styles.paper, { width, height: width * 0.75, padding: u * 2.2 }]}>
      <View style={[styles.outer, { borderWidth: u * 0.6 }]}>
        <View style={[styles.inner, { margin: u * 1, borderWidth: u * 0.18, paddingHorizontal: u * 6, paddingVertical: u * 3.4 }, dirStyle()]}>
          {(['tl', 'tr', 'bl', 'br'] as const).map((k) => (
            <Ornament key={k} size={u * 5} corner={k} />
          ))}
          <View style={[styles.brandRow, { gap: u * 1.2 }]}>
            <CrownIcon size={u * 4.4} color={GOLD} />
            <Text style={[styles.brand, { fontSize: u * 2.3, letterSpacing: u * 0.6 }]}>TIARO</Text>
          </View>
          <Text style={[styles.kicker, { fontSize: u * 1.9, marginTop: u * 0.6 }]}>{S.certKicker.toUpperCase()}</Text>
          <Text style={[styles.head, { fontSize: u * 5.6, marginTop: u * 1.4 }]} numberOfLines={1} adjustsFontSizeToFit>
            {S.certHeads[cert.kind]}
          </Text>
          <Text style={[styles.certify, { fontSize: u * 2.3, marginTop: u * 1.6 }]}>{S.certCertify}</Text>
          <Text style={[styles.name, { fontSize: u * 5.2, marginTop: u * 0.8, paddingHorizontal: u * 4 }]} numberOfLines={1} adjustsFontSizeToFit>
            {name || S.certPlayer}
          </Text>
          <View style={[styles.rule, { width: u * 46, marginTop: u * 0.4 }]} />
          <Text style={[styles.body, { fontSize: u * 2.3, lineHeight: u * 3.5, marginTop: u * 1.8 }]}>
            {(S.certBody[cert.kind] ?? (() => ''))(S.fullDate(cert.period))}
          </Text>
          <View style={[styles.foot, { marginTop: 'auto', gap: u * 3 }]}>
            <View style={[styles.footSide, { gap: u * 0.4 }]}>
              <Text style={[styles.small, { fontSize: u * 1.6 }]}>
                {S.certNo} <Text style={[styles.small, styles.latin, { fontSize: u * 1.6 }]}>{(cert.id ?? '········').toUpperCase()}</Text>
              </Text>
              <Text style={[styles.small, styles.latin, { fontSize: u * 1.35 }]}>
                {host}/cert/{cert.id ?? ''}
              </Text>
            </View>
            <Seal size={u * 15} />
            <View style={[styles.footSide, { alignItems: 'center', gap: u * 0.5 }]}>
              <Text style={[styles.signature, { fontSize: u * 3.2 }]}>Tiaro</Text>
              <View style={[styles.signLine, { width: u * 22 }]} />
              <Text style={[styles.small, { fontSize: u * 1.5 }]}>{S.certSigned}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
});

/** Gold seal: scalloped rim, ribbon tails and a crown. */
function Seal({ size }: { size: number }) {
  const points = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const r = i % 2 === 0 ? 48 : 43;
    return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
  }).join(' ');
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
        <Path d="M34 70 L24 99 L35 92 L42 100 L48 74 Z" fill="#9E2B25" />
        <Path d="M66 70 L76 99 L65 92 L58 100 L52 74 Z" fill="#9E2B25" />
        <Path d={`M${points.split(' ').join(' L')} Z`} fill={GOLD} />
        <Circle cx={50} cy={50} r={36} fill="#E2BE4B" stroke={GOLD_DARK} strokeWidth={1.5} />
        <Circle cx={50} cy={50} r={31} fill="none" stroke={GOLD_DARK} strokeWidth={0.8} strokeDasharray="2 2" />
        {/* The crown (same shape as CrownIcon's 24-unit path), centred in the seal. */}
        <Path d="M3.2 17.5 2 7.2l5.4 4.1L12 4.2l4.6 7.1L22 7.2l-1.2 10.3Z M3.4 19h17.2v2.2H3.4Z" fill={INK} transform="translate(29 29) scale(1.75)" />
      </Svg>
    </View>
  );
}

function Ornament({ size, corner }: { size: number; corner: 'tl' | 'tr' | 'bl' | 'br' }) {
  const pos = { tl: { top: 6, left: 6 }, tr: { top: 6, right: 6 }, bl: { bottom: 6, left: 6 }, br: { bottom: 6, right: 6 } }[corner];
  const rotate = { tl: '0deg', tr: '90deg', br: '180deg', bl: '270deg' }[corner];
  return (
    <View style={[styles.ornament, pos, { width: size, height: size, transform: [{ rotate }] }]}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Path d="M2 2 H24 M2 2 V24" stroke={GOLD} strokeWidth={2} />
        <Path d="M8 8 H18 M8 8 V18" stroke={GOLD} strokeWidth={1} />
        <Path d="M2 2 L10 10" stroke={GOLD} strokeWidth={1} />
        <Circle cx={12} cy={12} r={2.2} fill={GOLD} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: { backgroundColor: '#EFE4C8' },
  outer: { flex: 1, borderColor: GOLD, backgroundColor: PAPER },
  inner: { flex: 1, borderColor: GOLD, alignItems: 'center' },
  ornament: { position: 'absolute' },
  brandRow: { flexDirection: 'row', alignItems: 'center', direction: 'ltr' },
  brand: { fontFamily: serif, fontWeight: '700', color: INK, textAlign: 'center' },
  kicker: { color: GOLD_DARK, fontWeight: '700', letterSpacing: 2, textAlign: 'center' },
  head: { fontFamily: serif, fontWeight: '700', color: INK, textAlign: 'center' },
  certify: { color: '#5B5248', fontStyle: 'italic', textAlign: 'center' },
  name: { fontFamily: serif, fontStyle: 'italic', fontWeight: '700', color: '#3A2A06', textAlign: 'center' },
  rule: { height: 1.5, backgroundColor: GOLD },
  body: { color: INK, textAlign: 'center', maxWidth: '86%' },
  foot: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch' },
  footSide: { flex: 1 },
  small: { color: '#6B5A3A', textAlign: 'center' },
  // Codes and links keep Latin letters and digits in every language (Text skips Persian digits for MONO).
  latin: { fontFamily: MONO },
  signature: { fontFamily: serif, fontStyle: 'italic', color: '#2B3A67' },
  signLine: { height: 1, backgroundColor: INK },
});
