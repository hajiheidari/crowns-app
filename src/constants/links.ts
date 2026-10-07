/**
 * Public links, on Espadna's own domain (Amir 2026-10-04: Tiaro has no domain of its own;
 * playtiaro.com was dropped). The site is the `crowns-app` Worker (wrangler.jsonc); the landing page is espadna.com/tiaro-app/.
 *
 *   <LINK_BASE>/c/<code>   challenge link (code from engine `encodeChallenge`)
 *   <LINK_BASE>/?r=<ref>   invite link
 */
export const LINK_BASE = 'https://tiaro.espadna.com';

/** Pages on the same site as the links (`web/privacy.html`, `web/terms.html`). Stores need the privacy URL too. */
export const PRIVACY_URL = `${LINK_BASE}/privacy`;
/** Persian privacy page (describes the Cafe Bazaar build: Adivery ads, Bazaar billing). */
export const PRIVACY_URL_FA = `${LINK_BASE}/privacy-fa`;
export const TERMS_URL = `${LINK_BASE}/terms`;
/** Support address chosen by Amir (shown in Settings, the privacy policy and the store listings). */
export const SUPPORT_EMAIL = 'espadna.support@gmail.com';

export const challengeUrl = (code: string) => `${LINK_BASE}/c/${code}`;
export const inviteUrl = (ref: string) => `${LINK_BASE}/?r=${ref}`;
