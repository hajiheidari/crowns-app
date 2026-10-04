import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { AD_UNIT_IDS, adRequestOptions, adsReady, initAds } from './admob';

/** AdMob adaptive banner (App Store / Google Play builds). */
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
