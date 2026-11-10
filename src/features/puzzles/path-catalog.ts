/**
 * Path puzzles by id, like the crowns catalog:
 *
 *   path-YYYY-MM-DD      daily path puzzle for that local date
 *   path-hard-0042       bundled Unlimited path puzzle
 *   path-hard-g401       Unlimited path puzzle #401, beyond the bundled pool (generated on the phone)
 */
import dailyPack from '@/assets/packs/path-daily.json';
import easyPool from '@/assets/packs/path-pool-easy.json';
import expertPool from '@/assets/packs/path-pool-expert.json';
import hardPool from '@/assets/packs/path-pool-hard.json';
import mediumPool from '@/assets/packs/path-pool-medium.json';
import {
  dailyDifficulty,
  dailyNumber,
  DIFFICULTIES,
  generatePathPuzzle,
  unpackPath,
  type Difficulty,
  type PackedPath,
  type PathPuzzle,
} from '@/engine';

const dailyPuzzles = dailyPack.puzzles as PackedPath[];
const POOLS: Record<Difficulty, PackedPath[]> = {
  easy: easyPool as PackedPath[],
  medium: mediumPool as PackedPath[],
  hard: hardPool as PackedPath[],
  expert: expertPool as PackedPath[],
};
const POSITION = new Map<string, { difficulty: Difficulty; index: number }>();
for (const d of DIFFICULTIES) POOLS[d].forEach((p, index) => POSITION.set(p.i, { difficulty: d, index }));

const cache = new Map<string, PathPuzzle>();
const remember = (p: PathPuzzle) => (cache.set(p.id, p), p);

export const pathDailyId = (key: string) => `path-${key}`;

export function pathUnlimitedId(difficulty: Difficulty, index: number): string {
  const pool = POOLS[difficulty];
  return index < pool.length ? pool[index].i : `path-${difficulty}-g${index + 1}`;
}

export type PathInfo =
  | { mode: 'daily'; key: string; number: number; difficulty: Difficulty }
  | { mode: 'unlimited'; difficulty: Difficulty; number: number };

export function pathInfo(id: string): PathInfo | null {
  const daily = /^path-(\d{4}-\d{2}-\d{2})$/.exec(id);
  if (daily) return { mode: 'daily', key: daily[1], number: dailyNumber(daily[1]), difficulty: dailyDifficulty(daily[1]) };
  const pos = POSITION.get(id);
  if (pos) return { mode: 'unlimited', difficulty: pos.difficulty, number: pos.index + 1 };
  const gen = /^path-(easy|medium|hard|expert)-g(\d+)$/.exec(id);
  if (gen) return { mode: 'unlimited', difficulty: gen[1] as Difficulty, number: Number(gen[2]) };
  return null;
}

export function getPathPuzzle(id: string): PathPuzzle | null {
  const hit = cache.get(id);
  if (hit) return hit;
  const info = pathInfo(id);
  if (!info) return null;
  if (info.mode === 'daily') {
    const packed = dailyPuzzles[info.number - 1];
    return remember(packed ? unpackPath(packed) : generatePathPuzzle({ seed: `path-daily:v1:${info.key}`, difficulty: info.difficulty, id }));
  }
  const pool = POOLS[info.difficulty];
  const index = info.number - 1;
  if (index < pool.length) return remember(unpackPath(pool[index]));
  // Expert (8×8) is slow to make on a phone: replay the pool under the new id.
  if (info.difficulty === 'expert') return remember({ ...unpackPath(pool[index % pool.length]), id });
  return remember(generatePathPuzzle({ seed: `path-unlimited:v1:${id}`, difficulty: info.difficulty, id }));
}
