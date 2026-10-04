/** User-facing text for the current language (see src/i18n). Kept as the one import for screens. */
import type { Difficulty } from '@/engine';
import { S } from '@/i18n';

export { dirStyle, getLanguage, isRTL, localDigits, S } from '@/i18n';

const byDifficulty = (pick: () => Record<Difficulty, string>) =>
  new Proxy({} as Record<Difficulty, string>, { get: (_target, d) => pick()[d as Difficulty] });

export const DIFFICULTY_LABEL = byDifficulty(() => S.difficulty);
export const DIFFICULTY_SIZES = byDifficulty(() => S.difficultySizes);

/** "9:00 AM" / "9:00 صبح" clock label for reminder times. */
export const formatClock = (hour: number, minute: number) => S.clock(hour, minute);
