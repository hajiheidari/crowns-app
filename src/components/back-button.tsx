import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/text';
import { usePalette } from '@/hooks/use-palette';
import { ARROW_BACK, arrowStyle, S } from '@/strings';

/** Round back button: a filled circle so it stays easy to see and hit, even on a wide desktop window. */
export function BackButton({ onPress }: { onPress: () => void }) {
  const { c } = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={S.back}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.circle, { backgroundColor: c.surfaceMuted, opacity: pressed ? 0.6 : 1 }]}>
      <Text style={[styles.glyph, { color: c.text }, arrowStyle()]} maxFontSizeMultiplier={1.2}>
        {ARROW_BACK}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontSize: 32, lineHeight: 36, fontWeight: '600', marginTop: -3 },
});
