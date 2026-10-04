# Link landing page

Static site for share, challenge and invite links (`https://<domain>/c/<code>`, `https://<domain>/?r=<ref>`).
No server code: the challenge code carries everything (see `encodeChallenge` in `src/engine/share.ts`).

Host it on any static host that supports a rewrite (Netlify or Cloudflare Pages read `_redirects`).
`.well-known/apple-app-site-association` must be served as `application/json` without a redirect.

Before it goes live (needs Amir):
1. ~~Domain~~ done: `playtiaro.com` (registered on Cloudflare). app.json has `associatedDomains` and Android `intentFilters`
   (`/c/…` and `/`). Hosting: Cloudflare Pages, build output directory `web`, no build command (`_headers` sets the AASA type).
2. `APPLE_TEAM_ID` in `apple-app-site-association` (Apple Developer account → Membership).
3. `PLAY_APP_SIGNING_SHA256` in `assetlinks.json` (Play Console → App integrity → App signing key certificate).
4. Real store links and `apple-itunes-app` id in `index.html` after the first release.
5. A `/privacy` page (privacy policy) — needed for the stores anyway.
