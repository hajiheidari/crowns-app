// Native modules per build:
// - Firebase only when its config files exist (they would fail to start otherwise).
// - Cafe Bazaar build (EXPO_PUBLIC_STORE=bazaar): no Google ads / Google Play billing (not allowed, and they
//   don't work in Iran); it uses Adivery instead. Every other build leaves Adivery out.
// - Ad-free build (EXPO_PUBLIC_ADS=off): no AdMob, no RevenueCat.
const { firebaseEnabled } = require('./firebase-config');

const bazaar = process.env.EXPO_PUBLIC_STORE === 'bazaar';
const adsOff = process.env.EXPO_PUBLIC_ADS === 'off';
const off = { platforms: { ios: null, android: null } };

const dependencies = {};
if (!firebaseEnabled || bazaar) {
  dependencies['@react-native-firebase/app'] = off;
  dependencies['@react-native-firebase/analytics'] = off;
}
if (bazaar || adsOff) {
  dependencies['react-native-google-mobile-ads'] = off;
  dependencies['react-native-purchases'] = off;
}
if (!bazaar) dependencies.adivery = off;

module.exports = { dependencies };
