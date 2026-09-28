# Crowns — Product Spec (v1.0 → v1.2)

Status: approved direction from Amir, 2026-09-27. Working name "Crowns".
Target: US first (highest ad eCPM), English UI, iOS + Android released together.

## 1. Goals and success metrics

Business goal: ad revenue (rewarded + limited interstitial + banner) and a one-time "Remove Ads" purchase.

4-week go / no-go after launch (decides whether we invest in v1.1+):

| Metric | Target | Source |
|---|---|---|
| Day-1 retention | ≥ 30–40 % | Firebase Analytics |
| Day-7 retention | ≥ 12 % | Firebase Analytics |
| Store page → install conversion | ≥ 25 % | App Store Connect / Play Console |
| Rating | ≥ 4.6 | stores |
| Organic installs/day (by week 8–12) | ≥ 50–100 | stores |

## 2. The puzzle

n×n grid (5–11), n colored regions. Place n crowns: exactly one per row, column and region; crowns never touch
(including diagonally). Every puzzle has exactly one solution and is solvable **without guessing** (engine-verified).

Difficulty (engine grade) and sizes: Easy 5–6, Medium 7–8, Hard 8–9, Expert 9–11.
Daily rhythm: Mon/Tue easy, Wed/Thu medium, Fri/Sun hard, Sat expert.

## 3. Screens

### 3.1 First launch
1. Splash → **interactive tutorial** (~60 s, skippable): a guided 5×5 puzzle teaching the 4 rules with highlighted
   cells, then the controls (tap cycle, drag to mark, undo, hint).
2. After the tutorial: iOS ATT pre-prompt screen (why we ask, friendly) → system ATT prompt → UMP consent (only where required).
3. Land on Home with the daily puzzle highlighted.

### 3.2 Home
- Header: app name + streak flame with count.
- **Today card**: "Daily #123", difficulty chip, grid size, state (Play / Continue 02:13 / Solved ✓ 1:42) and a countdown
  to the next daily. Primary button.
- **Unlimited**: four buttons Easy / Medium / Hard / Expert, each with progress ("37 solved").
- **Archive**: past dailies calendar. Last 7 days free; older days unlock with a rewarded ad (free for Remove-Ads owners).
- Secondary: Stats, Settings, "Challenge a friend", "Invite friends".
- Adaptive **banner** at the bottom (not for Remove-Ads owners).

### 3.3 Game screen
- Top bar: back, title ("Daily #123" / "Hard #42"), timer (tap to hide; setting), pause.
- Board fills the width; region colors from the palette (§8). For n ≥ 9 on small phones: pinch-to-zoom + pan (should-have).
- Bottom toolbar: Undo, Redo, Hint (badge shows free hint available), Clear (confirm dialog).
- Status line: "Crowns 4/9".
- **No lives, no fail state.** Conflicting crowns are drawn red (setting "Highlight conflicts", default on).
- Pause hides the board and stops the timer. Timer only runs while the app is in the foreground and not paused.
- Progress auto-saves on every move; any puzzle can be resumed later (also after app kill / update).
- **No ads of any kind on this screen.**

#### Controls (fixing competitor complaints)
- **Tap** cycles empty → ✕ → crown → empty. Setting "Tap order": ✕ first (default) or crown first.
- **Long-press** places/removes a crown directly.
- **Drag to mark**: start on an empty cell → paint ✕ on empty cells you pass; start on an ✕ → erase ✕ along the path.
  Never changes crowns. One drag = one undo entry. Light haptic tick per changed cell (setting).
- **Every cell can always be returned to empty** individually.
- **Auto-✕** (default on): cells ruled out by a placed crown are shown as faint ✕. Derived, not stored; turning it
  off hides them. Advanced players can turn it off.
- Unlimited undo / redo for the whole puzzle.
- Minimum touch target: board width / n; on 11×11 on a 375-pt phone this is ~31 pt → zoom helps.

### 3.4 Hints (teaching, not just revealing)
Engine: `getHint(puzzle, board)` → mistake | step | reveal | solved; `explainStep(step)` → title + body.
Three stages per hint:
1. **Look here** — highlight `step.focus` cells (always free).
2. **Why?** — show the explanation card (title + body text).
3. **Apply** — perform `place` / `eliminate` on the board (animated).
If the board contains mistakes, the hint says "Something's off" and highlights the wrong marks first (option to remove them).
Pricing: stages 2–3 are free for the **first hint of each puzzle**; further hints cost one rewarded ad
(free and unlimited for Remove-Ads owners). If a rewarded ad fails to load, give the hint anyway.
Hints used are counted and shown on the win screen and share text (honest "no hints ✨" badge).

### 3.5 Win screen
Crown animation + light haptic → time, "New best!" badge, hints used, streak update (daily) →
buttons: **Share result**, **Challenge a friend**, Next puzzle (Unlimited) / Back home (Daily), Archive.
Interstitial (Unlimited only, see §5) may show **after** the user taps "Next puzzle", never before the result is seen.

### 3.6 Stats
Daily: current streak, best streak, month calendar heatmap, solved count.
Per difficulty: solved, best time, average time, last-10 trend sparkline. Hints-free solves count.

### 3.7 Settings
Gameplay: Auto-✕, Tap order, Drag to mark, Highlight conflicts, Show timer, Haptics.
Appearance: Theme (system/light/dark), Color-blind patterns (adds subtle pattern per region).
Reminders: Daily reminder on/off + time (asked in-context after the first solved daily, not on first launch).
Purchases: Remove Ads ($3.99 one-time, price always visible), Restore purchases.
Help: How to play (re-run tutorial), What's new, Contact support (mailto), Privacy policy, Terms.
Share: Invite friends, Rate the app. Footer: version + build number.

