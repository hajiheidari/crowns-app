import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { usePalette } from '@/hooks/use-palette';
import { S } from '@/strings';

interface Props {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Small cross-platform confirm dialog (Alert has no buttons on web). */
export function ConfirmDialog({ visible, title, body, confirmLabel, onConfirm, onCancel }: Props) {
  const { c } = usePalette();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={[styles.card, { backgroundColor: c.surface }]} onPress={() => {}}>
          <Text style={[styles.title, { color: c.text }]}>{title}</Text>
          <Text style={[styles.body, { color: c.textSecondary }]}>{body}</Text>
          <View style={styles.row}>
            <Button label={S.cancel} variant="secondary" onPress={onCancel} style={styles.flex} />
            <Button label={confirmLabel} onPress={onConfirm} style={styles.flex} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 360, borderRadius: 20, padding: 20, gap: 10 },
  title: { fontSize: 19, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 21 },
  row: { flexDirection: 'row', gap: 10, marginTop: 8 },
  flex: { flex: 1 },
});
