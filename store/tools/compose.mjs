import { chromium } from 'playwright'; import fs from 'fs'; import path from 'path';
const [dir] = process.argv.slice(2); const F = path.join(dir, 'fonts'); const out = path.join(dir, 'final'); fs.mkdirSync(out, { recursive: true });
const b64 = (p) => fs.readFileSync(p).toString('base64');
const fonts = `@font-face{font-family:Fraunces;font-weight:700;src:url(data:font/ttf;base64,${b64(F + '/font2.ttf')})}
@font-face{font-family:Inter;font-weight:500;src:url(data:font/ttf;base64,${b64(F + '/font3.ttf')})}
@font-face{font-family:Inter;font-weight:600;src:url(data:font/ttf;base64,${b64(F + '/font4.ttf')})}`;
const slides = [
  { raw: '1-home', bg: '#FAF7F0', accent: '#C9A227', title: 'A fresh logic puzzle<br>every day', sub: 'And a weekly brain score. Free, no ads.' },
  { raw: '2-game', bg: '#E8E1F5', accent: '#7A5BB5', title: 'One crown per row,<br>column and color', sub: 'Simple rules. Deep, satisfying logic.' },
  { raw: '3-hint', bg: '#FCE9D6', accent: '#C2742F', title: 'Stuck? Get hints<br>that teach', sub: 'See why a move works, not just where.' },
  { raw: '4-stats', bg: '#FFF3C8', accent: '#B8891A', title: 'Build your<br>daily streak', sub: 'Every solve, best time and streak, tracked.' },
  { raw: '5-win', bg: '#DCEBFB', accent: '#3E73B8', title: 'Challenge<br>your friends', sub: 'Send a link and race the same puzzle.' },
  { raw: '6-dark', bg: '#1F1B16', accent: '#E0BD4A', title: 'Easy on<br>the eyes', sub: 'Dark mode and color-blind patterns.', dark: true },
  { raw: '7-cert', bg: '#EFE4C8', accent: '#B8901F', title: 'Win certificates<br>to share', sub: 'Champion of the week, the month and more.' },
];
function html(s, W, H) {
  const img = 'data:image/png;base64,' + b64(path.join(dir, 'raw', s.raw + '.png'));
  const u = W / 100; // 1 unit = 1% of width
  // Phone sized to fit the space under the caption.
  const capH = H * (H / W > 2 ? 0.215 : 0.23);
  const phoneH = H - capH - u * 4;
  const screenH = phoneH - u * 3.2; const screenW = screenH * (1290 / 2796); const phoneW = screenW + u * 3.2;
  const ink = s.dark ? '#FAF7F0' : '#1F1B16'; const sub = s.dark ? '#CFC6B8' : '#5B5248';
  return `<!doctype html><html><head><style>${fonts}
  *{margin:0;box-sizing:border-box} body{width:${W}px;height:${H}px;background:${s.bg};overflow:hidden;position:relative;font-family:Inter}
  .cap{position:absolute;top:${u * 7}px;left:${u * 7}px;right:${u * 7}px;text-align:center}
  .bar{width:${u * 9}px;height:${u * 1}px;border-radius:${u}px;background:${s.accent};margin:0 auto ${u * 3.2}px}
  h1{font-family:Fraunces;font-weight:700;font-size:${u * 8.6}px;line-height:1.08;color:${ink};letter-spacing:-0.01em}
  p{margin-top:${u * 2.6}px;font-size:${u * 3.9}px;font-weight:500;color:${sub}}
  .phone{position:absolute;left:${(W - phoneW) / 2}px;top:${capH}px;width:${phoneW}px;height:${phoneH}px;background:#0E0C0A;border-radius:${u * 9}px;padding:${u * 1.6}px;box-shadow:0 ${u * 3}px ${u * 8}px rgba(31,27,22,${s.dark ? 0.6 : 0.22})}
  .phone img{width:${screenW}px;height:${screenH}px;border-radius:${u * 7.6}px;display:block}
  </style></head><body><div class="cap"><div class="bar"></div><h1>${s.title}</h1><p>${s.sub}</p></div>
  <div class="phone"><img src="${img}"></div></body></html>`;
}
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const [tag, W, H] of [['ios-6.9', 1290, 2796], ['android', 1080, 1920]]) {
  fs.mkdirSync(path.join(out, tag), { recursive: true });
  const pg = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  for (const [i, s] of slides.entries()) { await pg.setContent(html(s, W, H)); await pg.waitForTimeout(300); await pg.screenshot({ path: path.join(out, tag, `${i + 1}-${s.raw.slice(2)}.png`) }); }
  await pg.close();
}
await b.close(); console.log('ok');
