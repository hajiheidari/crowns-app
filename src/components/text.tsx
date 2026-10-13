/**
 * App-wide Text. In Persian and Arabic it uses Vazirmatn (it covers both scripts; picked by weight, since Android
 * would fake-bold a single file); Persian also shows Persian digits. In English it is exactly React Native's Text.
 */
import { Children, isValidElement, type ReactNode } from 'react';
import { Platform, Text as RNText, StyleSheet, type TextProps } from 'react-native';

import { getLanguage, isRTL, localDigits } from '@/i18n';

import { InlineCoin } from './coin-icon';

const FA_FONT: Record<string, string> = {
  '100': 'Vazirmatn-Regular',
  '200': 'Vazirmatn-Regular',
  '300': 'Vazirmatn-Regular',
  '400': 'Vazirmatn-Regular',
  normal: 'Vazirmatn-Regular',
  '500': 'Vazirmatn-Medium',
  '600': 'Vazirmatn-SemiBold',
  '700': 'Vazirmatn-Bold',
  bold: 'Vazirmatn-Bold',
  '800': 'Vazirmatn-Bold',
  '900': 'Vazirmatn-Bold',
};

/** Fixed-width font for codes; texts in it keep Latin digits in every language. */
export const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });

export const RTL_TEXT = { textAlign: Platform.OS === 'web' ? 'right' : 'left', writingDirection: 'rtl' } as const;

const COIN = '🪙';

/** Every 🪙 in a string becomes the gold coin drawing (the emoji is silver on iPhone). */
function withCoins(children: ReactNode, size: number): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child !== 'string' || !child.includes(COIN)) return child;
    const parts = child.split(COIN);
    return parts.flatMap((part, i) => (i === 0 ? [part] : [<InlineCoin key={i} size={size} />, part]));
  });
}

const fontSizeOf = (style: TextProps['style']) => (StyleSheet.flatten(style)?.fontSize as number | undefined) ?? 14;

function persianDigits(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === 'string') return localDigits(child);
    if (typeof child === 'number') return localDigits(String(child));
    return isValidElement(child) ? child : child;
  });
}

export function Text({ style, children, ...rest }: TextProps) {
  // English and Russian use the system font (Vazirmatn has no Cyrillic) and Latin digits.
  if (getLanguage() === 'en' || getLanguage() === 'ru') {
    return (
      <RNText style={style} {...rest}>
        {withCoins(children, fontSizeOf(style) * 1.05)}
      </RNText>
    );
  }
  const flat = StyleSheet.flatten(style) ?? {};
  // Code-like text (error details) keeps its monospace font and Latin digits.
  if (flat.fontFamily === 'monospace' || flat.fontFamily === MONO) {
    return (
      <RNText style={style} {...rest}>
        {children}
      </RNText>
    );
  }
  const fontFamily = FA_FONT[String(flat.fontWeight ?? '400')] ?? FA_FONT['400'];
  // The app flips layout with Yoga `direction: 'rtl'` (not I18nManager), and native text still aligns to the left by
  // default. Right-to-left languages start every unaligned text on the right, like the rest of the layout.
  // iOS and Android swap left/right alignment inside an RTL layout (so 'left' means the start, i.e. the right edge);
  // react-native-web does not swap, so there it has to be 'right'.
  const rtlText = isRTL() && (!flat.textAlign || flat.textAlign === 'auto' || flat.textAlign === 'left');
  return (
    <RNText style={[style, { fontFamily, fontWeight: 'normal' }, rtlText && RTL_TEXT]} {...rest}>
      {withCoins(persianDigits(children), fontSizeOf(style) * 1.05)}
    </RNText>
  );
}
