/// <reference types="node" />
/** The invite API (worker/index.js) with an in-memory KV: only real friends on other devices and networks count. */
import assert from 'node:assert/strict';
import { test } from 'node:test';

// eslint-disable-next-line import/no-relative-packages
import worker from '../../worker/index.js';

function makeEnv() {
  const kv = new Map<string, string>();
  return {
    IP_SALT: 'test',
    INVITES: {
      get: async (k: string, type?: string) => (kv.has(k) ? (type === 'json' ? JSON.parse(kv.get(k)!) : kv.get(k)) : null),
      put: async (k: string, v: string) => void kv.set(k, v),
    },
    ASSETS: { fetch: async () => new Response('asset') },
  };
}

const open = (env: object, ref: string, device: string, ip: string) =>
  worker
    .fetch(
      new Request('https://tiaro.espadna.com/api/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
        body: JSON.stringify({ ref, device }),
      }),
      env,
    )
    .then((r: Response) => r.json());

const confirmed = (env: object, ref: string, ip: string) =>
  worker
    .fetch(new Request(`https://tiaro.espadna.com/api/rewards?ref=${ref}`, { headers: { 'CF-Connecting-IP': ip } }), env)
    .then((r: Response) => r.json())
    .then((j: { confirmed: number }) => j.confirmed);

test('invite API: a friend counts once; self, repeats and the same network do not', async () => {
  const env = makeEnv();
  assert.equal(await confirmed(env, 'aaaaaa', '1.1.1.1'), 0); // the owner checks from home
  assert.deepEqual(await open(env, 'aaaaaa', 'aaaaaa', '9.9.9.9'), { ok: false, reason: 'self' });
  assert.deepEqual(await open(env, 'aaaaaa', 'bbbbbb', '1.1.1.1'), { ok: false, reason: 'network' }); // brother at home
  assert.deepEqual(await open(env, 'aaaaaa', 'bbbbbb', '2.2.2.2'), { ok: true });
  assert.deepEqual(await open(env, 'aaaaaa', 'bbbbbb', '2.2.2.2'), { ok: false, reason: 'device' }); // sent again
  assert.deepEqual(await open(env, 'aaaaaa', 'cccccc', '2.2.2.2'), { ok: false, reason: 'network' }); // new code, same phone line
  assert.deepEqual(await open(env, 'aaaaaa', 'dddddd', '3.3.3.3'), { ok: true });
  assert.equal(await confirmed(env, 'aaaaaa', '1.1.1.1'), 2);
});

test('invite API: at most 5 friends a day, bad codes rejected, other paths go to the site', async () => {
  const env = makeEnv();
  const results = [];
  for (let i = 0; i < 6; i++) results.push((await open(env, 'aaaaaa', `bbbbb${'2345678'[i]}`, `5.5.5.${i}`)).ok);
  assert.deepEqual(results, [true, true, true, true, true, false]);
  assert.equal((await open(env, 'AAAA', 'bbbbbb', '6.6.6.6')).reason, 'bad');
  const page = await worker.fetch(new Request('https://tiaro.espadna.com/'), env);
  assert.equal(await page.text(), 'asset');
});

