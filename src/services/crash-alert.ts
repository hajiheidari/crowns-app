/**
 * Shows an app-killing JS error in a native alert instead of closing silently, so a tester can
 * screenshot it (there is no crash reporting until Firebase is set up). Imported first in the root layout.
 */
import { Alert, Platform } from 'react-native';

type Handler = (error: unknown, isFatal?: boolean) => void;
type ErrorUtilsType = { getGlobalHandler(): Handler; setGlobalHandler(h: Handler): void };

const errorUtils = (globalThis as { ErrorUtils?: ErrorUtilsType }).ErrorUtils;

export function describeError(error: unknown): string {
  if (error instanceof Error) {
    const stack = (error.stack ?? '').split('\n').slice(0, 6).join('\n');
    return `${error.name}: ${error.message}\n\n${stack}`;
  }
  return String(error);
}

if (Platform.OS !== 'web' && errorUtils) {
  const fallback = errorUtils.getGlobalHandler();
  let shown = false;
  errorUtils.setGlobalHandler((error, isFatal) => {
    if (!isFatal || shown) return fallback(error, isFatal);
    shown = true;
    Alert.alert('Tiaro hit an error', `Please send a screenshot of this.\n\n${describeError(error)}`, [
      { text: 'Close app', onPress: () => fallback(error, isFatal) },
    ]);
  });
}
