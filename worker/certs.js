/**
 * Certificates (1.1, Amir 2026-10-13): shareable "this certifies that…" pages.
 *
 * POST /api/cert { code, kind, period, name, lang } → { id }. Kinds:
 *   week / month: champion of the player's friends league for the week / month starting on `period` (the server checks
 *                 the player had the most points then and at least one friend scored too),
 *   streak30 / streak100 / genius: personal milestones (claimed by the app; `period` = the day reached).
 * The same (code, kind, period) always gets the same id. GET /cert/<id> shows the certificate as a web page (verify
 * link printed on the shared image) with a "play" link that carries the owner's invite code (a friend who opens the
 * game from it counts like an invite). Stored: the id, kind, period, nickname, language and the owner's invite code.
 */
const CODE = /^[a-z2-9]{6}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const CERT_ID = /^[a-z2-9]{8}$/;
export const CERT_KINDS = ['week', 'month', 'streak30', 'streak100', 'genius'];
const LANGS = ['en', 'fa', 'ar', 'ru'];
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

const scoreIn = (p, kind, period) => (!p ? 0 : kind === 'month' ? (p.months?.[period] ?? 0) : (p.weeks?.[period] ?? 0));

/** Whether `code` won its friends league for that week/month (most points, and at least one friend played). */
export async function wonLeague(env, code, kind, period) {
  const friends = (await env.INVITES.get(`f:${code}`, 'json')) ?? [];
  const codes = [code, ...friends.filter((f) => f !== code)];
  const profiles = await Promise.all(codes.map((c) => env.INVITES.get(`p:${c}`, 'json')));
  const scores = profiles.map((p) => scoreIn(p, kind, period));
  const mine = scores[0];
  const others = scores.slice(1);
  return mine > 0 && others.some((s) => s > 0) && others.every((s) => s <= mine);
}

export async function issueCert(request, env, json, cleanName) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false }, 400);
  }
  const { code, kind, period } = body ?? {};
  if (!CODE.test(code ?? '') || !CERT_KINDS.includes(kind) || !DAY.test(period ?? '')) return json({ ok: false }, 400);
  const lang = LANGS.includes(body.lang) ? body.lang : 'en';
  const name = cleanName(body.name) || '';
  const slot = `cc:${code}:${kind}:${period}`;
  const existing = await env.INVITES.get(slot);
  if ((kind === 'week' || kind === 'month') && !existing && !(await wonLeague(env, code, kind, period))) {
    return json({ ok: false, reason: 'not the winner' }, 403);
  }
  let id = existing;
  if (!id) {
    id = '';
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    for (const b of bytes) id += ALPHABET[b % ALPHABET.length];
    await env.INVITES.put(slot, id);
  }
  // The name can still be changed (the player may set a nickname after earning it).
  await env.INVITES.put(`c:${id}`, JSON.stringify({ kind, period, name, lang, code, at: new Date().toISOString().slice(0, 10) }));
  return json({ ok: true, id });
}

const T = {
  en: {
    dir: 'ltr',
    title: 'Certificate',
    heads: { week: 'Champion of the Week', month: 'Champion of the Month', streak30: '30-Day Streak', streak100: '100-Day Streak', genius: 'Genius Level' },
    certify: 'This certifies that',
    body: {
      week: (p) => `won the Tiaro Friends League for the week starting ${p}.`,
      month: (p) => `won the Tiaro Friends League for the month starting ${p}.`,
      streak30: (p) => `solved the Tiaro daily puzzle 30 days in a row (reached on ${p}).`,
      streak100: (p) => `solved the Tiaro daily puzzle 100 days in a row (reached on ${p}).`,
      genius: (p) => `reached the Genius level of the Tiaro weekly brain score (on ${p}).`,
    },
    player: 'A Tiaro player',
    no: 'Certificate no.',
    cta: 'Play Tiaro free',
  },
  fa: {
    dir: 'rtl',
    title: 'گواهی‌نامه',
    heads: { week: 'قهرمان هفته', month: 'قهرمان ماه', streak30: '۳۰ روز پیاپی', streak100: '۱۰۰ روز پیاپی', genius: 'سطح نابغه' },
    certify: 'بدین‌وسیله گواهی می‌شود',
    body: {
      week: (p) => `قهرمان لیگ دوستان تیارو در هفته‌ی آغازشده در ${p} شد.`,
      month: (p) => `قهرمان لیگ دوستان تیارو در ماه آغازشده در ${p} شد.`,
      streak30: (p) => `پازل روزانه‌ی تیارو را ۳۰ روز پشت سر هم حل کرد (${p}).`,
      streak100: (p) => `پازل روزانه‌ی تیارو را ۱۰۰ روز پشت سر هم حل کرد (${p}).`,
      genius: (p) => `به سطح «نابغه» در امتیاز ذهن هفتگی تیارو رسید (${p}).`,
    },
    player: 'یک بازیکن تیارو',
    no: 'شماره‌ی گواهی',
    cta: 'تیارو را رایگان بازی کن',
  },
  ar: {
    dir: 'rtl',
    title: 'شهادة',
    heads: { week: 'بطل الأسبوع', month: 'بطل الشهر', streak30: '30 يومًا متتاليًا', streak100: '100 يوم متتالٍ', genius: 'مستوى العبقري' },
    certify: 'نشهد بأن',
    body: {
      week: (p) => `فاز بدوري أصدقاء تيارو في الأسبوع الذي بدأ في ${p}.`,
      month: (p) => `فاز بدوري أصدقاء تيارو في الشهر الذي بدأ في ${p}.`,
      streak30: (p) => `حلّ لغز تيارو اليومي 30 يومًا متتاليًا (${p}).`,
      streak100: (p) => `حلّ لغز تيارو اليومي 100 يوم متتالٍ (${p}).`,
      genius: (p) => `بلغ مستوى العبقري في نقاط الذهن الأسبوعية في تيارو (${p}).`,
    },
    player: 'لاعب في تيارو',
    no: 'رقم الشهادة',
    cta: 'العب تيارو مجانًا',
  },
  ru: {
    dir: 'ltr',
    title: 'Сертификат',
    heads: { week: 'Чемпион недели', month: 'Чемпион месяца', streak30: '30 дней подряд', streak100: '100 дней подряд', genius: 'Уровень «Гений»' },
    certify: 'Настоящим удостоверяется, что',
    body: {
      week: (p) => `стал(а) победителем лиги друзей Tiaro за неделю, начавшуюся ${p}.`,
      month: (p) => `стал(а) победителем лиги друзей Tiaro за месяц, начавшийся ${p}.`,
      streak30: (p) => `решал(а) ежедневную головоломку Tiaro 30 дней подряд (${p}).`,
      streak100: (p) => `решал(а) ежедневную головоломку Tiaro 100 дней подряд (${p}).`,
      genius: (p) => `достиг(ла) уровня «Гений» в недельном счёте ума Tiaro (${p}).`,
    },
    player: 'Игрок Tiaro',
    no: 'Сертификат №',
    cta: 'Играть в Tiaro бесплатно',
  },
};

