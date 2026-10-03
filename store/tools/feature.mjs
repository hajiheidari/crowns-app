import { chromium } from 'playwright'; import fs from 'fs'; import path from 'path';
const [dir] = process.argv.slice(2); const F = dir + '/fonts'; const b64 = (p) => fs.readFileSync(p).toString('base64');
const shot = 'data:image/png;base64,' + b64(dir + '/board-crop.png');
const crown = `<svg viewBox="0 0 64 48" width="92" height="69"><path d="M4 14 L18 28 L32 6 L46 28 L60 14 L54 40 H10 Z" fill="#E0BD4A"/><rect x="10" y="42" width="44" height="5" rx="2" fill="#E0BD4A"/></svg>`;
const html = `<!doctype html><html><head><style>
@font-face{font-family:Fraunces;font-weight:700;src:url(data:font/ttf;base64,${b64(F + '/font2.ttf')})}
@font-face{font-family:Inter;font-weight:500;src:url(data:font/ttf;base64,${b64(F + '/font3.ttf')})}
*{margin:0}body{width:1024px;height:500px;background:#1F1B16;overflow:hidden;position:relative;font-family:Inter}
.t{position:absolute;left:72px;top:118px;color:#FAF7F0}
h1{font-family:Fraunces;font-weight:700;font-size:112px;line-height:1;margin-top:14px;letter-spacing:-0.01em}
p{font-size:30px;color:#CFC6B8;margin-top:18px}
.board{position:absolute;right:64px;top:54px;width:392px;height:392px;border-radius:14px;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.5);background:url(${shot}) center/cover no-repeat;transform:rotate(-3deg)}) no-repeat;background-size:${1290 * 400 / 940}px auto;background-position:${-6 * 400 / 940 * 3}px ${-196 * 3 * 400 / 940}px}
</style></head><body><div class="t">${crown}<h1>Tiaro</h1><p>A fresh logic puzzle every day</p></div><div class="board"></div></body></html>`;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pg = await b.newPage({ viewport: { width: 1024, height: 500 } }); await pg.setContent(html); await pg.waitForTimeout(300);
await pg.screenshot({ path: dir + '/final/android/feature-graphic-1024x500.png' }); await b.close(); console.log('ok');
