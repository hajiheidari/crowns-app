/**
 * Past daily puzzles (spec §3.2). The last 7 days are free; older days unlock once with a
 * rewarded ad, or are always free for Remove-Ads owners.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { ScreenHeader } from '@/components/screen-header';
import { dateKey } from '@/engine';
import { AdBanner } from '@/features/monetization/ad-banner';
import { archiveLocked, archiveStart } from '@/features/monetization/policy';
import { watchRewarded } from '@/features/monetization/rewarded';
import { dailyId } from '@/features/puzzles/catalog';
import { MonthCalendar } from '@/features/stats/month-calendar';
import { usePalette } from '@/hooks/use-palette';
import { useGameStore } from '@/store/game-store';
import { S } from '@/strings';

export default function ArchiveScreen() {
  const { c } = usePalette();
  const router = useRouter();
  const today = dateKey();
  const daily = useGameStore((s) => s.daily);
  const games = useGameStore((s) => s.games);
  const meta = useGameStore((s) => s.meta);
  const [asking, setAsking] = useState<string | null>(null);

  const locked = (key: string) => archiveLocked(key, today, meta.removeAds, meta.archiveUnlocked);
  const open = (key: string) => router.push({ pathname: '/play/[id]', params: { id: dailyId(key) } });
  const onPressDay = (key: string) => (locked(key) ? setAsking(key) : open(key));
  const unlock = async (key: string) => {
    setAsking(null);
    if (!(await watchRewarded('archive'))) return;
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
            mark={(key) => (locked(key) ? 'locked' : games[dailyId(key)]?.board.some((m) => m) ? 'started' : null)}
          />
        </View>
        {!meta.removeAds && <Text style={[styles.help, { color: c.textSecondary }]}>{S.archiveHelp}</Text>}
      </ScrollView>
      <AdBanner />
      <ConfirmDialog
        visible={asking !== null}
        title={asking ? S.archiveUnlockTitle(S.dateLabel(asking)) : ''}
        body={S.archiveUnlockBody}
        confirmLabel={S.withAd(S.archiveUnlock)}
        onCancel={() => setAsking(null)}
        onConfirm={() => asking && unlock(asking)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 12, width: '100%', maxWidth: 560, alignSelf: 'center' },
  card: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  help: { fontSize: 14, textAlign: 'center' },
});
