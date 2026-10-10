/**
 * Where puzzles come from: bundled packs first, deterministic runtime generation after.
 * Every puzzle is addressed by a stable id, so a saved game (or a challenge link) can always
 * find its puzzle again.
 *
 *   daily-YYYY-MM-DD   daily puzzle for that local date
 *   daily-YYYY-MM-DD-easy   the same day for a new player in their first week (see `dailyIdFor`)
 *   hard-0042          bundled Unlimited puzzle
 *   hard-g401          Unlimited puzzle #401, beyond the bundled pool
 */
import dailyPack from '@/assets/packs/daily.json';
import easyPool from '@/assets/packs/pool-easy.json';
import expertPool from '@/assets/packs/pool-expert.json';
import hardPool from '@/assets/packs/pool-hard.json';
import mediumPool from '@/assets/packs/pool-medium.json';
import {
  addDays,
  dailyDifficulty,
  dailyNumber,
  DIFFICULTIES,
  generateDaily,
  generatePuzzle,
  unpackPuzzle,
  type Difficulty,
  type PackedPuzzle,
  type Puzzle,
} from '@/engine';

const dailyPuzzles = dailyPack.puzzles as PackedPuzzle[];

/** Pools sorted by grid size (stable), so grids grow as the player progresses. */
const POOLS: Record<Difficulty, PackedPuzzle[]> = {
  easy: sortBySize(easyPool as PackedPuzzle[]),
  medium: sortBySize(mediumPool as PackedPuzzle[]),
  hard: sortBySize(hardPool as PackedPuzzle[]),
  expert: sortBySize(expertPool as PackedPuzzle[]),
};

function sortBySize(pool: PackedPuzzle[]): PackedPuzzle[] {
  return pool.map((p, i) => ({ p, i })).sort((a, b) => a.p.n - b.p.n || a.i - b.i).map((x) => x.p);
}

const POSITION = new Map<string, { difficulty: Difficulty; index: number }>();
for (const d of DIFFICULTIES) POOLS[d].forEach((p, index) => POSITION.set(p.i, { difficulty: d, index }));

const cache = new Map<string, Puzzle>();

function remember(p: Puzzle): Puzzle {
  cache.set(p.id, p);
  return p;
}

export const dailyId = (key: string) => `daily-${key}`;

const RANK: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2, expert: 3 };

/**
 * First-week ramp: a new player's dailies start easy and grow (days 0-1 easy, 2-3 medium, 4-6 hard) before the
 * weekly rhythm (harder weekends) takes over. Null = no cap.
 */
export function starterCap(key: string, installedKey: string | null): Difficulty | null {
  if (!installedKey) return null;
  const day = dailyNumber(key) - dailyNumber(installedKey);
  if (day < 0 || day > 6) return null;
  return day <= 1 ? 'easy' : day <= 3 ? 'medium' : 'hard';
}

/** Id of the daily puzzle this player gets for a date: the regular one, or an easier starter in their first week. */
export function dailyIdFor(key: string, installedKey: string | null): string {
  const cap = starterCap(key, installedKey);
  return cap && RANK[cap] < RANK[dailyDifficulty(key)] ? `${dailyId(key)}-${cap}` : dailyId(key);
}

/** Id of the Unlimited puzzle at a 0-based position in a difficulty's sequence. */
export function unlimitedId(difficulty: Difficulty, index: number): string {
  const pool = POOLS[difficulty];
  return index < pool.length ? pool[index].i : `${difficulty}-g${index + 1}`;
}

export type PuzzleInfo =
  | { mode: 'daily'; key: string; number: number; difficulty: Difficulty; starter?: true }
  | { mode: 'unlimited'; difficulty: Difficulty; number: number };

/** Parse an id without building the puzzle. Null for unknown ids. */
export function puzzleInfo(id: string): PuzzleInfo | null {
  const daily = /^daily-(\d{4}-\d{2}-\d{2})(?:-(easy|medium|hard))?$/.exec(id);
  if (daily) {
    const key = daily[1];
    if (daily[2]) return { mode: 'daily', key, number: dailyNumber(key), difficulty: daily[2] as Difficulty, starter: true };
    return { mode: 'daily', key, number: dailyNumber(key), difficulty: dailyDifficultyFor(key) };
  }
  const pos = POSITION.get(id);
  if (pos) return { mode: 'unlimited', difficulty: pos.difficulty, number: pos.index + 1 };
  const gen = /^(easy|medium|hard|expert)-g(\d+)$/.exec(id);
  if (gen) return { mode: 'unlimited', difficulty: gen[1] as Difficulty, number: Number(gen[2]) };
  return null;
}

function dailyDifficultyFor(key: string): Difficulty {
  const packed = dailyPuzzles[dailyNumber(key) - 1];
  return packed ? unpackPuzzle(packed).difficulty : generateDailyCached(key).difficulty;
}

function generateDailyCached(key: string): Puzzle {
  return cache.get(dailyId(key)) ?? remember(generateDaily(key));
}

/** Build (or fetch from cache) the puzzle for an id. Null for unknown ids. */
export function getPuzzle(id: string): Puzzle | null {
  const hit = cache.get(id);
  if (hit) return hit;
  const info = puzzleInfo(id);
  if (!info) return null;

  if (info.mode === 'daily' && info.starter) return remember(starterPuzzle(info.key, info.difficulty, id));
  if (info.mode === 'daily') {
    const packed = dailyPuzzles[info.number - 1];
    // Dates outside the pack (before the epoch or after 3 years) fall back to generation.
    return packed ? remember(unpackPuzzle(packed)) : generateDailyCached(info.key);
  }

  const pool = POOLS[info.difficulty];
  const index = info.number - 1;
  if (index < pool.length) return remember(unpackPuzzle(pool[index]));
  if (info.difficulty === 'expert') {
    // Expert generation is too slow on-device: replay the pool with a new id.
    return remember({ ...unpackPuzzle(pool[index % pool.length]), id });
  }
  return remember(generatePuzzle({ seed: `unlimited:v1:${id}`, difficulty: info.difficulty, id, maxAttempts: 2000 }));
}

/**
 * A starter daily borrows a daily of the wanted difficulty from about two years later in the pack (verified unique,
 * same quality), so it is the same for everyone on that date and a challenge link rebuilds it.
 */
function starterPuzzle(key: string, difficulty: Difficulty, id: string): Puzzle {
  for (let k = addDays(key, 730), i = 0; i < 7; k = addDays(k, 1), i++) {
    const packed = dailyPuzzles[dailyNumber(k) - 1];
    if (packed && dailyDifficulty(k) === difficulty) {
      const p = unpackPuzzle(packed);
      if (p.difficulty === difficulty) return { ...p, id };
    }
  }
  return generatePuzzle({ seed: `daily-starter:v1:${key}`, difficulty, id, maxAttempts: 2000 });
}
