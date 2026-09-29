# Firebase config files

Put the two files from the Firebase console here (Project settings → Your apps):

- `GoogleService-Info.plist` (iOS app, bundle id from app.json)
- `google-services.json` (Android app, package from app.json)

Until **both** files are here, Firebase is left out of native builds (see `firebase-config.js`) and analytics calls do nothing,
so builds keep working without a Firebase project. These files are not secret, but keep them out of public repos anyway.
