/**
 * "Share result" sheet: a preview of the image card (square or story size) plus the
 * Wordle-style text. Image sharing needs the phone app; the web preview copies the text.
 */
import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import type { Puzzle } from '@/engine';
import { usePalette } from '@/hooks/use-palette';
import { track } from '@/services/analytics';
import { captureView } from '@/services/capture';
import { canShareImages, shareImage, shareText } from '@/services/share';
import { getRefCode } from '@/store/game-store';
import { S } from '@/strings';

import { puzzleTitle, resultText, type ShareResult } from './messages';
import { ShareCard, type CardFormat } from './share-card';

interface Props {
  visible: boolean;
  puzzle: Puzzle;
  result: ShareResult;
  onClose: () => void;
}

const PIXELS = { square: { width: 1080, height: 1080 }, story: { width: 1080, height: 1920 } };

export function ShareSheet({ visible, puzzle, result, onClose }: Props) {
  const { c } = usePalette();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const cardRef = useRef<View>(null);
  const [format, setFormat] = useState<CardFormat>('square');
  const [note, setNote] = useState<string | null>(null);

  // Fit the preview inside the sheet: full width for square, height-limited for story.
  const maxW = Math.min(screenW - 40, 360);
  const cardW = format === 'story' ? Math.min(maxW, ((screenH * 0.45) * 9) / 16) : Math.min(maxW, screenH * 0.38);

  const onShareImage = async () => {
    const uri = await captureView(cardRef, PIXELS[format]);
    if (!uri) return;
    track('share_result', { type: 'image' });
    await shareImage(uri, S.shareResult);
  };
  const onShareText = async () => {
    track('share_result', { type: 'text' });
    const res = await shareText(resultText(result, getRefCode()));
    setNote(res === 'copied' ? S.copied : null);
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={S.hintClose} />
      <SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: c.surface }]}>
        <View style={[styles.grabber, { backgroundColor: c.border }]} />
        <Text style={[styles.title, { color: c.text }]}>{S.shareResult}</Text>
        <View style={[styles.segment, { backgroundColor: c.surfaceMuted }]}>
          {(['square', 'story'] as const).map((f) => (
            <Pressable
              key={f}
              accessibilityRole="button"
              accessibilityState={{ selected: format === f }}
              onPress={() => setFormat(f)}
              style={[styles.segmentItem, format === f && { backgroundColor: c.surface }]}>
              <Text style={[styles.segmentText, { color: format === f ? c.text : c.textSecondary }]}>
                {f === 'square' ? S.cardSquare : S.cardStory}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={[styles.preview, { borderColor: c.border }]}>
          <ShareCard
            ref={cardRef}
            puzzle={puzzle}
            title={puzzleTitle(result.puzzleId)}
            seconds={result.seconds}
            hints={result.hints}
            streak={result.streak}
            format={format}
            width={cardW}
          />
        </View>
        {canShareImages && <Button label={S.shareImage} onPress={onShareImage} />}
        <Button label={canShareImages ? S.shareText : S.copyText} variant={canShareImages ? 'secondary' : 'primary'} onPress={onShareText} />
        {note ? <Text style={[styles.note, { color: c.textSecondary }]}>{note}</Text> : null}
        {!canShareImages && <Text style={[styles.note, { color: c.textSecondary }]}>{S.imageShareWebNote}</Text>}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
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
  segment: { flexDirection: 'row', borderRadius: 12, padding: 4, alignSelf: 'center' },
  segmentItem: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 9 },
  segmentText: { fontSize: 15, fontWeight: '600' },
  preview: { alignSelf: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, overflow: 'hidden' },
  note: { fontSize: 13, textAlign: 'center' },
});
