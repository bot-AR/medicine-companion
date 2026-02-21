import * as Notifications from 'expo-notifications';

export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDoseNotifications(
  medicineName: string,
  times: string[],
  scheduleId?: string,
): Promise<string[]> {
  const ids: string[] = [];
  for (const time of times) {
    const [hour, minute] = time.split(':').map(Number);
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `💊 Time for ${medicineName}`,
        body: 'Tap to log your dose',
        sound: true,
        data: { scheduleId, medicineName, time },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    ids.push(id);
  }
  return ids;
}

export async function cancelNotifications(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)),
  );
}
