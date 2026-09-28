# Crowns — daily logic puzzle app (iOS + Android)

> Working name **"Crowns"**. Final store name and bundle id are NOT decided yet (see "Decisions pending").
> Owner: Amir (Dubai). He is not a full-time developer: explain what you did in short, plain language,
> and ask him before anything that costs money, needs his accounts, or is hard to undo.
> He writes in Persian; answer him in Persian unless he writes in English. Code, comments and app text are English.

## What we are building (one paragraph)

A free, ad-supported daily logic-puzzle app for the US market (then worldwide). Core game: the
"one crown per row, column and colored region; crowns never touch" puzzle (a.k.a. Star Battle / the
LinkedIn "Queens" game). Positioning: **"Daily logic puzzles like NYT & LinkedIn — free, no subscription."**
We win on quality, not novelty: every complaint we found in competitor reviews is fixed by design
(see `docs/COMPETITOR_RESEARCH.md`). Later versions add two more puzzle types (path puzzle, binary sun/moon puzzle).

Read these before writing code:

1. `docs/PRODUCT_SPEC.md` — screens, controls, monetization rules, viral features, scope per version. **Source of truth.**
2. `docs/COMPETITOR_RESEARCH.md` — why each feature exists. Don't remove a feature listed there without asking.
3. `docs/RELEASE_CHECKLIST.md` — accounts, IDs and store steps (many need Amir).

## Current state (handoff)

- `engine/` — **done and tested**. Pure TypeScript, zero dependencies. Generator (unique solution,
  logic-only), human-style solver, difficulty grading, teaching hints with English explanations,
  board helpers (conflicts, auto-✕, win check), daily puzzle schedule, share text, challenge codes,
  compact pack format. 11 tests pass.
- `engine/packs/` — **pre-built puzzles**: 1,096 daily puzzles (3 years from `DAILY_EPOCH` = 2026-10-01)
  + 400 per difficulty for Unlimited mode. All verified unique + solvable without guessing.
- **M0 done (v0.1.0, 2026-09-28)**: Expo SDK 57 project at the root, engine moved to `src/engine`, packs to
  `assets/packs`, tests to `tests/engine`. Blank Home screen. Lint, typecheck and 11 engine tests pass.
