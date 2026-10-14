/**
 * "Get coins": the balance, how much is missing, and every way to earn (rewarded ad where the build has an ad network,
 * inviting friends, the daily bonus, winning). Opened when something costs more coins than the player has, and from
 * the coin chip on Home.
 */
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { CoinIcon } from '@/components/coin-icon';
import { Text } from '@/components/text';
import { shareInvite, shareNote } from '@/features/share/actions';
import { usePalette } from '@/hooks/use-palette';
import { rewardedAvailable } from '@/services/ads';
import { useGameStore, watchAdForCoins } from '@/store/game-store';
import { dirStyle, S } from '@/strings';

import { COINS } from './policy';

interface Props {
  visible: boolean;
  /** Coins the player wanted to spend (shows how many are missing). */
  need?: number;
  onClose: () => void;
}

export function CoinsSheet({ visible, need, onClose }: Props) {
  const { c } = usePalette();
  const router = useRouter();
  const coins = useGameStore((s) => s.meta.coins);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const missing = need !== undefined ? need - coins : 0;

  const watch = async () => {
    setBusy(true);
    const r = await watchAdForCoins();
    setBusy(false);
    setNote(r === 'earned' ? S.coinsEarned(COINS.rewardedAd) : r === 'limit' ? S.coinsAdLimit : r === 'unavailable' ? S.coinsAdUnavailable : null);
  };
  const invite = async () => setNote(shareNote(await shareInvite(), S.inviteCopied));
  const close = () => {
    setNote(null);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={close}>
      <Pressable style={[styles.backdrop, dirStyle()]} onPress={close}>
        <Pressable style={[styles.card, { backgroundColor: c.surface }]} onPress={() => {}}>
          <View style={styles.balanceRow}>
            <CoinIcon size={32} />
            <Text style={[styles.balance, { color: c.text }]}>{coins}</Text>
          </View>
          <Text style={[styles.title, { color: c.text }]}>{missing > 0 ? S.coinsNotEnough : S.coinsWays}</Text>
          {missing > 0 && <Text style={[styles.body, { color: c.textSecondary }]}>{S.coinsNeed(missing)}</Text>}
          {rewardedAvailable && (
            <Way icon="🎬" title={S.coinsWatchAd} sub={S.coinsWatchAdSub(COINS.rewardedAd, COINS.adsPerDay)}>
              <Button label={`+${COINS.rewardedAd} 🪙`} onPress={() => !busy && watch()} style={styles.wayButton} />
            </Way>
          )}
          <Way icon="🎁" title={S.inviteFriends} sub={S.coinsInviteSub(COINS.perFriend)}>
            <Button label={`+${COINS.perFriend} 🪙`} variant="secondary" onPress={invite} style={styles.wayButton} />
          </Way>
          <Way icon="📅" title={S.coinsLogin} sub={S.coinsLoginSub(COINS.login[0], COINS.login[COINS.login.length - 1])} />
          <Way icon="🏆" title={S.coinsWin} sub={S.coinsWinSub(COINS.dailyWin, COINS.win.hard, COINS.win.expert)} />
          {note && <Text selectable style={[styles.note, { color: c.text }]}>{note}</Text>}
          <View style={styles.row}>
            <Button label={S.close} variant="secondary" onPress={close} style={styles.flex} />
            <Button
              label={`🛍 ${S.shopTitle}`}
              onPress={() => {
                close();
                router.push('/shop');
              }}
              style={styles.flex}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Way({ icon, title, sub, children }: { icon: string; title: string; sub: string; children?: React.ReactNode }) {
  const { c } = usePalette();
  return (
    <View style={[styles.way, { backgroundColor: c.surfaceMuted }]}>
      <Text style={styles.wayIcon}>{icon}</Text>
      <View style={styles.wayText}>
        <Text style={[styles.wayTitle, { color: c.text }]}>{title}</Text>
        <Text style={[styles.waySub, { color: c.textSecondary }]}>{sub}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 400, borderRadius: 22, padding: 18, gap: 10 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  balance: { fontSize: 30, fontWeight: '800', textAlign: 'center', fontVariant: ['tabular-nums'] },
  title: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  body: { fontSize: 14, textAlign: 'center' },
  way: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 10 },
  wayIcon: { fontSize: 22 },
  wayText: { flex: 1, gap: 1 },
  wayTitle: { fontSize: 15, fontWeight: '700' },
  waySub: { fontSize: 12 },
  wayButton: { minHeight: 38, paddingHorizontal: 12 },
  note: { fontSize: 13, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 10, marginTop: 4 },
  flex: { flex: 1 },
});
