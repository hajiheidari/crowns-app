import { useColorScheme } from 'react-native';

import { Colors, RegionColors, type Palette } from '@/constants/theme';
import { useGameStore } from '@/store/game-store';

/** Colors for the current theme: the Settings choice, or the system's when set to "system". */
export function usePalette(): { c: Palette; regions: readonly string[]; dark: boolean } {
  const system = useColorScheme();
  const theme = useGameStore((s) => s.settings.theme);
  const dark = theme === 'system' ? system === 'dark' : theme === 'dark';
  return { c: dark ? Colors.dark : Colors.light, regions: dark ? RegionColors.dark : RegionColors.light, dark };
}
