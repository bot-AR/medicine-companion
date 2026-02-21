'use client';

import { useCallback, useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { generateId } from '@/lib/uuid';
import * as storage from '@/lib/storage';
import { todayISO, nowISO } from '@/lib/dateUtils';
import { buildTodayCards, calcAdherence, type DoseCardData, type AdherenceData } from '@/lib/scheduleUtils';
import type { DoseLog, DoseStatus } from '@medicine/shared';

export function useSchedule() {
  const { medicines, schedules, doseLogs, addDoseLog, setDoseLogs, setMedicines, setSchedules } =
    useAppStore();
  const [loading, setLoading] = useState(false);

  const loadToday = useCallback(async () => {
    setLoading(true);
    try {
      const meds = await storage.getAllMedicines();
      setMedicines(meds);
      const scheds = await storage.getAllSchedules();
      setSchedules(scheds);
      const logs = await storage.getDoseLogsByDate(todayISO());
      setDoseLogs(logs);
    } finally {
      setLoading(false);
    }
  }, [setMedicines, setSchedules, setDoseLogs]);

  const todayCards: DoseCardData[] = buildTodayCards(medicines, schedules, doseLogs);
  const adherence: AdherenceData = calcAdherence(todayCards);

  const logDose = useCallback(
    async (
      card: DoseCardData,
      status: DoseStatus,
      extra?: { aiSuggested?: boolean; aiReasoning?: string; notes?: string },
    ) => {
      const log: DoseLog = {
        id: card.logId ?? generateId(),
        scheduleId: card.scheduleId,
        medicineId: card.medicineId,
        userId: 'user-1',
        scheduledAt: `${todayISO()}T${card.scheduledTime}:00`,
        loggedAt: nowISO(),
        status,
        aiSuggested: extra?.aiSuggested ?? false,
        aiReasoning: extra?.aiReasoning,
        notes: extra?.notes,
        createdAt: nowISO(),
      };
      await storage.saveDoseLog(log);
      addDoseLog(log);
      return log;
    },
    [addDoseLog],
  );

  return { todayCards, adherence, loadToday, logDose, loading };
}
