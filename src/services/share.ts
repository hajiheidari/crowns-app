/**
 * Share sheet helpers. Phones use the system share sheet; the web preview falls back to
 * navigator.share or the clipboard.
 */
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';

export const canShareImages = Platform.OS === 'ios' || Platform.OS === 'android';

/** Returns 'copied' when the text went to the clipboard instead of a share sheet. */
export async function shareText(message: string): Promise<'shared' | 'copied' | 'cancelled'> {
  if (Platform.OS === 'web') {
    const nav = globalThis.navigator as Navigator | undefined;
    if (nav?.share) {
      try {
        await nav.share({ text: message });
        return 'shared';
      } catch {
        // Cancelled or blocked (e.g. inside an iframe): copy instead.
      }
    }
    await Clipboard.setStringAsync(message);
    return 'copied';
  }
  const res = await Share.share({ message });
  return res.action === Share.dismissedAction ? 'cancelled' : 'shared';
}

export async function copyText(message: string): Promise<void> {
  await Clipboard.setStringAsync(message);
}

export async function shareImage(uri: string, dialogTitle: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) return;
  await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle });
}
