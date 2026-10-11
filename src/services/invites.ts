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
  /** Won last week among this group. */
  crown: boolean;
}

/** Save this player's nickname, avatar and score for the week (shown to friends). */
export async function postMe(me: { code: string; name: string; emoji: string; week: string; score: number }): Promise<boolean> {
  try {
    const res = await fetch(`${API}/me`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(me) });
    return res.ok;
  } catch {
    return false;
  }
}

/** This player and their friends for a week, best first (null when offline). */
export async function fetchLeague(code: string, week: string): Promise<LeaguePlayer[] | null> {
  try {
    const res = await fetch(`${API}/league?code=${encodeURIComponent(code)}&week=${encodeURIComponent(week)}`);
    if (!res.ok) return null;
    const { players } = (await res.json()) as { players?: LeaguePlayer[] };
    return Array.isArray(players) ? players : null;
  } catch {
    return null;
  }
}
