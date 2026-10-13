/**
 * crowns-app Worker: serves the static site (assets) and a tiny invite API for earned hints.
 *
 * A player earns a free hint when a friend opens one of their links (invite, challenge, shared result) on ANOTHER
 * device. The app sends POST /api/open { ref: link owner's code, device: opener's own code }. An open counts only if
 *   - the opener is not the link owner (ref ≠ device),
 *   - this device has not counted for this ref before,
 *   - this network (hashed IP) has not counted for this ref before and is not one the owner uses,
 *   - the owner is under the daily cap.
 * The owner's app reads GET /api/rewards?ref=<code> → { confirmed } and turns new confirmations into hints.
 *
 * Friends league: any open of a friend's link (self excluded, no other checks) makes the two codes friends. Each app
 * posts POST /api/me { code, name, emoji, weeks: [{ week, score }] }: one entry per week kind (Persian weeks start on
 * Saturday, English/Arabic on Monday; week = that first day, score = brain points since). It reads
 * GET /api/league?code=&week= → the player and friends scored for that week, with last week's winner crowned.
 * (Older apps send { week, score } instead of weeks.)
 *
 * Backup: POST /api/backup { key, code, data } keeps the latest progress snapshot under a secret 12-letter recovery key
 * (shown to the player as XXXX-XXXX-XXXX); GET /api/backup?key= returns it on a new phone, after a reinstall or on the
 * web. The key is never shared in links (unlike the code).
 * Certificates: see worker/certs.js (POST /api/cert, GET /cert/<id>).
 * Stored: random app codes, a chosen nickname + emoji, weekly scores and salted IP hashes (no IPs, no personal data).
 * KV namespace: tiaro-invites.
 */
import { certPage, issueCert } from './certs.js';

const CODE = /^[a-z2-9]{6}$/;
const WEEK = /^\d{4}-\d{2}-\d{2}$/;
const DAILY_CAP = 5;
const MAX_FRIENDS = 100;
const MAX_WEEK_SCORE = 5000;
const MAX_MONTH_SCORE = 25000;
const BACKUP_KEY = /^[a-z2-9]{12}$/;
const MAX_BACKUP_BYTES = 200_000;
/** Avatars the app offers; anything else is replaced. */
const EMOJIS = ['🦊', '🐯', '🐼', '🐸', '🦉', '🐙', '🦁', '🐨', '🐵', '🦄', '🐢', '🐬', '🐝', '🦋', '🐧', '🐻'];
const NET_TTL = 60 * 60 * 24 * 180; // forget network hashes after ~6 months

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors } });

async function netHash(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') ?? '';
  // IPv6: count the /64 as one network (one home or phone).
  const net = ip.includes(':') ? ip.split(':').slice(0, 4).join(':') : ip;
  const data = new TextEncoder().encode(`${env.IP_SALT ?? 'tiaro'}|${net}`);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
  return [...digest.slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const today = () => new Date().toISOString().slice(0, 10);

async function readTotals(env, ref) {
  return (await env.INVITES.get(`t:${ref}`, 'json')) ?? { total: 0, day: '', dayCount: 0 };
}

async function open(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, reason: 'bad' }, 400);
  }
  const { ref, device } = body ?? {};
  if (!CODE.test(ref ?? '') || !CODE.test(device ?? '')) return json({ ok: false, reason: 'bad' }, 400);
  if (ref === device) return json({ ok: false, reason: 'self' });
  // Opening a friend's link always makes you friends (league), even when it earns no hint.
  await befriend(env, ref, device);

  const net = await netHash(request, env);
  const [seenDevice, seenNet, owner, totals] = await Promise.all([
    env.INVITES.get(`d:${ref}:${device}`),
    env.INVITES.get(`n:${ref}:${net}`),
    env.INVITES.get(`s:${ref}`, 'json'),
    readTotals(env, ref),
  ]);
  if (seenDevice) return json({ ok: false, reason: 'device' });
  if (seenNet || (owner ?? []).includes(net)) return json({ ok: false, reason: 'network' });
  const day = today();
  const dayCount = totals.day === day ? totals.dayCount : 0;
  if (dayCount >= DAILY_CAP) return json({ ok: false, reason: 'cap' });

  await Promise.all([
    env.INVITES.put(`d:${ref}:${device}`, '1'),
    env.INVITES.put(`n:${ref}:${net}`, '1', { expirationTtl: NET_TTL }),
    env.INVITES.put(`t:${ref}`, JSON.stringify({ total: totals.total + 1, day, dayCount: dayCount + 1 })),
  ]);
  return json({ ok: true });
}

