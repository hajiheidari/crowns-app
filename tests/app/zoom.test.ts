import assert from 'node:assert/strict';
import { test } from 'node:test';

import { clampZoom, pinchZoom, toBoard, ZOOM_MAX } from '../../src/features/game/zoom';

const SIZE = 300;

test('no zoom maps touches 1:1', () => {
  assert.deepEqual(toBoard({ s: 1, x: 0, y: 0 }, { x: 40, y: 250 }, SIZE), { x: 40, y: 250 });
});

test('pinch keeps the point under the fingers', () => {
  const focal = { x: 60, y: 90 };
  const z = pinchZoom({ s: 1, x: 0, y: 0 }, focal, 2, focal, SIZE);
  assert.equal(z.s, 2);
  const p = toBoard(z, focal, SIZE);
  assert.ok(Math.abs(p.x - 60) < 1e-9 && Math.abs(p.y - 90) < 1e-9);
});

test('zoom is limited and never shows empty space', () => {
  const z = pinchZoom({ s: 1, x: 0, y: 0 }, { x: 0, y: 0 }, 10, { x: 0, y: 0 }, SIZE);
  assert.equal(z.s, ZOOM_MAX);
  const max = ((ZOOM_MAX - 1) * SIZE) / 2;
  assert.equal(z.x, max);
  assert.equal(z.y, max);
  const out = clampZoom({ s: 0.5, x: 30, y: -30 }, SIZE);
  assert.ok(out.s === 1 && out.x === 0 && out.y === 0);
  // Corners of the viewport still land inside the board.
  const corner = toBoard(z, { x: SIZE, y: SIZE }, SIZE);
  assert.ok(corner.x <= SIZE && corner.y <= SIZE);
});
