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
 * Stored: random app codes and salted IP hashes only (no IPs, no personal data). KV namespace: tiaro-invites.
 */
const CODE = /^[a-z2-9]{6}$/;
const DAILY_CAP = 5;
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
      if (url.pathname === '/api/open' && request.method === 'POST') return open(request, env);
      if (url.pathname === '/api/rewards' && request.method === 'GET') return rewards(request, env, url);
      return json({ error: 'not found' }, 404);
    }
    return env.ASSETS.fetch(request);
  },
};
