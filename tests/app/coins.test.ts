/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { adAllowed, adReward, COINS, loginReward, winReward, type CoinDay } from '../../src/features/coins/policy';

test('daily login: 10 coins, growing to 30 on the 7th day in a row; a missed day starts over', () => {
  assert.deepEqual(loginReward(null, 0, '2026-10-13'), { coins: 10, streak: 1 });
  assert.equal(loginReward('2026-10-13', 1, '2026-10-13'), null); // paid once a day
  assert.deepEqual(loginReward('2026-10-13', 1, '2026-10-14'), { coins: 13, streak: 2 });
  assert.deepEqual(loginReward('2026-10-19', 6, '2026-10-20'), { coins: 30, streak: 7 });
  assert.deepEqual(loginReward('2026-10-20', 12, '2026-10-21'), { coins: 30, streak: 13 });
  assert.deepEqual(loginReward('2026-10-19', 6, '2026-10-21'), { coins: 10, streak: 1 });
});

test('wins: daily 10, hard 5, expert 10, easy/medium 0, at most 50 a day', () => {
  let day: CoinDay | null = null;
  let total = 0;
  const win = (d: 'easy' | 'medium' | 'hard' | 'expert', daily = false) => {
    const r = winReward(d, daily, day, '2026-10-13');
    day = r.next;
    total += r.coins;
    return r.coins;
  };
  assert.equal(win('medium', true), 10);
  assert.equal(win('easy'), 0);
  assert.equal(win('hard'), 5);
  for (let i = 0; i < 10; i++) win('expert');
  assert.equal(total, COINS.winCapPerDay);
  assert.equal(winReward('expert', false, day, '2026-10-14').coins, 10); // new day, new cap
});

test('rewarded ads: 20 coins, 5 a day', () => {
  let day: CoinDay | null = null;
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const r = adReward(day, '2026-10-13');
    day = r.next;
    total += r.coins;
  }
  assert.equal(total, 100);
  assert.equal(adAllowed(day, '2026-10-13'), false);
  assert.equal(adAllowed(day, '2026-10-14'), true);
});
