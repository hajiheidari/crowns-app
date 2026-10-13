/**
 * Earned hints, confirmed by the site's invite API (worker/index.js): a hint is paid only when a friend opens one of
 * this player's links on another device. Network errors are ignored: the next launch tries again.
 */
import { LINK_BASE } from '@/constants/links';

const API = `${LINK_BASE}/api`;

/** This device opened a link from `ref` (invite, challenge or shared result). */
export async function reportOpen(ref: string, device: string): Promise<void> {
  if (ref === device) return;
  try {
    await fetch(`${API}/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref, device }),
    });
  } catch {
    // Offline: this open is not counted.
  }
}

/** How many friends have opened this player's links so far (null when offline). */
export async function confirmedInvites(ref: string): Promise<number | null> {
  try {
    const res = await fetch(`${API}/rewards?ref=${encodeURIComponent(ref)}`);
    if (!res.ok) return null;
    const { confirmed } = (await res.json()) as { confirmed?: number };
    return typeof confirmed === 'number' ? confirmed : null;
  } catch {
    return null;
  }
}

export interface LeaguePlayer {
  id: string;
  me: boolean;
  /** Empty when the player has not picked a nickname yet. */
  name: string;
  emoji: string;
  score: number;
  /** Won the period before (last week / last month) among this group. */
  crown: boolean;
}

/** Save this player's nickname, avatar and score for the week (shown to friends). */
export async function postMe(me: {
  code: string;
  name: string;
  emoji: string;
  weeks: { week: string; score: number }[];
  months: { month: string; score: number }[];
}): Promise<boolean> {
  try {
    const res = await fetch(`${API}/me`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(me) });
    return res.ok;
  } catch {
    return false;
  }
}

/** Which table: a week (by its start) or a month (its start and the start of the month before, for the crown). */
export type LeaguePeriod = { week: string } | { month: string; prev: string };

/** This player and their friends for a week or month, best first (null when offline). */
export async function fetchLeague(code: string, period: LeaguePeriod): Promise<LeaguePlayer[] | null> {
  const query = 'week' in period ? `week=${period.week}` : `month=${period.month}&prev=${period.prev}`;
  try {
    const res = await fetch(`${API}/league?code=${encodeURIComponent(code)}&${query}`);
    if (!res.ok) return null;
    const { players } = (await res.json()) as { players?: LeaguePlayer[] };
    return Array.isArray(players) ? players : null;
  } catch {
    return null;
  }
}

/** Save the progress snapshot under the secret recovery key. */
export async function postBackup(backup: { key: string; code: string; data: object }): Promise<boolean> {
  try {
    const res = await fetch(`${API}/backup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(backup) });
    return res.ok;
  } catch {
    return false;
  }
}

/** The snapshot saved under a recovery key: 'missing' when there is none, null when offline. */
export async function fetchBackup(key: string): Promise<{ code: string; data: Record<string, unknown> } | 'missing' | null> {
  try {
    const res = await fetch(`${API}/backup?key=${encodeURIComponent(key)}`);
    if (res.status === 404 || res.status === 400) return 'missing';
    if (!res.ok) return null;
    const body = (await res.json()) as { code?: string; data?: Record<string, unknown> };
    return body.code && body.data ? { code: body.code, data: body.data } : 'missing';
  } catch {
    return null;
  }
}

/** Ask the server for a certificate id (null when offline, 'denied' when the server says it was not earned). */
export async function requestCert(cert: { code: string; kind: string; period: string; name: string; lang: string }): Promise<string | 'denied' | null> {
  try {
    const res = await fetch(`${API}/cert`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cert) });
    if (res.status === 403 || res.status === 400) return 'denied';
    if (!res.ok) return null;
    const body = (await res.json()) as { id?: string };
    return body.id ?? null;
  } catch {
    return null;
  }
}
