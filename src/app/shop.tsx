/**
 * Shop (1.1): board styles, crowns and hint packs, bought with coins. Bought items stay owned (`meta.owned`, also in the
 * backup); the style in use is a setting.
 */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { CrownIcon } from '@/components/crown-icon';
import { ScreenHeader } from '@/components/screen-header';
import { Text } from '@/components/text';
import { CoinsSheet } from '@/features/coins/coins-sheet';
import { BOARD_THEMES, CROWN_STYLES, HINT_PACKS, type BoardTheme, type CrownStyle } from '@/features/shop/catalog';
import { usePalette } from '@/hooks/use-palette';
import { track } from '@/services/analytics';
import { spendCoins, useGameStore } from '@/store/game-store';
import { S } from '@/strings';

/** A tiny 4×4 board in the style's colors (the same regions every time). */
const PREVIEW = [0, 0, 2, 2, 1, 0, 2, 3, 1, 5, 5, 3, 6, 6, 5, 7];

export default function ShopScreen() {
  const { c, dark } = usePalette();
  const coins = useGameStore((s) => s.meta.coins);
  const owned = useGameStore((s) => s.meta.owned);
  const hints = useGameStore((s) => s.meta.hintCredits);
  const settings = useGameStore((s) => s.settings);
  const [need, setNeed] = useState<number | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const has = (id: string, price: number) => price === 0 || owned.includes(id);
  const buy = (id: string, price: number, then: () => void) => {
    if (!spendCoins(price)) return setNeed(price);
    track('shop_buy', { item: id, price });
    then();
    setNote(S.shopBought);
  };
  const own = (id: string) => {
    const m = useGameStore.getState().meta;
    useGameStore.getState().updateMeta({ owned: [...m.owned, id] });
  };
  const pickBoard = (t: BoardTheme) =>
    has(`board-${t.id}`, t.price)
      ? useGameStore.getState().updateSettings({ boardTheme: t.id })
      : buy(`board-${t.id}`, t.price, () => {
          own(`board-${t.id}`);
          useGameStore.getState().updateSettings({ boardTheme: t.id });
        });
  const pickCrown = (k: CrownStyle) =>
    has(`crown-${k.id}`, k.price)
      ? useGameStore.getState().updateSettings({ crownStyle: k.id })
      : buy(`crown-${k.id}`, k.price, () => {
          own(`crown-${k.id}`);
          useGameStore.getState().updateSettings({ crownStyle: k.id });
        });
  const buyHints = (id: string, n: number, price: number) =>
    buy(id, price, () => {
      const m = useGameStore.getState().meta;
      useGameStore.getState().updateMeta({ hintCredits: m.hintCredits + n });
    });

  const label = (ownedNow: boolean, inUse: boolean, price: number) =>
    inUse ? S.shopInUse : ownedNow ? S.shopUse : price === 0 ? S.shopFree : `${price} 🪙`;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
      <ScreenHeader title={S.shopTitle} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setNeed(0)}
          style={[styles.balance, { backgroundColor: c.gold + '2E', borderColor: c.gold }]}>
          <Text style={[styles.balanceText, { color: c.text }]}>🪙 {coins}</Text>
          <Text style={[styles.balanceLink, { color: c.text }]}>{S.coinsWays}</Text>
        </Pressable>
        {note && <Text style={[styles.note, { color: c.text }]}>{note}</Text>}

        <Text style={[styles.section, { color: c.text }]}>{S.shopBoards}</Text>
        <Text style={[styles.help, { color: c.textSecondary }]}>{S.shopPreviewNote}</Text>
        <View style={styles.grid}>
          {BOARD_THEMES.map((t) => {
            const ownedNow = has(`board-${t.id}`, t.price);
            const inUse = settings.boardTheme === t.id;
            const colors = dark ? t.dark : t.light;
            const frame = t.frame ? (dark ? t.frame.dark : t.frame.light) : c.gridThick;
            return (
              <Item key={t.id} title={S.boardThemeNames[t.id] ?? t.id} button={label(ownedNow, inUse, t.price)} inUse={inUse} onPress={() => pickBoard(t)}>
                <View style={[styles.mini, { borderColor: frame }]}>
                  {PREVIEW.map((r, i) => (
                    <View key={i} style={[styles.miniCell, { backgroundColor: colors[r] }]} />
                  ))}
                </View>
              </Item>
            );
          })}
        </View>

        <Text style={[styles.section, { color: c.text }]}>{S.shopCrowns}</Text>
        <View style={styles.grid}>
          {CROWN_STYLES.map((k) => {
            const ownedNow = has(`crown-${k.id}`, k.price);
            const inUse = settings.crownStyle === k.id;
            return (
              <Item key={k.id} title={S.crownNames[k.id] ?? k.id} button={label(ownedNow, inUse, k.price)} inUse={inUse} onPress={() => pickCrown(k)}>
                <View style={[styles.crownBox, { backgroundColor: c.surfaceMuted }]}>
                  <CrownIcon size={56} color={k.fill ?? c.mark} gem={k.gem} />
                </View>
              </Item>
            );
          })}
        </View>

        <Text style={[styles.section, { color: c.text }]}>{S.shopHints}</Text>
        <Text style={[styles.help, { color: c.textSecondary }]}>{S.shopHintsLeft(hints)}</Text>
        <View style={styles.packs}>
          {HINT_PACKS.map((p) => (
            <View key={p.id} style={[styles.pack, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.packTitle, { color: c.text }]}>💡 {S.shopHintPack(p.hints)}</Text>
              <Button label={`${p.price} 🪙`} onPress={() => buyHints(p.id, p.hints, p.price)} style={styles.packButton} />
            </View>
          ))}
        </View>
      </ScrollView>
      <CoinsSheet visible={need !== null} need={need || undefined} onClose={() => setNeed(null)} />
    </SafeAreaView>
  );
}

