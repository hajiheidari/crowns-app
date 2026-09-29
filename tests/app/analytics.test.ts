/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { streakMilestone, toFirebaseParams } from '../../src/features/analytics/events';

test('streak milestones', () => {
  assert.equal(streakMilestone(7), 7);
  assert.equal(streakMilestone(8), null);
  assert.equal(streakMilestone(365), 365);
});

test('params fit Firebase limits', () => {
  assert.equal(toFirebaseParams(undefined), undefined);
  assert.deepEqual(toFirebaseParams({ via_ad: true, n: 9, value: 'x'.repeat(150) }), { via_ad: 1, n: 9, value: 'x'.repeat(100) });
});
