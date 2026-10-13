import { useRouter } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CrownIcon } from '@/components/crown-icon';
import { BackIcon, CrossIcon } from '@/components/icons';
import { ScreenHeader } from '@/components/screen-header';
import { usePalette } from '@/hooks/use-palette';
import { disableDailyReminder, enableDailyReminder, remindersSupported } from '@/services/notifications';
import { formatBackupKey, getBackupKey, parseBackupKey, restoreBackup, syncBackup, useGameStore, type Settings } from '@/store/game-store';
import { formatClock, isRTL, S } from '@/strings';
import { PRIVACY_URL, PRIVACY_URL_FA, SUPPORT_EMAIL, TERMS_URL } from '@/constants/links';
import { APP_VERSION } from '@/constants/version';
import { shareInvite, shareNote } from '@/features/share/actions';
import { STORE } from '@/constants/store';
import { LANGUAGES } from '@/i18n';
import { track } from '@/services/analytics';
import { MONO, Text } from '@/components/text';
import { Button } from '@/components/button';
import { copyText } from '@/services/share';

const REMINDER_HOURS = [7, 9, 12, 18, 20];

export default function SettingsScreen() {
  const { c } = usePalette();
  const router = useRouter();
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const updateMeta = useGameStore((s) => s.updateMeta);
  const [inviteNote, setInviteNote] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  /** Changes a simple setting and counts which settings people change (name and value only). */
  const change = <K extends 'autoCross' | 'dragToMark' | 'highlightConflicts' | 'showTimer' | 'haptics' | 'patterns' | 'tapOrder' | 'theme' | 'language'>(
    key: K,
    value: Settings[K],
  ) => {
    updateSettings({ [key]: value });
    track('setting_changed', { name: key, value: String(value) });
  };
  const toggle = (key: 'autoCross' | 'dragToMark' | 'highlightConflicts' | 'showTimer' | 'haptics' | 'patterns') => change(key, !settings[key]);

  const setReminder = async (enabled: boolean, hour = settings.reminder.hour) => {
    updateMeta({ reminderAsked: true });
    if (!enabled) {
      updateSettings({ reminder: { ...settings.reminder, enabled: false } });
      await disableDailyReminder();
      return;
    }
    const ok = await enableDailyReminder(hour, 0);
    setDenied(!ok);
    if (ok && !settings.reminder.enabled) track('reminder_enabled');
    updateSettings({ reminder: { enabled: ok, hour, minute: 0 } });
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background }]}>
      <ScreenHeader title={S.settings} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Section title={S.gameplay}>
          <Row label={S.autoCross} help={S.autoCrossHelp}>
            <Switch accessibilityLabel={S.autoCross} value={settings.autoCross} onValueChange={() => toggle('autoCross')} />
          </Row>
          <Row label={S.tapOrder}>
            <Segmented
              value={settings.tapOrder}
              options={[
                { value: 'cross-first', label: S.tapFirst, a11y: S.tapCrossFirst, icon: 'cross' },
                { value: 'crown-first', label: S.tapFirst, a11y: S.tapCrownFirst, icon: 'crown' },
              ]}
              onChange={(tapOrder) => change('tapOrder', tapOrder)}
            />
          </Row>
          <Row label={S.dragToMark}>
            <Switch accessibilityLabel={S.dragToMark} value={settings.dragToMark} onValueChange={() => toggle('dragToMark')} />
          </Row>
          <Row label={S.highlightConflicts}>
            <Switch accessibilityLabel={S.highlightConflicts} value={settings.highlightConflicts} onValueChange={() => toggle('highlightConflicts')} />
          </Row>
          <Row label={S.showTimer}>
            <Switch accessibilityLabel={S.showTimer} value={settings.showTimer} onValueChange={() => toggle('showTimer')} />
          </Row>
          <Row label={S.haptics} last>
            <Switch accessibilityLabel={S.haptics} value={settings.haptics} onValueChange={() => toggle('haptics')} />
          </Row>
        </Section>

        <Section title={S.appearance}>
          <Row label={S.language}>
            <Segmented
              value={settings.language}
              options={LANGUAGES.map((l) => ({ value: l, label: S.languageNames[l] }))}
              onChange={(language) => change('language', language)}
            />
          </Row>
          <Row label={S.theme}>
            <Segmented
              value={settings.theme}
              options={[
                { value: 'system', label: S.themeSystem },
                { value: 'light', label: S.themeLight },
                { value: 'dark', label: S.themeDark },
              ]}
              onChange={(theme) => change('theme', theme)}
            />
          </Row>
          <Row label={S.patterns} help={S.patternsHelp} last>
            <Switch accessibilityLabel={S.patterns} value={settings.patterns} onValueChange={() => toggle('patterns')} />
          </Row>
        </Section>

        <Section title={S.reminders}>
          <Row label={S.dailyReminder} last={!settings.reminder.enabled}>
            <Switch accessibilityLabel={S.dailyReminder}
              value={settings.reminder.enabled}
              disabled={!remindersSupported}
              onValueChange={(v) => setReminder(v)}
            />
          </Row>
          {settings.reminder.enabled && (
            <View style={styles.chips}>
              {REMINDER_HOURS.map((h) => (
                <Chip key={h} label={formatClock(h, 0)} selected={settings.reminder.hour === h} onPress={() => setReminder(true, h)} />
              ))}
            </View>
          )}
          {!remindersSupported && <Text style={[styles.note, { color: c.textSecondary }]}>{S.remindersWebNote}</Text>}
          {denied && <Text style={[styles.note, { color: c.danger }]}>{S.reminderDenied}</Text>}
        </Section>

        <BackupSection />

        <Section title={S.help}>
          <LinkRow label={S.howToPlay} onPress={() => router.push('/tutorial')} />
          <LinkRow
            label={S.contactSupport}
            onPress={() => openLink(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(S.supportSubject(APP_VERSION))}`)}
          />
          <LinkRow label={S.privacyPolicy} onPress={() => openLink(STORE === 'bazaar' ? PRIVACY_URL_FA : PRIVACY_URL)} />
          <LinkRow label={S.termsOfUse} onPress={() => openLink(TERMS_URL)} last />
        </Section>

        <Section title={S.shareSection}>
          <LinkRow
            label={S.inviteFriends}
            onPress={async () => setInviteNote(shareNote(await shareInvite(), S.inviteCopied))}
            last
          />
          {inviteNote && <Text selectable style={[styles.note, { color: c.textSecondary }]}>{inviteNote}</Text>}
        </Section>

        <Text style={[styles.footer, { color: c.textSecondary }]}>{S.version(APP_VERSION)}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Recovery code + restore (Amir 2026-10-11). The code unlocks the online backup on any device (web too); on iPhone the
 * keychain keeps it through a reinstall, so Home restores by itself there.
 */
function BackupSection() {
  const { c } = usePalette();
  const [key, setKey] = useState<string | null>(useGameStore.getState().meta.backupKey);
  const [loading, setLoading] = useState(!key);
  const [typed, setTyped] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    // Opening this section uploads the latest progress, so the code always unlocks what the player sees now.
    getBackupKey().then((k) => {
      setKey(k);
      setLoading(false);
      if (k) void syncBackup(true);
    });
  }, []);

  const ask = () => {
    const parsed = parseBackupKey(typed);
    setNote(parsed ? null : S.backupBadCode);
    setConfirm(parsed);
  };
  const restore = async () => {
    if (!confirm) return;
    setBusy(true);
    const result = await restoreBackup(confirm);
    setBusy(false);
    setConfirm(null);
    if (result === 'ok') {
      setKey(confirm);
      setTyped('');
    }
    setNote(result === 'ok' ? S.backupDone : result === 'missing' ? S.backupMissing : S.backupOffline);
  };

  return (
    <Section title={S.backupSection}>
      <View style={styles.backupBox}>
        <Text style={[styles.rowLabel, { color: c.text }]}>{S.backupCodeLabel}</Text>
        {key ? (
          <Text selectable style={[styles.code, { color: c.text }]}>{formatBackupKey(key)}</Text>
        ) : (
          <Text style={[styles.rowHelp, { color: c.textSecondary }]}>{loading ? S.backupLoading : S.backupOffline}</Text>
        )}
        {key && (
          <Button
            label={S.backupCopy}
            variant="secondary"
            onPress={async () => {
              await copyText(formatBackupKey(key));
              setNote(S.backupCopied);
            }}
          />
        )}
        <Text style={[styles.rowHelp, { color: c.textSecondary }]}>{S.backupHelp}</Text>
      </View>
      <View style={[styles.backupBox, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
        <Text style={[styles.rowLabel, { color: c.text }]}>{S.backupRestore}</Text>
        <TextInput
          value={typed}
          onChangeText={(t) => {
            setTyped(t);
            setConfirm(null);
          }}
          placeholder={S.backupPlaceholder}
          placeholderTextColor={c.textSecondary}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={20}
          returnKeyType="done"
          onSubmitEditing={ask}
          style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.background, fontFamily: MONO }]}
        />
        {confirm ? (
          <>
            <Text style={[styles.rowHelp, { color: c.text }]}>{S.backupConfirm}</Text>
            <View style={styles.backupButtons}>
              <Button label={S.backupCancel} variant="secondary" onPress={() => setConfirm(null)} style={styles.flex} />
              <Button label={S.backupConfirmYes} onPress={restore} disabled={busy} style={styles.flex} />
            </View>
          </>
        ) : (
          <Button label={S.backupRestoreGo} variant="secondary" onPress={ask} disabled={!typed.trim()} />
        )}
      </View>
      {note && <Text style={[styles.note, { color: c.textSecondary }]}>{note}</Text>}
    </Section>
  );
}

/** Opens a web page or the mail app; failures (no mail app, offline) are ignored. */
function openLink(url: string) {
  Linking.openURL(url).catch(() => {});
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { c } = usePalette();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>{title.toUpperCase()}</Text>
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>{children}</View>
    </View>
  );
}

function Row({ label, help, last, children }: { label: string; help?: string; last?: boolean; children?: ReactNode }) {
  const { c } = usePalette();
  return (
    <View style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }]}>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: c.text }]}>{label}</Text>
        {help && <Text style={[styles.rowHelp, { color: c.textSecondary }]}>{help}</Text>}
      </View>
      {children}
    </View>
  );
}

function LinkRow({ label, onPress, last, value }: { label: string; onPress: () => void; last?: boolean; value?: string }) {
  const { c } = usePalette();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={value ? `${label}, ${value}` : label} onPress={onPress}>
      {({ pressed }) => (
        <View style={{ opacity: pressed ? 0.6 : 1 }}>
          <Row label={label} last={last}>
            {value ? (
              <Text style={[styles.value, { color: c.text }]}>{value}</Text>
            ) : (
              <BackIcon size={18} color={c.textSecondary} flip={!isRTL()} />
            )}
          </Row>
        </View>
      )}
    </Pressable>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; a11y?: string; icon?: 'cross' | 'crown' }[];
  onChange: (v: T) => void;
}) {
  const { c } = usePalette();
  return (
    <View style={[styles.segmented, { backgroundColor: c.surfaceMuted }]}>
      {options.map((o) => {
        const on = o.value === value;
        const color = on ? c.text : c.textSecondary;
        const icon = o.icon === 'cross' ? <CrossIcon size={14} color={color} /> : o.icon === 'crown' ? <CrownIcon size={17} color={on ? c.gold : color} /> : null;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityLabel={o.a11y ?? o.label}
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[styles.segment, icon && styles.segmentWithIcon, on && { backgroundColor: c.surface }]}>
            {icon && S.tapIconFirst && icon}
            <Text style={[styles.segmentText, { color }]} maxFontSizeMultiplier={1.4}>{o.label}</Text>
            {icon && !S.tapIconFirst && icon}
          </Pressable>
        );
      })}
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { c } = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: selected ? c.primary : c.surfaceMuted }]}>
      <Text style={[styles.chipText, { color: selected ? c.onPrimary : c.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 20, maxWidth: 560, width: '100%', alignSelf: 'center' },
  section: { gap: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginStart: 4 },
  card: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14 },
  // Wraps so a control drops below its label at large font sizes instead of squeezing the label.
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', minHeight: 52, columnGap: 12, rowGap: 8, paddingVertical: 8 },
  rowText: { flex: 1, minWidth: 76, gap: 2 },
  rowLabel: { fontSize: 16 },
  rowHelp: { fontSize: 12 },
  value: { fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  segmented: { flexDirection: 'row', borderRadius: 10, padding: 3 },
  segment: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  segmentWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  segmentText: { fontSize: 13, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 12 },
  chip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { fontSize: 13, fontWeight: '600' },
  note: { fontSize: 13, paddingBottom: 12 },
  footer: { textAlign: 'center', fontSize: 12 },
  backupBox: { gap: 10, paddingVertical: 12 },
  // Latin letters and digits in every language (the monospace font skips Persian digits), read left to right.
  code: { fontFamily: MONO, fontSize: 22, fontWeight: '700', letterSpacing: 2, textAlign: 'center', writingDirection: 'ltr' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 18, textAlign: 'center', letterSpacing: 1 },
  backupButtons: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
});
