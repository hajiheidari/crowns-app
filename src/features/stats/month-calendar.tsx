import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { dateKey } from '@/engine';
import { usePalette } from '@/hooks/use-palette';
import { S } from '@/strings';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Month grid of daily puzzles: solved days filled in gold, today outlined. */
export function MonthCalendar({ solved }: { solved: Record<string, number> }) {
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
        <NavButton label="‹" a11y="Previous month" onPress={() => setOffset(offset - 1)} />
        <Text style={[styles.month, { color: c.text }]}>
          {MONTHS[first.getMonth()]} {first.getFullYear()} · {solvedThisMonth} ✓
        </Text>
        <NavButton label="›" a11y="Next month" onPress={() => setOffset(offset + 1)} disabled={offset >= 0} />
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
          return (
            <View key={i} style={styles.cell}>
              <View
                accessibilityLabel={`${MONTHS[first.getMonth()]} ${d}${done ? ', solved' : ''}`}
                style={[
                  styles.day,
                  done && { backgroundColor: c.gold },
                  key === todayKey && { borderWidth: 2, borderColor: c.text },
                ]}>
                <Text style={[styles.dayText, { color: done ? '#1F1B16' : key > todayKey ? c.border : c.textSecondary }]}>{d}</Text>
              </View>
            </View>
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
  dayText: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
