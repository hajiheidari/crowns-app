/**
 * Current UI language. The Bazaar build starts in Persian; every other build starts in the phone's language
 * (Arabic or Persian when the phone uses it, else English). Players can switch in Settings (saved in the game
 * store, applied with `setLanguage`, and the root layout remounts on change).
 */
import { STORE } from '@/constants/store';

import { en, type Dict } from './en';
import { ar } from './ar';
import { fa } from './fa';

export type Language = 'en' | 'fa' | 'ar';
export const LANGUAGES: Language[] = ['en', 'fa', 'ar'];

/** The phone's (or browser's) language, if we have it. Intl works on Hermes and on the web. */
function deviceLanguage(): Language {
  try {
    const tag = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    if (tag.startsWith('ar')) return 'ar';
    if (tag.startsWith('fa')) return 'fa';
  } catch {
    // No Intl: English.
  }
  return 'en';
}

export const DEFAULT_LANGUAGE: Language = STORE === 'bazaar' ? 'fa' : deviceLanguage();

const dicts: Record<Language, Dict> = { en, fa, ar };
let current: Language = DEFAULT_LANGUAGE;

export const getLanguage = () => current;
export const setLanguage = (lang: Language) => {
  current = lang;
};
const rtl = (lang: Language) => lang === 'fa' || lang === 'ar';
/** Right-to-left layout (Persian, Arabic). The puzzle board itself never mirrors. */
export const isRTL = () => rtl(current);
/**
 * Yoga layout direction for a subtree. Set on the app root, on every screen and inside every Modal
 * (modals and native screens do not inherit it); the board pins itself to 'ltr'.
 */
export const dirStyle = (lang: Language = current) => ({ direction: rtl(lang) ? ('rtl' as const) : ('ltr' as const) });

/**
 * Back / forward arrows. Always the same glyphs, kept out of bidi (browsers and Android mirror ‹ › inside
 * right-to-left text on their own, inconsistently) and flipped by a transform in right-to-left languages instead.
 */
export const ARROW_BACK = '‹';
export const ARROW_FORWARD = '›';
export const arrowStyle = () => ({
  writingDirection: 'ltr' as const,
  transform: [{ scaleX: rtl(current) ? -1 : 1 }],
});

/** Text for the current language; read it at render time, never store it in module constants. */
export const S: Dict = new Proxy({} as Dict, {
  get: (_target, key) => dicts[current][key as keyof Dict],
});

/** Shows Latin digits as Persian digits when the UI is Persian (display only; links and codes stay Latin). Arabic keeps 0-9. */
export function localDigits(text: string): string {
  return current === 'fa' ? text.replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]) : text;
}
