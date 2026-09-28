import { useColorScheme } from 'react-native';

import { Colors, RegionColors, type Palette } from '@/constants/theme';

export function usePalette(): { c: Palette; regions: readonly string[]; dark: boolean } {
  const dark = useColorScheme() === 'dark';
  return { c: dark ? Colors.dark : Colors.light, regions: dark ? RegionColors.dark : RegionColors.light, dark };
}
