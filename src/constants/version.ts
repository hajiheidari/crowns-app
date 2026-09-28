import { CHANGELOG } from '@/features/whats-new/changelog.generated';

/**
 * App version shown in the UI. Taken from the generated changelog, which a test keeps equal to
 * `app.json` (Constants.expoConfig can be stale in web exports because Metro caches the manifest).
 */
export const APP_VERSION = CHANGELOG[0]?.version ?? '0.0.0';
