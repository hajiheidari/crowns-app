/// <reference types="node" />
/**
 * Builds the bundled sun & moon packs (run on a dev machine, not in the app):
 *
 *   npm run build:binary-packs -- [--days 1096] [--pool 400] [--out assets/packs]
 *
 * binary-daily.json { epoch, puzzles: PackedBinary[] } (index = days since epoch) and binary-pool-<difficulty>.json.
 * Every puzzle is checked again: the logic solver finishes it alone (so exactly one solution, no guessing). Deterministic: re-running gives identical files.
 * Never change dailies that were already published (bump BINARY_GEN_VERSION only for new ones).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DAILY_EPOCH, DIFFICULTIES, addDays, dailyDifficulty, generateBinaryPuzzle, packBinary, solveBinary,
  type Difficulty, type BinaryPuzzle,
} from '../src/engine';

const BINARY_GEN_VERSION = 1;

function arg(name: string, def: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : def;
}

const days = Number(arg('days', '1096'));
const poolSize = Number(arg('pool', '400'));
const outDir = arg('out', join(__dirname, '..', 'assets', 'packs'));
mkdirSync(outDir, { recursive: true });

const seen = new Set<string>();
function build(seed: string, id: string, difficulty: Difficulty): BinaryPuzzle {
  for (let retry = 0; retry < 20; retry++) {
    const p = generateBinaryPuzzle({ seed: `${seed}:${retry}`, difficulty, id });
    const key = p.givens.join('') + p.signs.map((x) => `${x.a}${x.b}${x.same}`).join();
    const r = solveBinary(p, true);
    if (seen.has(key) || !r.solved || r.cells.join() !== p.solution.join()) continue;
    seen.add(key);
    return p;
  }
  throw new Error(`failed to build ${id}`);
}

const t0 = Date.now();
const daily = [];
for (let d = 0; d < days; d++) {
  const key = addDays(DAILY_EPOCH, d);
  daily.push(packBinary(build(`binary-daily:v${BINARY_GEN_VERSION}:${key}`, `binary-${key}`, dailyDifficulty(key))));
}
writeFileSync(join(outDir, 'binary-daily.json'), JSON.stringify({ epoch: DAILY_EPOCH, puzzles: daily }));
console.log(`daily ${days}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);

for (const diff of DIFFICULTIES) {
  const pool = [];
  for (let i = 0; i < poolSize; i++) {
    pool.push(packBinary(build(`binary-pool:v${BINARY_GEN_VERSION}:${diff}:${i}`, `binary-${diff}-${String(i + 1).padStart(4, '0')}`, diff)));
  }
  writeFileSync(join(outDir, `binary-pool-${diff}.json`), JSON.stringify(pool));
  console.log(`pool ${diff}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
