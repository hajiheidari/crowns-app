/**
 * All saved player data: games in progress, streak, per-difficulty stats, settings.
 * Persisted on every change, so any puzzle resumes after the app is killed.
 */
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { addDays, CROSS, CROWN, DIFFICULTIES, EMPTY, type Difficulty, type Mark } from '@/engine';
import { puzzleInfo, unlimitedId } from '@/features/puzzles/catalog';
import { DEFAULT_LANGUAGE, type Language } from '@/i18n';
import { persistStorage } from '@/store/storage';

/** One undo step: the cells it touched, with their marks before and after. */
export interface Move {
  cells: number[];
  from: Mark[];
  to: Mark[];
}

export interface GameState {
  /** Player marks only; auto-✕ is derived, never stored. */
  board: Mark[];
  undo: Move[];
  redo: Move[];
  seconds: number;
  hints: number;
  solved: boolean;
}

export interface DifficultyStats {
  solved: number;
  bestSeconds: number | null;
  totalSeconds: number;
  hintFree: number;
  /** Most recent solve times in seconds, oldest first (max 10). */
  recent: number[];
}

export interface DailyRecord {
  streak: number;
  bestStreak: number;
  lastSolvedKey: string | null;
  /** date key → seconds */
  solved: Record<string, number>;
}

export interface Settings {
  autoCross: boolean;
  tapOrder: 'cross-first' | 'crown-first';
  dragToMark: boolean;
  highlightConflicts: boolean;
  showTimer: boolean;
  haptics: boolean;
  theme: 'system' | 'light' | 'dark';
  /** Color-blind aid: a pattern per region on top of its color. */
  patterns: boolean;
  reminder: { enabled: boolean; hour: number; minute: number };
  /** UI language; the Bazaar build starts in Persian, others in English. */
  language: Language;
}

/** Bookkeeping that is not gameplay: install date, "What's new", review prompt. */
export interface Meta {
  installedKey: string | null;
  lastSeenVersion: string | null;
  wins: number;
  reminderAsked: boolean;
  lastReviewPromptKey: string | null;
  /** Anonymous invite code put in shared links (random, not tied to any person). */
  ref: string | null;
  /** Invite code of the friend whose link brought this player (kept for future referral rewards). */
  invitedBy: string | null;
  /** App launches (the first session never shows interstitials). */
  sessions: number;
  winsSinceInterstitial: number;
  lastInterstitialAt: number | null;
  /** Remove-Ads purchase, cached from the store so it works offline. */
  removeAds: boolean;
  /** Archive days unlocked with a rewarded ad. */
  archiveUnlocked: string[];
  /** Day the last streak repair was used. */
  lastRepairKey: string | null;
}

export interface WinResult {
  seconds: number;
  hints: number;
  newBest: boolean;
  /** Daily streak after this solve (daily puzzles only). */
  streak?: number;
}

interface Store {
  games: Record<string, GameState>;
  unlimitedIndex: Record<Difficulty, number>;
  stats: Record<Difficulty, DifficultyStats>;
  daily: DailyRecord;
  settings: Settings;
  tutorialSeen: boolean;
  meta: Meta;

  startGame: (id: string, n: number) => void;
  commit: (id: string, cells: number[], to: Mark[]) => void;
  undo: (id: string) => void;
  redo: (id: string) => void;
  clear: (id: string) => void;
  tick: (id: string) => void;
  complete: (id: string, difficulty: Difficulty) => WinResult | null;
  updateSettings: (patch: Partial<Settings>) => void;
  addHint: (id: string) => void;
  setTutorialSeen: () => void;
  updateMeta: (patch: Partial<Meta>) => void;
  /** Keep a streak alive over one missed day (rewarded ad, spec §5). */
  repairStreak: (today: string) => void;
}

const newGame = (n: number): GameState => ({
  board: new Array<Mark>(n * n).fill(EMPTY),
  undo: [],
  redo: [],
  seconds: 0,
  hints: 0,
  solved: false,
});

const perDifficulty = <T>(make: () => T) =>
  Object.fromEntries(DIFFICULTIES.map((d) => [d, make()])) as Record<Difficulty, T>;

