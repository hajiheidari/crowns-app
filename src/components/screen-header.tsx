import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { usePalette } from '@/hooks/use-palette';
import { S } from '@/strings';
import { Text } from '@/components/text';

export function ScreenHeader({ title }: { title: string }) {
  const { c } = usePalette();
  const router = useRouter();
  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={S.back}
        hitSlop={8}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={styles.back}>
        <Text style={[styles.backText, { color: c.text }]}>{S.chevronBack}</Text>
      </Pressable>
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      <View style={styles.back} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: 8 },
  back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 30 },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
});
