/**
 * Web preview: no Firebase. Events are kept in memory (globalThis.__crownsEvents) so they can be
 * checked in browser tests, and logged to the console in development.
 */
import type { EventName, EventParams } from '@/features/analytics/events';

type Logged = { name: string; params?: object };
const g = globalThis as { __crownsEvents?: Logged[] };

export function track<E extends EventName>(name: E, ...params: EventParams<E> extends undefined ? [] : [EventParams<E>]): void {
  (g.__crownsEvents ??= []).push({ name, params: params[0] as object | undefined });
  if (__DEV__) console.debug('[analytics]', name, params[0] ?? '');
}

export function setAdConsent(_personalizedAds: boolean): void {}
