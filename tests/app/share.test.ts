/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { LINK_BASE } from '../../src/constants/links';
import { decodeChallenge } from '../../src/engine';
import { unlimitedId } from '../../src/features/puzzles/catalog';
import { en } from '../../src/i18n/en';
import { bragLine, challengeLink, challengeText, inviteText, puzzleTitle, resultText } from '../../src/features/share/messages';

test('challenge link round-trips puzzle id, time and invite code', () => {
  const id = unlimitedId('hard', 41);
  const link = challengeLink({ puzzleId: id, seconds: 102 }, 'abc234');
  assert.ok(link.startsWith(`${LINK_BASE}/c/`));
  const decoded = decodeChallenge(link.slice(`${LINK_BASE}/c/`.length));
  assert.deepEqual(decoded, { puzzleId: id, seconds: 102, ref: 'abc234' });
});

test('daily result text is spoiler-free and carries the link', () => {
  const text = resultText({ puzzleId: 'daily-2026-10-05', seconds: 95, hints: 0, streak: 4 }, 'abc234');
  assert.match(text, /^Tiaro 👑\n/); // no puzzle number in shared texts
  assert.match(text, /1:35 · no hints ✨/);
  assert.match(text, /4-day streak/);
  assert.ok(text.includes(`${LINK_BASE}/c/daily-2026-10-05.`));
});

test('shared texts never name the level or number (Amir 2026-10-11)', () => {
  const id = unlimitedId('easy', 0);
  assert.equal(puzzleTitle(id), 'Easy #1'); // in-app title only
  for (const pid of [id, unlimitedId('hard', 41), unlimitedId('expert', 3), 'daily-2026-10-05']) {
    const text = resultText({ puzzleId: pid, seconds: 99, hints: 2 }, 'abc234');
    assert.match(text, /^Tiaro 👑\n/);
    const before = (t: string) => t.split('http')[0];
    assert.ok(!/easy|medium|hard|expert|#\d|daily/i.test(before(text)), text);
    const ch = challengeText({ puzzleId: pid, seconds: 101 }, 'abc234');
    assert.match(ch, /^I solved a Tiaro puzzle in 1:41 👑 Can you beat my time\?\n/);
  }
  assert.ok(inviteText('abc234').includes(`${LINK_BASE}/?r=abc234`));
  // One link per message: the coded one (no second "get the app" link, Amir 2026-10-11).
  for (const t of [inviteText('abc234'), challengeText({ puzzleId: 'daily-2026-10-05', seconds: 61 }, 'abc234'), resultText({ puzzleId: 'daily-2026-10-05', seconds: 61, hints: 0 }, 'abc234')]) {
    assert.equal(t.match(/https?:\/\//g)?.length, 1, t);
  }
});

test('brag line: same result gives the same line, and "no hints" lines only when no hints were used', () => {
  const r = { puzzleId: 'daily-2026-10-05', seconds: 95, hints: 0 };
  assert.equal(bragLine(r), bragLine({ ...r }));
  assert.ok([...en.shareBragNoHints, ...en.shareBrag].includes(bragLine(r)));
  for (let s = 0; s < 50; s++) assert.ok(en.shareBrag.includes(bragLine({ ...r, seconds: s, hints: 1 })));
  assert.ok(resultText(r, 'abc234').split('\n')[1] === bragLine(r));
});
