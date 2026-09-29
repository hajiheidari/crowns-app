import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { AD_UNIT_IDS, adRequestOptions, adsReady, initAds } from '@/services/ads';
import { useGameStore } from '@/store/game-store';

/** Adaptive banner for Home and Stats only (never on the game screen). Hidden for Remove-Ads owners. */
export function AdBanner() {
  const removeAds = useGameStore((s) => s.meta.removeAds);
  const [ready, setReady] = useState(adsReady);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    initAds().then(() => alive && setReady(adsReady()));
    return () => {
      alive = false;
    };
  }, []);
  if (removeAds || !ready || failed) return null;
  return (
    <View style={styles.box}>
      <BannerAd
        unitId={AD_UNIT_IDS.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={adRequestOptions()}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({ box: { alignItems: 'center' } });
