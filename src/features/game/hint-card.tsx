import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/button';
import { usePalette } from '@/hooks/use-palette';
import { Text } from '@/components/text';

interface Props {
  title: string;
  body: string;
  primary?: { label: string; onPress: () => void };
  onClose: () => void;
  closeLabel: string;
}

export function HintCard({ title, body, primary, onClose, closeLabel }: Props) {
  const { c } = usePalette();
  return (
    <Animated.View entering={FadeInDown.duration(200)} style={[styles.card, { backgroundColor: c.surface, borderColor: c.gold }]}>
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      <Text style={[styles.body, { color: c.textSecondary }]}>{body}</Text>
      <View style={styles.row}>
        <Button label={closeLabel} variant="secondary" onPress={onClose} style={styles.flex} />
        {primary && <Button label={primary.label} onPress={primary.onPress} style={styles.flex} />}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', maxWidth: 560, borderRadius: 16, borderWidth: 2, padding: 14, gap: 6 },
  title: { fontSize: 17, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 21 },
  row: { flexDirection: 'row', gap: 10, marginTop: 6 },
  flex: { flex: 1 },
});
