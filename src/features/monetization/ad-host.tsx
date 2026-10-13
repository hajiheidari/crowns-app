/**
 * Web preview: renders the stand-in for a rewarded ad. Mounted once in the root layout.
 */
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { usePalette } from '@/hooks/use-palette';
import { dirStyle, S } from '@/strings';

import { useAdUi } from './ad-ui';
import { Text } from '@/components/text';

export function AdHost() {
  const prompt = useAdUi((s) => s.prompt);
  const clear = useAdUi((s) => s.clear);
  if (!prompt) return null;
  return (
    <MockAd
      onDone={(completed) => {
        clear();
        prompt.resolve(completed);
      }}
    />
  );
}

const MOCK_SECONDS = 5;

function MockAd({ onDone }: { onDone: (completed: boolean) => void }) {
  const { c } = usePalette();
  const [left, setLeft] = useState(MOCK_SECONDS);
  useEffect(() => {
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <Modal transparent animationType="fade">
      <View style={[styles.backdrop, styles.dark, dirStyle()]}>
        <View style={[styles.card, { backgroundColor: c.surface }]}>
          <Text style={[styles.tag, { color: c.textSecondary, borderColor: c.border }]}>{S.mockAdTag}</Text>
          <Text style={[styles.title, { color: c.text }]}>{S.mockRewardedTitle}</Text>
          <Text style={[styles.body, { color: c.textSecondary }]}>{S.mockAdBody}</Text>
          {left > 0 ? (
            <>
              <Text style={[styles.count, { color: c.text }]}>{left}</Text>
              <Button label={S.mockSkip} variant="ghost" onPress={() => onDone(false)} style={styles.stretch} />
            </>
          ) : (
            <Button label={S.mockClaim} onPress={() => onDone(true)} style={styles.stretch} />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dark: { backgroundColor: 'rgba(0,0,0,0.8)' },
  card: { width: '100%', maxWidth: 380, borderRadius: 24, padding: 24, alignItems: 'center', gap: 10 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: 16, lineHeight: 22, textAlign: 'center' },
  tag: { fontSize: 12, fontWeight: '700', borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  count: { fontSize: 40, fontWeight: '300', fontVariant: ['tabular-nums'] },
  stretch: { alignSelf: 'stretch' },
});
