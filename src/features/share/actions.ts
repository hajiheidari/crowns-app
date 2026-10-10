/**
 * Share actions used from several screens; each one is counted (anonymously) in analytics and pays the free hints
 * it earns (see `HINT_REWARDS`).
 */
import { track } from '@/services/analytics';
import { shareText, type ShareStatus } from '@/services/share';
import { earnHints, getRefCode } from '@/store/game-store';
import { S } from '@/strings';

import { challengeText, inviteText } from './messages';

export interface ShareOutcome {
  status: ShareStatus;
  text: string;
  /** Free hints this share earned. */
  earned: number;
}

const went = (status: ShareStatus) => status === 'shared' || status === 'copied';

/** Pays the hint reward for a finished share. */
export function rewardShare(status: ShareStatus, action: Parameters<typeof earnHints>[0]): number {
  return went(status) ? earnHints(action) : 0;
}

export async function shareInvite(): Promise<ShareOutcome> {
  track('invite_sent');
  const text = inviteText(getRefCode());
  const status = await shareText(text);
  return { status, text, earned: rewardShare(status, { kind: 'invite' }) };
}

export async function shareChallenge(r: { puzzleId: string; seconds: number }): Promise<ShareOutcome> {
  track('challenge_sent');
  const text = challengeText(r, getRefCode());
  const status = await shareText(text);
  return { status, text, earned: rewardShare(status, { kind: 'share', puzzleId: r.puzzleId }) };
}

/**
 * Note to show under a share button: the hints it earned, plus (web preview only) "copied" or the text itself
 * to copy by hand when even copying is blocked. Phones open the share sheet, so nothing else needs saying there.
 */
export function shareNote({ status, text, earned }: ShareOutcome, copiedMessage: string): string | null {
  const reward = earned > 0 ? S.hintEarned(earned) : null;
  if (status === 'copied') return reward ? `${copiedMessage}\n${reward}` : copiedMessage;
  if (status === 'failed') return `${S.copyFailed}\n\n${text}`;
  return reward;
}