const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const APP_PAGE = { en: 'https://espadna.com/tiaro-app/', fa: 'https://espadna.com/tiaro-app/fa/', ar: 'https://espadna.com/tiaro-app/ar/', ru: 'https://espadna.com/tiaro-app/' };

export async function certPage(env, id) {
  const cert = CERT_ID.test(id) ? await env.INVITES.get(`c:${id}`, 'json') : null;
  if (!cert) return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  const t = T[cert.lang] ?? T.en;
  const name = cert.name || t.player;
  const head = t.heads[cert.kind];
  const text = t.body[cert.kind](cert.period);
  const html = `<!doctype html><html lang="${cert.lang}" dir="${t.dir}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(head)} · ${esc(name)} · Tiaro</title>
<meta property="og:title" content="${esc(`${head}: ${name}`)}"><meta property="og:description" content="${esc(text)}">
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#E9E4D8;font-family:Georgia,'Times New Roman',serif;padding:16px;box-sizing:border-box}
.c{position:relative;overflow:hidden;width:min(440px,100%);aspect-ratio:9/16;background:linear-gradient(160deg,#11574B,#0A3B33 55%,#06231E);color:#F7F3EA;text-align:center;box-sizing:border-box;padding:44% 9% 10%;display:flex;flex-direction:column;align-items:center;box-shadow:0 12px 40px rgba(0,0,0,.25)}
.c:before{content:'';position:absolute;left:0;top:0;width:44%;height:20%;background:linear-gradient(135deg,#F6E3A6,#D9B45A 55%,#A9802F);clip-path:polygon(0 0,100% 0,0 100%)}
.c:after{content:'';position:absolute;right:0;bottom:0;width:44%;height:21%;background:linear-gradient(135deg,#F6E3A6,#D9B45A 55%,#A9802F);clip-path:polygon(100% 0,100% 100%,0 100%)}
.f0{position:absolute;inset:2.5%;border:1px solid rgba(226,194,122,.7);pointer-events:none}
.medal{position:absolute;top:6%;right:12%;width:22%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#0B3E35 58%,#C49A45 60%,#FBEAB5 72%,#A9802F 74%);display:flex;align-items:center;justify-content:center;color:#E2C27A;font-weight:700;font-size:20px}
.w{font-size:34px;letter-spacing:.12em;font-weight:700;text-transform:uppercase}.k{color:#E2C27A;letter-spacing:.2em;font-size:12px;text-transform:uppercase;margin-top:4px}
.h{color:#E2C27A;font-size:24px;font-weight:700;margin:14px 0 10px}.p{font-family:system-ui,sans-serif;font-size:11px;letter-spacing:.2em;text-transform:uppercase;opacity:.9}
.n{color:#E2C27A;font-size:44px;font-style:italic;margin:6px 0;border-bottom:1px solid rgba(226,194,122,.8);padding:0 18px 4px}
.b{font-family:system-ui,sans-serif;font-size:14px;line-height:1.55;margin:10px 0 0}.s{margin-top:auto;font-style:italic;font-size:30px}
.f{font-family:ui-monospace,Menlo,monospace;font-size:10px;opacity:.8;margin-top:10px;position:relative;z-index:1}
a.btn{position:relative;z-index:1;display:inline-block;margin-top:14px;background:#E2C27A;color:#0A3B33;padding:10px 20px;border-radius:999px;text-decoration:none;font-family:system-ui,sans-serif;font-weight:700}
.links{position:relative;z-index:1;margin-top:8px;font-family:system-ui,sans-serif;font-size:12px}.links a{color:#E2C27A}
</style></head><body><div class="c"><div class="f0"></div><div class="medal">${esc(String(cert.period).slice(0, 4))}</div>
<div class="w">${esc(t.title)}</div><div class="k">Tiaro</div><div class="h">${esc(head)}</div>
<div class="p">${esc(t.certify)}</div><div class="n">${esc(name)}</div><div class="b">${esc(text)}</div>
<div class="s">Tiaro</div><div class="f">${esc(t.no)} ${esc(id.toUpperCase())} · ${esc(cert.at)}</div>
<a class="btn" href="/?r=${esc(cert.code ?? '')}&amp;lang=${cert.lang}">${esc(t.cta)}</a>
<div class="links"><a href="${APP_PAGE[cert.lang] ?? APP_PAGE.en}">iPhone · Android</a></div>
</div></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
