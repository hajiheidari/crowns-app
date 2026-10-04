import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { usePalette } from '@/hooks/use-palette';
import { Text } from '@/components/text';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = 'primary', disabled, icon, style }: Props) {
  const { c } = usePalette();
  const bg = variant === 'primary' ? c.primary : variant === 'secondary' ? c.surfaceMuted : 'transparent';
  const fg = variant === 'primary' ? c.onPrimary : c.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.base, { backgroundColor: bg, opacity: disabled ? 0.35 : pressed ? 0.75 : 1 }, style]}>
      {icon}
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: { fontSize: 17, fontWeight: '600' },
});
