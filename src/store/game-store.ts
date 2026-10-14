/**
 * All saved player data: games in progress, streak, per-difficulty stats, settings.
 * Persisted on every change, so any puzzle resumes after the app is killed.
 */
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { HINT_REWARDS } from '@/constants/monetization';
import { confirmedInvites, fetchBackup, fetchLeague, postBackup, postMe, reportOpen, requestCert, type LeaguePeriod, type LeaguePlayer } from '@/services/invites';
import { getKeychainKey, saveKeychainKey } from '@/services/keychain';
import { adAllowed, adReward, COINS, loginReward, winReward, type CoinDay } from '@/features/coins/policy';
import { rewardedAvailable, showRewarded } from '@/services/ads';
import { track } from '@/services/analytics';
import { brainLevel, calendarFor, leaguePoints, weekScore, periodScores, periodStart, pointsFromLog, solvePoints, weekFirstFor, weekStart, type DayPoints, type SolveLog } from '@/features/brain/score';
import { sameCert, uniqueCerts, type Cert, type CertKind } from '@/features/certificates/certs';
import { addDays, dateKey, CROSS, CROWN, DIFFICULTIES, EMPTY, type Difficulty, type Mark } from '@/engine';
import { puzzleInfo, unlimitedId } from '@/features/puzzles/catalog';
import { DEFAULT_LANGUAGE, getLanguage, type Language } from '@/i18n';
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
  /** Shop items in use (see features/shop/catalog.ts). */
  boardTheme: string;
  crownStyle: string;
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
  /** App launches. */
  sessions: number;
  /** Archive days unlocked with coins. */
  archiveUnlocked: string[];
  /** Day the last streak repair was used. */
  lastRepairKey: string | null;
  /** Hints left: bought with coins (and the free ones earned before 1.1). */
  hintCredits: number;
  /** Friend opens already paid out (the server's running count). */
  confirmedInvites: number;
  /** Coins (features/coins/policy.ts). */
  coins: number;
  /** Last day the daily login coins were paid, and the run of days in a row. */
  loginKey: string | null;
  loginStreak: number;
  /** Coins earned today from wins and ads (daily caps). */
  coinDay: CoinDay | null;
  /** Shop items bought. */
  owned: string[];
  /** Certificates earned (features/certificates). `id` comes from the server (null until it answered). */
  certs: Cert[];
  /** Certificates not opened yet (Home shows "you earned a certificate"). */
  certsNew: number;
  /** Day the friends-league champion check last ran (once a day). */
  certCheckedDay: string | null;
  /** Friends league: nickname and avatar shown to friends ('' = not chosen yet). */
  nickname: string;
  avatar: string;
  /** Last profile/score sent to the league server, to skip identical posts. */
  leagueSent: string;
  /** Rank among friends from the last league fetch (for the Home card). */
  leagueRank: { week: string; rank: number; total: number } | null;
  /** Secret recovery key for the server backup (shown as XXXX-XXXX-XXXX in Settings). */
  backupKey: string | null;
  /** Fingerprint of the last snapshot sent, to skip identical uploads. */
  backupSent: string;
  /** When the last backup upload went out (ms), to space uploads out. */
  backupAt: number;
  /** Set when a reinstall restored progress from the keychain key; Home says "welcome back" once and clears it. */
  restoredAuto: boolean;
}

export type { Cert, CertKind } from '@/features/certificates/certs';

export interface WinResult {
  seconds: number;
  hints: number;
  newBest: boolean;
  /** Daily streak after this solve (daily puzzles only). */
  streak?: number;
  /** Coins earned by this win (0 at the daily cap or for easy/medium Unlimited). */
  coins: number;
}

