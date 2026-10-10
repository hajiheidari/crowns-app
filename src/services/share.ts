/**
 * Share sheet helpers. Phones use the system share sheet; the web preview falls back to
 * navigator.share or the clipboard.
 */
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { Platform, Share } from 'react-native';

export const canShareImages = Platform.OS === 'ios' || Platform.OS === 'android';

/** 'copied': the web preview put the text on the clipboard instead of a share sheet; 'failed': it could do neither. */
export type ShareStatus = 'shared' | 'copied' | 'cancelled' | 'failed';

export async function shareText(message: string): Promise<ShareStatus> {
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
    return (await copyOnWeb(message)) ? 'copied' : 'failed';
  }
  const res = await Share.share({ message });
  return res.action === Share.dismissedAction ? 'cancelled' : 'shared';
}

export async function copyText(message: string): Promise<void> {
  if (Platform.OS === 'web') await copyOnWeb(message);
  else await Clipboard.setStringAsync(message);
}

/**
 * Web copy that reports the truth: expo-clipboard's fallback says "copied" even when the browser refused
 * (e.g. inside the sandboxed preview frame), so the caller can show the text for copying by hand instead.
 */
async function copyOnWeb(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API missing or not allowed here: try the old way.
  }
  try {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(field);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Shares the picture together with a text (the install link goes with it, Amir 2026-10-10), via react-native-share.
 * If that module is missing (an old build), the picture alone goes out through expo-sharing.
 */
export async function shareImage(uri: string, dialogTitle: string, message: string): Promise<ShareStatus> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const RNShare = require('react-native-share').default as typeof import('react-native-share').default;
    const res = await RNShare.open({ url: uri, type: 'image/png', message, title: dialogTitle, failOnCancel: false });
    return res.dismissedAction ? 'cancelled' : 'shared';
  } catch {
    if (!(await Sharing.isAvailableAsync())) return 'failed';
    await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle });
    return 'shared';
  }
}
