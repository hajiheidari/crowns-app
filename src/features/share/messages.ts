/** Texts people send to friends, in the current language: spoiler-free, always with a link back to the app. */
import { encodeChallenge, formatTime } from '@/engine';
import { challengeUrl, inviteUrl } from '@/constants/links';
import { puzzleInfo } from '@/features/puzzles/catalog';
import { S } from '@/strings';

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
  const lines = [
    info?.mode === 'daily' && info.number >= 1
      ? S.shareDailyHead(S.appName, info.number)
      : S.shareHead(S.appName, info ? puzzleTitle(r.puzzleId) : ''),
    `⏱ ${formatTime(r.seconds)} · ${S.shareHints(r.hints)}`,
  ];
  if ((r.streak ?? 0) > 1) lines.push(S.shareStreak(r.streak!));
  lines.push(S.shareBeatMe(challengeLink(r, ref)));
  return lines.join('\n');
}

export function challengeText(r: { puzzleId: string; seconds: number }, ref: string): string {
  return S.challengeMessage(puzzleTitle(r.puzzleId), formatTime(r.seconds), challengeLink(r, ref));
}

export function inviteText(ref: string): string {
  return S.inviteMessage(inviteUrl(ref));
}

/** "Daily #12" / "Hard #42" / "Daily preview" (or the Persian equivalents). */
export function puzzleTitle(id: string): string {
  const info = puzzleInfo(id);
  if (!info) return S.appName;
  return info.mode === 'daily' ? S.daily(info.number) : S.unlimitedTitle(info.difficulty, info.number);
}
