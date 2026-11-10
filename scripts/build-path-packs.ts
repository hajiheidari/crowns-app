/// <reference types="node" />
/**
 * Builds the bundled path-puzzle packs (run on a dev machine, not in the app):
 *
 *   npm run build:path-packs -- [--days 1096] [--pool 400] [--out assets/packs]
 *
 * path-daily.json { epoch, puzzles: PackedPath[] } (index = days since epoch) and path-pool-<difficulty>.json.
 * Every puzzle is checked again: exactly one solution. Deterministic: re-running gives identical files.
 * Never change dailies that were already published (bump PATH_GEN_VERSION only for new ones).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DAILY_EPOCH, DIFFICULTIES, addDays, countPathSolutions, dailyDifficulty, generatePathPuzzle, packPath,
  type Difficulty, type PathPuzzle,
} from '../src/engine';

const PATH_GEN_VERSION = 1;

function arg(name: string, def: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : def;
}

const days = Number(arg('days', '1096'));
const poolSize = Number(arg('pool', '400'));
const outDir = arg('out', join(__dirname, '..', 'assets', 'packs'));
mkdirSync(outDir, { recursive: true });

const seen = new Set<string>();
function build(seed: string, id: string, difficulty: Difficulty): PathPuzzle {
  for (let retry = 0; retry < 20; retry++) {
    const p = generatePathPuzzle({ seed: `${seed}:${retry}`, difficulty, id });
    const key = p.solution.join(',');
    if (seen.has(key) || countPathSolutions(p.n, p.clues, p.walls, 2, 2_000_000) !== 1) continue;
    seen.add(key);
    return p;
  }
  throw new Error(`failed to build ${id}`);
}

const t0 = Date.now();
const daily = [];
for (let d = 0; d < days; d++) {
  const key = addDays(DAILY_EPOCH, d);
  daily.push(packPath(build(`path-daily:v${PATH_GEN_VERSION}:${key}`, `path-${key}`, dailyDifficulty(key))));
}
writeFileSync(join(outDir, 'path-daily.json'), JSON.stringify({ epoch: DAILY_EPOCH, puzzles: daily }));
console.log(`daily ${days}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);

for (const diff of DIFFICULTIES) {
  const pool = [];
  for (let i = 0; i < poolSize; i++) {
    pool.push(packPath(build(`path-pool:v${PATH_GEN_VERSION}:${diff}:${i}`, `path-${diff}-${String(i + 1).padStart(4, '0')}`, diff)));
  }
  writeFileSync(join(outDir, `path-pool-${diff}.json`), JSON.stringify(pool));
  console.log(`pool ${diff}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