- Work now happens in a cloud container (no Mac). There `api.expo.dev` is blocked, so `npx expo install` fails:
  use `npm install <pkg>@<version from node_modules/expo/bundledNativeModules.json>` and run expo CLI with `EXPO_OFFLINE=1`.
  Preview = `npx expo export --platform web` + screenshot; on-device testing needs EAS builds (Amir's Expo account).

## Tech stack (decided)

- **Expo (latest SDK) + React Native + TypeScript (strict) + Expo Router.** One codebase → iOS + Android.
  At handoff time the latest was Expo SDK 57. Expo changes fast: before using any Expo/EAS/RN API,
  check the versioned docs (`https://docs.expo.dev/versions/v<major>.0.0/`) and `https://docs.expo.dev/llms.txt`.
  Never edit `ios/` or `android/` by hand (Continuous Native Generation) — use `app.json` + config plugins.
- Install packages with `npx expo install <pkg>` (SDK-compatible versions).
- State: `zustand` with AsyncStorage persistence. Board = plain Views (max 121 cells) +
  `react-native-gesture-handler` (drag-to-mark) + `react-native-reanimated` (animations) + `react-native-svg` (crown icon).
- Ads: `react-native-google-mobile-ads` (AdMob) incl. its UMP consent API; iOS ATT via `expo-tracking-transparency`.
- Remove-Ads purchase: RevenueCat (`react-native-purchases`) recommended (simplest restore/receipts); `expo-iap` is the fallback. Ask Amir before creating accounts.
- Analytics: Firebase Analytics (`@react-native-firebase/app` + `/analytics`) linked to AdMob (ad revenue per user).
- Builds & store upload: **EAS Build + EAS Submit** (cloud). Local runs on Amir's Mac: `npx expo run:ios` (needs Xcode).
  Expo Go will NOT work once native modules (AdMob, Firebase) are added → use a development build.

## Target folder layout (after Milestone 0)

```
puzzle mobile app/            ← this folder = the Expo project root
  CLAUDE.md  AGENTS.md(from Expo)  START-HERE-FA.md  CHANGELOG.md
  app.json  eas.json  package.json  tsconfig.json
  docs/                        product spec, research, release checklist
  src/app/                     Expo Router screens only
  src/engine/                  ← moved from engine/src (keep it dependency-free, no React imports)
  src/features/…  src/components/…  src/store/…  src/services/ (ads, iap, analytics, notifications, share)
  assets/packs/                ← moved from engine/packs
  tests/engine/                ← moved from engine/test (fix import paths)
  scripts/build-packs.ts       ← moved from engine/scripts (fix paths: output to assets/packs)
```

## Milestones (do them in order; show Amir the result after each)

Every milestone: bump `version` in `app.json` (0.1.0, 0.2.0 … 1.0.0 = store release; patch for fixes),
add a line to `CHANGELOG.md` (also shown in the in-app "What's new"), run lint + typecheck + tests.
**Amir explicitly wants the version bumped on every update** so he can tell which build he is looking at.

- **M0 Setup (v0.1.0)** — scaffold Expo into a temp dir (`npx create-expo-app@latest _scaffold --template default`),
  move its contents into this root (keep our `CLAUDE.md`; keep Expo's `AGENTS.md` and reference it with `@AGENTS.md`
  at the bottom of this file), delete the template demo screens, move `engine/` as in the layout above, add scripts
  `test:engine` (`tsx --test tests/engine/*.test.ts`) and `build:packs`. Set `name`, `slug`, `scheme`,
  `ios.bundleIdentifier`, `android.package` to placeholders from "Decisions pending". Add `eas.json`
  (development / preview / production profiles, `autoIncrement` build numbers). Done when: tests pass,
  app opens in the iOS simulator with a blank Home screen.
- **M1 Core game (v0.2.0)** — Home (daily card + Unlimited difficulty buttons), Game screen (board, tap cycle,
  drag-to-mark, auto-✕ display, conflicts, undo/redo, clear, timer, pause), win screen, persistence
  (resume any puzzle after the app is killed), daily streak. Load puzzles from `assets/packs`.
- **M2 Hints + tutorial (v0.3.0)** — 3-stage teaching hints (look here → why → apply) using `getHint`/`explainStep`;
  interactive 60-second tutorial on first launch (skippable, re-openable from Settings).
- **M3 Stats, settings, reminders (v0.4.0)** — Stats screen, all Settings, "What's new" sheet, opt-in daily reminder
  (`expo-notifications`), review prompt (`expo-store-review`, never rewarded).
- **M4 Viral (v0.5.0)** — share card (image + Wordle-style text), challenge-a-friend links, invite-a-friend share,
  tiny static web landing page for links (`web/`: universal links / app links + store buttons).
- **M5 Monetization (v0.6.0)** — AdMob banner/interstitial/rewarded with the exact rules in the spec, UMP + ATT consent,
  Remove-Ads purchase + restore. Test ad unit IDs until Amir provides real ones.
- **M6 Analytics (v0.7.0)** — Firebase Analytics events listed in the spec.
- **M7 Polish (v0.8.0–0.9.x)** — accessibility (VoiceOver/TalkBack labels, color-blind patterns), dark mode,
  icon/splash, small-phone layout for 11×11, low-end Android performance, crash-free QA pass.
- **M8 Release (v1.0.0)** — store listings, screenshots, privacy policy, EAS production builds, submit to both stores.

## Engine API cheat-sheet (`src/engine`)

```ts
import {
  unpackPuzzle, type PackedPuzzle, type Puzzle, type Board, EMPTY, CROSS, CROWN,
  emptyBoard, nextMark, findConflicts, autoCrossCells, isSolved,          // board
  getHint, applyHint, explainStep, REGION_COLOR_NAMES,                     // hints
  dateKey, dailyNumber, dailyDifficulty, DAILY_EPOCH, generateDaily,       // daily
  generatePuzzle,                                                          // runtime fallback (easy–hard only)
  buildShareText, formatTime, encodeChallenge, decodeChallenge,            // viral
} from '@/engine';
```

- Board = `Mark[]` (row-major, length n²). Store ONLY user marks. Auto-✕ cells are derived (`autoCrossCells`), never stored.
- Daily puzzle for local date `k = dateKey()`: `daily.puzzles[dailyNumber(k) - 1]`; if out of range → `generateDaily(k)`.
- Unlimited: pools are ordered; sort each pool by `n` ascending at load so grids grow as the player progresses.
  After a pool is exhausted, generate at runtime with a random seed (easy/medium/hard only — expert is too slow on-device).
- Region color order MUST match `REGION_COLOR_NAMES` (hint text says "the purple region").
- The generator is deterministic; if you change generator/solver logic, bump `GEN_VERSION` in the pack script and
  rebuild packs, but **never change puzzles that were already published as dailies**.
- Before launch, set `DAILY_EPOCH` to the real launch date and rebuild packs (`npm run build:packs`), so puzzle #1 = launch day.

## Rules

- Never show an interstitial during a puzzle, on the daily puzzle, or in the first session. Rules in the spec are hard limits.
- Never reward ratings/reviews (App Store & Play policy). Never use "LinkedIn", "NYT", "Queens", "Zip", "Tango"
  in the app name, icon, or UI. The word "queens" may appear only as a store keyword/description comparison — ask first.
- No accounts/sign-in in v1.0. Collect the minimum data. No personal data in analytics events.
- Keep `src/engine` free of React/Expo imports so tests run in plain Node.
- Before saying a task is done: `npx expo lint`, `npx tsc --noEmit`, `npm run test:engine` must all pass.
- Things that need Amir (accounts, payments, real ad unit IDs, domain, store forms): prepare everything, then give
  him a short numbered checklist in Persian.

## Decisions pending (ask Amir when you reach them)

- App name (candidates: "Crowns: Daily Logic Puzzle", "Regal – Daily Logic", "Crownly"). Check store availability.
- Bundle id / package (permanent after first upload), e.g. `com.<company>.crowns`. Placeholder: `com.amixstudio.crowns`.
- Apple Developer account type (individual vs organization with D-U-N-S) and Google Play account type.
- Domain for share/challenge links (e.g. `playcrowns.com`) + privacy policy URL.
- Remove-Ads price (planned $3.99, one-time).

@AGENTS.md
