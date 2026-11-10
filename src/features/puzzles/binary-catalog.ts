/**
 * Sun & moon puzzles by id, like the crowns catalog:
 *
 *   binary-YYYY-MM-DD      daily sun & moon puzzle for that local date
 *   binary-hard-0042       bundled Unlimited sun & moon puzzle
 *   binary-hard-g401       Unlimited sun & moon puzzle #401, beyond the bundled pool (generated on the phone)
 */
import dailyPack from '@/assets/packs/binary-daily.json';
import easyPool from '@/assets/packs/binary-pool-easy.json';
import expertPool from '@/assets/packs/binary-pool-expert.json';
import hardPool from '@/assets/packs/binary-pool-hard.json';
import mediumPool from '@/assets/packs/binary-pool-medium.json';
import {
  dailyDifficulty,
  dailyNumber,
  DIFFICULTIES,
  generateBinaryPuzzle,
  unpackBinary,
  type Difficulty,
  type PackedBinary,
  type BinaryPuzzle,
} from '@/engine';

const dailyPuzzles = dailyPack.puzzles as PackedBinary[];
const POOLS: Record<Difficulty, PackedBinary[]> = {
  easy: easyPool as PackedBinary[],
  medium: mediumPool as PackedBinary[],
  hard: hardPool as PackedBinary[],
  expert: expertPool as PackedBinary[],
};
const POSITION = new Map<string, { difficulty: Difficulty; index: number }>();
for (const d of DIFFICULTIES) POOLS[d].forEach((p, index) => POSITION.set(p.i, { difficulty: d, index }));

const cache = new Map<string, BinaryPuzzle>();
const remember = (p: BinaryPuzzle) => (cache.set(p.id, p), p);

export const binaryDailyId = (key: string) => `binary-${key}`;

export function binaryUnlimitedId(difficulty: Difficulty, index: number): string {
  const pool = POOLS[difficulty];
  return index < pool.length ? pool[index].i : `binary-${difficulty}-g${index + 1}`;
}

export type BinaryInfo =
  | { mode: 'daily'; key: string; number: number; difficulty: Difficulty }
  | { mode: 'unlimited'; difficulty: Difficulty; number: number };

export function binaryInfo(id: string): BinaryInfo | null {
  const daily = /^binary-(\d{4}-\d{2}-\d{2})$/.exec(id);
  if (daily) return { mode: 'daily', key: daily[1], number: dailyNumber(daily[1]), difficulty: dailyDifficulty(daily[1]) };
  const pos = POSITION.get(id);
  if (pos) return { mode: 'unlimited', difficulty: pos.difficulty, number: pos.index + 1 };
  const gen = /^binary-(easy|medium|hard|expert)-g(\d+)$/.exec(id);
  if (gen) return { mode: 'unlimited', difficulty: gen[1] as Difficulty, number: Number(gen[2]) };
  return null;
}

export function getBinaryPuzzle(id: string): BinaryPuzzle | null {
  const hit = cache.get(id);
  if (hit) return hit;
  const info = binaryInfo(id);
  if (!info) return null;
  if (info.mode === 'daily') {
    const packed = dailyPuzzles[info.number - 1];
    return remember(packed ? unpackBinary(packed) : generateBinaryPuzzle({ seed: `binary-daily:v1:${info.key}`, difficulty: info.difficulty, id }));
  }
  const pool = POOLS[info.difficulty];
  const index = info.number - 1;
  if (index < pool.length) return remember(unpackBinary(pool[index]));
  return remember(generateBinaryPuzzle({ seed: `binary-unlimited:v1:${id}`, difficulty: info.difficulty, id }));
}
