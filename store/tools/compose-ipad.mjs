// iPad (13") App Store screenshots, 2048×2732: the same six captions as compose.mjs / compose-ar.mjs on an iPad frame.
// Usage: node compose-ipad.mjs <dir> <repo> <en|ar>   (<dir>/raw-ipad or <dir>/raw-ipad-ar from raw.mjs at 1024×1366 @2x;
// English uses <dir>/fonts like compose.mjs). Writes <dir>/final-ipad-<lang>/.
import { chromium } from 'playwright'; import fs from 'fs'; import path from 'path';
const [dir, repo, lang = 'en'] = process.argv.slice(2);
const raw = path.join(dir, lang === 'ar' ? 'raw-ipad-ar' : 'raw-ipad'); const out = path.join(dir, `final-ipad-${lang}`);
fs.mkdirSync(out, { recursive: true });
const b64 = (p) => fs.readFileSync(p).toString('base64');
const face = (fam, w, f) => `@font-face{font-family:${fam};font-weight:${w};src:url(data:font/ttf;base64,${b64(f)})}`;
const fonts = lang === 'ar'
  ? face('Head', 800, path.join(repo, 'assets/fonts/Vazirmatn-Bold.ttf')) + face('Body', 500, path.join(repo, 'assets/fonts/Vazirmatn-Medium.ttf'))
  : face('Head', 700, path.join(dir, 'fonts/font2.ttf')) + face('Body', 500, path.join(dir, 'fonts/font3.ttf'));
const T = {
  en: [
    ['A fresh logic puzzle every day', 'And a weekly brain score. Free, no ads.'],
    ['One crown per row, column and color', 'Simple rules. Deep, satisfying logic.'],
    ['Stuck? Get hints that teach', 'See why a move works, not just where.'],
    ['Build your daily streak', 'Every solve, best time and streak, tracked.'],
    ['Challenge your friends', 'Send a link and race the same puzzle.'],
    ['Easy on the eyes', 'Dark mode and color-blind patterns.'],
  ],
  ar: [
    ['لغز منطقي جديد كل يوم', 'مجاني، دون اشتراك.'],
    ['تاج واحد في كل صف وعمود ولون', 'قواعد بسيطة ومنطق ممتع.'],
    ['علقت؟ تلميحات تعلّمك الحل', 'تفهم لماذا، لا أين فقط.'],
    ['ابنِ سلسلتك اليومية', 'كل حل وأفضل وقت وسلسلة، محفوظة.'],
    ['تحدَّ أصدقاءك', 'أرسل رابطًا وتسابقا على اللغز نفسه.'],
    ['مريح للعينين', 'وضع داكن وأنماط لعمى الألوان.'],
  ],
}[lang];
const look = [
  ['1-home', '#FAF7F0', '#C9A227'], ['2-game', '#E8E1F5', '#7A5BB5'], ['3-hint', '#FCE9D6', '#C2742F'],
  ['4-stats', '#FFF3C8', '#B8891A'], ['5-win', '#DCEBFB', '#3E73B8'], ['6-dark', '#1F1B16', '#E0BD4A'],
];
const W = 2048, H = 2732, u = W / 100;
function html(i) {
  const [rawName, bg, accent] = look[i]; const [title, sub] = T[i]; const dark = rawName === '6-dark';
  const img = 'data:image/png;base64,' + b64(path.join(raw, rawName + '.png'));
  const capH = H * 0.16; const frameH = H - capH - u * 5; const screenH = frameH - u * 4; const screenW = screenH * 0.75; const frameW = screenW + u * 4;
  return `<!doctype html><html dir="${lang === 'ar' ? 'rtl' : 'ltr'}"><head><style>${fonts}
  *{margin:0;box-sizing:border-box} body{width:${W}px;height:${H}px;background:${bg};overflow:hidden;position:relative}
  .cap{position:absolute;top:${u * 4.5}px;left:${u * 6}px;right:${u * 6}px;text-align:center}
  .bar{width:${u * 7}px;height:${u * 0.8}px;border-radius:${u}px;background:${accent};margin:0 auto ${u * 2}px}
  h1{font-family:Head;font-weight:${lang === 'ar' ? 800 : 700};font-size:${u * 5.6}px;line-height:1.2;color:${dark ? '#FAF7F0' : '#1F1B16'}}
  p{font-family:Body;margin-top:${u * 1.4}px;font-size:${u * 2.6}px;font-weight:500;color:${dark ? '#CFC6B8' : '#5B5248'}}
  .pad{position:absolute;left:${(W - frameW) / 2}px;top:${capH}px;width:${frameW}px;height:${frameH}px;background:#0E0C0A;border-radius:${u * 4.5}px;padding:${u * 2}px;box-shadow:0 ${u * 2}px ${u * 6}px rgba(31,27,22,${dark ? 0.6 : 0.22})}
  .pad img{width:${screenW}px;height:${screenH}px;border-radius:${u * 2.6}px;display:block}
  </style></head><body><div class="cap"><div class="bar"></div><h1>${title}</h1><p>${sub}</p></div><div class="pad"><img src="${img}"></div></body></html>`;
}
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pg = await b.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
for (let i = 0; i < 6; i++) { await pg.setContent(html(i)); await pg.waitForTimeout(300); await pg.screenshot({ path: path.join(out, `${look[i][0]}.png`) }); }
await b.close(); console.log('ok');
