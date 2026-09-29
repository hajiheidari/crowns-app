// Firebase is switched on only when both config files exist in ./firebase (see firebase/README.md).
const fs = require('fs');
const path = require('path');

const IOS_FILE = './firebase/GoogleService-Info.plist';
const ANDROID_FILE = './firebase/google-services.json';

const firebaseEnabled = [IOS_FILE, ANDROID_FILE].every((f) => fs.existsSync(path.join(__dirname, f)));

module.exports = { firebaseEnabled, IOS_FILE, ANDROID_FILE };