interface Store {
  games: Record<string, GameState>;
  unlimitedIndex: Record<Difficulty, number>;
  stats: Record<Difficulty, DifficultyStats>;
  daily: DailyRecord;
  settings: Settings;
  tutorialSeen: boolean;
  meta: Meta;
  /** Finished puzzles with their date (newest last, capped), for the weekly brain score. */
  log: SolveLog[];
  /** Brain points per day, all time (month/year/lifetime scores; `log` is trimmed, this is not). */
  points: DayPoints;

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

const LOG_MAX = 500;

/** Saves from before the brain score had no log: start it from the dated daily solves (hints unknown → 0). */
function seedLog(daily: DailyRecord | undefined): SolveLog[] {
  if (!daily) return [];
  return Object.entries(daily.solved)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .flatMap(([day, s]) => {
      const info = puzzleInfo(`daily-${day}`);
      return info ? [{ day, d: info.difficulty, s, h: 0, daily: true }] : [];
    })
    .slice(-LOG_MAX);
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
  boardTheme: 'classic',
  crownStyle: 'classic',
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
  archiveUnlocked: [],
  lastRepairKey: null,
  hintCredits: HINT_REWARDS.start,
  confirmedInvites: 0,
  coins: 0,
  loginKey: null,
  loginStreak: 0,
  coinDay: null,
  owned: [],
  certs: [],
  certsNew: 0,
  certCheckedDay: null,
  nickname: '',
  avatar: '',
  leagueSent: '',
  leagueRank: null,
  backupKey: null,
  backupSent: '',
  backupAt: 0,
  restoredAuto: false,
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
        log: [],
        points: {},
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
          const result: WinResult = { seconds: g.seconds, hints: g.hints, newBest, coins: 0 };

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

          const entry: SolveLog = { day: dateKey(), d: difficulty, s: g.seconds, h: g.hints, daily: info?.mode === 'daily' };
          const log = [...s.log, entry].slice(-LOG_MAX);
          const points = { ...s.points, [entry.day]: (s.points[entry.day] ?? 0) + solvePoints(entry) };
          const reward = winReward(difficulty, entry.daily, s.meta.coinDay, entry.day);
          result.coins = reward.coins;
          const meta = { ...s.meta, wins: s.meta.wins + 1, coins: s.meta.coins + reward.coins, coinDay: reward.next };
          set({ games, stats, daily, unlimitedIndex, log, points, meta });
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
      partialize: ({ games, unlimitedIndex, stats, daily, settings, tutorialSeen, meta, log, points }) => ({
        log,
        points,
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
          log: p.log ?? seedLog(p.daily),
          points: p.points ?? pointsFromLog(p.log ?? seedLog(p.daily)),
        };
      },
    },
  ),
);

/**
 * Turn friends' new link opens (counted by the server) into coins. Returns how many coins were added.
 */
export async function syncEarnedCoins(): Promise<number> {
  const confirmed = await confirmedInvites(getRefCode());
  if (confirmed === null) return 0;
  const { meta, updateMeta } = useGameStore.getState();
  const fresh = Math.max(0, confirmed - meta.confirmedInvites) * COINS.perFriend;
  if (confirmed !== meta.confirmedInvites) updateMeta({ confirmedInvites: confirmed, coins: meta.coins + fresh });
  return fresh;
}

/** Pays today's login coins once a day. Returns what was paid (for the Home toast), or null. */
export function claimLoginCoins(day = dateKey()): { coins: number; streak: number } | null {
  const { meta, updateMeta } = useGameStore.getState();
  const reward = loginReward(meta.loginKey, meta.loginStreak, day);
  if (!reward) return null;
  updateMeta({ coins: meta.coins + reward.coins, loginKey: day, loginStreak: reward.streak });
  return reward;
}

/** Spend coins; false (and nothing spent) when there are not enough. */
export function spendCoins(amount: number): boolean {
  const { meta, updateMeta } = useGameStore.getState();
  if (meta.coins < amount) return false;
  updateMeta({ coins: meta.coins - amount });
  return true;
}

/**
 * Watch a rewarded ad for coins. 'earned' (coins added), 'limit' (5 a day reached), 'unavailable' (no ad right now)
 * or 'skipped' (closed early).
 */
