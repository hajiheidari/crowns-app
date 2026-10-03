# Store screenshots

Ready to upload:

- `screenshots/ios-6.9/` — App Store, 1290×2796 (6.9" iPhone; Apple scales these down for smaller iPhones).
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
