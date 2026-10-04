// Arabic App Store / Google Play screenshots: same frames as compose.mjs, Arabic captions in Vazirmatn.
// Usage: node compose-ar.mjs <dir> <repo>   (<dir>/raw-ar holds the Arabic app screens from raw.mjs)
// Writes <dir>/final-ar/ios-6.9 (1290×2796), <dir>/final-ar/android (1080×1920) and the Play feature graphic.
import { chromium } from 'playwright'; import fs from 'fs'; import path from 'path';
const [dir, repo] = process.argv.slice(2); const out = path.join(dir, 'final-ar'); fs.mkdirSync(out, { recursive: true });
const b64 = (p) => fs.readFileSync(p).toString('base64');
const font = (w, f) => `@font-face{font-family:Vazirmatn;font-weight:${w};src:url(data:font/ttf;base64,${b64(path.join(repo, 'assets/fonts', f))})}`;
const fonts = font(800, 'Vazirmatn-Bold.ttf') + font(500, 'Vazirmatn-Medium.ttf');
const slides = [
  { raw: '1-home', bg: '#FAF7F0', accent: '#C9A227', title: 'لغز منطقي جديد<br>كل يوم', sub: 'مجاني، دون اشتراك.' },
  { raw: '2-game', bg: '#E8E1F5', accent: '#7A5BB5', title: 'تاج واحد في كل صف<br>وعمود ولون', sub: 'قواعد بسيطة ومنطق ممتع.' },
  { raw: '3-hint', bg: '#FCE9D6', accent: '#C2742F', title: 'علقت؟ تلميحات<br>تعلّمك الحل', sub: 'تفهم لماذا، لا أين فقط.' },
  { raw: '4-stats', bg: '#FFF3C8', accent: '#B8891A', title: 'ابنِ سلسلتك<br>اليومية', sub: 'كل حل وأفضل وقت وسلسلة، محفوظة.' },
  { raw: '5-win', bg: '#DCEBFB', accent: '#3E73B8', title: 'تحدَّ<br>أصدقاءك', sub: 'أرسل رابطًا وتسابقا على اللغز نفسه.' },
  { raw: '6-dark', bg: '#1F1B16', accent: '#E0BD4A', title: 'مريح<br>للعينين', sub: 'وضع داكن وأنماط لعمى الألوان.', dark: true },
];
function html(s, W, H) {
  const img = 'data:image/png;base64,' + b64(path.join(dir, 'raw-ar', s.raw + '.png'));
  const u = W / 100;
  const capH = H * (H / W > 2 ? 0.215 : 0.24);
  const phoneH = H - capH - u * 4;
  const screenH = phoneH - u * 3.2; const screenW = screenH * (1290 / 2796); const phoneW = screenW + u * 3.2;
  const ink = s.dark ? '#FAF7F0' : '#1F1B16'; const sub = s.dark ? '#CFC6B8' : '#5B5248';
  return `<!doctype html><html dir="rtl"><head><style>${fonts}
  *{margin:0;box-sizing:border-box} body{width:${W}px;height:${H}px;background:${s.bg};overflow:hidden;position:relative;font-family:Vazirmatn}
  .cap{position:absolute;top:${u * 6.5}px;left:${u * 6}px;right:${u * 6}px;text-align:center}
  .bar{width:${u * 9}px;height:${u * 1}px;border-radius:${u}px;background:${s.accent};margin:0 auto ${u * 3}px}
  h1{font-weight:800;font-size:${u * 8.2}px;line-height:1.3;color:${ink}}
  p{margin-top:${u * 2.2}px;font-size:${u * 4}px;font-weight:500;color:${sub}}
  .phone{position:absolute;left:${(W - phoneW) / 2}px;top:${capH}px;width:${phoneW}px;height:${phoneH}px;background:#0E0C0A;border-radius:${u * 9}px;padding:${u * 1.6}px;box-shadow:0 ${u * 3}px ${u * 8}px rgba(31,27,22,${s.dark ? 0.6 : 0.22})}
  .phone img{width:${screenW}px;height:${screenH}px;border-radius:${u * 7.6}px;display:block}
  </style></head><body><div class="cap"><div class="bar"></div><h1>${s.title}</h1><p>${s.sub}</p></div>
  <div class="phone"><img src="${img}"></div></body></html>`;
}
// Feature graphic: the English one's board (right half) with Arabic text over the left half.
const feature = `<!doctype html><html dir="rtl"><head><style>${fonts}
*{margin:0}body{width:1024px;height:500px;overflow:hidden;position:relative;font-family:Vazirmatn;
background:url(data:image/png;base64,${b64(path.join(repo, 'store/screenshots/android/feature-graphic-1024x500.png'))}) no-repeat}
.t{box-sizing:border-box;position:absolute;left:0;top:0;width:530px;height:500px;background:#1F1B16;color:#FAF7F0;display:flex;flex-direction:column;justify-content:center;padding:0 64px}
h1{font-weight:800;font-size:110px;line-height:1.2} p{font-size:32px;color:#CFC6B8;margin-top:8px}
</style></head><body><div class="t"><svg viewBox="0 0 64 48" width="92" height="69"><path d="M4 14 L18 28 L32 6 L46 28 L60 14 L54 40 H10 Z" fill="#E0BD4A"/><rect x="10" y="42" width="44" height="5" rx="2" fill="#E0BD4A"/></svg><h1>تيارو</h1><p>لغز منطقي جديد كل يوم</p></div></body></html>`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const [tag, W, H] of [['ios-6.9', 1290, 2796], ['android', 1080, 1920]]) {
  fs.mkdirSync(path.join(out, tag), { recursive: true });
  const pg = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  for (const [i, s] of slides.entries()) { await pg.setContent(html(s, W, H)); await pg.waitForTimeout(300); await pg.screenshot({ path: path.join(out, tag, `${i + 1}-${s.raw.slice(2)}.png`) }); }
  await pg.close();
}
const pg = await b.newPage({ viewport: { width: 1024, height: 500 } }); await pg.setContent(feature); await pg.waitForTimeout(300);
await pg.screenshot({ path: path.join(out, 'android', 'feature-graphic-1024x500.png') });
await b.close(); console.log('ok');
