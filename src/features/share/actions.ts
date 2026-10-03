/** Share actions used from several screens; each one is counted (anonymously) in analytics. */
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
 * Note to show under a share button. Phones open the share sheet, so there is nothing to say; the web
 * preview copies instead and says so, or shows the text itself when even copying is blocked.
 */
export function shareNote({ status, text }: ShareOutcome, copiedMessage: string): string | null {
  if (status === 'copied') return copiedMessage;
  if (status === 'failed') return `${S.copyFailed}\n\n${text}`;
  return null;
}
