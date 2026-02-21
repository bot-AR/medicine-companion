import {
  scheduleDoseNotifications,
  cancelNotifications,
} from '../../services/notifications';

export async function handleNotification(
  action: 'schedule' | 'cancel',
  payload: Record<string, unknown>,
) {
  if (action === 'schedule') {
    const ids = await scheduleDoseNotifications(
      payload.medicineName as string,
      payload.scheduledTimes as string[],
      payload.scheduleId as string | undefined,
    );
    return { success: true, notificationIds: ids };
  }

  if (action === 'cancel') {
    await cancelNotifications(payload.notificationIds as string[]);
    return { success: true };
  }

  return { success: false };
}
