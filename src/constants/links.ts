/**
 * Public links. The domain is a placeholder until Amir picks one (CLAUDE.md "Decisions pending");
 * change LINK_BASE and the `web/` landing page together.
 *
 *   <LINK_BASE>/c/<code>   challenge link (code from engine `encodeChallenge`)
 *   <LINK_BASE>/?r=<ref>   invite link
 */
export const LINK_BASE = 'https://playcrowns.com';

export const challengeUrl = (code: string) => `${LINK_BASE}/c/${code}`;
export const inviteUrl = (ref: string) => `${LINK_BASE}/?r=${ref}`;
