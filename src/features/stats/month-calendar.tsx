import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { dateKey } from '@/engine';
import { usePalette } from '@/hooks/use-palette';
import { monthView } from '@/features/stats/calendar';
import { BackIcon } from '@/components/icons';
import { isRTL, S } from '@/strings';
import { Text } from '@/components/text';

export type DayMark = 'locked' | 'started';

interface Props {
  solved: Record<string, number>;
  /** Makes days tappable (archive). Days outside [minKey, today] stay disabled. */
  onPressDay?: (key: string) => void;
  minKey?: string;
  mark?: (key: string) => DayMark | null;
}

/** Month grid of daily puzzles: solved days filled in gold, today outlined. */
export function MonthCalendar({ solved, onPressDay, minKey, mark }: Props) {
  const { c } = usePalette();
  const today = new Date();
  const todayKey = dateKey(today);
  const [offset, setOffset] = useState(0);
  const month = monthView(offset, today);
  const cells: ({ day: number; key: string } | null)[] = [...Array.from({ length: month.lead }, () => null), ...month.days];
  while (cells.length % 7) cells.push(null);
  const solvedThisMonth = month.days.filter((d) => solved[d.key] !== undefined).length;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <NavButton
          forward={false}
          a11y={S.prevMonth}
          onPress={() => setOffset(offset - 1)}
          disabled={!!minKey && month.prevEndKey < minKey}
        />
        <Text style={[styles.month, { color: c.text }]}>
          {S.monthTitle(month.name, month.year, solvedThisMonth)}
        </Text>
        <NavButton forward a11y={S.nextMonth} onPress={() => setOffset(offset + 1)} disabled={offset >= 0} />
      </View>
      <View style={styles.grid}>
        {S.weekdays.map((d, i) => (
          <Text key={`h${i}`} style={[styles.weekday, { color: c.textSecondary }]}>
            {d}
          </Text>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <View key={i} style={styles.cell} />;
          const { day: d, key } = cell;
          const done = solved[key] !== undefined;
          const inRange = key <= todayKey && (!minKey || key >= minKey);
          const m = inRange && !done ? mark?.(key) : null;
          const label = S.dayLabel(month.name, d, done ? 'solved' : m === 'locked' ? 'locked' : m === 'started' ? 'started' : '');
          const day = (
            <View
              style={[
                styles.day,
                done && { backgroundColor: c.gold },
                onPressDay && inRange && !done && { backgroundColor: c.surfaceMuted },
                key === todayKey && { borderWidth: 2, borderColor: c.text },
              ]}>
              <Text style={[styles.dayText, { color: done ? '#1F1B16' : !inRange ? c.border : m === 'locked' ? c.textSecondary : c.text }]}>
                {d}
              </Text>
              {m && <Text style={[styles.dayMark, { color: c.goldText }]}>{m === 'locked' ? '🔒' : '•'}</Text>}
            </View>
          );
          if (!onPressDay) {
            return (
              <View key={i} style={styles.cell} accessibilityLabel={label}>
                {day}
              </View>
            );
          }
          return (
            <Pressable
              key={i}
              style={({ pressed }) => [styles.cell, { opacity: pressed ? 0.6 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel={label}
              disabled={!inRange}
              onPress={() => onPressDay(key)}>
              {day}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function NavButton({ forward, a11y, onPress, disabled }: { forward: boolean; a11y: string; onPress: () => void; disabled?: boolean }) {
  const { c } = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={onPress}
      disabled={disabled}
      hitSlop={10}
      style={[styles.nav, { opacity: disabled ? 0.25 : 1 }]}>
      <BackIcon size={22} color={c.text} flip={forward !== isRTL()} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  month: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  nav: { paddingHorizontal: 6, paddingVertical: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 3 },
  day: { flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  dayMark: { position: 'absolute', bottom: 1, fontSize: 9 },
  dayText: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
