import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

/** Renders a view to a PNG file and returns its uri. */
export async function captureView(ref: RefObject<View | null>, size: { width: number; height: number }): Promise<string | null> {
  if (!ref.current) return null;
  return captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile', ...size });
}