export const DEFAULT_SETTINGS: Settings = {
  autoCross: true,
  tapOrder: 'cross-first',
  dragToMark: true,
  highlightConflicts: true,
  showTimer: true,
  haptics: true,
  theme: 'system',
  patterns: false,
  reminder: { enabled: false, hour: 9, minute: 0 },
  language: DEFAULT_LANGUAGE,
};

const DEFAULT_META: Meta = {
  installedKey: null,
  lastSeenVersion: null,
  wins: 0,
  reminderAsked: false,
  lastReviewPromptKey: null,
  ref: null,
  invitedBy: null,
  sessions: 0,
  winsSinceInterstitial: 0,
  lastInterstitialAt: null,
  removeAds: false,
  archiveUnlocked: [],
  lastRepairKey: null,
};

const newStats = (): DifficultyStats => ({ solved: 0, bestSeconds: null, totalSeconds: 0, hintFree: 0, recent: [] });

/** Next mark for a single tap, honoring the "Tap order" setting. */
export function tapCycle(m: Mark, order: Settings['tapOrder']): Mark {
  if (order === 'crown-first') return m === EMPTY ? CROWN : m === CROWN ? CROSS : EMPTY;
  return m === EMPTY ? CROSS : m === CROSS ? CROWN : EMPTY;
}

/** Streak that is still alive today (solved today or yesterday). */
export function currentStreak(d: DailyRecord, todayKey: string): number {
  if (!d.lastSolvedKey) return 0;
  return d.lastSolvedKey === todayKey || d.lastSolvedKey === addDays(todayKey, -1) ? d.streak : 0;
}

function applyMove(board: Mark[], cells: number[], marks: Mark[]): Mark[] {
  const next = board.slice();
  cells.forEach((c, i) => (next[c] = marks[i]));
  return next;
}

