/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addDays, DAILY_EPOCH } from '../../src/engine';
import {
  archiveLocked,
  archiveStart,
  hintReward,
  interstitialAllowed,
  streakRepairOffer,
  type AdCounters,
} from '../../src/features/monetization/policy';

const base: AdCounters = { removeAds: false, sessions: 2, wins: 10, winsSinceInterstitial: 3, lastInterstitialAt: null };
const now = 1_000_000_000;

test('interstitial: only in Unlimited, after the first session and first 3 wins', () => {
  assert.equal(interstitialAllowed(base, 'unlimited', now), true);
  assert.equal(interstitialAllowed(base, 'daily', now), false);
  assert.equal(interstitialAllowed({ ...base, sessions: 1 }, 'unlimited', now), false);
  assert.equal(interstitialAllowed({ ...base, wins: 3 }, 'unlimited', now), false);
  assert.equal(interstitialAllowed({ ...base, removeAds: true }, 'unlimited', now), false);
});

test('interstitial: at most 1 per 3 puzzles and 3 minutes apart', () => {
  assert.equal(interstitialAllowed({ ...base, winsSinceInterstitial: 2 }, 'unlimited', now), false);
  assert.equal(interstitialAllowed({ ...base, lastInterstitialAt: now - 179_000 }, 'unlimited', now), false);
  assert.equal(interstitialAllowed({ ...base, lastInterstitialAt: now - 180_000 }, 'unlimited', now), true);
});

test('hints are earned: 1 per shared puzzle (once each), 1 per invite up to 3 a day', () => {
  const s0 = { rewardedShares: [] as string[], inviteRewardKey: null as string | null, inviteRewardCount: 0 };
  const share = hintReward(s0, { kind: 'share', puzzleId: 'daily-2026-10-10' }, '2026-10-10');
  assert.equal(share.hints, 1);
  const s1 = { ...s0, ...share.patch };
  assert.equal(hintReward(s1, { kind: 'share', puzzleId: 'daily-2026-10-10' }, '2026-10-10').hints, 0);
  assert.equal(hintReward(s1, { kind: 'share', puzzleId: 'hard-0001' }, '2026-10-10').hints, 1);

  let s = s0;
  const got = [];
  for (let i = 0; i < 4; i++) {
    const r = hintReward(s, { kind: 'invite' }, '2026-10-10');
    got.push(r.hints);
    s = { ...s, ...r.patch };
  }
  assert.deepEqual(got, [1, 1, 1, 0]);
  assert.equal(hintReward(s, { kind: 'invite' }, '2026-10-11').hints, 1); // a new day
});

test('archive: last 7 days free, older days locked until unlocked', () => {
  const today = addDays(DAILY_EPOCH, 40);
  assert.equal(archiveStart(today), DAILY_EPOCH);
  assert.equal(archiveLocked(addDays(today, -7), today, false, []), false);
  assert.equal(archiveLocked(addDays(today, -8), today, false, []), true);
  assert.equal(archiveLocked(addDays(today, -8), today, false, [addDays(today, -8)]), false);
  assert.equal(archiveLocked(addDays(today, -30), today, true, []), false);
  // Before launch the archive shows 30 preview days.
  assert.equal(archiveStart(addDays(DAILY_EPOCH, -2)), addDays(DAILY_EPOCH, -32));
});

test('streak repair: one missed day, streak of 2+, once per week', () => {
  const today = '2026-11-10';
  const broken = { streak: 5, lastSolvedKey: '2026-11-08' };
  assert.equal(streakRepairOffer(broken, today, null), 5);
  assert.equal(streakRepairOffer({ streak: 5, lastSolvedKey: '2026-11-09' }, today, null), null); // still alive
  assert.equal(streakRepairOffer({ streak: 5, lastSolvedKey: '2026-11-07' }, today, null), null); // two days missed
  assert.equal(streakRepairOffer({ streak: 1, lastSolvedKey: '2026-11-08' }, today, null), null);
  assert.equal(streakRepairOffer(broken, today, '2026-11-05'), null);
  assert.equal(streakRepairOffer(broken, today, '2026-11-03'), 5);
});
