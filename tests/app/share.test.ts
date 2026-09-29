/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { LINK_BASE } from '../../src/constants/links';
import { decodeChallenge } from '../../src/engine';
import { unlimitedId } from '../../src/features/puzzles/catalog';
import { challengeLink, challengeText, inviteText, puzzleTitle, resultText } from '../../src/features/share/messages';

test('challenge link round-trips puzzle id, time and invite code', () => {
  const id = unlimitedId('hard', 41);
  const link = challengeLink({ puzzleId: id, seconds: 102 }, 'abc234');
  assert.ok(link.startsWith(`${LINK_BASE}/c/`));
  const decoded = decodeChallenge(link.slice(`${LINK_BASE}/c/`.length));
  assert.deepEqual(decoded, { puzzleId: id, seconds: 102, ref: 'abc234' });
});

test('daily result text is spoiler-free and carries the link', () => {
  const text = resultText({ puzzleId: 'daily-2026-10-05', seconds: 95, hints: 0, streak: 4 }, 'abc234');
  assert.match(text, /^Crowns #5 👑/);
  assert.match(text, /1:35 · no hints ✨/);
  assert.match(text, /4-day streak/);
  assert.ok(text.includes(`${LINK_BASE}/c/daily-2026-10-05.`));
});

test('unlimited titles and messages', () => {
  const id = unlimitedId('easy', 0);
  assert.equal(puzzleTitle(id), 'Easy #1');
  assert.match(resultText({ puzzleId: id, seconds: 30, hints: 2 }, 'abc234'), /^Crowns · Easy #1 👑\n⏱ 0:30 · 2 hints/);
  assert.match(challengeText({ puzzleId: id, seconds: 30 }, 'abc234'), /Easy #1 in Crowns in 0:30/);
  assert.ok(inviteText('abc234').endsWith(`${LINK_BASE}/?r=abc234`));
});
