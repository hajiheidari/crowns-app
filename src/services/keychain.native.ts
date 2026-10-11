/**
 * Keeps the backup recovery key in the iPhone keychain (Android: encrypted storage). On iPhone keychain items survive
 * deleting the app and move to a new iPhone restored from an iCloud backup, so a reinstall restores progress by itself.
 */
import * as SecureStore from 'expo-secure-store';

const ITEM = 'tiaro-backup-key';
const OPTIONS: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK };

export async function getKeychainKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ITEM, OPTIONS);
  } catch {
    return null;
  }
}

export async function saveKeychainKey(key: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(ITEM, key, OPTIONS);
  } catch {
    // Keychain unavailable: the recovery code in Settings still works.
  }
}
