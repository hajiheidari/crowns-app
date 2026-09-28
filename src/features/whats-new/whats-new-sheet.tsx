import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { usePalette } from '@/hooks/use-palette';
import { S } from '@/strings';

import { CHANGELOG } from './changelog.generated';

/** Compares "1.2.3" style versions. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  return 0;
}

interface Props {
  visible: boolean;
  /** Show only entries newer than this version; null shows everything. */
  since: string | null;
  onClose: () => void;
}

export function WhatsNewSheet({ visible, since, onClose }: Props) {
  const { c } = usePalette();
  const entries = since ? CHANGELOG.filter((e) => compareVersions(e.version, since) > 0) : CHANGELOG;
  const shown = entries.length ? entries : CHANGELOG.slice(0, 1);
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: c.surface }]}>
        <View style={[styles.grabber, { backgroundColor: c.border }]} />
        <Text style={[styles.title, { color: c.text }]}>{S.whatsNew}</Text>
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {shown.map((e) => (
            <View key={e.version} style={styles.entry}>
              <Text style={[styles.version, { color: c.textSecondary }]}>
                v{e.version} · {e.date}
              </Text>
              {e.items.map((item, i) => (
                <View key={i} style={styles.item}>
                  <Text style={[styles.bullet, { color: c.gold }]}>•</Text>
                  <Text style={[styles.itemText, { color: c.text }]}>{item}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
        <Button label={S.gotIt} onPress={onClose} />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    maxHeight: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 12,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3 },
  title: { fontSize: 22, fontWeight: '700' },
  list: { flexGrow: 0 },
  listContent: { gap: 16, paddingBottom: 4 },
  entry: { gap: 6 },
  version: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  item: { flexDirection: 'row', gap: 8 },
  bullet: { fontSize: 16, lineHeight: 22 },
  itemText: { flex: 1, fontSize: 16, lineHeight: 22 },
});
