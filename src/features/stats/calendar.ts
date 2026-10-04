/**
 * One month of daily puzzles in the current language's calendar: Gregorian weeks start on Sunday,
 * Jalali (Persian) weeks start on Saturday. Days always map back to the Gregorian day keys puzzles use.
 */
import { dateKey } from '@/engine';
import { S } from '@/strings';
import { jalaliMonthLength, toGregorian, toJalali } from '@/utils/jalali';

export interface MonthView {
  name: string;
  year: number;
  /** Empty cells before day 1 (first column = Sunday, or Saturday in Jalali). */
  lead: number;
  days: { day: number; key: string }[];
  /** Day key of the last day before this month (to know if there is anything to go back to). */
  prevEndKey: string;
}

export function monthView(offset: number, today = new Date()): MonthView {
  if (S.calendar === 'jalali') {
    const t = toJalali(today.getFullYear(), today.getMonth() + 1, today.getDate());
    const index = t.jm - 1 + offset;
    const jy = t.jy + Math.floor(index / 12);
    const jm = (((index % 12) + 12) % 12) + 1;
    const days = Array.from({ length: jalaliMonthLength(jy, jm) }, (_, i) => {
      const g = toGregorian(jy, jm, i + 1);
      return { day: i + 1, key: dateKey(new Date(g.gy, g.gm - 1, g.gd)) };
    });
    const g1 = toGregorian(jy, jm, 1);
    const first = new Date(g1.gy, g1.gm - 1, g1.gd);
    return {
      name: S.months[jm - 1],
      year: jy,
      lead: (first.getDay() + 1) % 7,
      days,
      prevEndKey: dateKey(new Date(g1.gy, g1.gm - 1, g1.gd - 1)),
    };
  }
  const first = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return {
    name: S.months[first.getMonth()],
    year: first.getFullYear(),
    lead: first.getDay(),
    days: Array.from({ length: count }, (_, i) => ({ day: i + 1, key: dateKey(new Date(first.getFullYear(), first.getMonth(), i + 1)) })),
    prevEndKey: dateKey(new Date(first.getFullYear(), first.getMonth(), 0)),
  };
}
