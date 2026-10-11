/**
 * Pushes this week's brain score to the iPhone home-screen widget (src/widgets/brain-widget.tsx). Cheap: called from
 * Home whenever the numbers change. Texts are translated here because the widget runtime has no i18n.
 */
import { isRTL, localDigits, S } from '@/strings';
import BrainWidget from '@/widgets/brain-widget';

let last = '';

export function syncWidget(d: { score: number; level: string; change: string; streak: number; solvedToday: boolean; days: number[] }): void {
  const props = {
    title: `🧠 ${S.brainTitleShort}`,
    score: localDigits(String(d.score)),
    level: d.level,
    change: d.change,
    streak: localDigits(String(d.streak)),
    today: d.solvedToday ? S.widgetTodayDone : S.widgetTodayWaiting,
    days: d.days,
    rtl: isRTL(),
  };
  const key = JSON.stringify(props);
  if (key === last) return;
  last = key;
  try {
    BrainWidget.updateSnapshot(props);
  } catch {
    // No widget support on this device/build: nothing to update.
  }
}
