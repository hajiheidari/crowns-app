/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { sameCert, uniqueCerts, type Cert } from '../../src/features/certificates/certs';

test('a Saturday week and a Monday week of the same days are one certificate', () => {
  // 18 and 20 Mehr 1405 (Amir got both after switching week kinds).
  assert.ok(sameCert({ kind: 'genius', period: '2026-10-10' }, { kind: 'genius', period: '2026-10-12' }));
  assert.ok(sameCert({ kind: 'week', period: '2026-10-10' }, { kind: 'week', period: '2026-10-12' }));
  assert.ok(!sameCert({ kind: 'genius', period: '2026-10-10' }, { kind: 'genius', period: '2026-10-17' }));
  assert.ok(!sameCert({ kind: 'month', period: '2026-10-01' }, { kind: 'month', period: '2026-10-03' }));
  assert.ok(!sameCert({ kind: 'week', period: '2026-10-10' }, { kind: 'genius', period: '2026-10-10' }));
});

test('uniqueCerts keeps the earliest one and prefers the issued copy of the same period', () => {
  const certs: Cert[] = [
    { kind: 'genius', period: '2026-10-10', id: null },
    { kind: 'genius', period: '2026-10-12', id: 'b' },
    { kind: 'genius', period: '2026-10-10', id: 'a' },
    { kind: 'week', period: '2026-10-05', id: 'w' },
    { kind: 'genius', period: '2026-10-17', id: 'c' },
  ];
  assert.deepEqual(uniqueCerts(certs), [
    { kind: 'genius', period: '2026-10-10', id: 'a' },
    { kind: 'week', period: '2026-10-05', id: 'w' },
    { kind: 'genius', period: '2026-10-17', id: 'c' },
  ]);
});
