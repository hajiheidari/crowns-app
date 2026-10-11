# Tiaro — daily logic puzzle app (iOS + Android)

> App name **"Tiaro"** (decided 2026-10-03; store title "Tiaro: Daily Logic Puzzle"). The working name was "Crowns", so the repo,
> the EAS slug `crowns`, storage keys and code identifiers still say crowns: keep them (changing storage keys loses progress).
> Bundle id / package: `com.espadna.tiaro` (decided 2026-10-03).
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
  Amir plays the web build as an Artifact (https://claude.ai/artifact/TbUGV5pzEns1KCnr39Ne52): the JS bundle is inlined
  into one HTML page (`web.output` is `single`) and the page resets the URL path to "/" for Expo Router.
- **M1 done (v0.2.0)**: Home, Game screen, win overlay, persistence (zustand + AsyncStorage), daily streak.
- **M2 done (v0.3.0)**: animated tutorial (`src/features/tutorial/slides.ts`, Amir asked for a picture/video style tutorial, so it is looping animations on a real 5×5, not text) + 3-stage hints (all free until ads land in M5).
  v0.3.1: per Amir, the tutorial is NOT shown automatically on first launch; only via the "How to play" button on Home.
- **M3 done (v0.4.0)**: Stats screen (streaks, month calendar, per-difficulty times + sparkline), Settings (gameplay, theme,
  daily reminder via expo-notifications, help), "What's new" sheet generated from CHANGELOG.md (`npm run changelog`),
  review prompt after 3 wins (never rewarded). UI version comes from `src/constants/version.ts` (changelog; a test ties it to app.json).
- **M4 done (v0.5.0)**: share sheet (image card square/story via react-native-view-shot + expo-sharing, text via `buildShareText`),
  challenge links `<LINK_BASE>/c/<code>` → route `src/app/c/[code].tsx` → game with `?vs=<seconds>` (both times on the win card),
  invite links `/?r=<ref>` (anonymous random `meta.ref`; first inviter kept in `meta.invitedBy` for 1.1 referrals).
  Static landing page in `web/` (see `web/README.md`). Domain is a placeholder (`src/constants/links.ts`); universal/app links
  (`associatedDomains`, `intentFilters`) are NOT in app.json yet: add them when the domain is decided. Web preview can't share images.
- **M5 done (v0.6.0)**: ad rules as pure functions in `src/features/monetization/policy.ts` (tested). AdMob via
  `src/services/ads.native.ts` (UMP → ATT explainer + prompt → init; rewarded pays out if it fails to load; interstitial only on
  "Next puzzle" in Unlimited). Banner (`ad-banner.native.tsx`) on Home, Stats, Archive. Rewarded: 2nd+ hint per puzzle, archive days
  older than 7, streak repair (1 missed day, once/week). Remove Ads via RevenueCat (`src/services/iap.native.ts`, entitlement and
  product id `remove_ads`). Web preview uses stand-ins (`ads.ts`, `iap.ts`: fake ads, free test purchase). Still placeholders in
  `src/constants/monetization.ts` (real ad unit ids, RevenueCat keys) and app.json (Google TEST AdMob app ids, only Google's own
  SKAdNetwork id: paste AdMob's full list before release). Real ad ids are used only when `EXPO_PUBLIC_ADS_ENV=production` (eas.json).
- **M6 done (v0.7.0)**: typed events in `src/features/analytics/events.ts` (spec §6, no personal data), `track()` from
  `src/services/analytics(.native).ts`. Firebase is OFF until `firebase/GoogleService-Info.plist` + `firebase/google-services.json`
  exist: `firebase-config.js` drives `app.config.ts` (adds the RNFB plugin, googleServicesFile, static frameworks) and
  `react-native.config.js` (drops RNFB from autolinking otherwise). Ad consent is passed to Firebase consent mode. Web preview keeps
  events in `globalThis.__crownsEvents` for browser tests. Linking Firebase to AdMob (ad revenue per user) is done in the consoles.
- **M7 (part 1) done (v0.8.0)**: new icon/splash (`assets/images/*`, generated from an SVG: ink #1F1B16 bg, gold crown, 4 pastel tiles),
  color-blind patterns (`settings.patterns`, `src/features/game/region-patterns.tsx`: one SVG under the cells), "!" badge on conflicting
  crowns, per-cell screen reader labels + actions in `board.tsx`, ✕ drawn with Views (not SVG) for low-end Android, R8 minify/shrink
  via expo-build-properties (app.config.ts merges Firebase's static frameworks into that entry), blocked storage/overlay permissions.
  v0.8.1: pinch-to-zoom for n ≥ 8 (`src/features/game/zoom.ts` math + tests; pinch/2-finger pan are UI-thread worklets in
  `board.tsx`, touches mapped back with `toBoard`; on web the pinch focal is page-based, so the board offset is subtracted).
  Still open for M7: tune zoom on a real phone, Dynamic Type check, on-device QA (needs EAS: Amir is creating the Expo account,
  token goes in env var `EXPO_TOKEN`, network must allow expo.dev, api.expo.dev, storage.googleapis.com).
- v0.8.2: fixed Android crash on launch. Importing `@react-native-firebase/*` without its native module throws, so
  `analytics.native.ts` now `require`s it lazily and only when `extra.firebaseEnabled` (set by `app.config.ts`) is true.
  EAS project `@hajiheidaris-team/crowns` is linked in app.json; APKs come from `eas build -p android --profile preview`.
- v0.8.3: fatal JS errors show in a native alert (`src/services/crash-alert.ts`, imported first in `_layout.tsx`) and render errors in
  the root `ErrorBoundary`, so testers can screenshot them. Amir's S23 Ultra (Android 14, Persian locale, Iran) still did not open 0.8.2;
  2026-10-08: Amir installed the latest builds on his phone and they open fine. The emulator here has no KVM: boots take 15+ min and sometimes hang.
- v0.8.4 (M7): large-font pass. Tight texts cap `maxFontSizeMultiplier` (wordmark, tile titles, game top bar, toolbar, segmented
  controls); Settings rows wrap so controls drop below the label. Dark mode and 320-px-wide layouts checked on web, all screens.
- v0.8.5: web share/copy reports the truth (`copyOnWeb` in `src/services/share.ts`; expo-clipboard's web fallback claims success
  even when the browser refuses). Share actions return `{ status, text }`; `shareNote()` gives the note under each share button
  ("copied", or the text itself to copy by hand). Challenge links still point at the placeholder domain, so they open nothing yet.
- v0.8.6: renamed to **Tiaro** (user-facing text, scheme `tiaro`, placeholder domain playtiaro.com, landing page).
- v0.9.0 (Bazaar phase A, Persian): `src/i18n/{en,fa}.ts` (same shape; TS checks fa), `S` in `src/strings.ts` is a Proxy over the
  current language (`setLanguage` from `settings.language`; root layout re-keys on change). Default language: `fa` when
  `EXPO_PUBLIC_STORE=bazaar` (`src/constants/store.ts`), else `en`; Settings → Appearance → Language switches. RTL = Yoga
  `direction: 'rtl'` via `dirStyle()` on the root, every Stack screen (contentStyle) and inside each Modal; the board pins 'ltr'.
  `src/components/text.tsx` replaces RN Text everywhere: Vazirmatn by weight (assets/fonts, loaded with useFonts) + Persian digits.
  Engine `explainStep(step, { lang: 'fa' })` and `regionColorName(i, 'fa')` give Persian hints. "What's new" stays English.
- v0.9.1: Persian shows the Jalali calendar (`src/utils/jalali.ts`, tested; `src/features/stats/calendar.ts` builds the month,
  Saturday-first). **Cafe Bazaar build** = eas.json profile `bazaar` (EXPO_PUBLIC_STORE=bazaar, APK): app.config.ts gives the Persian
  name, drops the AdMob plugin/Firebase and blocks BILLING + AD_ID; react-native.config.js drops google-mobile-ads, purchases and
  Firebase (and drops `adivery` from every other build). `src/services/ads.native.ts` / `iap.native.ts` / `ad-banner.native.tsx`
  pick `ad-networks/admob*` or `ad-networks/adivery*`, `purchases/revenuecat` or `purchases/bazaar` with lazy require.
  Adivery ids in `ADIVERY` (constants/monetization.ts). Bazaar billing (Poolakey) waits for the RSA key; until then the
  Purchases section is hidden in that build and the review prompt is off (Play-only).
- v0.10.0: **Arabic** (`src/i18n/ar.ts`, MSA, Latin digits, Gregorian calendar Sunday-first, Vazirmatn font, RTL like Persian;
  `count()` there handles Arabic number agreement). Engine hints: `explainStep(step, { lang: 'ar' })`, `REGION_COLOR_NAMES_AR`
  (feminine adjectives, "المنطقة البنفسجية"). Global builds now start in the phone's language (ar/fa/en via Intl), Bazaar in Persian.
  iOS: `locales` in app.json (ATT text in ar/fa) + `CFBundleAllowMixedLocalizations`. Store: `store/listing-ar.md`,
  `store/screenshots-ar/` (`store/tools/compose-ar.mjs`). Landing page Arabic button opens `?lang=ar`. The Bazaar build offers only fa/en (Amir: no Arabic there).
- v1.0.0 (App Store, Amir 2026-10-10 "plan A"): **ad-free first release**. eas.json `production` sets `EXPO_PUBLIC_ADS=off` →
  `ADS_OFF` (`src/constants/store.ts`): `ad-networks/none.ts` + `purchases/none.ts`, no banner, free hints/archive/streak repair
  (via `|| ADS_OFF`, never by saving meta.removeAds), Purchases section hidden; app.config.ts drops the AdMob plugin and
  react-native.config.js drops AdMob + RevenueCat. iPhone and iPad (Amir asked for iPad: `supportsTablet` + `requireFullScreen`, the app is portrait-only; iPad screenshots
  in `store/screenshots*/ipad-13`). Privacy label: since 1.0.4 "Identifiers → User ID, App Functionality, not linked, no tracking" (Amir set it 2026-10-11).
  **iOS build + submit from this container** (first done 2026-10-10, build 9 → TestFlight): App Store Connect API key in env
  `EXPO_ASC_API_KEY` (bare base64 body; wrap it in PEM BEGIN/END lines into a scratch .p8), `EXPO_ASC_KEY_ID`, `EXPO_ASC_ISSUER_ID`.
  Build: `EXPO_ASC_API_KEY_PATH=<p8> EXPO_APPLE_TEAM_ID=RGR5G6VN69 EXPO_APPLE_TEAM_TYPE=INDIVIDUAL EXPO_NO_CAPABILITY_SYNC=1
  eas build -p ios --profile production` (credentials now exist on Expo; capability sync hits an Apple API bug, so capabilities
  were set via the API: IAP, Associated Domains, Push). Submit needs `ascApiKeyPath/IssuerId/Id` in eas.json submit.ios: add them
  only for the run, never commit the path. `plugins/with-no-push-entitlement.js` drops `aps-environment` (reminders are local).
  When AdMob is approved: remove `EXPO_PUBLIC_ADS` from the profile, fill ids, set "Contains ads" + privacy answers in listing.md.
- v1.0.1: **first-week ramp** (Amir): `dailyIdFor(key, meta.installedKey)` in `catalog.ts` (Home + Archive) caps a new player's
  daily (install day +0–1 easy, +2–3 medium, +4–6 hard, then the weekly schedule). A capped day uses id `daily-<key>-<easy|medium|hard>`:
  same number/streak (stats are keyed by date), puzzle borrowed from the daily pack ~730 days later (`starterPuzzle`). Tested in
  `tests/app/catalog.test.ts`. Arrows (back button, calendar, Settings rows) are the SVG `BackIcon` (text ‹ › sat off-centre).
- v1.0.2: share card follows the theme (`dark` prop) and the square card puts the board beside the text (Vazirmatn's tall lines
  overflowed and clipped the top); its footer and every share text end with the install page `APP_PAGE` (`appPageUrl(lang)`:
  espadna.com/tiaro-app/ + fa/ or ar/). Tap order segments show `CrossIcon`/`CrownIcon` + `S.tapFirst` (`S.tapIconFirst` sets the order).
- v1.0.3 (Amir): **hints are earned** — `meta.hintCredits` (start `HINT_REWARDS.start` = 0); tapping 💡 spends one (`spendHint`,
  a closed hint on the same board reopens free); `earnHints` via `hintReward()` in policy.ts: +1 per shared puzzle (once each,
  `rewardedShares`), +1 per invite up to 3/day. Share actions (`features/share/actions.ts`, share sheet) pay it when the share went out.
  No rewarded ads for hints anymore (archive + streak repair still use them). Home has a gold "Free hints" card with the invite button.
  Image share = react-native-share `open({ url, message })` (picture + result text with the install link), expo-sharing fallback.
  "What's new" sheet removed (Home + Settings); the changelog still drives `APP_VERSION`.
- v1.0.4 (Amir): earned hints are **confirmed by a server**: the Worker now has a script (`worker/index.js`, `main` in wrangler.jsonc,
  `run_worker_first: ["/api/*"]`, KV `INVITES` = namespace tiaro-invites, secret `IP_SALT` set via API). `POST /api/open {ref, device}`
  is sent by `noteInvitedBy` (invite `?r=` and challenge links); it counts once per (ref, device) and per (ref, salted /64 network),
  never from the owner's own networks (recorded by `GET /api/rewards?ref=`), max 5/day. Home calls `syncEarnedHints()` on mount and
  foreground (`meta.confirmedInvites` = server count already paid). Tests: `tests/app/invites.test.ts` (in-memory KV).
  KV free tier = 1,000 writes/day (~3 per counted friend): move to Workers Paid ($5/mo, ask Amir) if invites grow.
- v1.0.5: Apple silently dropped builds 12–13 (1.0.3/1.0.4: upload OK, never in ASC) — react-native-share links Photos code, so
  `NSPhotoLibraryUsageDescription` + `NSPhotoLibraryAddUsageDescription` are now in app.json (+ locales fa/ar). After every submit, check
  the build shows up in ASC (`/v1/builds?filter[app]=6821354196`); a missing build = processing rejection (Apple emails Amir).
- M8 started: store screenshots in `store/` (6 captioned shots for iOS 1290×2796 and Android 1080×1920 + Play feature graphic),
  made from the web export with seeded saves (`store/tools/`, see `store/README.md`). Re-run them after visible UI changes.
- v0.8.8 (M8): store texts in `store/listing.md` (lengths checked by `node store/tools/check-listing.mjs`) incl. answers for the
  App Store privacy label and Play Data safety. `web/privacy.html` + `web/terms.html` (served at /privacy, /terms). Settings → Help:
  Contact support (`SUPPORT_EMAIL` = espadna.support@gmail.com: one address for all Espadna apps, Amir 2026-10-07), Privacy policy, Terms, and "Ad privacy choices"
  (UMP `showPrivacyOptionsForm`, shown only when `privacyOptionsRequirementStatus` is REQUIRED).

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

- ~~App name~~ decided 2026-10-03: **Tiaro** (Amir chose it). "Crowns" is taken by two identical games on the App Store,
  "Regal" is Regal Cinemas' app. Tiaro was free on the App Store (iTunes search) and playtiaro.com / tiaro.app were unregistered.
  Reserve the name in App Store Connect as soon as the Apple account exists.
- ~~Bundle id / package~~ decided 2026-10-03: **`com.espadna.tiaro`** (Amir's brand is Espadna) for both iOS and Android.
  Permanent after the first store upload.
- Apple Developer account type (individual vs organization with D-U-N-S) and Google Play account type.
- ~~Domain~~ decided 2026-10-04: everything on Espadna's domain: game **tiaro.espadna.com** (`LINK_BASE`, app links, AASA),
  landing **espadna.com/tiaro-app/** (en, `fa/`, `ar/`). Amir dropped playtiaro.com (2026-10-04, detached from the Worker): never use it.
  Iran mirror (Amir, 2026-10-07): tiaro.espadna.ir + espadna.ir/tiaro-app, copied by espadna-site's `mirror-ir/sync.php` from the
  `files.json` manifests `scripts/build-site.mjs` writes (see `web/README.md`).
  v0.10.4: on a `.ir` host the web game starts in Persian (`deviceLanguage()` in `src/i18n/index.ts`; `?lang=` and a saved choice still win).
  App Store Connect app id **6821354196** (eas.json submit). Apple Team ID **RGR5G6VN69** (in AASA since 2026-10-10). Still open: Play/Bazaar SHA-256 in assetlinks.json.
- "queens" store keyword: Amir left the timing to us. Plan: leave it out of v1.0 (trademark rejections), try it in an update.
- Cafe Bazaar: Amir wants the full version (Persian default, Adivery ads, Bazaar billing at 99,000 toman for remove_ads).
  RSA key received 2026-10-08 (`BAZAAR_RSA_KEY` in constants/monetization.ts); Poolakey billing not built yet (Amir sent the key "for info").
- ~~Remove-Ads price~~ decided 2026-09-29: $3.99 one-time (Amir confirmed).

@AGENTS.md
