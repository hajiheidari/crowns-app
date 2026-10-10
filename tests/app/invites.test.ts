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
