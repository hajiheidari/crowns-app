/**
 * The picture people post: title (hard/expert only), a fun brag line, time, badges and the puzzle's color map
 * (no crowns, so no spoilers).
 * Always drawn in the light brand colors so shared images look the same everywhere.
 */
import { forwardRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { CrownIcon } from '@/components/crown-icon';
import { LINK_BASE } from '@/constants/links';
import { Colors, RegionColors } from '@/constants/theme';
import { formatTime, type Puzzle } from '@/engine';
import { S } from '@/strings';
import { Text } from '@/components/text';

export type CardFormat = 'square' | 'story';

interface Props {
  puzzle: Puzzle;
  /** Null for easy/medium puzzles: the card then shows no title. */
  title: string | null;
  brag: string;
  seconds: number;
  hints: number;
  streak?: number;
  format: CardFormat;
  /** Rendered width in points; the image is captured at a fixed pixel size. */
  width: number;
}

const c = Colors.light;
const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });

export const ShareCard = forwardRef<View, Props>(function ShareCard(p, ref) {
  const height = p.format === 'story' ? (p.width * 16) / 9 : p.width;
  const u = p.width / 100; // layout unit: 1% of the card width
  const boardSize = p.format === 'story' ? p.width * 0.72 : p.width * 0.4;
  const cell = boardSize / p.puzzle.n;
  const badges = [p.hints === 0 ? S.noHints : S.hintsUsed(p.hints)];
  if (p.streak && p.streak > 1) badges.push(`🔥 ${S.streakDays(p.streak)}`);

  return (
    <View ref={ref} collapsable={false} style={[styles.card, { width: p.width, height, padding: 4 * u, gap: 2 * u }]}>
      <View style={[styles.brand, { gap: 2 * u }]}>
        <CrownIcon size={8 * u} color={c.gold} />
        <Text style={[styles.brandText, { fontSize: 7 * u }]}>{S.appName}</Text>
      </View>
      {p.title ? <Text style={[styles.title, { fontSize: 5.5 * u }]}>{p.title}</Text> : null}
      <View style={[styles.board, { width: boardSize, height: boardSize, borderRadius: 2 * u }]}>
        {p.puzzle.regions.map((r, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: (i % p.puzzle.n) * cell,
              top: Math.floor(i / p.puzzle.n) * cell,
              width: cell,
              height: cell,
              backgroundColor: RegionColors.light[r],
              borderColor: c.background,
              borderWidth: Math.max(1, u * 0.3),
            }}
          />
        ))}
      </View>
      <Text style={[styles.brag, { fontSize: 5 * u }]} numberOfLines={2}>
        {p.brag}
      </Text>
      <Text style={[styles.time, { fontSize: 11 * u }]}>{formatTime(p.seconds)}</Text>
      <View style={[styles.badges, { gap: 2 * u }]}>
        {badges.map((b) => (
          <Text key={b} style={[styles.badge, { fontSize: 3.8 * u, paddingHorizontal: 3 * u, paddingVertical: 1.2 * u, borderRadius: 5 * u }]}>
            {b}
          </Text>
        ))}
      </View>
      <Text style={[styles.footer, { fontSize: 3.4 * u }]}>{S.cardFooter(LINK_BASE.replace(/^https?:\/\//, ''))}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { backgroundColor: c.background, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  brand: { flexDirection: 'row', alignItems: 'center' },
  brandText: { color: c.text, fontFamily: serif, fontWeight: '600' },
  title: { color: c.textSecondary, fontWeight: '700' },
  board: { overflow: 'hidden', backgroundColor: c.background },
  brag: { color: c.text, fontWeight: '800', textAlign: 'center' },
  time: { color: c.text, fontWeight: '300', fontVariant: ['tabular-nums'] },
  badges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  badge: { color: c.goldText, backgroundColor: c.surfaceMuted, fontWeight: '700', overflow: 'hidden' },
  footer: { color: c.textSecondary, fontWeight: '600' },
});
