import type { RefObject } from 'react';
import type { View } from 'react-native';

/** Web preview: image sharing is phone-only (see capture.native.ts). */
export async function captureView(_ref: RefObject<View | null>, _size: { width: number; height: number }): Promise<string | null> {
  return null;
}
