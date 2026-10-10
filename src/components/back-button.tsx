import { Pressable, StyleSheet } from 'react-native';

import { BackIcon } from '@/components/icons';
import { usePalette } from '@/hooks/use-palette';
import { isRTL, S } from '@/strings';

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
      <BackIcon size={24} color={c.text} flip={isRTL()} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
