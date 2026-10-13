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
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#EFE7D6;font-family:Georgia,'Times New Roman',serif;color:#1F1B16;padding:16px;box-sizing:border-box}
.c{max-width:760px;width:100%;background:#FFFCF4;border:3px solid #B8901F;outline:1px solid #B8901F;outline-offset:-12px;padding:44px 36px;text-align:center;box-sizing:border-box;box-shadow:0 10px 40px rgba(0,0,0,.12)}
.k{letter-spacing:.3em;text-transform:uppercase;color:#8A6D0B;font-size:14px}.h{font-size:38px;margin:10px 0 22px}
.n{font-size:34px;font-style:italic;border-bottom:1px solid #B8901F;display:inline-block;padding:0 24px 6px;margin:12px 0}
.b{font-size:18px;line-height:1.6;max-width:520px;margin:10px auto 24px}.s{font-size:44px}.f{font-size:13px;color:#6B5A3A;margin-top:18px}
a.btn{display:inline-block;margin-top:22px;background:#1F1B16;color:#FFFCF4;padding:12px 22px;border-radius:999px;text-decoration:none;font-family:system-ui,sans-serif}
</style></head><body><div class="c">
<div class="k">Tiaro · ${esc(t.title)}</div><div class="h">${esc(head)}</div>
<div>${esc(t.certify)}</div><div class="n">${esc(name)}</div><div class="b">${esc(text)}</div>
<div class="s">👑</div><div class="f">${esc(t.no)} ${esc(id.toUpperCase())} · ${esc(cert.at)}</div>
<a class="btn" href="/?r=${esc(cert.code ?? '')}&amp;lang=${cert.lang}">${esc(t.cta)}</a>
<div class="f"><a href="${APP_PAGE[cert.lang] ?? APP_PAGE.en}" style="color:#6B5A3A">iPhone · Android</a></div>
</div></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
