/** Texts people send to friends, in the current language: spoiler-free, always with one link back to the app (it carries the sender's code for earned hints). */
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

/** A fun first-person line that makes people want to post their result. Same result → same line (card and text match). */
export function bragLine(r: ShareResult): string {
  const pool = r.hints === 0 ? [...S.shareBragNoHints, ...S.shareBrag] : S.shareBrag;
  let h = r.seconds;
  for (const ch of r.puzzleId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return pool[h % pool.length];
}

/**
 * Wordle-style result: app name, brag line, time, hints badge, streak, challenge link. Shared texts and pictures never
 * name the puzzle's level or number (Amir 2026-10-11): just "a Tiaro puzzle".
 */
export function resultText(r: ShareResult, ref: string): string {
  const lines = [
    `${S.appName} 👑`,
    bragLine(r),
    `⏱ ${formatTime(r.seconds)} · ${S.shareHints(r.hints)}`,
  ];
  if ((r.streak ?? 0) > 1) lines.push(S.shareStreak(r.streak!));
  lines.push(S.shareBeatMe(challengeLink(r, ref)));
  return lines.join('\n');
}

export function challengeText(r: { puzzleId: string; seconds: number }, ref: string): string {
  return S.challengeMessage(formatTime(r.seconds), challengeLink(r, ref));
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
