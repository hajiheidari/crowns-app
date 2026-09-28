import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Board } from '@/features/game/board';
import { SLIDES, TUTORIAL_PUZZLE } from '@/features/tutorial/slides';
import { usePalette } from '@/hooks/use-palette';
import { useGameStore } from '@/store/game-store';
import { S } from '@/strings';

const FRAME_MS = 900;
const noop = () => {};

export default function TutorialScreen() {
  const { c } = usePalette();
  const router = useRouter();
  const settings = useGameStore((s) => s.settings);
  const setTutorialSeen = useGameStore((s) => s.setTutorialSeen);
  const [index, setIndex] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((k) => k + 1), FRAME_MS);
    return () => clearInterval(t);
  }, []);

  const slide = SLIDES[index];
  const frame = slide.frames[tick % slide.frames.length];
  const last = index === SLIDES.length - 1;

  const go = (next: number) => {
    setIndex(next);
    setTick(0);
  };
  const finish = () => {
    setTutorialSeen();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
      <View style={styles.top}>
        <Text style={[styles.step, { color: c.textSecondary }]}>
          {index + 1} / {SLIDES.length}
        </Text>
        <Pressable accessibilityRole="button" onPress={finish} hitSlop={10}>
          <Text style={[styles.skip, { color: c.textSecondary }]}>{S.skip}</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.boardBox}>
          <Board
            puzzle={TUTORIAL_PUZZLE}
            board={frame.board}
            settings={{ ...settings, autoCross: !!frame.autoCross, highlightConflicts: true }}
            locked
            onTap={noop}
            onLongPress={noop}
            onDrag={noop}
            onDragTick={noop}
            highlight={frame.highlight ? new Set(frame.highlight) : undefined}
            danger={frame.danger ? new Set(frame.danger) : undefined}
            finger={frame.finger}
          />
        </View>
        <Text style={[styles.title, { color: c.text }]}>{slide.title}</Text>
        <Text style={[styles.text, { color: c.textSecondary }]}>{slide.body}</Text>
      </View>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: i === index ? c.text : c.border }]} />
        ))}
      </View>
      <View style={styles.actions}>
        {index > 0 && <Button label={S.back} variant="secondary" onPress={() => go(index - 1)} style={styles.flex} />}
        <Button label={last ? S.startPlaying : S.next} onPress={() => (last ? finish() : go(index + 1))} style={styles.flex} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, height: 48 },
  step: { fontSize: 14, fontVariant: ['tabular-nums'] },
  skip: { fontSize: 16, fontWeight: '600' },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 },
  boardBox: { width: '100%', maxWidth: 320, marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  text: { fontSize: 17, lineHeight: 24, textAlign: 'center', maxWidth: 380, minHeight: 72 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingBottom: 16, maxWidth: 520, width: '100%', alignSelf: 'center' },
  flex: { flex: 1 },
});
