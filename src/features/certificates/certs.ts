/** Certificate records and the rule for when two of them are the same one (pure, tested). */

export type CertKind = 'week' | 'month' | 'streak30' | 'streak100' | 'genius';

export interface Cert {
  kind: CertKind;
  /** Week/month start for champions, the day it was reached for milestones. */
  period: string;
  id: string | null;
}

const dayNumber = (key: string) => Math.round(Date.parse(`${key}T00:00:00Z`) / 86400000);

/**
 * The same certificate: same kind and period. Week certificates (league week, genius) also match when their weeks
 * overlap, because Saturday weeks (Persian) and Monday weeks (other languages) start on different days, and a player
 * who switched language could otherwise get one certificate per week kind.
 */
export function sameCert(a: Pick<Cert, 'kind' | 'period'>, b: Pick<Cert, 'kind' | 'period'>): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'week' || a.kind === 'genius') return Math.abs(dayNumber(a.period) - dayNumber(b.period)) < 7;
  return a.period === b.period;
}

/** One certificate per kind and period (1.1.0 builds could save the same one twice); the earliest one is kept. */
export function uniqueCerts(certs: Cert[]): Cert[] {
  const kept: Cert[] = [];
  for (const c of certs) {
    const i = kept.findIndex((k) => sameCert(k, c));
    if (i < 0) kept.push(c);
    else if (!kept[i].id && c.id && kept[i].period === c.period) kept[i] = c;
  }
  return kept;
}
