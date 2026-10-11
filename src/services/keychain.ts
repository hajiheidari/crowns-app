/** Web: no keychain. The recovery code is the way back (see keychain.native.ts). */
export async function getKeychainKey(): Promise<string | null> {
  return null;
}

export async function saveKeychainKey(_key: string): Promise<void> {}
