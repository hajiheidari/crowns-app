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
 * posts POST /api/me { code, name, emoji, week, score } (week = the Saturday it started, score = brain points that
 * week) and reads GET /api/league?code=&week= → the player and their friends, with last week's winner crowned.
 * Stored: random app codes, a chosen nickname + emoji, weekly scores and salted IP hashes (no IPs, no personal data).
 * KV namespace: tiaro-invites.
 */
const CODE = /^[a-z2-9]{6}$/;
const WEEK = /^\d{4}-\d{2}-\d{2}$/;
const DAILY_CAP = 5;
const MAX_FRIENDS = 100;
const MAX_WEEK_SCORE = 5000;
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
  const { code, week } = body ?? {};
  const score = Math.round(Number(body?.score));
  if (!CODE.test(code ?? '') || !WEEK.test(week ?? '') || !(score >= 0 && score <= MAX_WEEK_SCORE)) return json({ ok: false }, 400);
  const old = (await env.INVITES.get(`p:${code}`, 'json')) ?? {};
  const next = {
    name: cleanName(body.name),
    emoji: EMOJIS.includes(body.emoji) ? body.emoji : EMOJIS[0],
    week,
    // A new week moves the finished one to `last` (for last week's crown).
    score: old.week === week ? Math.max(old.score ?? 0, score) : score,
    last: old.week && old.week !== week ? { week: old.week, score: old.score ?? 0 } : old.last,
  };
  if (JSON.stringify(next) !== JSON.stringify(old)) await env.INVITES.put(`p:${code}`, JSON.stringify(next));
  return json({ ok: true });
}

const addDaysKey = (key, days) => new Date(Date.parse(`${key}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);

async function league(env, url) {
  const code = url.searchParams.get('code') ?? '';
  const week = url.searchParams.get('week') ?? '';
  if (!CODE.test(code) || !WEEK.test(week)) return json({ players: [] }, 400);
  const friends = (await env.INVITES.get(`f:${code}`, 'json')) ?? [];
  const codes = [code, ...friends.filter((f) => f !== code)];
  const profiles = await Promise.all(codes.map((c) => env.INVITES.get(`p:${c}`, 'json')));
  const lastWeek = addDaysKey(week, -7);
  const lastScore = (p) => (!p ? 0 : p.week === lastWeek ? p.score : p.last?.week === lastWeek ? p.last.score : 0);
  const best = Math.max(0, ...profiles.map(lastScore));
  const players = codes.map((c, i) => {
    const p = profiles[i];
    return {
      // A short stable id for the list (never the code itself, which earns hints).
      id: `${i}`,
      me: c === code,
      name: p?.name ?? '',
      emoji: p?.emoji ?? EMOJIS[i % EMOJIS.length],
      score: p?.week === week ? p.score : 0,
      crown: best > 0 && lastScore(p) === best,
    };
  });
  players.sort((a, b) => b.score - a.score || Number(b.me) - Number(a.me));
  return json({ week, players });
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
      return json({ error: 'not found' }, 404);
    }
    return env.ASSETS.fetch(request);
  },
};
