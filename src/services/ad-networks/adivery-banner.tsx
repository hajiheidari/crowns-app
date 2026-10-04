import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AdiveryBanner, Banner } from 'adivery';

import { ADIVERY } from '@/constants/monetization';

import { adsReady, initAds } from './adivery';

/** Adivery 320×50 banner (Cafe Bazaar build). */
export function AdBanner() {
  const [ready, setReady] = useState(adsReady);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    initAds().then(() => alive && setReady(adsReady()));
    return () => {
      alive = false;
    };
  }, []);
  if (!ready || failed) return null;
  return (
    <View style={styles.box}>
      <AdiveryBanner
        placementId={ADIVERY.banner}
        bannerSize={Banner}
        onAdLoaded={() => {}}
        onAdShown={() => {}}
        onAdClicked={() => {}}
        onError={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({ box: { alignItems: 'center' } });
