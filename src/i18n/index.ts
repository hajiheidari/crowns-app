/**
 * Current UI language. The Bazaar build starts in Persian, every other build in English; players can switch in
 * Settings (saved in the game store, applied with `setLanguage`, and the root layout remounts on change).
 */
import { STORE } from '@/constants/store';

import { en, type Dict } from './en';
import { fa } from './fa';

export type Language = 'en' | 'fa';
export const LANGUAGES: Language[] = ['en', 'fa'];
export const DEFAULT_LANGUAGE: Language = STORE === 'bazaar' ? 'fa' : 'en';

const dicts: Record<Language, Dict> = { en, fa };
let current: Language = DEFAULT_LANGUAGE;

export const getLanguage = () => current;
export const setLanguage = (lang: Language) => {
  current = lang;
};
/** Right-to-left layout (Persian). The puzzle board itself never mirrors. */
export const isRTL = () => current === 'fa';
/**
 * Yoga layout direction for a subtree. Set on the app root, on every screen and inside every Modal
 * (modals and native screens do not inherit it); the board pins itself to 'ltr'.
 */
export const dirStyle = (lang: Language = current) => ({ direction: lang === 'fa' ? ('rtl' as const) : ('ltr' as const) });

/**
 * Back / forward arrows. Always the same glyphs, kept out of bidi (browsers and Android mirror ‹ › inside
 * right-to-left text on their own, inconsistently) and flipped by a transform in Persian instead.
 */
export const ARROW_BACK = '‹';
export const ARROW_FORWARD = '›';
export const arrowStyle = () => ({
  writingDirection: 'ltr' as const,
  transform: [{ scaleX: current === 'fa' ? -1 : 1 }],
});

/** Text for the current language; read it at render time, never store it in module constants. */
export const S: Dict = new Proxy({} as Dict, {
  get: (_target, key) => dicts[current][key as keyof Dict],
});

/** Shows Latin digits as Persian digits when the UI is Persian (display only; links and codes stay Latin). */
export function localDigits(text: string): string {
  return current === 'fa' ? text.replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]) : text;
}
