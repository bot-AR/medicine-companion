'use client';

import { useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import { generateId } from '@/lib/uuid';
import { sendRequest } from '@/lib/bridge';
import * as storage from '@/lib/storage';
import { nowISO } from '@/lib/dateUtils';
import type { Medicine, DoseSchedule } from '@medicine/shared';

export function useMedicines() {
  const { medicines, schedules, addMedicine, addSchedule, setMedicines, setSchedules } =
    useAppStore();

  const loadMedicines = useCallback(async () => {
    const meds = await storage.getAllMedicines();
    setMedicines(meds);
    const scheds = await storage.getAllSchedules();
    setSchedules(scheds);
  }, [setMedicines, setSchedules]);

  const saveMedicineWithSchedule = useCallback(
    async (
      medData: Omit<Medicine, 'id' | 'userId' | 'isActive' | 'createdAt' | 'updatedAt'>,
      schedData: { frequency: DoseSchedule['frequency']; scheduledTimes: string[]; startDate: string; endDate?: string },
    ) => {
      const now = nowISO();
      const med: Medicine = {
        ...medData,
        id: generateId(),
        userId: 'user-1',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      const sched: DoseSchedule = {
        id: generateId(),
        medicineId: med.id,
        userId: 'user-1',
        frequency: schedData.frequency,
        timesPerDay: schedData.scheduledTimes.length,
        scheduledTimes: schedData.scheduledTimes,
        startDate: schedData.startDate,
        endDate: schedData.endDate,
        notificationIds: [],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      await storage.saveMedicine(med);
      await storage.saveSchedule(sched);
      addMedicine(med);
      addSchedule(sched);

      try {
        const result = await sendRequest('SCHEDULE_SAVE', { medicine: med, schedule: sched });
        if (result.event === 'NOTIFICATION_RESULT') {
          const ids = (result.payload as { notificationIds?: string[] })?.notificationIds ?? [];
          sched.notificationIds = ids;
          await storage.saveSchedule(sched);
        }
      } catch {
        /* bridge unavailable in browser */
      }

      try {
        await sendRequest('NOTIFICATION_SCHEDULE', {
          scheduleId: sched.id,
          medicineName: `${med.name} ${med.strength}${med.unit}`,
          scheduledTimes: sched.scheduledTimes,
          startDate: sched.startDate,
          repeatDaily: sched.frequency === 'daily',
        });
      } catch {
        /* bridge unavailable */
      }

      return { medicine: med, schedule: sched };
    },
    [addMedicine, addSchedule],
  );

  return { medicines, schedules, loadMedicines, saveMedicineWithSchedule };
}
