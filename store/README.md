# Store screenshots

Ready to upload:

- `screenshots-ar/` — the same set in Arabic (`ios-6.9/`, `android/` + feature graphic); texts in `listing-ar.md`.

- `screenshots/ios-6.9/` — App Store, 1290×2796 (6.9" iPhone; Apple scales these down for smaller iPhones).
- `screenshots/ipad-13/` — App Store iPad 13", 2048×2732 (`tools/compose-ipad.mjs <dir> <repo> en|ar`, from raw.mjs run at a
  1024×1366 @2x viewport).
- `screenshots/android/` — Google Play phone screenshots, 1080×1920, plus `feature-graphic-1024x500.png`.

Order: 1 daily puzzle, 2 rules, 3 hints, 4 streak/stats, 5 challenge a friend, 6 dark mode.

## Rebuilding (after UI changes)

The app runs as its web export in Chromium with saved data from `tools/seed.ts`, then each screen is framed with a caption.

```bash
W=/tmp/tiaro-store && mkdir -p $W/fonts
EXPO_OFFLINE=1 npx expo export --platform web --output-dir $W/web
npx tsx store/tools/seed.ts $W/seed.json
# Fonts: Fraunces 700 → font2.ttf, Inter 500/600 → font3.ttf/font4.ttf in $W/fonts (from Google Fonts)
cd $W && npm i playwright@1   # uses the preinstalled Chromium path in the scripts
node <repo>/store/tools/raw.mjs $W/web $W/seed.json $W/raw        # 1290×2796 app screens
node <repo>/store/tools/compose.mjs $W                             # captions + phone frame → $W/final
# Feature graphic: crop the board from raw/2-game.png to $W/board-crop.png, then
node <repo>/store/tools/feature.mjs $W
```

### Arabic set

Same steps with the app in Arabic: give every seeded save `settings.language = 'ar'`, run a copy of `raw.mjs` whose cell selector is
`[aria-label^="الصف ${r + 1}، العمود ${c + 1}،"]` and hint button `تلميح`, writing to `$W/raw-ar`; then
`node <repo>/store/tools/compose-ar.mjs $W <repo>` (writes `$W/final-ar`). Persian (Cafe Bazaar) works the same way with `compose-fa.mjs`.
