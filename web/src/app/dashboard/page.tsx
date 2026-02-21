'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import AdherenceBar from '@/components/dashboard/AdherenceBar';
import TodayScheduleList from '@/components/dashboard/TodayScheduleList';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import { useSchedule } from '@/hooks/useSchedule';
import { showToast } from '@/components/shared/Toast';
import type { DoseCardData } from '@/lib/scheduleUtils';

function DashboardContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { todayCards, adherence, loadToday, logDose, loading } = useSchedule();
  const [confirmCard, setConfirmCard] = useState<DoseCardData | null>(null);
  const [confirmAction, setConfirmAction] = useState<'take' | 'skip'>('take');
  const highlightedId = params.get('highlight') ?? undefined;

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  const handleConfirmTake = (card: DoseCardData) => {
    setConfirmCard(card);
    setConfirmAction('take');
  };

  const handleConfirmSkip = (card: DoseCardData) => {
    setConfirmCard(card);
    setConfirmAction('skip');
  };

  const handleConfirm = async () => {
    if (!confirmCard) return;
    if (confirmAction === 'take') {
      await logDose(confirmCard, 'taken');
      showToast('Dose marked as taken');
    } else {
      await logDose(confirmCard, 'skipped', { notes: 'Skipped by user' });
      showToast('Dose skipped');
    }
    setConfirmCard(null);
    await loadToday();
  };

  const handleMissed = (card: DoseCardData) => {
    router.push(`/missed?scheduleId=${card.scheduleId}&time=${card.scheduledTime}&medicineId=${card.medicineId}`);
  };

  const pendingCount = todayCards.filter((c) => c.status === 'pending').length;

  return (
    <div>
      <PageHeader
        title="Today"
        right={
          <button
            onClick={() => router.push('/medicines/add')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-blue-600 dark:text-blue-400"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        }
      />

      <div className="p-4 flex flex-col gap-4">
        <AdherenceBar percent={adherence.percent} taken={adherence.taken} total={adherence.total} />

        {pendingCount > 0 && !loading && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              {pendingCount} dose{pendingCount > 1 ? 's' : ''} pending today
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Schedule</h2>
          <button
            onClick={() => router.push('/ai-summary')}
            className="text-sm text-blue-600 dark:text-blue-400 font-medium"
          >
            AI Summary
          </button>
        </div>

        <TodayScheduleList
          cards={todayCards}
          onTake={handleConfirmTake}
          onMissed={handleMissed}
          onSkip={handleConfirmSkip}
          loading={loading}
          highlightedId={highlightedId}
        />
      </div>

      <Modal open={!!confirmCard} onClose={() => setConfirmCard(null)} title={confirmAction === 'take' ? 'Confirm Dose' : 'Skip Dose'}>
        {confirmCard && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {confirmAction === 'take'
                ? <>Mark <strong>{confirmCard.medicineName}</strong> ({confirmCard.strength}{confirmCard.unit}) as taken?</>
                : <>Skip <strong>{confirmCard.medicineName}</strong> ({confirmCard.strength}{confirmCard.unit})? This will be recorded in your history.</>
              }
            </p>
            <div className="flex gap-3">
              <Button onClick={handleConfirm} variant={confirmAction === 'take' ? 'primary' : 'secondary'} className="flex-1">
                {confirmAction === 'take' ? 'Confirm Take' : 'Confirm Skip'}
              </Button>
              <Button variant="secondary" onClick={() => setConfirmCard(null)} className="flex-1">Cancel</Button>
            </div>
          </div>
        )}
      </Modal>

      <div className="h-20" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-gray-500">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
