/** Share actions used from several screens; each one is counted (anonymously) in analytics. */
import { track } from '@/services/analytics';
import { shareText } from '@/services/share';
import { getRefCode } from '@/store/game-store';

import { challengeText, inviteText } from './messages';

/** Returns 'copied' when the web preview put the text on the clipboard instead of sharing. */
export async function shareInvite() {
  track('invite_sent');
  return shareText(inviteText(getRefCode()));
}

export async function shareChallenge(r: { puzzleId: string; seconds: number }) {
  track('challenge_sent');
  return shareText(challengeText(r, getRefCode()));
}
