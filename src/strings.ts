/** All user-facing English text lives here (i18n-ready). */
import type { Difficulty } from '@/engine';

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
};

export const DIFFICULTY_SIZES: Record<Difficulty, string> = {
  easy: '5×5 – 6×6',
  medium: '7×7 – 8×8',
  hard: '8×8 – 9×9',
  expert: '9×9 – 11×11',
};

export const S = {
  appName: 'Crowns',
  tagline: 'Daily logic puzzles',
  today: 'Today',
  daily: (n: number) => (n >= 1 ? `Daily #${n}` : 'Daily preview'),
  unlimitedTitle: (d: Difficulty, n: number) => `${DIFFICULTY_LABEL[d]} #${n}`,
  play: 'Play',
  continue: 'Continue',
  solved: 'Solved',
  nextDailyIn: 'Next puzzle in',
  unlimited: 'Unlimited',
  solvedCount: (k: number) => `${k} solved`,
  streakDays: (k: number) => `${k}-day streak`,
  crownsCount: (k: number, n: number) => `Crowns ${k}/${n}`,
  undo: 'Undo',
  redo: 'Redo',
  clear: 'Clear',
  pause: 'Pause',
  paused: 'Paused',
  resume: 'Resume',
  back: 'Back',
  clearTitle: 'Clear the board?',
  clearBody: 'All your marks on this puzzle will be removed. You can undo this.',
  cancel: 'Cancel',
  youSolvedIt: 'Solved!',
  newBest: 'New best!',
  noHints: 'No hints ✨',
  hintsUsed: (k: number) => `${k} hint${k === 1 ? '' : 's'}`,
  nextPuzzle: 'Next puzzle',
  home: 'Home',
  backHome: 'Back home',
  solvedIn: (t: string) => `Solved in ${t}`,
  notFound: 'This puzzle could not be found.',
  rules:
    'Place one crown in every row, column and color region. Crowns never touch, not even diagonally.',
  controls: 'Tap: ✕ → crown → empty. Long-press: crown. Drag: paint ✕.',
};
