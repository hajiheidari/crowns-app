# Link landing page

Static site for share, challenge and invite links (`https://<domain>/c/<code>`, `https://<domain>/?r=<ref>`).
No server code: the challenge code carries everything (see `encodeChallenge` in `src/engine/share.ts`).

Host it on any static host that supports a rewrite (Netlify or Cloudflare Pages read `_redirects`).
`.well-known/apple-app-site-association` must be served as `application/json` without a redirect.

Before it goes live (needs Amir):
1. Pick the domain. Replace `playcrowns.com` here, in `src/constants/links.ts`, and add it to `app.json`
   (`ios.associatedDomains: ["applinks:<domain>"]`, and an Android `intentFilters` entry with `autoVerify: true` for `https://<domain>/c`).
2. `APPLE_TEAM_ID` in `apple-app-site-association` (Apple Developer account → Membership).
3. `PLAY_APP_SIGNING_SHA256` in `assetlinks.json` (Play Console → App integrity → App signing key certificate).
4. Real store links and `apple-itunes-app` id in `index.html` after the first release.
5. A `/privacy` page (privacy policy) — needed for the stores anyway.