export async function watchAdForCoins(): Promise<'earned' | 'limit' | 'unavailable' | 'skipped'> {
  const day = dateKey();
  if (!adAllowed(useGameStore.getState().meta.coinDay, day)) return 'limit';
  if (!rewardedAvailable) return 'unavailable';
  track('rewarded_offer', { placement: 'coins' });
  const watched = await showRewarded();
  if (!watched) return 'skipped';
  track('rewarded_complete', { placement: 'coins' });
  const { meta, updateMeta } = useGameStore.getState();
  const reward = adReward(meta.coinDay, day);
  updateMeta({ coins: meta.coins + reward.coins, coinDay: reward.next });
  return 'earned';
}

/** Send this week's league score (and nickname/avatar) when it changed since the last send. */
export async function syncLeague(): Promise<void> {
  const today = dateKey();
  const { meta, log, points, updateMeta } = useGameStore.getState();
  // Both week kinds go up, so friends who play in another language still see this player's score for their own week;
  // the same for months (Gregorian and Jalali).
  const weeks = (['sat', 'mon'] as const).map((f) => ({ week: weekStart(today, f), score: leaguePoints(log, today, f) }));
  const months = (['gregorian', 'jalali'] as const).map((cal) => ({
    month: periodStart(today, 'month', cal),
    score: periodScores(points, today, cal).month,
  }));
  const me = { code: getRefCode(), name: meta.nickname, emoji: meta.avatar, weeks, months };
  const key = JSON.stringify(me);
  if (key === meta.leagueSent) return;
  if (await postMe(me)) updateMeta({ leagueSent: key });
}

/** The league period the player sees: this week, or this month in their calendar. */
export function leaguePeriod(kind: 'week' | 'month', today = dateKey()): LeaguePeriod {
  const lang = getLanguage();
  if (kind === 'week') return { week: weekStart(today, weekFirstFor(lang)) };
  const month = periodStart(today, 'month', calendarFor(lang));
  return { month, prev: periodStart(addDays(month, -1), 'month', calendarFor(lang)) };
}

/** Fetch the league for this week (or month) and remember this player's weekly rank for the Home card. */
export async function loadLeague(kind: 'week' | 'month' = 'week'): Promise<LeaguePlayer[] | null> {
  await syncLeague();
  const period = leaguePeriod(kind);
  const players = await fetchLeague(getRefCode(), period);
  if (players && 'week' in period) {
    const rank = players.findIndex((p) => p.me) + 1;
    useGameStore.getState().updateMeta({ leagueRank: rank > 0 ? { week: period.week, rank, total: players.length } : null });
  }
  return players;
}

const KEY_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const BACKUP_EVERY_MS = 3 * 60 * 60 * 1000;

/** True while this install has no progress at all (a fresh install, before the first move). */
function isFresh(): boolean {
  const { games, log, meta } = useGameStore.getState();
  return Object.keys(games).length === 0 && log.length === 0 && meta.wins === 0;
}

function newBackupKey(): string {
  let key = '';
  while (key.length < 12) key += KEY_ALPHABET[Math.floor(Math.random() * KEY_ALPHABET.length)];
  return key;
}

let keyTask: Promise<string | null> | null = null;

/**
 * This player's secret recovery key. A fresh install first looks in the keychain: on iPhone the key survives deleting
 * the app, so a reinstall brings the old progress back by itself (`meta.restoredAuto` tells Home to say so).
 * Null while that restore could not run (offline): nothing is uploaded then, so the old backup is never overwritten.
 */
export function getBackupKey(): Promise<string | null> {
  keyTask ??= resolveBackupKey().then((key) => {
    if (!key) keyTask = null; // try again next time
    return key;
  });
  return keyTask;
}

async function resolveBackupKey(): Promise<string | null> {
  const known = useGameStore.getState().meta.backupKey;
  if (known) return known;
  const saved = await getKeychainKey();
  if (saved && isFresh()) {
    const result = await restoreBackup(saved);
    if (result === 'offline') return null;
    if (result === 'ok') {
      useGameStore.getState().updateMeta({ restoredAuto: true });
      return saved;
    }
  }
  const key = saved ?? newBackupKey();
  useGameStore.getState().updateMeta({ backupKey: key });
  if (!saved) await saveKeychainKey(key);
  return key;
}

