import assert from 'node:assert/strict';
import { test } from 'node:test';

import { jalaliFromKey, jalaliMonthLength, toGregorian, toJalali } from '../../src/utils/jalali';

test('Nowruz and known dates', () => {
  assert.deepEqual(toJalali(2026, 3, 21), { jy: 1405, jm: 1, jd: 1 });
  assert.deepEqual(toJalali(2025, 3, 21), { jy: 1404, jm: 1, jd: 1 });
  assert.deepEqual(toJalali(2026, 10, 4), { jy: 1405, jm: 7, jd: 12 });
  assert.deepEqual(jalaliFromKey('2026-03-20'), { jy: 1404, jm: 12, jd: 29 });
  assert.deepEqual(toGregorian(1405, 7, 12), { gy: 2026, gm: 10, gd: 4 });
});

test('round trip over several years, month lengths add up', () => {
  for (let t = Date.UTC(2024, 0, 1); t < Date.UTC(2030, 0, 1); t += 86400000) {
    const d = new Date(t);
    const j = toJalali(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    assert.ok(j.jd >= 1 && j.jd <= jalaliMonthLength(j.jy, j.jm));
    assert.deepEqual(toGregorian(j.jy, j.jm, j.jd), { gy: d.getUTCFullYear(), gm: d.getUTCMonth() + 1, gd: d.getUTCDate() });
  }
  // 1403 is a leap year (Esfand has 30 days), 1404 is not.
  assert.equal(jalaliMonthLength(1403, 12), 30);
  assert.equal(jalaliMonthLength(1404, 12), 29);
});
