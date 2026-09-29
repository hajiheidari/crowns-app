import { StyleSheet, Text, View } from 'react-native';

import { usePalette } from '@/hooks/use-palette';
import { useGameStore } from '@/store/game-store';
import { S } from '@/strings';

/** Web preview: marks where the phone app shows its banner ad. */
export function AdBanner() {
  const { c } = usePalette();
  const removeAds = useGameStore((s) => s.meta.removeAds);
  if (removeAds) return null;
  return (
    <View style={[styles.box, { borderColor: c.border, backgroundColor: c.surfaceMuted }]}>
      <Text style={[styles.text, { color: c.textSecondary }]}>{S.bannerPlaceholder}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { height: 50, borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 12, fontWeight: '600' },
});
