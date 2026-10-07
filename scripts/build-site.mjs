// Builds tiaro.espadna.com into dist-site/: the web game at / (Expo web export, no ads, no purchases),
// plus the static pages from web/ (/privacy, /privacy-fa, /terms, /tiaro-app/, .well-known).
// Run by `wrangler deploy` (build.command in wrangler.jsonc), so Cloudflare builds it on every push.
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const OUT = 'dist-site';
rmSync(OUT, { recursive: true, force: true });
execSync(`npx expo export --platform web --output-dir ${OUT}`, {
  stdio: 'inherit',
  // EXPO_OFFLINE: the export needs no Expo servers. EXPO_PUBLIC_SITE: see src/constants/store.ts.
  env: { ...process.env, EXPO_OFFLINE: '1', EXPO_PUBLIC_SITE: '1', CI: '1' },
});
if (!existsSync(`${OUT}/index.html`)) throw new Error('expo export made no index.html');

// The game owns / and handles /c/<code> and /?r=<ref> itself (not_found_handling in wrangler.jsonc).
const SKIP = new Set(['web/README.md']);
cpSync('web', OUT, { recursive: true, filter: (src) => !SKIP.has(src.replaceAll('\\', '/')) });

// files.json: what the Iranian mirror (espadna.ir, espadna-site/mirror-ir/sync.php) copies. One per mirrored source:
// the game (tiaro.espadna.com → tiaro.espadna.ir) and the landing page (espadna.com/tiaro-app → espadna.ir/tiaro-app).
// Every file with its sha256; written last so it lists everything.
const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
function writeManifest(dir, skipDir) {
  const files = walk(dir)
    .map((f) => relative(dir, f).split('\\').join('/'))
    .filter((f) => !['files.json', '_headers', '_redirects'].includes(f) && !(skipDir && f.startsWith(`${skipDir}/`)))
    .sort()
    .map((f) => {
      const data = readFileSync(join(dir, f));
      return { path: f, size: data.length, sha256: createHash('sha256').update(data).digest('hex') };
    });
  const version = createHash('sha256').update(files.map((f) => f.sha256).join('')).digest('hex').slice(0, 12);
  // Cloudflare does not serve _redirects as a file, so its text goes inline.
  const redirects = existsSync(join(dir, '_redirects')) ? readFileSync(join(dir, '_redirects'), 'utf8') : '';
  writeFileSync(join(dir, 'files.json'), JSON.stringify({ version, files, redirects }));
  return files.length;
}
const game = writeManifest(OUT, 'tiaro-app');
const landing = writeManifest(join(OUT, 'tiaro-app'));
console.log(`Site ready in ${OUT}/ (files.json: game ${game} files, tiaro-app ${landing} files)`);
