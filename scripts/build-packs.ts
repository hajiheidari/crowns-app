/// <reference types="node" />
/**
 * Builds the bundled puzzle packs (run on a dev machine, not in the app):
 *
 *   npm run build:packs -- [--days 1096] [--pool 400] [--out assets/packs]
 *
 * Output:
 *   daily.json          { epoch, puzzles: PackedPuzzle[] }  index = days since epoch
 *   pool-<difficulty>.json  PackedPuzzle[]                    for Unlimited mode
 *   manifest.json       counts + generator version
 *
 * Every puzzle is re-verified: unique solution + solvable by pure logic.
 * Deterministic: re-running produces identical files.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DAILY_EPOCH, DIFFICULTIES, addDays, countSolutions, dailyDifficulty, generatePuzzle,
  packPuzzle, solveLogically, type Difficulty, type Puzzle,
} from '../src/engine';

const GEN_VERSION = 1;

function arg(name: string, def: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : def;
}

const days = Number(arg('days', '1096'));
const poolSize = Number(arg('pool', '400'));
const outDir = arg('out', join(__dirname, '..', 'assets', 'packs'));
mkdirSync(outDir, { recursive: true });

const seen = new Set<string>();

function verify(p: Puzzle): boolean {
  const key = p.regions.join(',');
  if (seen.has(key)) return false;
  if (countSolutions(p.n, p.regions, 2) !== 1) return false;
  if (!solveLogically(p.n, p.regions).solved) return false;
  seen.add(key);
  return true;
}

function build(seedBase: string, id: string, difficulty: Difficulty): Puzzle {
  for (let retry = 0; retry < 20; retry++) {
    const p = generatePuzzle({ seed: `${seedBase}:${retry}`, difficulty, id, maxAttempts: 4000 });
    if (p.difficulty === difficulty && verify(p)) return p;
  }
  throw new Error(`failed to build ${id}`);
}

const t0 = Date.now();

// Daily
const daily = [];
for (let d = 0; d < days; d++) {
  const key = addDays(DAILY_EPOCH, d);
  daily.push(packPuzzle(build(`daily:v${GEN_VERSION}:${key}`, `daily-${key}`, dailyDifficulty(key))));
  if (d % 100 === 0) console.log(`daily ${d}/${days}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
writeFileSync(join(outDir, 'daily.json'), JSON.stringify({ epoch: DAILY_EPOCH, puzzles: daily }));

// Unlimited pools
const counts: Record<string, number> = { daily: daily.length };
for (const diff of DIFFICULTIES) {
  const pool = [];
  for (let i = 0; i < poolSize; i++) {
    const id = `${diff}-${String(i + 1).padStart(4, '0')}`;
    pool.push(packPuzzle(build(`pool:v${GEN_VERSION}:${diff}:${i}`, id, diff)));
  }
  writeFileSync(join(outDir, `pool-${diff}.json`), JSON.stringify(pool));
  counts[diff] = pool.length;
  console.log(`pool ${diff} done  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

writeFileSync(
  join(outDir, 'manifest.json'),
  JSON.stringify({ generatorVersion: GEN_VERSION, epoch: DAILY_EPOCH, counts, builtAt: 'deterministic' }, null, 2),
);
console.log('done', counts, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
