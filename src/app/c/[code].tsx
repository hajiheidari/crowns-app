/**
 * Challenge landing (spec §3.9). Opened from a link like <LINK_BASE>/c/<code> or tiaro://c/<code>.
 * No server: the code itself carries the puzzle id and the friend's time.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CrownIcon } from '@/components/crown-icon';
import { ScreenHeader } from '@/components/screen-header';
import { decodeChallenge, formatTime } from '@/engine';
import { getPuzzle } from '@/features/puzzles/catalog';
import { shareChallenge, shareNote } from '@/features/share/actions';
import { puzzleTitle } from '@/features/share/messages';
import { usePalette } from '@/hooks/use-palette';
import { track } from '@/services/analytics';
import { noteInvitedBy, useGameStore } from '@/store/game-store';
import { DIFFICULTY_LABEL, S } from '@/strings';

export default function ChallengeRoute() {
  const { c } = usePalette();
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const challenge = useMemo(() => (code ? decodeChallenge(code) : null), [code]);
  const puzzle = useMemo(() => (challenge ? getPuzzle(challenge.puzzleId) : null), [challenge]);
  const mine = useGameStore((s) => (challenge ? s.games[challenge.puzzleId] : undefined));
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    noteInvitedBy(challenge?.ref);
    if (challenge) track('challenge_opened');
  }, [challenge]);

  const home = () => router.replace('/');

  if (!challenge || !puzzle) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
        <ScreenHeader title={S.challengeTitle} />
        <View style={styles.body}>
          <Text style={[styles.text, { color: c.text }]}>{S.challengeInvalid}</Text>
          <Button label={S.backHome} onPress={home} />
        </View>
      </SafeAreaView>
    );
  }

  const theirs = challenge.seconds;
  const hasTime = theirs > 0;
  const start = () =>
    router.replace({ pathname: '/play/[id]', params: hasTime ? { id: puzzle.id, vs: String(theirs) } : { id: puzzle.id } });

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
      <ScreenHeader title={S.challengeTitle} />
      <View style={styles.body}>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <CrownIcon size={56} color={c.gold} />
          <Text style={[styles.puzzle, { color: c.text }]}>{puzzleTitle(puzzle.id)}</Text>
          <Text style={[styles.meta, { color: c.textSecondary }]}>
            {DIFFICULTY_LABEL[puzzle.difficulty]} · {puzzle.n}×{puzzle.n}
          </Text>
          {hasTime && <Text style={[styles.time, { color: c.text }]}>{formatTime(theirs)}</Text>}
          <Text style={[styles.text, { color: c.text }]}>
            {mine?.solved ? S.challengeAlreadySolved(formatTime(mine.seconds)) : hasTime ? S.challengeBody(formatTime(theirs)) : S.challengeOpenBody}
          </Text>
          {mine?.solved && hasTime && (
            <Text style={[styles.verdict, { color: c.goldText }]}>
              {mine.seconds < theirs ? S.vsWin : mine.seconds > theirs ? S.vsLose : S.vsTie}
            </Text>
          )}
        </View>
        {mine?.solved ? (
          <>
            <Button
              label={S.challengeBack}
              onPress={async () =>
                setNote(shareNote(await shareChallenge({ puzzleId: puzzle.id, seconds: mine.seconds }), S.challengeCopied))
              }
            />
            {note && (
              <Text selectable style={[styles.note, { color: c.textSecondary }]}>
                {note}
              </Text>
            )}
            <Button label={S.home} variant="ghost" onPress={home} />
          </>
        ) : (
          <>
            <Button label={mine && mine.board.some((m) => m) ? S.continue : S.challengeStart} onPress={start} />
            <Button label={S.home} variant="ghost" onPress={home} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, padding: 24, gap: 12, justifyContent: 'center', width: '100%', maxWidth: 480, alignSelf: 'center' },
  card: { borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: 24, alignItems: 'center', gap: 6, marginBottom: 12 },
  puzzle: { fontSize: 26, fontWeight: '700', marginTop: 4 },
  meta: { fontSize: 15, fontWeight: '600' },
  time: { fontSize: 44, fontWeight: '300', fontVariant: ['tabular-nums'], marginTop: 8 },
  text: { fontSize: 17, lineHeight: 24, textAlign: 'center' },
  note: { fontSize: 13, textAlign: 'center' },
  verdict: { fontSize: 17, fontWeight: '700' },
});
