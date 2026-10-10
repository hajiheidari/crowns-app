/**
 * Banner for Home, Stats and Past puzzles only (never on the game screen). Hidden for Remove-Ads owners.
 * AdMob in the App Store / Google Play builds, Adivery in the Cafe Bazaar build.
 */
import type { ComponentType } from 'react';

import { ADS_OFF, STORE } from '@/constants/store';
import { useGameStore } from '@/store/game-store';

const NetworkBanner: ComponentType | null = ADS_OFF
  ? null
  : STORE === 'bazaar'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/services/ad-networks/adivery-banner').AdBanner
    : // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@/services/ad-networks/admob-banner').AdBanner;

export function AdBanner() {
  const removeAds = useGameStore((s) => s.meta.removeAds);
  return removeAds || !NetworkBanner ? null : <NetworkBanner />;
}
