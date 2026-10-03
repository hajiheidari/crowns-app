/**
 * Opt-in daily reminder (local notification, no server).
 * Only on iOS / Android; the web preview has no notifications.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const remindersSupported = Platform.OS === 'ios' || Platform.OS === 'android';

if (remindersSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Ask for permission (if needed) and schedule the reminder. Returns false if the user said no. */
export async function enableDailyReminder(hour: number, minute: number): Promise<boolean> {
  if (!remindersSupported) return false;
  const current = await Notifications.getPermissionsAsync();
  const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return false;
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Your daily Tiaro puzzle is ready 👑', body: 'A fresh puzzle is waiting. Keep your streak going!' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
  return true;
}

export async function disableDailyReminder(): Promise<void> {
  if (remindersSupported) await Notifications.cancelAllScheduledNotificationsAsync();
}
