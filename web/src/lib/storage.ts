import { openDB, type IDBPDatabase } from 'idb';
import type { Medicine, DoseSchedule, DoseLog, UserProfile } from '@medicine/shared';

const DB_NAME = 'medicine-companion';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('medicines')) {
          db.createObjectStore('medicines', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('schedules')) {
          db.createObjectStore('schedules', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('doseLogs')) {
          const store = db.createObjectStore('doseLogs', { keyPath: 'id' });
          store.createIndex('byDate', 'scheduledAt');
        }
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllMedicines(): Promise<Medicine[]> {
  const db = await getDB();
  return db.getAll('medicines');
}

export async function saveMedicine(med: Medicine): Promise<void> {
  const db = await getDB();
  await db.put('medicines', med);
}

export async function deleteMedicine(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('medicines', id);
}

export async function getAllSchedules(): Promise<DoseSchedule[]> {
  const db = await getDB();
  return db.getAll('schedules');
}

export async function saveSchedule(sched: DoseSchedule): Promise<void> {
  const db = await getDB();
  await db.put('schedules', sched);
}

export async function deleteSchedule(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('schedules', id);
}

export async function getAllDoseLogs(): Promise<DoseLog[]> {
  const db = await getDB();
  return db.getAll('doseLogs');
}

export async function getDoseLogsByDate(date: string): Promise<DoseLog[]> {
  const all = await getAllDoseLogs();
  return all.filter((log) => log.scheduledAt.startsWith(date));
}

export async function saveDoseLog(log: DoseLog): Promise<void> {
  const db = await getDB();
  await db.put('doseLogs', log);
}

export async function getProfile(): Promise<UserProfile | undefined> {
  const db = await getDB();
  const all = await db.getAll('profile');
  return all[0];
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  const db = await getDB();
  await db.put('profile', profile);
}
