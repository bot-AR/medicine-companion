import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  medicines: '@mc/medicines_v1',
  schedules: '@mc/schedules_v1',
  doseLogs: '@mc/dose_logs_v1',
  profile: '@mc/profile_v1',
  offlineQueue: '@mc/offline_queue_v1',
};

export async function getMedicines(): Promise<Record<string, unknown>[]> {
  const raw = await AsyncStorage.getItem(KEYS.medicines);
  return raw ? JSON.parse(raw) : [];
}

export async function saveMedicine(med: Record<string, unknown>): Promise<void> {
  const list = await getMedicines();
  const updated = [...list.filter((m) => m.id !== med.id), med];
  await AsyncStorage.setItem(KEYS.medicines, JSON.stringify(updated));
}

export async function getSchedules(): Promise<Record<string, unknown>[]> {
  const raw = await AsyncStorage.getItem(KEYS.schedules);
  return raw ? JSON.parse(raw) : [];
}

export async function saveSchedule(sched: Record<string, unknown>): Promise<void> {
  const list = await getSchedules();
  const updated = [...list.filter((s) => s.id !== sched.id), sched];
  await AsyncStorage.setItem(KEYS.schedules, JSON.stringify(updated));
}

export async function getDoseLogs(): Promise<Record<string, unknown>[]> {
  const raw = await AsyncStorage.getItem(KEYS.doseLogs);
  return raw ? JSON.parse(raw) : [];
}

export async function saveDoseLog(log: Record<string, unknown>): Promise<void> {
  const list = await getDoseLogs();
  const updated = [...list.filter((l) => l.id !== log.id), log];
  await AsyncStorage.setItem(KEYS.doseLogs, JSON.stringify(updated));
}

export async function getProfile(): Promise<Record<string, unknown> | null> {
  const raw = await AsyncStorage.getItem(KEYS.profile);
  return raw ? JSON.parse(raw) : null;
}

export async function saveProfile(profile: Record<string, unknown>): Promise<void> {
  await AsyncStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

export async function getOfflineQueue(): Promise<Record<string, unknown>[]> {
  const raw = await AsyncStorage.getItem(KEYS.offlineQueue);
  return raw ? JSON.parse(raw) : [];
}

export async function addToOfflineQueue(item: Record<string, unknown>): Promise<void> {
  const queue = await getOfflineQueue();
  queue.push(item);
  await AsyncStorage.setItem(KEYS.offlineQueue, JSON.stringify(queue));
}

export async function clearOfflineQueue(): Promise<void> {
  await AsyncStorage.setItem(KEYS.offlineQueue, JSON.stringify([]));
}
