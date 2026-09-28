import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { formatTime } from '@/engine';
import { usePalette } from '@/hooks/use-palette';

const H = 44;
const PAD = 5;

/** Last solve times, oldest → newest. Lower is better, so the best time is labeled. */
export function Sparkline({ values }: { values: number[] }) {
  const { c } = usePalette();
  const [w, setW] = useState(0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const x = (i: number) => PAD + (values.length === 1 ? (w - 2 * PAD) / 2 : (i * (w - 2 * PAD)) / (values.length - 1));
  const y = (v: number) => PAD + (1 - (v - min) / span) * (H - 2 * PAD);
  const last = values.length - 1;

  return (
    <View style={styles.row}>
      <View style={styles.chart} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {w > 0 && (
          <Svg width={w} height={H}>
            <Line x1={PAD} x2={w - PAD} y1={y(min)} y2={y(min)} stroke={c.border} strokeWidth={1} strokeDasharray="3 3" />
            {values.length > 1 && (
              <Polyline
                points={values.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
                fill="none"
                stroke={c.textSecondary}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}
            <Circle cx={x(last)} cy={y(values[last])} r={4} fill={c.gold} stroke={c.surface} strokeWidth={2} />
          </Svg>
        )}
      </View>
      <View style={styles.labels}>
        <Text style={[styles.label, { color: c.text }]}>{formatTime(values[last])}</Text>
        <Text style={[styles.sub, { color: c.textSecondary }]}>best {formatTime(min)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chart: { flex: 1, height: H },
  labels: { alignItems: 'flex-end', minWidth: 64 },
  label: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  sub: { fontSize: 12, fontVariant: ['tabular-nums'] },
});
