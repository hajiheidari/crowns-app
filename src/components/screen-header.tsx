import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BackButton } from '@/components/back-button';
import { Text } from '@/components/text';
import { usePalette } from '@/hooks/use-palette';

export function ScreenHeader({ title }: { title: string }) {
  const { c } = usePalette();
  const router = useRouter();
  return (
    <View style={styles.bar}>
      <BackButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      <View style={styles.side} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Same width as the screens' content (maxWidth 560), so the button sits next to it on wide screens.
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 12,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  side: { width: 44 },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
});
