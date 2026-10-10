/**
 * Share actions used from several screens; each one is counted (anonymously) in analytics. Every link carries this
 * player's code, and a friend opening it on another device earns a free hint (see `syncEarnedHints`).
 */
import { track } from '@/services/analytics';
import { shareText, type ShareStatus } from '@/services/share';
import { getRefCode } from '@/store/game-store';
import { S } from '@/strings';

import { challengeText, inviteText } from './messages';

export interface ShareOutcome {
  status: ShareStatus;
  text: string;
}

async function share(text: string): Promise<ShareOutcome> {
  return { status: await shareText(text), text };
}

export async function shareInvite() {
  track('invite_sent');
  return share(inviteText(getRefCode()));
}

export async function shareChallenge(r: { puzzleId: string; seconds: number }) {
  track('challenge_sent');
  return share(challengeText(r, getRefCode()));
}

/**
 * Note to show under a share button: once the link went out, how the hint is earned; on the web preview also
 * "copied", or the text itself to copy by hand when even copying is blocked.
 */
export function shareNote({ status, text }: ShareOutcome, copiedMessage: string): string | null {
  if (status === 'copied') return `${copiedMessage}\n${S.hintPending}`;
  if (status === 'failed') return `${S.copyFailed}\n\n${text}`;
  return status === 'shared' ? S.hintPending : null;
}
