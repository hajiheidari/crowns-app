# Competitor research (2026-09-27)

Method: read the publicly visible user reviews of the main "Queens / Star Battle" style apps on the US/UK App Store and
Google Play, plus articles on LinkedIn Tango / Zip alternatives. Store pages only show a sample of reviews, but the same
complaints repeat across apps, which is the signal we designed for.

## Apps reviewed

| App | Store | Scale | Model |
|---|---|---|---|
| Queens Master: Sudoku Puzzle (Kwalee) | iOS 4.7★ / 14K ratings; Android 1M+ installs, 4.3★ / 17K | market leader | ads + weekly ad-free subscription |
| Queens: Logic Puzzles (brennerd) | Android 100K+, 4.8★ / 3.6K | best-rated | ads + ~$4 one-time |
| Star Battle: Logic Puzzles (brennerd) | Android 100K+, 4.7★ / 6K | | ads + one-time + packs |
| Queens: Board Puzzle Games | iOS 4.5★ / 873 | | ads + IAP → moved to subscription |
| Queenzle | iOS / Android | new | ads |
| Crowns – Star Battle / Queens Puzzle Game | iOS 3.6★ | small | heavy ads |
| Queens Game – Logic Puzzle | iOS 3.8★ | small | ads |
| Zip Game Puzzle (Kuantark) | iOS 4.9★ / 13 | new | subscription for unlimited |

## Complaints → our answer

### Ads and money (most frequent)
| Complaint (paraphrased from reviews) | Our design |
|---|---|
| "An ad after every game", "more time in ads than playing" | Interstitial max 1 per 3 puzzles, 3-min gap, never on daily |
| Ads during gameplay; ads with no close button (had to force-quit) | No ads on the game screen; standard closable formats only |
| Playable ads overheat the phone | Only after the user taps Next; frequency cap; consider blocking playable formats if AdMob allows |
| Rewarded ad crashes and the reward is lost | Reward saved on earn event; if ad fails, grant anyway |
| Hint shown before the ad finished (useless) | Hint revealed only after the reward callback |
| Ad-free became a weekly subscription; paid ad-free but ads came back | One-time Remove Ads forever; never a subscription |
| Advertised $3.99, charged $4.99; ad-free only offered in random pop-ups | Price always visible in Settings, read from the store |
| No "restore purchases"; can't transfer progress | Restore button; system backup in v1.0, cloud sync in v1.1 |
| All levels locked behind payment | Nothing locked behind payment |

### Puzzle quality
| Complaint | Our design |
|---|---|
| Hardest puzzles "require guessing", hints "assume things you can't know" | Every puzzle passes a human-logic solver; rejected otherwise |
| Same grids repeat after 50–100 levels | Pre-built unique packs (deduplicated) + unique runtime generation |
| Level 131 and still 9×9; want bigger grids | Sizes 5–11; pools ordered so grids grow |
| Inconsistent difficulty | Graded by required reasoning, not only size |
| Stuck at level 35 / 81 | No level gates; any difficulty any time |

### Controls and UI
| Complaint | Our design |
|---|---|
| Small grid, easy to misplace X or crown | Big cells, zoom for large grids, undo/redo, long-press crown |
| Can't return a cell to empty; can only clear all marks | Tap cycle includes empty; per-cell clear |
| "Let me slide my finger to mark" | Drag to mark / erase |
| Manual elimination is slow; want auto-elimination | Auto-✕ (toggle) |
| Want pencil / notes like Sudoku | Drag-✕ + auto-✕ cover this; notes mode considered for v1.1 if requested |
| No pause; can't turn off haptics | Pause button; haptics toggle |
| Rules and features not explained; unannounced rule changes | Interactive tutorial; "What's new" after every update |
| Life system too harsh; lives cut from 3 to 1 silently | No lives at all |

### Hints, stats, competition
| Request / complaint | Our design |
|---|---|
| Hints should explain the reasoning like LinkedIn's | 3-stage teaching hints with plain-English reasons |
| Average time per difficulty; beat personal best | Stats: best, average, trend per difficulty |
| Tournament compares my current time with others' best (unfair) | Leaderboards (v1.1) compare the same puzzle, same day only |
| Excessive tracking | No sign-in, minimal data, consent flows |

### From Tango / Zip alternative articles
| Wish | Our design |
|---|---|
| One puzzle a day is not enough | Daily + unlimited pools |
| Needs a LinkedIn account | No account needed |
| Works offline (plane, subway) | Fully offline |
| Hints on hard grids | Teaching hints |
| The daily ritual: one puzzle, one timer, done | Daily card, streak, share |

## Market notes
- NYT Games puts most games behind a subscription; LinkedIn gives one puzzle per type per day and needs an account →
  room for "free, unlimited, no account".
- Queens clones are crowded in search. Differentiation must be visible in the first screenshot and the subtitle:
  "Daily logic puzzles · No guessing · No subscription".

## Sources
- https://apps.apple.com/us/app/queens-board-puzzle-games/id6737204850?see-all=reviews&platform=iphone
- https://apps.apple.com/gb/app/queens-puzzle-game/id6747024378?see-all=reviews&platform=iphone
- https://apps.apple.com/us/app/queens-game-logic-puzzle/id6736374935?see-all=reviews&platform=iphone
- https://apps.apple.com/us/app/queens-master-sudoku-puzzle/id6741799909
- https://play.google.com/store/apps/details?id=com.kwalee.queenspuzzle
- https://play.google.com/store/apps/details?id=com.brennerd.grid_puzzle.queens
- https://play.google.com/store/apps/details?id=com.brennerd.grid_puzzle.star_battle
- https://play.google.com/store/apps/details?id=com.honeybadger.queens
- https://apps.apple.com/app/id6758591954
- https://flipultimate.com/blog/games-like-tango
- https://www.thewordfinder.com/blog/which-nyt-games-are-free/
