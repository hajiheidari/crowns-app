/**
 * Public links. The domain is a placeholder until Amir picks one (CLAUDE.md "Decisions pending");
 * change LINK_BASE and the `web/` landing page together.
 *
 *   <LINK_BASE>/c/<code>   challenge link (code from engine `encodeChallenge`)
 *   <LINK_BASE>/?r=<ref>   invite link
 */
export const LINK_BASE = 'https://playtiaro.com';

/** Pages on the same site as the links (`web/privacy.html`, `web/terms.html`). Stores need the privacy URL too. */
export const PRIVACY_URL = `${LINK_BASE}/privacy`;
export const TERMS_URL = `${LINK_BASE}/terms`;
/** Placeholder until Amir creates the mailbox. */
export const SUPPORT_EMAIL = 'support@playtiaro.com';

export const challengeUrl = (code: string) => `${LINK_BASE}/c/${code}`;
export const inviteUrl = (ref: string) => `${LINK_BASE}/?r=${ref}`;
