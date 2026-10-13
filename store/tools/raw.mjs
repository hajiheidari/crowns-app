import { chromium } from 'playwright'; import http from 'http'; import fs from 'fs'; import path from 'path';
const [root, seedFile, out] = process.argv.slice(2); fs.mkdirSync(out, { recursive: true });
const seed = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
// VIEW=1024x1366@2 for the iPad set (default: 6.9" iPhone, 430x932@3 → 1290×2796).
const [vw, vh, vs] = (process.env.VIEW ?? '430x932@3').split(/[x@]/).map(Number);
const srv = http.createServer((q, r) => { let p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(root, 'index.html'); r.end(fs.readFileSync(p)); }).listen(8130);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
async function shot(name, scenario, url, act, scheme = 'light') {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: vs, timezoneId: 'America/New_York', locale: 'en-US', colorScheme: scheme });
  await ctx.addInitScript((s) => { if (!sessionStorage.getItem('seeded')) { localStorage.clear(); localStorage.setItem('crowns-store', JSON.stringify(s)); sessionStorage.setItem('seeded', '1'); } }, seed.scenarios[scenario]);
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.clock.setFixedTime(new Date('2026-10-22T10:15:00-04:00'));
  await pg.goto('http://localhost:8130' + url); await pg.waitForTimeout(2500);
  if (act) await act(pg);
  await pg.screenshot({ path: `${out}/${name}.png` });
  console.log(name, errs.length ? errs : 'ok'); await ctx.close();
}
const tapCell = async (pg, r, c, times) => { const box = await pg.locator(`[aria-label^="Row ${r + 1}, column ${c + 1},"]`).first().boundingBox(); for (let i = 0; i < times; i++) { await pg.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await pg.waitForTimeout(150); } };
await shot('1-home', 'home', '/');
await shot('2-game', 'game', '/play/' + seed.mid);
await shot('3-hint', 'game', '/play/' + seed.mid, async (pg) => { await pg.getByText('Hint', { exact: true }).click(); await pg.waitForTimeout(1200); });
await shot('4-stats', 'stats', '/stats');
await shot('5-win', 'win', `/play/${seed.mid}?vs=104`, async (pg) => { await tapCell(pg, seed.lastRow, seed.lastCol, 2); await pg.waitForTimeout(2000); });
await shot('6-dark', 'dark', '/play/' + seed.hard, null, 'dark');
await shot('7-cert', 'home', '/certificates');
await b.close(); srv.close();
