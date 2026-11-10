import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { usePalette } from '@/hooks/use-palette';
import { dirStyle, S } from '@/strings';

/** The rules of a newer puzzle type, shown the first time it is opened and from the "?" button. */
export function RulesCard({ visible, title, rules, onClose }: { visible: boolean; title: string; rules: string[]; onClose: () => void }) {
  const { c } = usePalette();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, dirStyle()]} onPress={onClose}>
        <Pressable style={[styles.card, { backgroundColor: c.surface }]} onPress={() => {}}>
          <Text style={[styles.title, { color: c.text }]}>{title}</Text>
          {rules.map((rule, i) => (
            <View key={i} style={styles.row}>
              <Text style={[styles.num, { backgroundColor: c.gold, color: '#1F1B16' }]}>{i + 1}</Text>
              <Text style={[styles.rule, { color: c.text }]}>{rule}</Text>
            </View>
          ))}
          <Button label={S.gotIt} onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 380, borderRadius: 20, padding: 20, gap: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  num: { width: 24, height: 24, borderRadius: 12, overflow: 'hidden', textAlign: 'center', lineHeight: 24, fontSize: 14, fontWeight: '800' },
  rule: { flex: 1, fontSize: 16, lineHeight: 23 },
});
