# Release checklist (iOS + Android together)

Items marked 👤 need Amir (accounts, payments, legal). Claude Code prepares everything else.

## Accounts (start early — some take days)
- 👤 Apple Developer Program ($99/year). Organization accounts need a D-U-N-S number (free, ~1–2 weeks).
- 👤 Google Play Console ($25 one-time). Personal accounts must run a **closed test with 12+ testers for 14 days**
  before production access → start the closed test as soon as the first build exists. Organization accounts skip this.
- 👤 Expo account (free) → `npx eas-cli@latest login`, `eas init`.
- 👤 AdMob account (UAE payout details) → create iOS + Android apps and ad units: banner, interstitial, rewarded.
  Add `app-ads.txt` on the website domain.
- 👤 Firebase project (free) → download `GoogleService-Info.plist` + `google-services.json`; link to AdMob.
- 👤 RevenueCat (free tier) or skip if using expo-iap. Create the non-consumable product `remove_ads` in both stores.
- 👤 Domain for links + privacy policy + app-ads.txt (e.g. playcrowns.com).

## Build
- `app.json`: final name, bundle id / package, version, `ios.infoPlist.NSUserTrackingUsageDescription`,
  AdMob app IDs in the plugin config, `SKAdNetworkItems` (from AdMob docs), associated domains / intent filters.
- `eas.json`: `development` (dev client), `preview` (internal APK / TestFlight), `production` (store) with `autoIncrement`.
- `eas build -p all --profile production` → `eas submit -p ios` / `eas submit -p android`.

## Store listing
- Name (30 chars), subtitle (iOS 30) / short description (Android 80), long description, keywords (iOS 100 chars).
- Screenshots: iPhone 6.9" and 6.5", iPad if supported (or set iPhone-only), Android phone. First screenshot = the promise
  ("Daily logic puzzles · No guessing · No subscription").
- Icon 1024×1024, Android feature graphic 1024×500.
- Privacy: App Store privacy "nutrition label" (AdMob + Firebase data types), Play Data safety form. 👤 review and submit.
- Content rating questionnaires (both stores). Play target audience 13+.
- Support URL + privacy policy URL.

## Pre-launch QA
- Fresh install on a small iPhone and a low-end Android; 11×11 playable; dark mode; VoiceOver/TalkBack pass.
- Kill app mid-puzzle → resume works. Update from previous build keeps progress.
- Airplane mode: everything except ads works.
- Ads: test IDs in dev/preview, real IDs only in production. Consent flows in EEA (use UMP debug geography).
- Purchases: buy, restore, reinstall, second device.
- Set `DAILY_EPOCH` = launch date, rebuild packs, verify daily #1 shows on launch day.
