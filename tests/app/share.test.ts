/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { LINK_BASE } from '../../src/constants/links';
import { decodeChallenge } from '../../src/engine';
import { unlimitedId } from '../../src/features/puzzles/catalog';
import { en } from '../../src/i18n/en';
import { bragLine, challengeLink, challengeText, inviteText, puzzleTitle, resultText, shareTitle } from '../../src/features/share/messages';

test('challenge link round-trips puzzle id, time and invite code', () => {
  const id = unlimitedId('hard', 41);
  const link = challengeLink({ puzzleId: id, seconds: 102 }, 'abc234');
  assert.ok(link.startsWith(`${LINK_BASE}/c/`));
  const decoded = decodeChallenge(link.slice(`${LINK_BASE}/c/`.length));
  assert.deepEqual(decoded, { puzzleId: id, seconds: 102, ref: 'abc234' });
});

test('daily result text is spoiler-free and carries the link', () => {
  const text = resultText({ puzzleId: 'daily-2026-10-05', seconds: 95, hints: 0, streak: 4 }, 'abc234');
  assert.match(text, /^Tiaro #5 👑/);
  assert.match(text, /1:35 · no hints ✨/);
  assert.match(text, /4-day streak/);
  assert.ok(text.includes(`${LINK_BASE}/c/daily-2026-10-05.`));
});

test('unlimited titles and messages: easy and medium are left out of shared results', () => {
  const id = unlimitedId('easy', 0);
  assert.equal(puzzleTitle(id), 'Easy #1');
  assert.equal(shareTitle(id), null);
  assert.equal(shareTitle(unlimitedId('medium', 3)), null);
  const text = resultText({ puzzleId: id, seconds: 30, hints: 2 }, 'abc234');
  assert.match(text, /^Tiaro 👑\n.+\n⏱ 0:30 · 2 hints/);
  assert.ok(!/easy|medium/i.test(text.split('http')[0]), text); // the link itself keeps the puzzle id
  assert.match(challengeText({ puzzleId: id, seconds: 30 }, 'abc234'), /solved a puzzle in Tiaro in 0:30/);
  const hard = unlimitedId('hard', 41);
  assert.equal(shareTitle(hard), 'Hard #42');
  assert.match(resultText({ puzzleId: hard, seconds: 99, hints: 0 }, 'abc234'), /^Tiaro · Hard #42 👑/);
  assert.match(challengeText({ puzzleId: hard, seconds: 99 }, 'abc234'), /Hard #42 in Tiaro/);
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