async function rewards(request, env, url) {
  const ref = url.searchParams.get('ref') ?? '';
  if (!CODE.test(ref)) return json({ confirmed: 0 }, 400);
  const net = await netHash(request, env);
  const [owner, totals] = await Promise.all([env.INVITES.get(`s:${ref}`, 'json'), readTotals(env, ref)]);
  const nets = owner ?? [];
  // Remember the owner's own networks (last 10), so opening their own link at home never counts.
  if (!nets.includes(net)) await env.INVITES.put(`s:${ref}`, JSON.stringify([...nets, net].slice(-10)));
  return json({ confirmed: totals.total });
}

async function befriend(env, a, b) {
  const [fa, fb] = await Promise.all([env.INVITES.get(`f:${a}`, 'json'), env.INVITES.get(`f:${b}`, 'json')]);
  const writes = [];
  if (!(fa ?? []).includes(b)) writes.push(env.INVITES.put(`f:${a}`, JSON.stringify([...(fa ?? []), b].slice(-MAX_FRIENDS))));
  if (!(fb ?? []).includes(a)) writes.push(env.INVITES.put(`f:${b}`, JSON.stringify([...(fb ?? []), a].slice(-MAX_FRIENDS))));
  await Promise.all(writes);
}

/** A nickname shown to friends: plain text, 16 characters at most, no links. */
function cleanName(name) {
  const text = String(name ?? '')
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 16);
  return /https?:|www\.|\.[a-z]{2,}\b/i.test(text) ? '' : text;
}

async function me(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false }, 400);
  }
  const code = body?.code;
  const list = Array.isArray(body?.weeks) ? body.weeks.slice(0, 4) : [{ week: body?.week, score: body?.score }];
  const entries = list.map((w) => ({ week: w?.week, score: Math.round(Number(w?.score)) }));
  const valid = entries.length > 0 && entries.every((w) => WEEK.test(w.week ?? '') && w.score >= 0 && w.score <= MAX_WEEK_SCORE);
  if (!CODE.test(code ?? '') || !valid) return json({ ok: false }, 400);
  const old = (await env.INVITES.get(`p:${code}`, 'json')) ?? {};
  // Scores per week start; the 8 most recent weeks are kept (enough for this and last week of both kinds).
  const weeks = { ...legacyWeeks(old), ...old.weeks };
  for (const w of entries) weeks[w.week] = Math.max(weeks[w.week] ?? 0, w.score);
  const kept = newest(weeks, 8);
  // Monthly league (1.1): scores per month start (Gregorian and Jalali months start on different days), 6 kept.
  const months = { ...old.months };
  const monthList = Array.isArray(body?.months) ? body.months.slice(0, 4) : [];
  for (const m of monthList) {
    const score = Math.round(Number(m?.score));
    if (WEEK.test(m?.month ?? '') && score >= 0 && score <= MAX_MONTH_SCORE) months[m.month] = Math.max(months[m.month] ?? 0, score);
  }
  const next = { name: cleanName(body.name), emoji: EMOJIS.includes(body.emoji) ? body.emoji : EMOJIS[0], weeks: kept };
  if (Object.keys(months).length) next.months = newest(months, 6);
  if (JSON.stringify(next) !== JSON.stringify(old)) await env.INVITES.put(`p:${code}`, JSON.stringify(next));
  return json({ ok: true });
}

const newest = (map, n) => Object.fromEntries(Object.entries(map).sort(([a], [b]) => (a < b ? 1 : -1)).slice(0, n));

