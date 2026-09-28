/**
 * Viral loop helpers: spoiler-free result text (Wordle-style) and
 * friend-challenge codes that reproduce the exact same puzzle.
 */

export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

export interface ShareInput {
  appName: string;
  /** Daily number, omitted for non-daily puzzles. */
  dailyNumber?: number;
  difficultyLabel: string;
  seconds: number;
  hintsUsed: number;
  streak: number;
  /** Invite / challenge link (contains the referral code). */
  link: string;
}

export function buildShareText(x: ShareInput): string {
  const head = x.dailyNumber ? `${x.appName} #${x.dailyNumber} 👑` : `${x.appName} · ${x.difficultyLabel} 👑`;
  const lines = [head, `⏱ ${formatTime(x.seconds)}${x.hintsUsed === 0 ? ' · no hints ✨' : ` · ${x.hintsUsed} hint${x.hintsUsed > 1 ? 's' : ''}`}`];
  if (x.streak > 1) lines.push(`🔥 ${x.streak}-day streak`);
  lines.push(`Can you beat me? ${x.link}`);
  return lines.join('\n');
}

export interface Challenge {
  puzzleId: string; // e.g. "daily-2026-10-01" or "hard-0042"
  seconds: number; // challenger's time
  ref?: string; // challenger's referral code
}

const SAFE = /^[a-z0-9-]+$/;

/** Compact, URL-safe: "<puzzleId>.<time base36>[.<ref>]" */
export function encodeChallenge(c: Challenge): string {
  if (!SAFE.test(c.puzzleId)) throw new Error('puzzleId must be url-safe');
  const parts = [c.puzzleId, Math.floor(c.seconds).toString(36)];
  if (c.ref) parts.push(c.ref);
  return parts.join('.');
}

export function decodeChallenge(code: string): Challenge | null {
  const parts = code.trim().toLowerCase().split('.');
  if (parts.length < 2 || !SAFE.test(parts[0])) return null;
  const seconds = parseInt(parts[1], 36);
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  return { puzzleId: parts[0], seconds, ref: parts[2] && /^[a-z0-9]{4,12}$/.test(parts[2]) ? parts[2] : undefined };
}
