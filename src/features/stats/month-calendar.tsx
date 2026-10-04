import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { dateKey } from '@/engine';
import { usePalette } from '@/hooks/use-palette';
import { S } from '@/strings';
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
  const first = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);
  const solvedThisMonth = cells.filter((d) => d && solved[dateKey(new Date(first.getFullYear(), first.getMonth(), d))] !== undefined).length;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <NavButton
          label={S.chevronBack}
          a11y={S.prevMonth}
          onPress={() => setOffset(offset - 1)}
          disabled={!!minKey && dateKey(new Date(first.getFullYear(), first.getMonth(), 0)) < minKey}
        />
        <Text style={[styles.month, { color: c.text }]}>
          {S.monthTitle(first.getMonth(), first.getFullYear(), solvedThisMonth)}
        </Text>
        <NavButton label={S.chevronForward} a11y={S.nextMonth} onPress={() => setOffset(offset + 1)} disabled={offset >= 0} />
      </View>
      <View style={styles.grid}>
        {S.weekdays.map((d, i) => (
          <Text key={`h${i}`} style={[styles.weekday, { color: c.textSecondary }]}>
            {d}
          </Text>
        ))}
        {cells.map((d, i) => {
          if (!d) return <View key={i} style={styles.cell} />;
          const key = dateKey(new Date(first.getFullYear(), first.getMonth(), d));
          const done = solved[key] !== undefined;
          const inRange = key <= todayKey && (!minKey || key >= minKey);
          const m = inRange && !done ? mark?.(key) : null;
          const label = S.dayLabel(first.getMonth(), d, done ? 'solved' : m === 'locked' ? 'locked' : m === 'started' ? 'started' : '');
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

function NavButton({ label, a11y, onPress, disabled }: { label: string; a11y: string; onPress: () => void; disabled?: boolean }) {
  const { c } = usePalette();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} onPress={onPress} disabled={disabled} hitSlop={10}>
      <Text style={[styles.nav, { color: c.text, opacity: disabled ? 0.25 : 1 }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  month: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  nav: { fontSize: 26, paddingHorizontal: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 3 },
  day: { flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  dayMark: { position: 'absolute', bottom: 1, fontSize: 9 },
  dayText: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