/** Profiles saved before `weeks` existed: { week, score, last: { week, score } }. */
function legacyWeeks(p) {
  const weeks = {};
  if (p.last?.week) weeks[p.last.week] = p.last.score ?? 0;
  if (p.week) weeks[p.week] = p.score ?? 0;
  return weeks;
}

const scoreFor = (p, week) => (!p ? 0 : (p.weeks?.[week] ?? legacyWeeks(p)[week] ?? 0));

const BACKUP_TTL = 400 * 24 * 60 * 60;

async function saveBackup(request, env) {
  const text = await request.text();
  if (text.length > MAX_BACKUP_BYTES) return json({ ok: false, reason: 'too big' }, 413);
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ ok: false }, 400);
  }
  const { key, code, data } = body ?? {};
  if (!BACKUP_KEY.test(key ?? '') || !CODE.test(code ?? '') || !data || typeof data !== 'object') return json({ ok: false }, 400);
  // A backup nobody updates for 400 days is deleted (privacy policy).
  await env.INVITES.put(`b:${key}`, JSON.stringify({ code, data, at: new Date().toISOString() }), { expirationTtl: BACKUP_TTL });
  return json({ ok: true });
}

async function loadBackup(env, url) {
  const key = (url.searchParams.get('key') ?? '').toLowerCase();
  if (!BACKUP_KEY.test(key)) return json({ ok: false }, 400);
  const backup = await env.INVITES.get(`b:${key}`, 'json');
  return backup ? json({ ok: true, ...backup }) : json({ ok: false, reason: 'not found' }, 404);
}

const addDaysKey = (key, days) => new Date(Date.parse(`${key}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);

/**
 * The league table for a week (`week=<start>`, last week = 7 days before) or a month (`month=<start>&prev=<start of
 * the month before>`: the client knows its calendar). `crown` marks the top player of the period before.
 */
async function league(env, url) {
  const code = url.searchParams.get('code') ?? '';
  const week = url.searchParams.get('week') ?? '';
  const month = url.searchParams.get('month') ?? '';
  const prev = url.searchParams.get('prev') ?? '';
  const monthly = WEEK.test(month) && WEEK.test(prev);
  if (!CODE.test(code) || (!monthly && !WEEK.test(week))) return json({ players: [] }, 400);
  const friends = (await env.INVITES.get(`f:${code}`, 'json')) ?? [];
  const codes = [code, ...friends.filter((f) => f !== code)];
  const profiles = await Promise.all(codes.map((c) => env.INVITES.get(`p:${c}`, 'json')));
  const score = monthly ? (p, m) => p?.months?.[m] ?? 0 : scoreFor;
  const period = monthly ? month : week;
  const before = monthly ? prev : addDaysKey(week, -7);
  const best = Math.max(0, ...profiles.map((p) => score(p, before)));
  const players = codes.map((c, i) => {
    const p = profiles[i];
    return {
      // A short stable id for the list (never the code itself, which earns hints).
      id: `${i}`,
      me: c === code,
      name: p?.name ?? '',
      emoji: p?.emoji ?? EMOJIS[i % EMOJIS.length],
      score: score(p, period),
      crown: best > 0 && score(p, before) === best,
    };
  });
  players.sort((a, b) => b.score - a.score || Number(b.me) - Number(a.me));
  return json(monthly ? { month, players } : { week, players });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
      if (url.pathname === '/api/open' && request.method === 'POST') return open(request, env);
      if (url.pathname === '/api/rewards' && request.method === 'GET') return rewards(request, env, url);
      if (url.pathname === '/api/me' && request.method === 'POST') return me(request, env);
      if (url.pathname === '/api/league' && request.method === 'GET') return league(env, url);
      if (url.pathname === '/api/backup' && request.method === 'POST') return saveBackup(request, env);
      if (url.pathname === '/api/backup' && request.method === 'GET') return loadBackup(env, url);
      if (url.pathname === '/api/cert' && request.method === 'POST') return issueCert(request, env, json, cleanName);
      return json({ error: 'not found' }, 404);
    }
    const cert = url.pathname.match(/^\/cert\/([a-z0-9]+)\/?$/i);
    if (cert) return certPage(env, cert[1].toLowerCase());
    return env.ASSETS.fetch(request);
  },
};
