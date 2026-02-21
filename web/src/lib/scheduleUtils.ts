import type { DoseSchedule, DoseLog, Medicine, DoseStatus } from '@medicine/shared';
import { todayISO, currentTimeStr } from './dateUtils';

export interface DoseCardData {
  scheduleId: string;
  medicineId: string;
  medicineName: string;
  strength: number;
  unit: string;
  scheduledTime: string;
  status: DoseStatus;
  logId?: string;
  instructions?: string;
}

export interface AdherenceData {
  percent: number;
  taken: number;
  total: number;
}

export function buildTodayCards(
  medicines: Medicine[],
  schedules: DoseSchedule[],
  logs: DoseLog[],
): DoseCardData[] {
  const today = todayISO();
  const cards: DoseCardData[] = [];

  for (const sched of schedules) {
    if (!sched.isActive) continue;
    if (sched.startDate > today) continue;
    if (sched.endDate && sched.endDate < today) continue;

    const med = medicines.find((m) => m.id === sched.medicineId);
    if (!med || !med.isActive) continue;

    for (const time of sched.scheduledTimes) {
      const scheduledAt = `${today}T${time}:00`;
      const log = logs.find(
        (l) => l.scheduleId === sched.id && l.scheduledAt === scheduledAt,
      );

      let status: DoseStatus = 'pending';
      if (log) {
        status = log.status;
      }

      cards.push({
        scheduleId: sched.id,
        medicineId: med.id,
        medicineName: med.name,
        strength: med.strength,
        unit: med.unit,
        scheduledTime: time,
        status,
        logId: log?.id,
        instructions: med.instructions,
      });
    }
  }

  return cards.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}

export function calcAdherence(cards: DoseCardData[]): AdherenceData {
  if (cards.length === 0) return { percent: 100, taken: 0, total: 0 };

  const now = currentTimeStr();
  const pastOrActioned = cards.filter((c) => c.status !== 'pending' || c.scheduledTime <= now);
  const taken = cards.filter((c) => c.status === 'taken').length;

  if (pastOrActioned.length === 0) return { percent: 100, taken: 0, total: cards.length };

  return {
    percent: Math.round((taken / pastOrActioned.length) * 100),
    taken,
    total: cards.length,
  };
}
