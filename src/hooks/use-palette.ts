import { useColorScheme } from 'react-native';

import { Colors, type Palette } from '@/constants/theme';
import { boardTheme } from '@/features/shop/catalog';
import { useGameStore } from '@/store/game-store';

/**
 * Colors for the current theme (the Settings choice, or the system's when set to "system"). Region colors and the
 * board frame follow the board style chosen in the shop.
 */
export function usePalette(): { c: Palette; regions: readonly string[]; dark: boolean; frame: string } {
  const system = useColorScheme();
  const theme = useGameStore((s) => s.settings.theme);
  const board = boardTheme(useGameStore((s) => s.settings.boardTheme));
  const dark = theme === 'system' ? system === 'dark' : theme === 'dark';
  const c = dark ? Colors.dark : Colors.light;
  const frame = board.frame ? (dark ? board.frame.dark : board.frame.light) : c.gridThick;
  return { c, regions: dark ? board.dark : board.light, dark, frame };
}
