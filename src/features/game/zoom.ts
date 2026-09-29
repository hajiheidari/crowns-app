/**
 * Pinch-to-zoom math for big boards on small phones. Pure functions (worklets) so they run on the UI thread
 * during a pinch and stay testable in Node. The board is scaled around its center, then translated.
 */

/** Boards this size and up can be zoomed (8×8 cells are ~40 pt on a 375-pt phone; 11×11 are ~31 pt). */
export const ZOOM_MIN_N = 8;
export const ZOOM_MAX = 2.5;

export interface ZoomState {
  s: number;
  x: number;
  y: number;
}

/** Keep the zoomed board covering the viewport: no empty gap at any edge. */
export function clampZoom(z: ZoomState, size: number): ZoomState {
  'worklet';
  const s = Math.min(ZOOM_MAX, Math.max(1, z.s));
  const max = ((s - 1) * size) / 2;
  return { s, x: Math.min(max, Math.max(-max, z.x)), y: Math.min(max, Math.max(-max, z.y)) };
}

/**
 * New zoom after pinching by `factor`: the board point that was under the fingers at the start stays under
 * them (following the fingers if they also moved).
 */
export function pinchZoom(
  start: ZoomState,
  startFocal: { x: number; y: number },
  factor: number,
  focal: { x: number; y: number },
  size: number,
): ZoomState {
  'worklet';
  const c = size / 2;
  const px = c + (startFocal.x - c - start.x) / start.s;
  const py = c + (startFocal.y - c - start.y) / start.s;
  const s = Math.min(ZOOM_MAX, Math.max(1, start.s * factor));
  return clampZoom({ s, x: focal.x - c - (px - c) * s, y: focal.y - c - (py - c) * s }, size);
}

/** Where a touch on the viewport lands on the unzoomed board. */
export function toBoard(z: ZoomState, point: { x: number; y: number }, size: number): { x: number; y: number } {
  'worklet';
  const c = size / 2;
  return { x: c + (point.x - c - z.x) / z.s, y: c + (point.y - c - z.y) / z.s };
}

/** Clock for gesture callbacks (a worklet, so it also runs on the UI thread). */
export function gestureClock(): number {
  'worklet';
  return Date.now();
}
