import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { Button } from '@/components/button';
import { CrownIcon } from '@/components/crown-icon';
import { formatTime } from '@/engine';
import { usePalette } from '@/hooks/use-palette';
import type { WinResult } from '@/store/game-store';
import { formatClock, S } from '@/strings';

interface Props {
  result: WinResult;
  isDaily: boolean;
  onNext: () => void;
  onHome: () => void;
  /** Offer the daily reminder here (once, after the first solved daily). */
  reminderOffer?: { hour: number; onAnswer: (yes: boolean) => void };
}

export function WinOverlay({ result, isDaily, onNext, onHome, reminderOffer }: Props) {
  const { c } = usePalette();
  return (
    <Animated.View entering={FadeIn.duration(250)} style={[StyleSheet.absoluteFill, styles.backdrop]}>
      <Animated.View entering={ZoomIn.springify().damping(14)} style={[styles.card, { backgroundColor: c.surface }]}>
        <CrownIcon size={72} color={c.gold} />
        <Text style={[styles.title, { color: c.text }]}>{S.youSolvedIt}</Text>
        <Text style={[styles.time, { color: c.text }]}>{formatTime(result.seconds)}</Text>
        <View style={styles.badges}>
          {result.newBest && <Badge text={S.newBest} color={c.goldText} bg={c.surfaceMuted} />}
          <Badge text={result.hints === 0 ? S.noHints : S.hintsUsed(result.hints)} color={c.textSecondary} bg={c.surfaceMuted} />
          {result.streak !== undefined && <Badge text={`🔥 ${S.streakDays(result.streak)}`} color={c.flame} bg={c.surfaceMuted} />}
        </View>
        {reminderOffer && (
          <View style={[styles.offer, { backgroundColor: c.surfaceMuted }]}>
            <Text style={[styles.offerTitle, { color: c.text }]}>{S.reminderOfferTitle}</Text>
            <View style={styles.offerRow}>
              <Button label={S.reminderOfferNo} variant="ghost" onPress={() => reminderOffer.onAnswer(false)} style={styles.flex} />
              <Button
                label={S.reminderOfferYes(formatClock(reminderOffer.hour, 0))}
                variant="secondary"
                onPress={() => reminderOffer.onAnswer(true)}
                style={styles.flex}
              />
            </View>
          </View>
        )}
        <View style={styles.actions}>
          {isDaily ? (
            <Button label={S.backHome} onPress={onHome} />
          ) : (
            <>
              <Button label={S.nextPuzzle} onPress={onNext} />
              <Button label={S.home} variant="ghost" onPress={onHome} />
            </>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 380, borderRadius: 24, padding: 24, alignItems: 'center', gap: 6 },
  title: { fontSize: 28, fontWeight: '700', marginTop: 4 },
  time: { fontSize: 44, fontWeight: '300', fontVariant: ['tabular-nums'] },
  badges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginVertical: 8 },
  badge: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { fontSize: 14, fontWeight: '600' },
  offer: { alignSelf: 'stretch', borderRadius: 14, padding: 12, gap: 8 },
  offerTitle: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  offerRow: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  actions: { alignSelf: 'stretch', gap: 4, marginTop: 8 },
});