function Item({ title, button, inUse, onPress, children }: { title: string; button: string; inUse: boolean; onPress: () => void; children: React.ReactNode }) {
  const { c } = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${button}`}
      accessibilityState={{ selected: inUse }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        { backgroundColor: c.surface, borderColor: inUse ? c.gold : c.border, opacity: pressed ? 0.75 : 1 },
        inUse && styles.itemInUse,
      ]}>
      {children}
      <Text style={[styles.itemTitle, { color: c.text }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={[styles.itemButton, { backgroundColor: inUse ? c.gold + '33' : c.surfaceMuted }]}>
        <Text style={[styles.itemButtonText, { color: c.text }]}>{button}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 12, maxWidth: 720, width: '100%', alignSelf: 'center' },
  balance: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderRadius: 18, padding: 14 },
  balanceText: { fontSize: 26, fontWeight: '800', fontVariant: ['tabular-nums'] },
  balanceLink: { fontSize: 14, fontWeight: '700' },
  note: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  section: { fontSize: 20, fontWeight: '800', marginTop: 6 },
  help: { fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  item: { flexGrow: 1, flexBasis: 150, maxWidth: 230, borderRadius: 16, borderWidth: 1, padding: 10, gap: 8, alignItems: 'center' },
  itemInUse: { borderWidth: 2.5 },
  itemTitle: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  itemButton: { alignSelf: 'stretch', borderRadius: 10, paddingVertical: 7, alignItems: 'center' },
  itemButtonText: { fontSize: 14, fontWeight: '800', textAlign: 'center' },
  mini: { width: 92, height: 92, flexDirection: 'row', flexWrap: 'wrap', borderWidth: 2.5, borderRadius: 6, overflow: 'hidden', direction: 'ltr' },
  miniCell: { width: '25%', height: '25%' },
  crownBox: { width: 92, height: 92, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  packs: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pack: { flexGrow: 1, flexBasis: 150, borderRadius: 16, borderWidth: 1, padding: 12, gap: 8, alignItems: 'center' },
  packTitle: { fontSize: 16, fontWeight: '800' },
  packButton: { alignSelf: 'stretch', minHeight: 40 },
});
