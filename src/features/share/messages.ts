/** Texts people send to friends. English, spoiler-free, always with a link back to the app. */
import { buildShareText, encodeChallenge, formatTime } from '@/engine';
import { challengeUrl, inviteUrl } from '@/constants/links';
import { puzzleInfo } from '@/features/puzzles/catalog';
import { DIFFICULTY_LABEL, S } from '@/strings';

export interface ShareResult {
  puzzleId: string;
  seconds: number;
  hints: number;
  streak?: number;
}

export function challengeLink(r: { puzzleId: string; seconds: number }, ref: string): string {
  return challengeUrl(encodeChallenge({ puzzleId: r.puzzleId, seconds: r.seconds, ref }));
}

/** Wordle-style result: title, time, hints badge, streak, challenge link. */
export function resultText(r: ShareResult, ref: string): string {
  const info = puzzleInfo(r.puzzleId);
  const isDaily = info?.mode === 'daily' && info.number >= 1;
  return buildShareText({
    appName: S.appName,
    dailyNumber: isDaily ? info.number : undefined,
    difficultyLabel: info ? puzzleTitle(r.puzzleId) : '',
    seconds: r.seconds,
    hintsUsed: r.hints,
    streak: r.streak ?? 0,
    link: challengeLink(r, ref),
  });
}

export function challengeText(r: { puzzleId: string; seconds: number }, ref: string): string {
  return S.challengeMessage(puzzleTitle(r.puzzleId), formatTime(r.seconds), challengeLink(r, ref));
}

export function inviteText(ref: string): string {
  return S.inviteMessage(inviteUrl(ref));
}

/** "Daily #12" / "Hard #42" / "Daily preview". */
export function puzzleTitle(id: string): string {
  const info = puzzleInfo(id);
  if (!info) return S.appName;
  return info.mode === 'daily' ? S.daily(info.number) : `${DIFFICULTY_LABEL[info.difficulty]} #${info.number}`;
}
