# Crowns puzzle engine

Pure TypeScript, no dependencies. Runs in React Native, Node and the browser.

| File | What it does |
|---|---|
| `src/types.ts` | Puzzle / Board / Mark types |
| `src/rng.ts` | Seeded deterministic RNG (never use Math.random for puzzles) |
| `src/grid.ts` | Rows, columns, regions, neighbours, attack tables |
| `src/generator.ts` | Random layout → regions → uniqueness repair → grading |
| `src/logic.ts` | Human-style solver: 5 rule levels (last cell, confinement, blocks-unit, k-in-k groups, short what-if) |
| `src/hints.ts` | `getHint` (mistakes first, then next logical step) + `applyHint` |
| `src/explain.ts` | Plain-English text for each step |
| `src/board.ts` | Tap cycle, conflicts, auto-✕, win check, mistakes |
| `src/daily.ts` | Daily schedule, puzzle numbers, deterministic fallback |
| `src/share.ts` | Share text, challenge codes |
| `src/packs.ts` | Compact JSON format for bundled packs |
| `scripts/build-packs.ts` (repo root) | Builds + verifies `assets/packs/` (≈8 min on a laptop) |

Tests: `npm run test:engine` (11 tests, ~5 s).

Grading: Easy = only levels 1–2; Medium = some level-3; Hard = one k-in-k group step or many level-3 steps;
Expert = a what-if step or 2+ group steps.
