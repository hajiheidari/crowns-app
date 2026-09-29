import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
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
  onShare: () => void;
  onArchive?: () => void;
  onChallenge: () => void;
  /** Friend's time when this game came from a challenge link. */
  versus?: number;
  /** Offer the daily reminder here (once, after the first solved daily). */
  reminderOffer?: { hour: number; onAnswer: (yes: boolean) => void };
}

export function WinOverlay({ result, isDaily, onNext, onHome, onShare, onArchive, onChallenge, versus, reminderOffer }: Props) {
  const { c } = usePalette();
  // Screen readers hear the result right away instead of having to find the card.
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${S.youSolvedIt} ${formatTime(result.seconds)}`);
  }, [result.seconds]);
  return (
    <Animated.View entering={FadeIn.duration(250)} style={[StyleSheet.absoluteFill, styles.backdrop]}>
      <Animated.View
        accessibilityViewIsModal
        entering={ZoomIn.springify().damping(14)}
        style={[styles.card, { backgroundColor: c.surface }]}>
        <CrownIcon size={72} color={c.gold} />
        <Text style={[styles.title, { color: c.text }]}>{S.youSolvedIt}</Text>
        <Text style={[styles.time, { color: c.text }]}>{formatTime(result.seconds)}</Text>
        <View style={styles.badges}>
          {result.newBest && <Badge text={S.newBest} color={c.goldText} bg={c.surfaceMuted} />}
          <Badge text={result.hints === 0 ? S.noHints : S.hintsUsed(result.hints)} color={c.textSecondary} bg={c.surfaceMuted} />
          {result.streak !== undefined && <Badge text={`🔥 ${S.streakDays(result.streak)}`} color={c.flame} bg={c.surfaceMuted} />}
        </View>
        {versus !== undefined && (
          <View style={[styles.versus, { backgroundColor: c.surfaceMuted }]}>
            <View style={styles.vsRow}>
              <VsTime label={S.you} seconds={result.seconds} strong={result.seconds <= versus} />
              <Text style={[styles.vsMid, { color: c.textSecondary }]}>vs</Text>
              <VsTime label={S.friend} seconds={versus} strong={versus <= result.seconds} />
            </View>
            <Text style={[styles.vsVerdict, { color: c.text }]}>
              {result.seconds < versus ? S.vsWin : result.seconds > versus ? S.vsLose : S.vsTie}
            </Text>
          </View>
        )}
        <View style={styles.shareRow}>
          <Button label={S.share} variant="secondary" onPress={onShare} style={styles.flex} />
          <Button label={versus !== undefined ? S.rematch : S.challenge} variant="secondary" onPress={onChallenge} style={styles.flex} />
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
            <>
              <Button label={S.backHome} onPress={onHome} />
              {onArchive && <Button label={S.archive} variant="ghost" onPress={onArchive} />}
            </>
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

function VsTime({ label, seconds, strong }: { label: string; seconds: number; strong: boolean }) {
  const { c } = usePalette();
  return (
    <View style={styles.vsTime}>
      <Text style={[styles.vsLabel, { color: c.textSecondary }]}>{label}</Text>
      <Text style={[styles.vsValue, { color: strong ? c.goldText : c.text, fontWeight: strong ? '700' : '400' }]}>{formatTime(seconds)}</Text>
    </View>
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
  shareRow: { flexDirection: 'row', gap: 8, alignSelf: 'stretch' },
  versus: { alignSelf: 'stretch', borderRadius: 14, padding: 12, gap: 4, alignItems: 'center' },
  vsRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  vsTime: { alignItems: 'center', minWidth: 90 },
  vsLabel: { fontSize: 13, fontWeight: '600' },
  vsValue: { fontSize: 24, fontVariant: ['tabular-nums'] },
  vsMid: { fontSize: 15, fontWeight: '600' },
  vsVerdict: { fontSize: 15, fontWeight: '700' },
  actions: { alignSelf: 'stretch', gap: 4, marginTop: 8 },
});
