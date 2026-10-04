// Persian (Cafe Bazaar) store screenshots: same frames as compose.mjs, Persian captions in Vazirmatn, 1080×1920.
// Usage: node compose-fa.mjs <dir> <repo>   (<dir>/raw-fa holds the Persian app screens from raw.mjs)
import { chromium } from 'playwright'; import fs from 'fs'; import path from 'path';
const [dir, repo] = process.argv.slice(2); const out = path.join(dir, 'final-fa'); fs.mkdirSync(out, { recursive: true });
const b64 = (p) => fs.readFileSync(p).toString('base64');
const font = (w, f) => `@font-face{font-family:Vazirmatn;font-weight:${w};src:url(data:font/ttf;base64,${b64(path.join(repo, 'assets/fonts', f))})}`;
const fonts = font(800, 'Vazirmatn-Bold.ttf') + font(500, 'Vazirmatn-Medium.ttf');
const slides = [
  { raw: '1-home', bg: '#FAF7F0', accent: '#C9A227', title: 'هر روز یک پازل<br>منطقی تازه', sub: 'رایگان، بدون اشتراک ماهانه' },
  { raw: '2-game', bg: '#E8E1F5', accent: '#7A5BB5', title: 'در هر ردیف، ستون<br>و رنگ یک تاج', sub: 'قانون ساده، منطق عمیق و لذت‌بخش' },
  { raw: '3-hint', bg: '#FCE9D6', accent: '#C2742F', title: 'گیر کردی؟<br>راهنمایی که یاد می‌دهد', sub: 'می‌فهمی چرا، نه فقط کجا' },
  { raw: '4-stats', bg: '#FFF3C8', accent: '#B8891A', title: 'زنجیره‌ی روزهایت<br>را بساز', sub: 'رکوردها و آمار هر بازی با تقویم شمسی' },
  { raw: '5-win', bg: '#DCEBFB', accent: '#3E73B8', title: 'دوستانت را<br>به چالش بکش', sub: 'لینک بفرست و روی همان پازل مسابقه بدهید' },
  { raw: '6-dark', bg: '#1F1B16', accent: '#E0BD4A', title: 'راحت<br>برای چشم', sub: 'حالت تیره و طرح مخصوص رنگ‌کوری', dark: true },
];
function html(s, W, H) {
  const img = 'data:image/png;base64,' + b64(path.join(dir, 'raw-fa', s.raw + '.png'));
  const u = W / 100;
  const capH = H * 0.24;
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
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
for (const [i, s] of slides.entries()) { await pg.setContent(html(s, 1080, 1920)); await pg.waitForTimeout(300); await pg.screenshot({ path: path.join(out, `${i + 1}-${s.raw.slice(2)}.png`) }); }
await b.close(); console.log('ok');
