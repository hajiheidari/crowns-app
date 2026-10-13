/**
 * Certificates the player earned (newest first), each with a share button, and how to earn the others.
 * Opening the screen clears the "new certificate" mark on Home.
 */
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ScreenHeader } from '@/components/screen-header';
import { Text } from '@/components/text';
import { LINK_BASE } from '@/constants/links';
import { CERT_PIXELS, Certificate } from '@/features/certificates/certificate';
import { usePalette } from '@/hooks/use-palette';
import { track } from '@/services/analytics';
import { captureView } from '@/services/capture';
import { canShareImages, shareImage, shareText } from '@/services/share';
import { issueCertificates, uniqueCerts, useGameStore, type Cert, type CertKind } from '@/store/game-store';
import { S } from '@/strings';

const KINDS: CertKind[] = ['week', 'month', 'genius', 'streak30', 'streak100'];

export default function CertificatesScreen() {
  const { c } = usePalette();
  const router = useRouter();
  const certs = useGameStore((s) => s.meta.certs);
  const nickname = useGameStore((s) => s.meta.nickname);
  const { width } = useWindowDimensions();
  const cardW = Math.min(width - 48, 420);

  useEffect(() => {
    useGameStore.getState().updateMeta({ certsNew: 0 });
    void issueCertificates();
  }, []);

  const shown = uniqueCerts(certs).reverse();
  const missing = KINDS.filter((k) => !certs.some((x) => x.kind === k) || k === 'week' || k === 'month' || k === 'genius');

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
      <ScreenHeader title={S.certsTitle} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {!nickname && (
          <View style={[styles.hint, { backgroundColor: c.surfaceMuted }]}>
            <Text style={[styles.hintText, { color: c.text }]}>{S.certNameHint}</Text>
            <Button label={S.certSetName} variant="secondary" onPress={() => router.push('/league')} />
          </View>
        )}
        {shown.map((cert) => (
          <CertItem key={`${cert.kind}-${cert.period}`} cert={cert} name={nickname} width={cardW} />
        ))}
        <Text style={[styles.section, { color: c.text }]}>{shown.length ? S.certMore : S.certEmpty}</Text>
        {missing.map((k) => (
          <View key={k} style={[styles.goal, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={styles.goalIcon}>{k === 'week' || k === 'month' ? '🏆' : k === 'genius' ? '🧠' : '🔥'}</Text>
            <View style={styles.goalText}>
              <Text style={[styles.goalTitle, { color: c.text }]}>{S.certHeads[k]}</Text>
              <Text style={[styles.goalSub, { color: c.textSecondary }]}>{S.certGoals[k]}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function CertItem({ cert, name, width }: { cert: Cert; name: string; width: number }) {
  const { c } = usePalette();
  const ref = useRef<View>(null);
  const [note, setNote] = useState<string | null>(null);
  const link = cert.id ? `${LINK_BASE}/cert/${cert.id}` : LINK_BASE;
  const text = `${S.certHeads[cert.kind]} 👑 ${name || S.certPlayer}\n${link}`;
  const share = async () => {
    track('certificate_shared', { kind: cert.kind });
    const uri = canShareImages ? await captureView(ref, CERT_PIXELS) : null;
    const status = uri ? await shareImage(uri, S.certShare, text) : await shareText(text);
    setNote(status === 'copied' ? S.copied : status === 'failed' ? text : null);
  };
  return (
    <View style={styles.item}>
      <View style={[styles.frame, { borderColor: c.border }]}>
        <Certificate ref={ref} cert={cert} name={name} width={width} />
      </View>
      <Button label={`📤 ${S.certShare}`} onPress={share} />
      {note && <Text selectable style={[styles.note, { color: c.textSecondary }]}>{note}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 14, alignItems: 'center' },
  hint: { borderRadius: 14, padding: 12, gap: 8, alignSelf: 'center', width: '100%', maxWidth: 720 },
  hintText: { fontSize: 14 },
  item: { gap: 8, alignSelf: 'stretch', alignItems: 'center' },
  frame: { borderRadius: 6, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  note: { fontSize: 13, textAlign: 'center' },
  section: { fontSize: 18, fontWeight: '800', alignSelf: 'center', width: '100%', maxWidth: 720, marginTop: 6 },
  goal: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 12, alignSelf: 'center', width: '100%', maxWidth: 720 },
  goalIcon: { fontSize: 26 },
  goalText: { flex: 1, gap: 2 },
  goalTitle: { fontSize: 15, fontWeight: '700' },
  goalSub: { fontSize: 13 },
});
