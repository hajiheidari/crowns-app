/**
 * Small UI queue for things the ad services need to show on screen: the iOS tracking
 * explainer (before Apple's prompt) and, in the web preview, a stand-in for video ads.
 */
import { create } from 'zustand';

export type AdPrompt =
  | { kind: 'tracking'; resolve: () => void }
  | { kind: 'mock'; format: 'rewarded' | 'interstitial'; resolve: (completed: boolean) => void };

interface AdUi {
  prompt: AdPrompt | null;
  show: (p: AdPrompt) => void;
  clear: () => void;
}

export const useAdUi = create<AdUi>((set) => ({
  prompt: null,
  show: (prompt) => set({ prompt }),
  clear: () => set({ prompt: null }),
}));

/** Resolves when the player has seen the explainer and tapped Continue. */
export function showTrackingExplainer(): Promise<void> {
  return new Promise((resolve) => useAdUi.getState().show({ kind: 'tracking', resolve }));
}

/** Web preview only: shows a fake ad; resolves true if it ran to the end. */
export function showMockAd(format: 'rewarded' | 'interstitial'): Promise<boolean> {
  return new Promise((resolve) => useAdUi.getState().show({ kind: 'mock', format, resolve }));
}
