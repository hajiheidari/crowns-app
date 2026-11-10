/**
 * Saved-game scenarios for the store screenshots (a 21-day streak on 2026-10-22, games in progress).
 * Usage: npx tsx store/tools/seed.ts <out.json>
 */
import { writeFileSync } from 'node:fs';

import { APP_VERSION } from '@/constants/version';
import { CROSS, CROWN, EMPTY } from '@/engine';
import { binaryUnlimitedId, getBinaryPuzzle } from '@/features/puzzles/binary-catalog';
import { getPathPuzzle, pathUnlimitedId } from '@/features/puzzles/path-catalog';
import { getPuzzle, unlimitedId } from '@/features/puzzles/catalog';

const out = process.argv[2];
const days = Array.from({ length: 21 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`);
const times = [212, 185, 304, 166, 241, 198, 275, 152, 233, 189, 260, 171, 219, 205, 146, 288, 177, 196, 230, 163, 181];
const solved: Record<string, number> = {};
days.forEach((d, i) => (solved[d] = times[i]));
const stat = (n: number, best: number, avg: number, recent: number[]) => ({
  solved: n,
  bestSeconds: best,
  totalSeconds: n * avg,
  hintFree: Math.round(n * 0.7),
  recent,
});
const idx = { easy: 34, medium: 22, hard: 11, expert: 4 };
const settings = {
  autoCross: true,
  tapOrder: 'cross-first',
  dragToMark: true,
  highlightConflicts: true,
  showTimer: true,
  haptics: true,
  theme: 'light',
  patterns: false,
  reminder: { enabled: true, hour: 9, minute: 0 },
};
const base = (over: Record<string, unknown> = {}) => ({
  state: {
    games: {},
    unlimitedIndex: idx,
    stats: {
      easy: stat(34, 41, 78, [96, 88, 71, 80, 64, 75, 59, 70, 52, 61]),
      medium: stat(22, 97, 168, [210, 188, 175, 160, 171, 149, 155, 138, 142, 129]),
      hard: stat(11, 214, 342, [420, 388, 361, 340, 322, 351, 298, 305, 279, 266]),
      expert: stat(4, 512, 701, [880, 742, 655, 612]),
    },
    daily: { streak: 21, bestStreak: 21, lastSolvedKey: '2026-10-21', solved },
    settings,
    tutorialSeen: true,
    // removeAds hides the web preview's banner placeholder in the screenshots.
    meta: {
      installedKey: '2026-10-01',
      lastSeenVersion: APP_VERSION,
      wins: 92,
      reminderAsked: true,
      lastReviewPromptKey: '2026-10-05',
      ref: 'k7m2qp',
      invitedBy: null,
      sessions: 40,
      winsSinceInterstitial: 0,
      lastInterstitialAt: null,
      removeAds: true,
      hintCredits: 3, // the hint shot shows a hint, not "no free hints left"
      coins: 340,
      certCheckedDay: "2026-10-22", // no certificate pop-up over the Home shot
      nickname: "Alex",
      certs: [{ kind: "week" as const, period: "2026-10-12", id: "k7m2qpa9" }, { kind: "genius" as const, period: "2026-10-19", id: "k7m2qpb3" }, { kind: "genius" as const, period: "2026-10-17", id: "k7m2qpb4" }],
      archiveUnlocked: [],
      lastRepairKey: null,
      rulesSeen: ['path', 'binary'], // no rules card over the new puzzle shots
    },
    // Today's Path daily is done (✓ on Home), Sun & Moon is still to play.
    extra: {},
    extraIndex: { path: { easy: 18, medium: 9, hard: 5, expert: 1 }, binary: { easy: 15, medium: 8, hard: 3, expert: 1 } },
    extraDaily: { path: { '2026-10-22': 96 }, binary: {} },
    ...over,
  },
  version: 1,
});

/** Board with crowns on the given rows and a few hand-placed ✕ on cells that are surely empty. */
function board(id: string, crownRows: number[], extraCross: number) {
  const p = getPuzzle(id)!;
  const b: number[] = new Array(p.n * p.n).fill(EMPTY);
  for (const r of crownRows) b[r * p.n + p.solution[r]] = CROWN;
  for (let i = 0, k = 0; i < p.n * p.n && k < extraCross; i += 7) {
    const r = Math.floor(i / p.n);
    if (p.solution[r] !== i % p.n && !crownRows.includes(r)) {
      b[i] = CROSS;
      k++;
    }
  }
  return b;
}
const game = (b: number[], seconds: number) => ({ board: b, undo: [], redo: [], seconds, hints: 0, solved: false });

const mid = unlimitedId('medium', idx.medium);
// The new puzzle types, half done: a path drawn part of the way, a sun & moon grid partly filled.
const pathId = pathUnlimitedId('hard', 5);
const pp = getPathPuzzle(pathId)!;
const pathGame = { cells: pp.solution.slice(0, 22), undo: [], redo: [], seconds: 73, hints: 0, solved: false };
const binId = binaryUnlimitedId('medium', 8);
const bp = getBinaryPuzzle(binId)!;
const binCells = bp.givens.map((v, i) => (v || (i < bp.n * 3 ? bp.solution[i] : 0)));
const binGame = { cells: binCells, undo: [], redo: [], seconds: 58, hints: 0, solved: false };
const hard = unlimitedId('hard', idx.hard);
const lastRow = 6;
const pm = getPuzzle(mid)!;
const allButLast = pm.solution.map((_, r) => r).filter((r) => r !== lastRow);

writeFileSync(
  out,
  JSON.stringify({
    mid,
    hard,
    pathId,
    binId,
    lastRow,
    lastCol: pm.solution[lastRow],
    scenarios: {
      home: base(),
      path: base({ extra: { [pathId]: pathGame } }),
      binary: base({ extra: { [binId]: binGame } }),
      stats: base(),
      game: base({ games: { [mid]: game(board(mid, [0, 2, 3, 5], 6), 134) } }),
      win: base({ games: { [mid]: game(board(mid, allButLast, 0), 87) } }),
      dark: base({ games: { [hard]: game(board(hard, [1, 4, 6], 5), 201) }, settings: { ...settings, theme: 'dark' } }),
    },
  }),
);