export const useGameStore = create<Store>()(
  persist(
    (set, get) => {
      const update = (id: string, fn: (g: GameState) => GameState) => {
        const g = get().games[id];
        if (!g || g.solved) return;
        set({ games: { ...get().games, [id]: fn(g) } });
      };

      return {
        games: {},
        unlimitedIndex: perDifficulty(() => 0),
        stats: perDifficulty(newStats),
        daily: { streak: 0, bestStreak: 0, lastSolvedKey: null, solved: {} },
        settings: DEFAULT_SETTINGS,
        tutorialSeen: false,
        meta: DEFAULT_META,

        startGame: (id, n) => {
          const games = { ...get().games };
          // Finished Unlimited games are not needed any more; dailies stay for the archive.
          for (const key of Object.keys(games)) {
            if (key !== id && games[key].solved && !key.startsWith('daily-')) delete games[key];
          }
          if (!games[id] || games[id].board.length !== n * n) games[id] = newGame(n);
          set({ games });
        },

        commit: (id, cells, to) =>
          update(id, (g) => {
            const idx = cells.map((_, i) => i).filter((i) => g.board[cells[i]] !== to[i]);
            if (!idx.length) return g;
            const move: Move = {
              cells: idx.map((i) => cells[i]),
              from: idx.map((i) => g.board[cells[i]]),
              to: idx.map((i) => to[i]),
            };
            return { ...g, board: applyMove(g.board, move.cells, move.to), undo: [...g.undo, move], redo: [] };
          }),

        undo: (id) =>
          update(id, (g) => {
            const move = g.undo[g.undo.length - 1];
            if (!move) return g;
            return { ...g, board: applyMove(g.board, move.cells, move.from), undo: g.undo.slice(0, -1), redo: [...g.redo, move] };
          }),

        redo: (id) =>
          update(id, (g) => {
            const move = g.redo[g.redo.length - 1];
            if (!move) return g;
            return { ...g, board: applyMove(g.board, move.cells, move.to), undo: [...g.undo, move], redo: g.redo.slice(0, -1) };
          }),

        clear: (id) => {
          const g = get().games[id];
          if (!g) return;
          const cells = g.board.map((_, i) => i);
          get().commit(id, cells, cells.map(() => EMPTY));
        },

        tick: (id) => update(id, (g) => ({ ...g, seconds: g.seconds + 1 })),

        complete: (id, difficulty) => {
          const s = get();
          const g = s.games[id];
          if (!g || g.solved) return null;
          const info = puzzleInfo(id);
          const prev = s.stats[difficulty];
          const newBest = prev.bestSeconds !== null && g.seconds < prev.bestSeconds;
          const stats = {
            ...s.stats,
            [difficulty]: {
              solved: prev.solved + 1,
              bestSeconds: prev.bestSeconds === null ? g.seconds : Math.min(prev.bestSeconds, g.seconds),
              totalSeconds: prev.totalSeconds + g.seconds,
              hintFree: prev.hintFree + (g.hints === 0 ? 1 : 0),
              recent: [...prev.recent, g.seconds].slice(-10),
            },
          };
          const games = { ...s.games, [id]: { ...g, solved: true, undo: [], redo: [] } };
          const result: WinResult = { seconds: g.seconds, hints: g.hints, newBest };

          let daily = s.daily;
          let unlimitedIndex = s.unlimitedIndex;
          if (info?.mode === 'daily') {
            const key = info.key;
            const already = daily.solved[key] !== undefined;
            const continues = daily.lastSolvedKey === addDays(key, -1);
            const streak = already ? daily.streak : continues ? daily.streak + 1 : 1;
            const isLatest = !daily.lastSolvedKey || key >= daily.lastSolvedKey;
            daily = {
              streak: isLatest ? streak : daily.streak,
              bestStreak: Math.max(daily.bestStreak, isLatest ? streak : 0),
              lastSolvedKey: isLatest ? key : daily.lastSolvedKey,
              solved: { ...daily.solved, [key]: g.seconds },
            };
            result.streak = daily.streak;
          } else if (info?.mode === 'unlimited' && unlimitedId(difficulty, s.unlimitedIndex[difficulty]) === id) {
            unlimitedIndex = { ...unlimitedIndex, [difficulty]: s.unlimitedIndex[difficulty] + 1 };
          }

          set({ games, stats, daily, unlimitedIndex, meta: { ...s.meta, wins: s.meta.wins + 1, winsSinceInterstitial: s.meta.winsSinceInterstitial + 1 } });
          return result;
        },

        updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),

        addHint: (id) => update(id, (g) => ({ ...g, hints: g.hints + 1 })),

        setTutorialSeen: () => set({ tutorialSeen: true }),

        updateMeta: (patch) => set({ meta: { ...get().meta, ...patch } }),

        repairStreak: (today) => {
          const { daily, meta } = get();
          // Treat yesterday as played: the streak count stays, and solving today continues it.
          set({ daily: { ...daily, lastSolvedKey: addDays(today, -1) }, meta: { ...meta, lastRepairKey: today } });
        },
      };
    },
    {
      name: 'crowns-store',
      version: 1,
      storage: persistStorage,
      partialize: ({ games, unlimitedIndex, stats, daily, settings, tutorialSeen, meta }) => ({
        games,
        unlimitedIndex,
        stats,
        daily,
        settings,
        tutorialSeen,
        meta,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Store>;
        // Fill in fields added by newer app versions so old saves keep working.
        const stats = perDifficulty(newStats);
        for (const d of DIFFICULTIES) stats[d] = { ...newStats(), ...p.stats?.[d] };
        return {
          ...current,
          ...p,
          stats,
          settings: { ...DEFAULT_SETTINGS, ...p.settings },
          meta: { ...DEFAULT_META, ...p.meta },
        };
      },
    },
  ),
);

/** This install's invite code, created on first use. */
export function getRefCode(): string {
  const { meta, updateMeta } = useGameStore.getState();
  if (meta.ref) return meta.ref;
  let ref = '';
  while (ref.length < 6) ref += 'abcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 31)];
  updateMeta({ ref });
  return ref;
}

/** Remember who invited this player (first link wins; never your own code). */
export function noteInvitedBy(ref: string | undefined): void {
  if (!ref || !/^[a-z0-9]{4,12}$/.test(ref)) return;
  const { meta, updateMeta } = useGameStore.getState();
  if (!meta.invitedBy && meta.ref !== ref) updateMeta({ invitedBy: ref });
}

/** True once saved data has been loaded from disk. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useGameStore.persist.onFinishHydration(onChange),
    () => useGameStore.persist.hasHydrated(),
    () => false,
  );
}
