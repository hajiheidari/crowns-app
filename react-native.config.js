// Without Firebase config files, keep the Firebase native modules out of the build (they would fail to start).
const { firebaseEnabled } = require('./firebase-config');

const off = { platforms: { ios: null, android: null } };

module.exports = {
  dependencies: firebaseEnabled
    ? {}
    : { '@react-native-firebase/app': off, '@react-native-firebase/analytics': off },
};
