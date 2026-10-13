# Game Center (set up in App Store Connect via the API, 2026-10-13)

Game Center detail `7cc7a8f7-39e3-433d-a054-759b8d085c46`; capability GAME_CENTER on bundle id 3XFQ3YCFM3.
Ids must match `src/services/game-center.ts`.

Leaderboards (integer, best score, high first; en-US / ru / ar-SA names):
- `tiaro.week` — brain points since Monday; recurring every 7 days from 2026-10-19 00:00 UTC (Apple has no monthly recurrence).
- `tiaro.alltime` — all brain points.
- `tiaro.beststreak` — best daily streak.

Achievements (images = the PNGs here, 512×512):
`tiaro.first_solve` 10, `tiaro.streak7` 25, `tiaro.streak30` 50, `tiaro.streak100` 100, `tiaro.expert10` 50,
`tiaro.genius` 50, `tiaro.nohints25` 40 points.

When submitting a version that first uses them, add the leaderboards and achievements in the version's Game Center
section in App Store Connect (they go to review with the app).
