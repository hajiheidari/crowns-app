# Store listing — Tiaro (v1.0)

English (US). Lengths are checked by `store/tools/check-listing.mjs`; limits in brackets.
Never use other companies' brand names here (LinkedIn, NYT, Queens, Zip, Tango): Apple and Google reject them.
Plan for "queens" (Amir left the timing to us): not in v1.0; try it as an iOS keyword in a later update and keep it only if the update is approved.

## Both stores

- **App name** [30]: Tiaro: Daily Logic Puzzle
- **Category:** Games → Puzzle (App Store secondary: Board). Google Play: Game → Puzzle.
- **Price:** Free. **v1.0 (App Store) has no ads and no in-app purchase** (Amir 2026-10-10: ship before AdMob is approved).
  Later update: ads + one in-app purchase "Remove Ads" $3.99 (non-consumable, id `remove_ads`).
- **Contains ads:** v1.0: No. (Switch to Yes in the update that adds ads.)
- **Support URL:** https://espadna.com/tiaro-app/ · **Privacy policy:** https://tiaro.espadna.com/privacy
- **Marketing URL (optional):** https://espadna.com/tiaro-app/

## App Store (iOS)

**Subtitle** [30]
One crown. Every row. Daily.

**Promotional text** [170] (can be changed any time without a new build)
A fresh logic puzzle every day. Place one crown in each row, column and color. No guessing, no timers you can't hide, no subscription.

**Keywords** [100] (comma-separated, no spaces after commas; the name and subtitle words already count, so they are not repeated)
logic,brain,star battle,grid,sudoku,nonogram,teaser,mind,crowns,game,games,iq,riddle,calm,offline

**Description** [4000]
(same text as the Google Play full description below)

**Age rating:** 4+ (no objectionable content; the questionnaire answers are all "None"). Ads are shown.
**iPhone and iPad** (Amir 2026-10-10). iPad screenshots (13", 2048×2732): `store/screenshots/ipad-13/` (Arabic: `store/screenshots-ar/ipad-13/`).
The app is portrait-only, so the iPad build runs full screen (`ios.requireFullScreen`, no Split View).

## Google Play

**Short description** [80]
A fresh crown logic puzzle every day. Free, offline, no subscription.

**Full description** [4000]

Tiaro is a calm, clever logic puzzle you can play in a few minutes a day.

THE RULES FIT IN ONE LINE
Place one crown in every row, every column and every color region. Crowns never touch, not even diagonally. That's it.

A NEW PUZZLE EVERY DAY
Everyone gets the same daily puzzle. Keep your streak alive, then compare times with friends.

NEVER GUESS
Every puzzle has exactly one solution and can be solved by pure logic. If you get stuck, Tiaro's hints teach you the next step: first where to look, then why it works.

PLAY AS MUCH AS YOU LIKE
Unlimited puzzles in four levels, from relaxing 5×5 boards to tough 11×11 grids.

MADE FOR YOU
• Tap to mark, drag to fill, long-press for a crown
• Undo, redo and automatic ✕ marks
• Pinch to zoom on big boards
• Dark mode and color-blind patterns
• Screen reader support
• Works offline
• In English, Arabic and Persian

CHALLENGE YOUR FRIENDS
Share your result without spoilers, or send a challenge link so a friend can race you on the same puzzle.

FREE, NO SUBSCRIPTION
Tiaro is free to play, with no subscription. Ever.

**Content rating:** questionnaire → Everyone / PEGI 3 (no violence etc.). **Target audience:** 13+ (not "Designed for Families").
**Ads declaration:** Yes, contains ads.

## Privacy forms (what to answer)

### v1.0 ad-free build (no AdMob, no Firebase, no RevenueCat)
From 1.0.4 (earned hints, Amir 2026-10-11) the app sends random codes to our invite API (worker/index.js), so:
App Store "App Privacy": Data Collected → **Identifiers → User ID** (the random app code; Apple counts any app-generated
ID): used for **App Functionality** only, **not linked** to the user's identity, **not used for tracking**. Tracking: **No.**
Google Play Data safety: Collected → **Device or other IDs** (random app code), purpose **App functionality**, not shared,
encrypted in transit, processed ephemerally: No; users can't request deletion via account (no account): point to the policy.
Everything else stays on the device. Use the answers below once ads/analytics are added in an update.

### App Store "App Privacy" (nutrition label)
Data used to track you: **Device ID** (advertising ID, only with permission) — Third-party advertising.
Data linked to you: **None.**
Data not linked to you:
- **Identifiers → Device ID** — Third-party advertising, Analytics
- **Usage data → Product interaction, Advertising data** — Third-party advertising, Analytics
- **Diagnostics → Other diagnostic data** — Analytics (Firebase)
- **Location → Coarse location** — Third-party advertising (AdMob, from IP)
- **Purchases → Purchase history** — App functionality (Remove Ads restore)

### Google Play "Data safety"
- Data is **encrypted in transit**: Yes. Users can request deletion: No account exists; point to the privacy policy.
- Collected (not shared for other purposes, processed by Google/RevenueCat as service providers; AdMob counts as "shared"):
  - **Device or other IDs** — Advertising or marketing, Analytics (shared with AdMob)
  - **App interactions** — Analytics
  - **Approximate location** — Advertising (AdMob)
  - **Purchase history** — App functionality
  - **Diagnostics** — Analytics
- Not collected: name, email, contacts, precise location, photos, messages, financial info (payments stay with Google).

Check these against the current AdMob and Firebase "data disclosure" pages before submitting; Google updates them.
