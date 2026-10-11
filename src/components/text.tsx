/**
 * App-wide Text. In Persian and Arabic it uses Vazirmatn (it covers both scripts; picked by weight, since Android
 * would fake-bold a single file); Persian also shows Persian digits. In English it is exactly React Native's Text.
 */
import { Children, isValidElement, type ReactNode } from 'react';
import { Platform, Text as RNText, StyleSheet, type TextProps } from 'react-native';

import { getLanguage, isRTL, localDigits } from '@/i18n';

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

function persianDigits(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === 'string') return localDigits(child);
    if (typeof child === 'number') return localDigits(String(child));
    return isValidElement(child) ? child : child;
  });
}

export function Text({ style, children, ...rest }: TextProps) {
  if (getLanguage() === 'en') {
    return (
      <RNText style={style} {...rest}>
        {children}
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
      {persianDigits(children)}
    </RNText>
  );
}