const post = (env: object, path: string, body: object, ip = '7.7.7.7') =>
  worker
    .fetch(
      new Request(`https://tiaro.espadna.com${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
        body: JSON.stringify(body),
      }),
      env,
    )
    .then((r: Response) => r.json());
const league = (env: object, code: string, week: string) =>
  worker.fetch(new Request(`https://tiaro.espadna.com/api/league?code=${code}&week=${week}`), env).then((r: Response) => r.json());

test('league: opening a link makes friends both ways; weekly scores, nicknames and last week\'s crown', async () => {
  const env = makeEnv();
  // Same network: no hint, but they still become friends.
  await open(env, 'aaaaaa', 'bbbbbb', '1.1.1.1');
  await open(env, 'aaaaaa', 'cccccc', '1.1.1.1');
  await post(env, '/api/me', { code: 'aaaaaa', name: 'Amir', emoji: '🦊', week: '2026-10-03', score: 50 });
  await post(env, '/api/me', { code: 'bbbbbb', name: 'Sara http://spam.com', emoji: '🐯', week: '2026-10-03', score: 90 });
  // New week: last week's scores move to `last`.
  await post(env, '/api/me', { code: 'aaaaaa', name: 'Amir', emoji: '🦊', week: '2026-10-10', score: 120 });
  await post(env, '/api/me', { code: 'bbbbbb', name: 'Sara', emoji: '🐯', week: '2026-10-10', score: 30 });
  await post(env, '/api/me', { code: 'cccccc', name: '<b>Ali</b>', emoji: 'nope', week: '2026-10-10', score: 9999 }); // rejected: too high

  const a = await league(env, 'aaaaaa', '2026-10-10');
  assert.deepEqual(
    a.players.map((p: { name: string; score: number; me: boolean; crown: boolean }) => [p.name, p.score, p.me, p.crown]),
    [
      ['Amir', 120, true, false],
      ['Sara', 30, false, true], // won last week (90 > 50)
      ['', 0, false, false], // Ali never saved a valid score
    ],
  );
  // Friendship goes both ways.
  const b = await league(env, 'bbbbbb', '2026-10-10');
  assert.deepEqual(b.players.map((p: { name: string }) => p.name), ['Amir', 'Sara']);
  // Bad input is refused; names lose tags and links.
  assert.equal((await post(env, '/api/me', { code: 'XX', week: '2026-10-10', score: 1 })).ok, false);
  await post(env, '/api/me', { code: 'dddddd', name: '<i>Rez</i>', emoji: '🐼', week: '2026-10-10', score: 5 });
  await open(env, 'dddddd', 'aaaaaa', '2.2.2.2');
  const d = await league(env, 'dddddd', '2026-10-10');
  assert.equal(d.players.find((p: { me: boolean }) => p.me).name, 'iRez/i');
});

test('league: Saturday and Monday weeks side by side (friends in different languages)', async () => {
  const env = makeEnv();
  await open(env, 'aaaaaa', 'bbbbbb', '2.2.2.2');
  // A Persian player (week from Saturday 10-10) and an English one (week from Monday 10-12), both sending both kinds.
  await post(env, '/api/me', { code: 'aaaaaa', name: 'Amir', emoji: '🦊', weeks: [{ week: '2026-10-10', score: 80 }, { week: '2026-10-12', score: 50 }] });
  await post(env, '/api/me', { code: 'bbbbbb', name: 'Sam', emoji: '🐯', weeks: [{ week: '2026-10-10', score: 40 }, { week: '2026-10-12', score: 40 }] });
  const fa = await league(env, 'aaaaaa', '2026-10-10');
  assert.deepEqual(fa.players.map((p: { name: string; score: number }) => [p.name, p.score]), [['Amir', 80], ['Sam', 40]]);
  const en = await league(env, 'bbbbbb', '2026-10-12');
  assert.deepEqual(en.players.map((p: { name: string; score: number }) => [p.name, p.score]), [['Amir', 50], ['Sam', 40]]);
});

test('league: monthly table with last month\'s crown (each calendar sends its own month start)', async () => {
  const env = makeEnv();
  await open(env, 'aaaaaa', 'bbbbbb', '3.3.3.3');
  const w = [{ week: '2026-10-12', score: 1 }];
  await post(env, '/api/me', { code: 'aaaaaa', name: 'Amir', emoji: '🦊', weeks: w, months: [{ month: '2026-09-01', score: 300 }, { month: '2026-09-23', score: 200 }] });
  await post(env, '/api/me', { code: 'bbbbbb', name: 'Sam', emoji: '🐯', weeks: w, months: [{ month: '2026-09-01', score: 500 }] });
  await post(env, '/api/me', { code: 'aaaaaa', name: 'Amir', emoji: '🦊', weeks: w, months: [{ month: '2026-10-01', score: 90 }, { month: '2026-99-99', score: 1 }] });
  await post(env, '/api/me', { code: 'bbbbbb', name: 'Sam', emoji: '🐯', weeks: w, months: [{ month: '2026-10-01', score: 99999 }] }); // too high: ignored
  const m = await worker
    .fetch(new Request('https://tiaro.espadna.com/api/league?code=aaaaaa&month=2026-10-01&prev=2026-09-01'), env)
    .then((r: Response) => r.json());
  assert.equal(m.month, '2026-10-01');
  assert.deepEqual(m.players.map((p: { name: string; score: number; crown: boolean }) => [p.name, p.score, p.crown]), [
    ['Amir', 90, false],
    ['Sam', 0, true], // won September (500 > 300)
  ]);
});

test('backup: save under the secret key, load it back (any case), refuse bad keys', async () => {
  const env = makeEnv();
  const data = { daily: { streak: 9 }, meta: { hintCredits: 3 } };
  assert.equal((await post(env, '/api/backup', { key: 'abcdefghjkmn', code: 'aaaaaa', data })).ok, true);
  const res = await worker.fetch(new Request('https://tiaro.espadna.com/api/backup?key=ABCDEFGHJKMN'), env);
  const back = await res.json();
  assert.equal(back.code, 'aaaaaa');
  assert.deepEqual(back.data, data);
  assert.equal((await worker.fetch(new Request('https://tiaro.espadna.com/api/backup?key=zzzzzzzzzzzz'), env)).status, 404);
  assert.equal((await post(env, '/api/backup', { key: 'short', code: 'aaaaaa', data })).ok, false);
});

test('certificates: champions are checked by the server; ids are stable; the page shows the name', async () => {
  const env = makeEnv();
  await open(env, 'aaaaaa', 'bbbbbb', '4.4.4.4');
  await post(env, '/api/me', { code: 'aaaaaa', name: 'Amir', emoji: '🦊', weeks: [{ week: '2026-10-05', score: 300 }], months: [{ month: '2026-09-01', score: 10 }] });
  await post(env, '/api/me', { code: 'bbbbbb', name: 'Sam', emoji: '🐯', weeks: [{ week: '2026-10-05', score: 200 }], months: [{ month: '2026-09-01', score: 50 }] });
  const issue = (code: string, kind: string, period: string) => post(env, '/api/cert', { code, kind, period, name: 'Amir', lang: 'en' });
  const won = await issue('aaaaaa', 'week', '2026-10-05');
  assert.equal(won.ok, true);
  assert.match(won.id, /^[a-z2-9]{8}$/);
  assert.equal((await issue('aaaaaa', 'week', '2026-10-05')).id, won.id); // same certificate again
  assert.equal((await issue('bbbbbb', 'week', '2026-10-05')).ok, false); // Sam did not win that week
  assert.equal((await issue('aaaaaa', 'month', '2026-09-01')).ok, false); // nor Amir that month
  assert.equal((await issue('cccccc', 'week', '2026-10-05')).ok, false); // nobody else played with them
  assert.equal((await issue('aaaaaa', 'streak30', '2026-10-30')).ok, true); // personal milestones are not checked
  assert.equal((await issue('aaaaaa', 'nope', '2026-10-30')).ok, false);
  const page = await worker.fetch(new Request(`https://tiaro.espadna.com/cert/${won.id}`), env);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.ok(html.includes('Champion of the Week') && html.includes('Amir') && html.includes('2026-10-05'));
  assert.equal((await worker.fetch(new Request('https://tiaro.espadna.com/cert/zzzzzzzz'), env)).status, 404);
});
