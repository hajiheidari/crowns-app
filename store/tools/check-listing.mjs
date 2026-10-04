// Checks a store listing's fields against store limits: node store/tools/check-listing.mjs [store/listing-ar.md]
import fs from 'fs';
const md = fs.readFileSync(process.argv[2] ?? new URL('../listing.md', import.meta.url), 'utf8');
const line = (label) => (md.match(new RegExp(`\\*\\*${label}\\*\\*[^\\n]*\\n([^\\n]+)`)) || [])[1]?.trim();
const inline = (label) => (md.match(new RegExp(`\\*\\*${label}\\*\\* \\[\\d+\\]: ([^\\n]+)`)) || [])[1]?.trim();
const full = md.split('**Full description** [4000]')[1].split('**Content rating:**')[0].trim();
const checks = [
  ['App name', inline('App name'), 30], ['Subtitle', line('Subtitle'), 30], ['Promotional text', line('Promotional text'), 170],
  ['Keywords', line('Keywords'), 100], ['Short description', line('Short description'), 80], ['Full description', full, 4000],
];
let bad = 0;
for (const [name, v, max] of checks) { const n = [...(v ?? '')].length; if (!v || n > max) bad++; console.log(`${n > max || !v ? '✗' : '✓'} ${name}: ${n}/${max}`); }
process.exit(bad ? 1 : 0);
