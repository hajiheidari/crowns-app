# Link landing page

Static site for share, challenge and invite links (`https://<domain>/c/<code>`, `https://<domain>/?r=<ref>`).
No server code: the challenge code carries everything (see `encodeChallenge` in `src/engine/share.ts`).

playtiaro.com is a Cloudflare Worker (`wrangler.jsonc`): `wrangler deploy` runs `scripts/build-site.mjs`, which puts the
web game (Expo export, `EXPO_PUBLIC_SITE=1`: no ads, no purchases) at `/` and copies this folder next to it. This
`index.html` is served as `/app`; challenge (`/c/<code>`) and invite links are handled by the game itself (SPA fallback).
`.well-known/apple-app-site-association` must be served as `application/json` without a redirect.

Before it goes live (needs Amir):
1. ~~Domain~~ done: `playtiaro.com` (registered on Cloudflare). app.json has `associatedDomains` and Android `intentFilters`
   (`/c/…` and `/`). Hosting: Cloudflare Workers Builds, production branch = our work branch, deploy command `npx wrangler deploy`.
2. `APPLE_TEAM_ID` in `apple-app-site-association` (Apple Developer account → Membership).
3. `PLAY_APP_SIGNING_SHA256` in `assetlinks.json` (Play Console → App integrity → App signing key certificate).
4. Real store links and `apple-itunes-app` id in `index.html` after the first release.
5. A `/privacy` page (privacy policy) — needed for the stores anyway.
