/** Texts people send to friends, in the current language: spoiler-free, always with a link back to the app. */
import { encodeChallenge, formatTime } from '@/engine';
import { challengeUrl, inviteUrl } from '@/constants/links';
import { puzzleInfo, type PuzzleInfo } from '@/features/puzzles/catalog';
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

/**
 * Title on shared results. Easy and medium puzzles are left out (nothing to brag about, Amir 2026-10-08);
 * hard and expert are shown, also on a daily ("Daily #12 · Hard").
 */
const isTough = (info: PuzzleInfo | null) => info?.difficulty === 'hard' || info?.difficulty === 'expert';

export function shareTitle(id: string): string | null {
  const info = puzzleInfo(id);
  if (!info) return null;
  const tough = isTough(info);
  if (info.mode === 'unlimited') return tough ? S.unlimitedTitle(info.difficulty, info.number) : null;
  return tough && info.number >= 1 ? `${S.daily(info.number)} · ${S.difficulty[info.difficulty]}` : S.daily(info.number);
}

/** A fun first-person line that makes people want to post their result. Same result → same line (card and text match). */
export function bragLine(r: ShareResult): string {
  const pool = r.hints === 0 ? [...S.shareBragNoHints, ...S.shareBrag] : S.shareBrag;
  let h = r.seconds;
  for (const ch of r.puzzleId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return pool[h % pool.length];
}

/** Wordle-style result: title, brag line, time, hints badge, streak, challenge link. */
export function resultText(r: ShareResult, ref: string): string {
  const info = puzzleInfo(r.puzzleId);
  const title = shareTitle(r.puzzleId);
  const plainDaily = info?.mode === 'daily' && info.number >= 1 && !isTough(info);
  const lines = [
    plainDaily ? S.shareDailyHead(S.appName, info.number) : title ? S.shareHead(S.appName, title) : `${S.appName} 👑`,
    bragLine(r),
    `⏱ ${formatTime(r.seconds)} · ${S.shareHints(r.hints)}`,
  ];
  if ((r.streak ?? 0) > 1) lines.push(S.shareStreak(r.streak!));
  lines.push(S.shareBeatMe(challengeLink(r, ref)));
  return lines.join('\n');
}

export function challengeText(r: { puzzleId: string; seconds: number }, ref: string): string {
  return S.challengeMessage(shareTitle(r.puzzleId) ?? S.sharePuzzle, formatTime(r.seconds), challengeLink(r, ref));
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