/** XXXX-XXXX-XXXX, as shown and typed. */
export const formatBackupKey = (key: string) => key.toUpperCase().replace(/(.{4})(?=.)/g, '$1-');
/** Whatever the player typed → a key, or null when it can't be one. */
export function parseBackupKey(text: string): string | null {
  // Persian/Arabic digits typed on a local keyboard count as Latin ones.
  const latin = text.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0)).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660));
  const key = latin.toLowerCase().replace(/[^a-z0-9]/g, '');
  return key.length === 12 && [...key].every((ch) => KEY_ALPHABET.includes(ch)) ? key : null;
}

/** What a backup holds: everything except bookkeeping about the backup/league uploads themselves. */
function snapshot(): object {
  const { games, unlimitedIndex, stats, daily, settings, tutorialSeen, meta, log, points } = useGameStore.getState();
  // Unfinished games and solved dailies (Home/Archive show them); undo history is left out to keep it small.
  const kept = Object.fromEntries(
    Object.entries(games)
      .filter(([id, g]) => !g.solved || id.startsWith('daily-'))
      .slice(-150)
      .map(([id, g]) => [id, { ...g, undo: [], redo: [] }]),
  );
  const { backupSent: _sent, backupAt: _at, restoredAuto: _auto, leagueSent: _league, leagueRank: _rank, ...rest } = meta;
  return { v: 1, games: kept, unlimitedIndex, stats, daily, settings, tutorialSeen, meta: rest, log, points };
}

function fingerprint(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return `${text.length}:${h}`;
}

/** Upload the progress snapshot when it changed since the last upload. */
/** Upload the progress snapshot when it changed, at most every few hours unless `force` (KV writes are limited). */
export async function syncBackup(force = false): Promise<void> {
  const key = await getBackupKey();
  if (!key || isFresh()) return;
  const { backupSent, backupAt } = useGameStore.getState().meta;
  if (!force && Date.now() - backupAt < BACKUP_EVERY_MS) return;
  const data = snapshot();
  const print = fingerprint(JSON.stringify(data));
  if (print === backupSent) return;
  if (await postBackup({ key, code: getRefCode(), data })) useGameStore.getState().updateMeta({ backupSent: print, backupAt: Date.now() });
}

/**
 * Replace this device's progress with the backup saved under `key`. The player keeps their old invite code, so
 * friends, league and earned hints come along. Returns 'ok', 'missing' (no backup for that key) or 'offline'.
 */
export async function restoreBackup(key: string): Promise<'ok' | 'missing' | 'offline'> {
  const backup = await fetchBackup(key);
  if (backup === null) return 'offline';
  if (backup === 'missing') return 'missing';
  const d = backup.data as Partial<Store>;
  const s = useGameStore.getState();
  useGameStore.setState({
    games: d.games ?? {},
    unlimitedIndex: { ...s.unlimitedIndex, ...d.unlimitedIndex },
    stats: { ...s.stats, ...d.stats },
    daily: d.daily ?? s.daily,
    settings: { ...DEFAULT_SETTINGS, ...d.settings },
    tutorialSeen: d.tutorialSeen ?? s.tutorialSeen,
    log: d.log ?? [],
    points: d.points ?? pointsFromLog(d.log ?? []),
    meta: { ...DEFAULT_META, ...d.meta, ref: backup.code, backupKey: key, backupSent: '', backupAt: 0, leagueSent: '', leagueRank: null },
  });
  keyTask = Promise.resolve(key);
  void saveKeychainKey(key);
  return 'ok';
}

