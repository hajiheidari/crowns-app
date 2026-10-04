// Builds playtiaro.com into dist-site/: the web game at / (Expo web export, no ads, no purchases),
// plus the static pages from web/ (/privacy, /privacy-fa, /terms, /app, .well-known).
// Run by `wrangler deploy` (build.command in wrangler.jsonc), so Cloudflare builds it on every push.
import { execSync } from 'node:child_process';
import { cpSync, existsSync, rmSync } from 'node:fs';

const OUT = 'dist-site';
rmSync(OUT, { recursive: true, force: true });
execSync(`npx expo export --platform web --output-dir ${OUT}`, {
  stdio: 'inherit',
  // EXPO_OFFLINE: the export needs no Expo servers. EXPO_PUBLIC_SITE: see src/constants/store.ts.
  env: { ...process.env, EXPO_OFFLINE: '1', EXPO_PUBLIC_SITE: '1', CI: '1' },
});
if (!existsSync(`${OUT}/index.html`)) throw new Error('expo export made no index.html');

// web/index.html (the "get the app" page) moves to /app: the game owns /.
// The game handles /c/<code> and /?r=<ref> itself (not_found_handling in wrangler.jsonc).
const SKIP = new Set(['web/README.md', 'web/_redirects', 'web/index.html']);
cpSync('web', OUT, { recursive: true, filter: (src) => !SKIP.has(src.replaceAll('\\', '/')) });
cpSync('web/index.html', `${OUT}/app.html`);
console.log(`Site ready in ${OUT}/`);
