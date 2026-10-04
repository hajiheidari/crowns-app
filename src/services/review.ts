/**
 * App Store / Play review prompt at a happy moment. Never rewarded (store policy).
 * Rule (spec §4): after the 3rd solve or later, from the second day after install,
 * at most once every 120 days. The OS may still decide not to show it.
 */
import * as StoreReview from 'expo-store-review';
import { Platform } from 'react-native';

import { STORE } from '@/constants/store';
import { addDays, dateKey } from '@/engine';
import { useGameStore } from '@/store/game-store';

export async function maybeAskForReview(): Promise<void> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
  // The Android prompt is Google Play's; Cafe Bazaar users don't have it (a Bazaar rating intent can come later).
  if (STORE === 'bazaar') return;
  const { meta, updateMeta } = useGameStore.getState();
  const today = dateKey();
  if (meta.wins < 3 || !meta.installedKey || today <= meta.installedKey) return;
  if (meta.lastReviewPromptKey && today < addDays(meta.lastReviewPromptKey, 120)) return;
  if (!(await StoreReview.isAvailableAsync())) return;
  updateMeta({ lastReviewPromptKey: today });
  await StoreReview.requestReview();
}