### 3.8 What's new
Bottom sheet shown once after each update; content from `CHANGELOG.md` entries. Promise: rule changes are never silent.

### 3.9 Challenge landing
Opening a challenge link: "Sam solved this puzzle in 1:42 — can you beat it?" → Start. On finish, show both times side by side
and offer to challenge back. Code format from engine: `encodeChallenge({ puzzleId, seconds, ref })`.

## 4. Viral / growth features

| Feature | Version | Notes |
|---|---|---|
| Wordle-style share text (spoiler-free) | 1.0 | `buildShareText()`; includes daily #, time, hints badge, streak, link |
| Share **image card** (Instagram story size + square) | 1.0 | react-native-view-shot + share sheet; board silhouette without solution |
| Challenge a friend link | 1.0 | works without a server: link carries puzzle id + time |
| Web landing page for links | 1.0 | static page: universal links / Android app links, store buttons, OG preview image |
| Invite friends (share app link) | 1.0 | plain share, no reward yet |
| Milestone badges to share (7/30/100-day streak, first 11×11, no-hint expert) | 1.0 | image card |
| Review prompt at a happy moment (3rd win in a row, day ≥ 2) | 1.0 | never rewarded, OS-limited |
| **Referral rewards** (both get 3 hints + streak freeze + exclusive theme; 5 invites → 7 days ad-free) | 1.1 | needs server (Firebase) to credit the inviter and stop abuse; Android Install Referrer for attribution |
| Friends league + daily leaderboard (same puzzle, today only → fair) | 1.1 | Firebase Auth (anonymous → Apple/Google) + Firestore |
| Cloud sync across devices | 1.1 | same Firebase; v1.0 relies on iOS/Android system backups (keep Android auto-backup enabled) |

## 5. Monetization rules (hard limits)

- **Rewarded** (main revenue): extra hints, archive unlocks, streak freeze (repair a broken streak once per week).
  Reward is granted on the earned-reward event and saved immediately; if the ad fails to load, grant anyway.
- **Interstitial**: Unlimited mode only; at most 1 per 3 completed puzzles and at least 3 minutes apart;
  never in the first session or the first 3 puzzles after install; never on the daily; never mid-puzzle; always closable
  (standard formats only). Shown only after the user taps "Next".
- **Banner**: Home and Stats only. Never on the game screen.
- **Remove Ads** ($3.99 one-time, non-consumable): removes banner + interstitial, makes hints/archive free.
  Never becomes a subscription. Restore button always in Settings.
- Consent: UMP (GDPR/US state privacy) + iOS ATT before loading ads. Non-personalized ads if declined.
- Play target audience: 13+ (not "Designed for Families"). App Store age rating 4+.

## 6. Analytics events (Firebase, no personal data)

`tutorial_begin`, `tutorial_complete`, `puzzle_start{mode,difficulty,n}`, `puzzle_complete{mode,difficulty,n,seconds,hints}`,
`puzzle_abandon{mode,difficulty,progress}`, `hint_used{stage,level,via_ad}`, `rewarded_offer{placement}`,
`rewarded_complete{placement}`, `share_result{type}`, `challenge_sent`, `challenge_opened`, `invite_sent`,
`streak_milestone{days}`, `remove_ads_purchase`, `reminder_enabled`, `setting_changed{name,value}`.
Link Firebase to AdMob for ad revenue per user.

## 7. Non-functional

- Fully offline (packs bundled). Cold start < 2 s on a mid-range Android.
- 60 fps board interactions; generation never on the UI thread for large sizes (use packs).
- Accessibility: VoiceOver/TalkBack labels ("Row 3, column 4, purple region, crown"), Dynamic Type for text,
  color-blind patterns, no information by color alone for conflicts (red + icon).
- English strings in one file (i18n-ready: Spanish, Arabic next). The board must NOT mirror in RTL.
- Privacy: no sign-in in v1.0; store only local game data.

## 8. Visual direction

Calm, premium "newspaper puzzle" feel: warm off-white background (dark mode: near-black warm gray), clean sans UI,
a serif wordmark, gold crown icon, soft pastel regions. Region palette order = `REGION_COLOR_NAMES`
(purple, orange, blue, green, gray, red, yellow, teal, pink, brown, lime):

| # | name | light | dark |
|---|---|---|---|
| 0 | purple | #C9B6E4 | #6E5A9E |
| 1 | orange | #F6C28B | #A86A2E |
| 2 | blue | #A9CBEF | #3F6FA3 |
| 3 | green | #B5DDA4 | #4F8A45 |
| 4 | gray | #D3D3D3 | #6B6B6B |
| 5 | red | #F4A6A6 | #A5484C |
| 6 | yellow | #F3E49A | #A89530 |
| 7 | teal | #9FDCD3 | #2F8C80 |
| 8 | pink | #F2B8D8 | #A35486 |
| 9 | brown | #D2B49C | #7D5A40 |
| 10 | lime | #D7EC9A | #7F9A33 |

Starting point only — tune for contrast (✕ and crown must be readable on every color, both themes).
Region borders: thick lines between different regions, thin lines inside a region.

## 9. Roadmap

- **v1.0** — Crowns puzzle, everything above except items marked 1.1.
- **v1.1** — Firebase: referral rewards, friends league, daily leaderboard, cloud sync. Optional sounds.
- **v1.2** — Two new daily puzzle types: path puzzle (draw one path through every cell, numbered checkpoints in order)
  and binary sun/moon puzzle (equal count per line, no three in a row, =/× clues). Home becomes "3 daily puzzles".
- Later — Arabic + Spanish localization, widgets (today's puzzle / streak), Apple Watch streak complication.
