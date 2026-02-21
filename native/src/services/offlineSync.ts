import { getOfflineQueue, clearOfflineQueue, saveDoseLog } from './storage';

export async function drainOfflineQueue(): Promise<number> {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return 0;

  for (const item of queue) {
    await saveDoseLog(item);
  }

  await clearOfflineQueue();
  return queue.length;
}
