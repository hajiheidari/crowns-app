# Reply to App Review: Guidelines 4.3 and 4.2.6 (Tiaro)

Paste the English text below into App Store Connect → Tiaro → App Review
(Resolution Center) → Reply. Do **not** resubmit; Apple asks for a reply
when the app is not spam. Answer 5 lists Adadi, Shah Dozd Vazir and Mafia God;
add or remove apps to match what is on this developer account. Keep the
paragraph about submitting several apps together the same in every reply.
Do not add the names of other companies' games (trademark risk).

---

Hello, and thank you for the review. I understand that this puzzle type has many apps, so I want to explain what Tiaro is and why it is not a copy or a template. I am replying instead of resubmitting. My answers:

**1. What the app does and the problem it solves**

Tiaro is a daily logic puzzle. The player places crowns on a grid divided into coloured regions: one crown in every row, every column and every region, and no two crowns may touch. It is a classic pencil-and-paper logic puzzle, a type used in puzzle championships for many years, and Tiaro is my own implementation of it.

The problem it solves is that this kind of puzzle is usually either too easy or unfair: it can need guessing, or the "hint" just reveals a cell. I built my own engine:

- A generator makes every puzzle, and a solver that reasons like a person accepts it only if it has exactly one solution and can be solved by logic alone, without guessing.
- The difficulty is graded by the kind of reasoning a puzzle needs, not only by its size.
- When the player is stuck, a hint teaches in three steps: where to look, why (the rule that applies, explained in plain words in the player's language), and then it applies the move.

A new daily puzzle comes every day with a streak, plus unlimited puzzles at four difficulties and an archive of past days. An animated tutorial teaches the rules. The player also gets stats, a shareable result card that never shows the answer, challenge links (a friend plays the same puzzle against your time), a weekly friends league, a home-screen widget and a backup with a recovery code.

**2. Intended users**

Adults and older teens who enjoy a short daily brain workout, typically 3 to 10 minutes on a commute or a break. They come for one puzzle a day and a streak, and some go on to harder puzzles. Tiaro is also made for players who are often left out:

- Persian and Arabic speakers: full right-to-left interface and hints, the Persian solar calendar, local week start.
- Colour-blind players: every region can get its own pattern.
- VoiceOver users: every cell is read aloud, for example "row 3, column 4, purple region, crown", and crowns can be placed with VoiceOver.

**3. The need it addresses**

Before building Tiaro I read the public reviews of the popular apps of this puzzle type. The same complaints came up again and again, and each one shaped a decision in Tiaro:

- **Ads after every game, subscriptions to remove them.** The App Store version of Tiaro has no ads and no purchases.
- **Hard puzzles that need guessing, and hints that assume things you can't know.** Every puzzle passes the logic-only solver, and hints explain the reasoning.
- **Repeated grids and difficulty that jumps around.** Every puzzle is unique and verified, and grids grow gradually.
- **Small cells and clumsy controls.** Pinch zoom on big grids, drag to mark, undo and redo, and no lives.
- **English only, left to right only.** Tiaro is fully translated into Persian and Arabic, right to left, including the hint explanations.
- **No accessibility.** Colour-blind patterns, full VoiceOver support and large-text layouts.

New players also start gently: the daily puzzle grows from easy to hard over their first week.

**4. Beta testing and feedback applied**

I am an individual developer working alone, so I did the testing myself: I installed the TestFlight builds on my iPhone and the Android test builds on my Android phone (Persian locale), and played daily and unlimited puzzles in every language. Problems I found and fixed:

- An Android build closed right after opening on my phone. I added on-screen error reports, found the cause and fixed it.
- Persian and Arabic text started on the left in some places, so I fixed right-to-left alignment everywhere (it took two passes).
- New players were getting hard daily puzzles on day one, so the first week now ramps from easy to hard.
- The home screen scrolled on phones; it now fits on one screen.
- The back arrow sat off-centre in its circle in some languages.
- Shared pictures were cut off and ignored dark mode, so they now fit and follow the theme.
- A "What's new" pop-up was more annoying than useful, so I removed it.
- App Store Connect pointed out that the build included ad-tracking permission text although it shows no ads, so I removed it.

**5. Standalone or part of a suite**

Tiaro is a standalone game. This is my personal developer account; Espadna is the name I publish my games under. I built my apps separately, one at a time, each with its own code, rules and art. Once my developer account was ready, I submitted the ones that were finished within a short time, which is why several reached review together. I will space out future submissions. My other apps on the App Store:

- Adadi: a math crossword in which every row and column is an equation, with number tiles and age groups from 13 up.
- Shah Dozd Vazir: a hidden-role party game for 4 to 6 people around one phone.
- Mafia God: a narrator tool for the in-person Mafia party game.

Tiaro is the only one with this logic puzzle, the only one without numbers, and the only one with teaching hints.

**6. Could it be an in-app purchase or an addition to another app?**

No. The closest app, Adadi, is an arithmetic puzzle with number tiles, an age gate and age-based difficulty. Tiaro is a pure logic puzzle with no numbers, its own engine, its own controls (tap and drag to place crowns and marks) and its own audience of daily-logic-puzzle players. The two share no puzzle logic. Putting one inside the other would hide each game from the people searching for it.

**7. Code, frameworks or assets shared with my other apps**

No. Tiaro is its own Expo / React Native codebase, written in TypeScript; my other apps use different technology (Flutter, or a web app in Capacitor). Everything in it was written for Tiaro:

- the puzzle engine: generator, logic solver, difficulty grading, teaching hints in several languages, and 1,096 pre-verified daily puzzles
- the screens, the art, its Game Center module and its online services

The only things in common with my other apps are the open-source font Vazirmatn and my brand name.

**8. Codebase, SDK or content shared with a third party**

No, beyond standard frameworks: Expo / React Native with standard Expo and community modules (storage, gestures, animation, SVG, notifications, sharing). No template, white-label product or app-generation service was used. The puzzles, hints, texts and art are my own.

**9. Created for a client or third party?**

No. I am an individual developer and this is my own account; Espadna is just my brand name, not a company or a client. The idea, the content and the branding are mine. Nothing was supplied by a client, partner or template provider.

Thank you for taking another look. I am happy to provide a short video of the app in use if that helps.

---
