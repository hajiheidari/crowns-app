/**
 * Past daily puzzles (spec §3.2). The last 7 days are free; older days unlock once with a
 * rewarded ad, or are always free for Remove-Ads owners.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { ScreenHeader } from '@/components/screen-header';
import { dateKey } from '@/engine';
import { archiveLocked, archiveStart } from '@/features/monetization/policy';
import { CoinsSheet } from '@/features/coins/coins-sheet';
import { COINS } from '@/features/coins/policy';
import { dailyIdFor } from '@/features/puzzles/catalog';
import { MonthCalendar } from '@/features/stats/month-calendar';
import { usePalette } from '@/hooks/use-palette';
import { spendCoins, useGameStore } from '@/store/game-store';
import { S } from '@/strings';
import { Text } from '@/components/text';

export default function ArchiveScreen() {
  const { c } = usePalette();
  const router = useRouter();
  const today = dateKey();
  const daily = useGameStore((s) => s.daily);
  const games = useGameStore((s) => s.games);
  const meta = useGameStore((s) => s.meta);
  const [asking, setAsking] = useState<string | null>(null);

  const [needCoins, setNeedCoins] = useState(false);
  const locked = (key: string) => archiveLocked(key, today, meta.archiveUnlocked);
  const open = (key: string) => router.push({ pathname: '/play/[id]', params: { id: dailyIdFor(key, meta.installedKey) } });
  const onPressDay = (key: string) => (locked(key) ? setAsking(key) : open(key));
  const unlock = (key: string) => {
    setAsking(null);
    if (!spendCoins(COINS.archiveDay)) return setNeedCoins(true);
    const m = useGameStore.getState().meta;
    useGameStore.getState().updateMeta({ archiveUnlocked: [...m.archiveUnlocked, key] });
    open(key);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
      <ScreenHeader title={S.archive} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <MonthCalendar
            solved={daily.solved}
            minKey={archiveStart(today)}
            onPressDay={onPressDay}
            mark={(key) => (locked(key) ? 'locked' : games[dailyIdFor(key, meta.installedKey)]?.board.some((m) => m) ? 'started' : null)}
          />
        </View>
        <Text style={[styles.help, { color: c.textSecondary }]}>{S.archiveHelp}</Text>
      </ScrollView>
      <ConfirmDialog
        visible={asking !== null}
        title={asking ? S.archiveUnlockTitle(S.dateLabel(asking)) : ''}
        body={S.archiveUnlockBody}
        confirmLabel={S.archiveUnlock}
        onCancel={() => setAsking(null)}
        onConfirm={() => asking && unlock(asking)}
      />
      <CoinsSheet visible={needCoins} need={COINS.archiveDay} onClose={() => setNeedCoins(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 12, width: '100%', maxWidth: 560, alignSelf: 'center' },
  card: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  help: { fontSize: 14, textAlign: 'center' },
});
