/**
 * The picture people post: a fun brag line, time, badges and the puzzle's color map
 * (no crowns, so no spoilers).
 * Drawn in the player's theme (dark players share a dark card). The square card puts the board beside the text so
 * everything fits, also with Vazirmatn's taller lines.
 */
import { forwardRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { CrownIcon } from '@/components/crown-icon';
import { APP_PAGE } from '@/constants/links';
import { Colors, RegionColors } from '@/constants/theme';
import { formatTime, type Puzzle } from '@/engine';
import { S } from '@/strings';
import { Text } from '@/components/text';

export type CardFormat = 'square' | 'story';

interface Props {
  puzzle: Puzzle;
  brag: string;
  seconds: number;
  hints: number;
  streak?: number;
  format: CardFormat;
  /** Rendered width in points; the image is captured at a fixed pixel size. */
  width: number;
  dark: boolean;
}

/** "espadna.com/tiaro-app": where a friend can install the app. */
const APP_PAGE_SHORT = APP_PAGE.replace(/^https?:\/\//, '').replace(/\/$/, '');
const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });

export const ShareCard = forwardRef<View, Props>(function ShareCard(p, ref) {
  const c = p.dark ? Colors.dark : Colors.light;
  const regions = p.dark ? RegionColors.dark : RegionColors.light;
  const story = p.format === 'story';
  const height = story ? (p.width * 16) / 9 : p.width;
  const u = p.width / 100; // layout unit: 1% of the card width
  const boardSize = story ? p.width * 0.72 : p.width * 0.44;
  const cell = boardSize / p.puzzle.n;
  const badges = [p.hints === 0 ? S.noHints : S.hintsUsed(p.hints)];
  if (p.streak && p.streak > 1) badges.push(`🔥 ${S.streakDays(p.streak)}`);

  const board = (
    <View style={[styles.board, { width: boardSize, height: boardSize, borderRadius: 2 * u, backgroundColor: c.background }]}>
      {p.puzzle.regions.map((r, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: (i % p.puzzle.n) * cell,
            top: Math.floor(i / p.puzzle.n) * cell,
            width: cell,
            height: cell,
            backgroundColor: regions[r],
            borderColor: c.background,
            borderWidth: Math.max(1, u * 0.3),
          }}
        />
      ))}
    </View>
  );
  const result = (
    <View style={[styles.result, { gap: (story ? 2 : 1.5) * u }, !story && { width: 44 * u }]}>
      <Text style={[styles.brag, { color: c.text, fontSize: (story ? 5 : 4.6) * u, lineHeight: (story ? 7 : 6.4) * u }]} numberOfLines={3}>
        {p.brag}
      </Text>
      <Text style={[styles.time, { color: c.text, fontSize: (story ? 11 : 10) * u, lineHeight: (story ? 14 : 12.5) * u }]}>
        {formatTime(p.seconds)}
      </Text>
      <View style={[styles.badges, { gap: 1.5 * u }]}>
        {badges.map((b) => (
          <Text
            key={b}
            style={[
              styles.badge,
              { color: c.goldText, backgroundColor: c.surfaceMuted },
              { fontSize: 3.6 * u, lineHeight: 5.4 * u, paddingHorizontal: 2.6 * u, paddingVertical: 0.8 * u, borderRadius: 4 * u },
            ]}>
            {b}
          </Text>
        ))}
      </View>
    </View>
  );

  return (
    <View
      ref={ref}
      collapsable={false}
      style={[styles.card, { backgroundColor: c.background, width: p.width, height, padding: 5 * u, gap: (story ? 3 : 2.5) * u }]}>
      <View style={styles.head}>
        <View style={[styles.brand, { gap: 2 * u }]}>
          <CrownIcon size={7 * u} color={c.gold} />
          <Text style={[styles.brandText, { color: c.text, fontSize: 6.5 * u, lineHeight: 8.5 * u }]}>{S.appName}</Text>
        </View>
      </View>
      {story ? (
        <>
          {board}
          {result}
        </>
      ) : (
        <View style={[styles.row, { gap: 5 * u }]}>
          {board}
          {result}
        </View>
      )}
      <Text style={[styles.footer, { color: c.textSecondary, fontSize: 3.4 * u, lineHeight: 5 * u }]}>
        {S.cardFooter(APP_PAGE_SHORT)}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  head: { alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center' },
  brandText: { fontFamily: serif, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center' },
  board: { overflow: 'hidden' },
  result: { alignItems: 'center' },
  brag: { fontWeight: '800', textAlign: 'center' },
  time: { fontWeight: '300', fontVariant: ['tabular-nums'] },
  badges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  badge: { fontWeight: '700', overflow: 'hidden' },
  footer: { fontWeight: '600' },
});