/** Use one hint: a hint left over first, otherwise one bought with coins. False when neither is possible. */
export function spendHint(): boolean {
  const { meta, updateMeta } = useGameStore.getState();
  if (meta.hintCredits > 0) updateMeta({ hintCredits: meta.hintCredits - 1 });
  else if (!spendCoins(COINS.hint)) return false;
  return true;
}

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
  if (meta.ref === ref) return;
  if (!meta.invitedBy) updateMeta({ invitedBy: ref });
  // Tell the server a friend opened this link: that is what earns the sender a hint.
  void reportOpen(ref, getRefCode());
}

/** True once saved data has been loaded from disk. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useGameStore.persist.onFinishHydration(onChange),
    () => useGameStore.persist.hasHydrated(),
    () => false,
  );
}

/**
 * Look for newly earned certificates: streak milestones and the Genius level (local), and last week's / last month's
 * friends-league crown (from the server, once a day; the server checks it again before issuing). New ones are added
 * to `meta.certs` and counted in `meta.certsNew`. Returns how many were added.
 */
let certCheck: Promise<number> | null = null;

export function checkCertificates(today = dateKey()): Promise<number> {
  // Home calls this on open and on returning to the app: one check at a time, or both add the same certificate.
  certCheck ??= findCertificates(today).finally(() => {
    certCheck = null;
  });
  return certCheck;
}

export { uniqueCerts };

async function findCertificates(today: string): Promise<number> {
  const found: Cert[] = [];
  const st = useGameStore.getState();
  const have = (kind: CertKind, period?: string) => st.meta.certs.some((c) => (period ? sameCert(c, { kind, period }) : c.kind === kind));
  if (st.daily.bestStreak >= 30 && !have('streak30')) found.push({ kind: 'streak30', period: today, id: null });
  if (st.daily.bestStreak >= 100 && !have('streak100')) found.push({ kind: 'streak100', period: today, id: null });
  // Genius: once per league week.
  const week = weekStart(today, weekFirstFor(getLanguage()));
  if (brainLevel(weekScore(st.log, today).score) === 'genius' && !have('genius', week)) found.push({ kind: 'genius', period: week, id: null });
  if (st.meta.certCheckedDay !== today) {
    const code = getRefCode();
    for (const kind of ['week', 'month'] as const) {
      const period = leaguePeriod(kind, today);
      const players = await fetchLeague(code, period);
      if (!players) continue;
      // The crown marks the winner of the period before this one.
      const before = 'week' in period ? addDays(period.week, -7) : period.prev;
      const others = players.filter((p) => !p.me);
      if (players.find((p) => p.me)?.crown && others.length > 0 && !have(kind, before)) found.push({ kind, period: before, id: null });
    }
    useGameStore.getState().updateMeta({ certCheckedDay: today });
  }
  const m = useGameStore.getState().meta;
  const current = uniqueCerts(m.certs);
  const added = found.filter((f) => !current.some((c) => sameCert(c, f)));
  if (added.length || current.length !== m.certs.length) {
    useGameStore.getState().updateMeta({ certs: [...current, ...added], certsNew: m.certsNew + added.length });
  }
  await issueCertificates();
  return added.length;
}

/**
 * Get server ids for certificates that have none yet; drop champion ones the server refuses. `all`: send every
 * certificate again (after a nickname change, so the verify pages show the new name; ids stay the same).
 */
export async function issueCertificates(all = false): Promise<void> {
  const { meta } = useGameStore.getState();
  const code = getRefCode();
  for (const cert of meta.certs.filter((c) => all || !c.id)) {
    const id = await requestCert({ code, kind: cert.kind, period: cert.period, name: meta.nickname, lang: getLanguage() });
    if (id === null) return; // offline: try again later
    const certs = useGameStore.getState().meta.certs;
    const same = (c: Cert) => c.kind === cert.kind && c.period === cert.period;
    const m = useGameStore.getState().meta;
    useGameStore.getState().updateMeta(
      id === 'denied'
        ? { certs: certs.filter((c) => !same(c)), certsNew: Math.max(0, m.certsNew - 1) }
        : { certs: certs.map((c) => (same(c) ? { ...c, id } : c)) },
    );
  }
}
