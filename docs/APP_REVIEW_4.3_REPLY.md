Hello, and thank you for the review. This puzzle type has many apps, but Tiaro is my own original work, not a copy or a template, so I am replying instead of resubmitting.

1. What it does
Tiaro is a daily logic puzzle: place one crown in every row, column and coloured region, with no two crowns touching. This is a classic pencil-and-paper puzzle type; Tiaro is my own implementation of it, with my own engine:
- A generator makes each puzzle, and a solver that reasons like a person accepts it only if it has exactly one solution and can be solved without guessing.
- Difficulty is graded by the reasoning a puzzle needs, not only by its size.
- When the player is stuck, a hint teaches in three steps: where to look, why (the rule, in plain words in the player's language), then the move.

There is a daily puzzle with a streak, unlimited puzzles at four difficulties, an archive, an animated tutorial, stats, challenge links and a friends league.

2. Users
Adults and older teens who like a 3-to-10-minute daily brain workout. It is also made for players who are usually left out:
- Persian and Arabic speakers (full right-to-left interface and hints, the Persian solar calendar)
- colour-blind players (a pattern for every region)
- VoiceOver users (every cell is read aloud and crowns can be placed by voice)

3. What is different
Before building Tiaro I read the public reviews of popular apps of this type. Each frequent complaint shaped a decision:
- Ads after every game, and subscriptions to remove them: the App Store version has no ads and no purchases.
- Puzzles that need guessing, and hints that do not explain: every puzzle is solvable by logic alone, and the hints explain why.
- Small cells: pinch zoom, drag to mark, undo and no lives.
- English only: Tiaro is fully translated into Persian and Arabic.

4. Testing
I am an individual developer and tested it myself on my iPhone, in the web version and on Android, over many TestFlight builds. That testing led to these fixes:
- an Android crash on launch
- right-to-left text alignment in Persian and Arabic
- hard puzzles on a new player's first day (now a first-week ramp)
- a home screen that scrolled
- share pictures that were cut off

5. Standalone or suite
Standalone. This is my personal developer account; Espadna is my brand name. My only published app is Dorehami: Pantomime & Heads Up, a charades and word-guessing game. I built my other games over the past weeks, one at a time, each with its own code, rules and art, and submitted the finished ones close together. That is why Tiaro, Adadi, Mafia God and Shah Dozd Vazir reached review at the same time. I will space out future submissions. Tiaro is the only one with this logic puzzle and teaching hints.

6. Could it be part of another app?
No. The nearest is Adadi, an arithmetic crossword with number tiles and age groups. Tiaro is a logic puzzle with no numbers, its own engine, its own controls and its own audience. Players search for them separately.

7. Code shared with my other apps
None. Tiaro is its own Expo / React Native codebase in TypeScript, while my other apps use Flutter or a web app in Capacitor. The engine, 1,096 verified daily puzzles, screens and art were written for Tiaro. Only the open-source font Vazirmatn and my brand name are in common.

8. Third-party code
Only standard frameworks: Expo / React Native with standard Expo and community modules. No template or app-generation service was used. The puzzles, hints, texts and art are my own.

9. Client or third party
No. I am an individual developer, and the idea, content and branding are mine. Nothing was supplied by a client, partner or template provider.

Thank you for taking another look. I am happy to send a short video of the app in use.
