/**
 * Web preview only: a stand-in for a rewarded video ad, rendered by AdHost.
 */
import { create } from 'zustand';

interface AdUi {
  prompt: { resolve: (completed: boolean) => void } | null;
  show: (resolve: (completed: boolean) => void) => void;
  clear: () => void;
}

export const useAdUi = create<AdUi>((set) => ({
  prompt: null,
  show: (resolve) => set({ prompt: { resolve } }),
  clear: () => set({ prompt: null }),
}));

/** Shows the fake ad; resolves true if it ran to the end. */
export function showMockAd(): Promise<boolean> {
  return new Promise((resolve) => useAdUi.getState().show(resolve));
}
