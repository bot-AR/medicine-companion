'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import AIReasoningCard from '@/components/ai/AIReasoningCard';
import AIOfflineFallback from '@/components/ai/AIOfflineFallback';
import Button from '@/components/shared/Button';
import { useAI } from '@/hooks/useAI';
import { useSchedule } from '@/hooks/useSchedule';
import { useAppStore } from '@/store/appStore';
import { currentTimeStr, hoursBetween, formatTime } from '@/lib/dateUtils';
import { showToast } from '@/components/shared/Toast';
import type { DoseCardData } from '@/lib/scheduleUtils';

export default function MissedDosePageWrapper() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-gray-500">Loading...</div>}>
      <MissedDosePage />
    </Suspense>
  );
}

function MissedDosePage() {
  const params = useSearchParams();
  const router = useRouter();
  const { run, loading, result, offline } = useAI();
  const { todayCards, logDose, loadToday } = useSchedule();
  const medicines = useAppStore((s) => s.medicines);
  const schedules = useAppStore((s) => s.schedules);
  const [actionTaken, setActionTaken] = useState(false);

  const scheduleId = params.get('scheduleId');
  const time = params.get('time');
  const medicineId = params.get('medicineId');

  const card: DoseCardData | undefined = useMemo(
    () => todayCards.find((c) => c.scheduleId === scheduleId && c.scheduledTime === time),
    [todayCards, scheduleId, time],
  );

  const medicine = medicines.find((m) => m.id === medicineId);
  const schedule = schedules.find((s) => s.id === scheduleId);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  useEffect(() => {
    if (!medicine || !schedule || !time) return;
    const now = currentTimeStr();
    const nextTimes = schedule.scheduledTimes.filter((t) => t > now);
    const nextDoseTime = nextTimes[0] ?? 'N/A';

    run('missed_dose_advice', {
      medicineName: medicine.name,
      strength: medicine.strength,
      unit: medicine.unit,
      scheduledTime: time,
      currentTime: now,
      nextDoseTime,
      hoursSinceMissed: hoursBetween(time, now).toFixed(1),
      instructions: medicine.instructions ?? 'none',
    });
  }, [medicine, schedule, time, run]);

  const handleApproveSkip = async () => {
    if (!card || !result) return;
    await logDose(card, 'skipped', { aiSuggested: true, aiReasoning: result.reasoning });
    setActionTaken(true);
    showToast('Dose skipped (AI approved)');
    router.push('/dashboard');
  };

  const handleMarkMissed = async () => {
    if (!card) return;
    await logDose(card, 'missed');
    setActionTaken(true);
    showToast('Dose marked as missed');
    router.push('/dashboard');
  };

  const handleTakeNow = async () => {
    if (!card) return;
    await logDose(card, 'taken', { notes: 'Taken late' });
    setActionTaken(true);
    showToast('Dose taken (late)');
    router.push('/dashboard');
  };

  if (!medicine && !loading) {
    return (
      <div>
        <PageHeader title="Missed Dose" back />
        <div className="p-4 text-center py-12">
          <span className="text-4xl block mb-3">🔍</span>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Medicine not found.</p>
          <Button variant="secondary" onClick={() => router.push('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Missed Dose" back />
      <div className="p-4 space-y-4">
        {medicine && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{medicine.name}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {medicine.strength}{medicine.unit} &middot; Scheduled at {time ? formatTime(time) : ''}
            </p>
            {time && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {hoursBetween(time, currentTimeStr()).toFixed(0)}h since scheduled time
              </p>
            )}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center py-12">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Getting AI advice...</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">AI will never act automatically</p>
          </div>
        )}

        {!loading && result && !actionTaken && (
          <div className="space-y-3">
            <AIReasoningCard
              result={result}
              onApprove={handleApproveSkip}
              onDismiss={handleMarkMissed}
              approveLabel="Approve & Skip"
              dismissLabel="Mark Missed"
            />
            <Button variant="primary" onClick={handleTakeNow} className="w-full">
              Take Now (Late)
            </Button>
          </div>
        )}

        {!loading && offline && !actionTaken && (
          <AIOfflineFallback onMarkMissed={handleMarkMissed} onTakeNow={handleTakeNow} />
        )}
      </div>
    </div>
  );
}
