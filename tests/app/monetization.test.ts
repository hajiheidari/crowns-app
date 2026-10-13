/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addDays, DAILY_EPOCH } from '../../src/engine';
import { archiveLocked, archiveStart, streakRepairOffer } from '../../src/features/monetization/policy';

test('archive: last 7 days free, older days locked until unlocked', () => {
  const today = addDays(DAILY_EPOCH, 40);
  assert.equal(archiveStart(today), DAILY_EPOCH);
  assert.equal(archiveLocked(addDays(today, -7), today, []), false);
  assert.equal(archiveLocked(addDays(today, -8), today, []), true);
  assert.equal(archiveLocked(addDays(today, -8), today, [addDays(today, -8)]), false);
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
