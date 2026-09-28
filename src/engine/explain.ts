/**
 * Plain-English explanations for solver steps (used by hints).
 * Keep sentences short: they are shown in a small card above the board.
 */
import type { Step } from './logic';
import type { UnitRef } from './types';

/**
 * Default region names. The UI palette MUST use the same order
 * (region 0 = purple, 1 = orange, ...), or hint text won't match the colors.
 */
export const REGION_COLOR_NAMES = [
  'purple', 'orange', 'blue', 'green', 'gray', 'red', 'yellow', 'teal', 'pink', 'brown', 'lime',
];

export interface ExplainOptions {
  regionName?: (index: number) => string;
}

export function unitName(u: UnitRef, opts: ExplainOptions = {}): string {
  if (u.kind === 'row') return `row ${u.index + 1}`;
  if (u.kind === 'column') return `column ${u.index + 1}`;
  const name = opts.regionName?.(u.index) ?? REGION_COLOR_NAMES[u.index] ?? `#${u.index + 1}`;
  return `the ${name} region`;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function list(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export interface Explanation {
  title: string;
  body: string;
}

export function explainStep(step: Step, opts: ExplainOptions = {}): Explanation {
  const name = (u: UnitRef) => unitName(u, opts);
  switch (step.rule) {
    case 'lastCell': {
      const u = name(step.units[0]);
      return { title: 'Only one spot left', body: `${cap(u)} has just one open cell, so its crown goes there.` };
    }
    case 'confinement': {
      const [a, b] = step.units;
      if (a.kind === 'region') {
        return {
          title: 'Region stuck in one line',
          body: `Every open cell of ${name(a)} is in ${name(b)}. Its crown must be there, so the other cells of ${name(b)} can be crossed out.`,
        };
      }
      return {
        title: 'Line owned by one region',
        body: `Every open cell of ${name(a)} belongs to ${name(b)}. That line's crown comes from ${name(b)}, so the rest of ${name(b)} can be crossed out.`,
      };
    }
    case 'blocksUnit': {
      const u = name(step.units[0]);
      return {
        title: 'This cell blocks too much',
        body: `A crown on the highlighted cell would cover every open cell of ${u}, leaving it no room. So this cell can't hold a crown.`,
      };
    }
    case 'group': {
      const k = step.units.length / 2;
      const first = step.units.slice(0, k).map(name);
      const second = step.units.slice(k).map(name);
      return {
        title: `${k} fit in ${k}`,
        body: `${cap(list(first))} only have open cells in ${list(second)}. These ${k} must share those ${k} crowns, so every other open cell in ${list(second)} is out.`,
      };
    }
    case 'contradiction': {
      const u = name(step.units[0]);
      return {
        title: 'What if…?',
        body: `Imagine a crown on the highlighted cell. Following the simple rules, ${u} ends up with no room for a crown. So this cell must be empty.`,
      };
    }
  }
}
