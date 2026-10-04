/**
 * Renders what the ad services ask for: Apple's tracking explainer, and in the web preview a
 * stand-in for full-screen ads. Mounted once in the root layout.
 */
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { CrownIcon } from '@/components/crown-icon';
import { usePalette } from '@/hooks/use-palette';
import { dirStyle, S } from '@/strings';

import { useAdUi, type AdPrompt } from './ad-ui';
import { Text } from '@/components/text';

export function AdHost() {
  const prompt = useAdUi((s) => s.prompt);
  const clear = useAdUi((s) => s.clear);
  if (!prompt) return null;
  if (prompt.kind === 'tracking') {
    return (
      <TrackingExplainer
        onContinue={() => {
          clear();
          prompt.resolve();
        }}
      />
    );
  }
  return (
    <MockAd
      key={prompt.format}
      prompt={prompt}
      onDone={(completed) => {
        clear();
        prompt.resolve(completed);
      }}
    />
  );
}

function TrackingExplainer({ onContinue }: { onContinue: () => void }) {
  const { c } = usePalette();
  return (
    <Modal transparent animationType="fade">
      <View style={[styles.backdrop, dirStyle()]}>
        <View style={[styles.card, { backgroundColor: c.surface }]}>
          <CrownIcon size={48} color={c.gold} />
          <Text style={[styles.title, { color: c.text }]}>{S.trackingTitle}</Text>
          <Text style={[styles.body, { color: c.textSecondary }]}>{S.trackingBody}</Text>
          <Button label={S.continueLabel} onPress={onContinue} style={styles.stretch} />
        </View>
      </View>
    </Modal>
  );
}

const MOCK_SECONDS = { rewarded: 5, interstitial: 3 };

function MockAd({ prompt, onDone }: { prompt: Extract<AdPrompt, { kind: 'mock' }>; onDone: (completed: boolean) => void }) {
  const { c } = usePalette();
  const [left, setLeft] = useState(MOCK_SECONDS[prompt.format]);
  useEffect(() => {
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const rewarded = prompt.format === 'rewarded';
  return (
    <Modal transparent animationType="fade">
      <View style={[styles.backdrop, styles.dark, dirStyle()]}>
        <View style={[styles.card, { backgroundColor: c.surface }]}>
          <Text style={[styles.tag, { color: c.textSecondary, borderColor: c.border }]}>{S.mockAdTag}</Text>
          <Text style={[styles.title, { color: c.text }]}>{rewarded ? S.mockRewardedTitle : S.mockInterstitialTitle}</Text>
          <Text style={[styles.body, { color: c.textSecondary }]}>{S.mockAdBody}</Text>
          {left > 0 ? (
            <>
              <Text style={[styles.count, { color: c.text }]}>{left}</Text>
              {rewarded && <Button label={S.mockSkip} variant="ghost" onPress={() => onDone(false)} style={styles.stretch} />}
            </>
          ) : (
            <Button label={rewarded ? S.mockClaim : S.mockCloseAd} onPress={() => onDone(true)} style={styles.stretch} />
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
