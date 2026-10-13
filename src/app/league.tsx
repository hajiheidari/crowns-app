/**
 * Friends league: this week's (or month's) brain points (since Saturday in Persian, Monday in English and Arabic) for the player and everyone connected by a shared link,
 * with last week's winner crowned. Players pick a nickname and an animal avatar; nothing else about them is shown.
 */
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ScreenHeader } from '@/components/screen-header';
import { RTL_TEXT, Text } from '@/components/text';
import { AVATARS } from '@/features/league/avatars';
import { shareInvite, shareNote } from '@/features/share/actions';
import { usePalette } from '@/hooks/use-palette';
import type { LeaguePlayer } from '@/services/invites';
import { issueCertificates, loadLeague, syncLeague, useGameStore } from '@/store/game-store';
import { getLanguage, isRTL, S } from '@/strings';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeagueScreen() {
  const { c } = usePalette();
  const router = useRouter();
  const meta = useGameStore((s) => s.meta);
  const [players, setPlayers] = useState<LeaguePlayer[] | null | 'error'>(null);
  const [editing, setEditing] = useState(!meta.nickname);
  const [name, setName] = useState(meta.nickname);
  const [avatar, setAvatar] = useState<string>(meta.avatar || AVATARS[0]);
  const [note, setNote] = useState<string | null>(null);
  const [kind, setKind] = useState<'week' | 'month'>('week');

  const refresh = useCallback(async () => setPlayers((await loadLeague(kind)) ?? 'error'), [kind]);
  useEffect(() => {
    void loadLeague(kind).then((p) => setPlayers(p ?? 'error'));
  }, [kind]);
  const pick = (k: 'week' | 'month') => {
    if (k === kind) return;
    setPlayers(null);
    setKind(k);
  };

  const save = async () => {
    const nickname = name.trim().slice(0, 16);
    if (!nickname) return;
    useGameStore.getState().updateMeta({ nickname, avatar });
    setEditing(false);
    void issueCertificates(true); // the new nickname on certificate pages too
    await syncLeague();
    await refresh();
  };

  const list = Array.isArray(players) ? players : [];
  const meIndex = list.findIndex((p) => p.me);
  const me = list[meIndex];
  const leader = list[0];
  const label = (p: LeaguePlayer) => (p.me ? `${meta.nickname || S.leaguePlayer} (${S.leagueYou})` : p.name || S.leaguePlayer);
  let headline: string | null = null;
  if (me && list.length > 1) {
    if (meIndex === 0 && me.score > 0) headline = S.leagueLeading;
    else if (meIndex > 0 && leader.score > me.score) headline = S.leagueBehind(leader.score - me.score, label(leader));
  }
  const inputFont = getLanguage() === 'en' || getLanguage() === 'ru' ? undefined : 'Vazirmatn-Regular';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
      <ScreenHeader title={S.leagueTitle} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {editing ? (
          <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.gold }]}>
            <Text style={[styles.setupTitle, { color: c.text }]}>{S.leagueSetupTitle}</Text>
            <Text style={[styles.hint, { color: c.textSecondary }]}>{S.leagueSetupHint}</Text>
            <View style={styles.avatars}>
              {AVATARS.map((a) => (
                <Pressable
                  key={a}
                  accessibilityRole="button"
                  accessibilityState={{ selected: a === avatar }}
                  onPress={() => setAvatar(a)}
                  style={[styles.avatarChoice, { backgroundColor: a === avatar ? c.gold + '55' : c.surfaceMuted }]}>
                  <Text style={styles.avatarText}>{a}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={name}
              onChangeText={setName}
              maxLength={16}
              placeholder={S.leagueNamePlaceholder}
              placeholderTextColor={c.textSecondary}
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={save}
              style={[
                styles.input,
                { color: c.text, borderColor: c.border, backgroundColor: c.background, fontFamily: inputFont },
                isRTL() && RTL_TEXT,
              ]}
            />
            <Button label={S.leagueSave} onPress={save} disabled={!name.trim()} />
          </View>
        ) : (
          <View style={styles.meRow}>
            <Text style={[styles.week, { color: c.textSecondary }]}>{kind === 'week' ? S.leagueWeek : S.leagueMonth}</Text>
            <Pressable accessibilityRole="button" onPress={() => setEditing(true)} hitSlop={8}>
              <Text style={[styles.edit, { color: c.text }]}>
                {meta.avatar || AVATARS[0]} {S.leagueEdit}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={[styles.tabs, { backgroundColor: c.surfaceMuted }]}>
          {(['week', 'month'] as const).map((k) => (
            <Pressable
              key={k}
              accessibilityRole="button"
              accessibilityState={{ selected: k === kind }}
              onPress={() => pick(k)}
              style={[styles.tab, k === kind && { backgroundColor: c.surface }]}>
              <Text style={[styles.tabText, { color: k === kind ? c.text : c.textSecondary }]}>
                {k === 'week' ? S.leagueTabWeek : S.leagueTabMonth}
              </Text>
            </Pressable>
          ))}
        </View>

        {headline && <Text style={[styles.headline, { color: c.text }]}>{headline}</Text>}

        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, paddingVertical: 6 }]}>
          {players === null ? (
            <ActivityIndicator style={styles.loading} color={c.textSecondary} />
          ) : players === 'error' ? (
            <Text style={[styles.hint, { color: c.textSecondary }]}>{S.leagueOffline}</Text>
          ) : (
            list.map((p, i) => (
              <View
                key={p.id}
                style={[
                  styles.row,
                  i < list.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.border },
                  p.me && { backgroundColor: c.gold + '22' },
                ]}>
                <Text style={styles.rank}>{p.score > 0 && i < 3 ? MEDALS[i] : String(i + 1)}</Text>
                <Text style={styles.avatar}>{p.me ? meta.avatar || p.emoji : p.emoji}</Text>
                <Text style={[styles.name, { color: c.text }, p.me && styles.bold]} numberOfLines={1}>
                  {label(p)}
                  {p.crown ? ' 👑' : ''}
                </Text>
                <Text style={[styles.score, { color: c.text }]}>{p.score}</Text>
              </View>
            ))
          )}
          {Array.isArray(players) && list.length <= 1 && (
            <Text style={[styles.hint, styles.empty, { color: c.textSecondary }]}>{S.leagueEmpty}</Text>
          )}
        </View>

        <Text style={[styles.note, { color: c.textSecondary }]}>{kind === 'week' ? S.leagueCrownNote : S.leagueCrownNoteMonth}</Text>
        <Button label={S.certOpen} variant="secondary" onPress={() => router.push('/certificates')} />
        <Button label={`🎁 ${S.leagueInvite}`} onPress={async () => setNote(shareNote(await shareInvite(), S.inviteCopied))} />
        {note && <Text selectable style={[styles.note, { color: c.text }]}>{note}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 18, gap: 12, maxWidth: 560, width: '100%', alignSelf: 'center' },
  card: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 10 },
  setupTitle: { fontSize: 17, fontWeight: '800' },
  hint: { fontSize: 13, lineHeight: 19 },
  avatars: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  avatarChoice: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 17 },
  tabs: { flexDirection: 'row', borderRadius: 12, padding: 3 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  tabText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  meRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  week: { fontSize: 13, fontWeight: '700', flexShrink: 1 },
  edit: { fontSize: 14, fontWeight: '700' },
  headline: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  loading: { paddingVertical: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 10 },
  rank: { width: 28, fontSize: 18, textAlign: 'center' },
  avatar: { fontSize: 22 },
  name: { flex: 1, fontSize: 16 },
  bold: { fontWeight: '800' },
  score: { fontSize: 17, fontWeight: '800', fontVariant: ['tabular-nums'] },
  empty: { paddingVertical: 8, textAlign: 'center' },
  note: { fontSize: 12, textAlign: 'center' },
});
