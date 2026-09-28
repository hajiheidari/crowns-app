/// <reference types="node" />
/**
 * Turns CHANGELOG.md into src/features/whats-new/changelog.generated.ts for the in-app "What's new" sheet.
 *
 *   npm run changelog
 *
 * tests/app/changelog.test.ts fails if the generated file is out of date.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface ChangelogEntry {
  version: string;
  date: string;
  items: string[];
}

export const ROOT = join(__dirname, '..');
export const OUT = join(ROOT, 'src', 'features', 'whats-new', 'changelog.generated.ts');

export function parseChangelog(md: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  for (const line of md.split('\n')) {
    const head = /^## (\d+\.\d+\.\d+)\s*[—-]\s*(\S+)/.exec(line);
    if (head) entries.push({ version: head[1], date: head[2], items: [] });
    else if (line.startsWith('- ') && entries.length) entries[entries.length - 1].items.push(line.slice(2).trim());
  }
  return entries;
}

export function renderChangelog(entries: ChangelogEntry[]): string {
  return `// Generated from CHANGELOG.md by \`npm run changelog\`. Do not edit.
import type { ChangelogEntry } from './types';

export const CHANGELOG: ChangelogEntry[] = ${JSON.stringify(entries, null, 2)};
`;
}

if (require.main === module) {
  writeFileSync(OUT, renderChangelog(parseChangelog(readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8'))));
  console.log('Wrote', OUT);
}
