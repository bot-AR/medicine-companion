'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/shared/Button';
import { getAllMedicines, getAllSchedules, deleteMedicine, deleteSchedule } from '@/lib/storage';
import { formatTime } from '@/lib/dateUtils';
import { showToast } from '@/components/shared/Toast';
import type { Medicine, DoseSchedule } from '@medicine/shared';

export default function MedicineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  const [schedule, setSchedule] = useState<DoseSchedule | null>(null);

  useEffect(() => {
    (async () => {
      const meds = await getAllMedicines();
      setMedicine(meds.find((m) => m.id === id) ?? null);
      const scheds = await getAllSchedules();
      setSchedule(scheds.find((s) => s.medicineId === id) ?? null);
    })();
  }, [id]);

  const handleDelete = async () => {
    if (!medicine) return;
    await deleteMedicine(medicine.id);
    if (schedule) await deleteSchedule(schedule.id);
    showToast('Medicine deleted');
    router.push('/medicines');
  };

  if (!medicine) {
    return (
      <div>
        <PageHeader title="Medicine" back />
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={medicine.name} back />
      <div className="p-4 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Strength</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{medicine.strength}{medicine.unit}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Form</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{medicine.form}</span>
          </div>
          {medicine.instructions && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Instructions</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{medicine.instructions}</span>
            </div>
          )}
          {medicine.prescribedBy && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Prescribed by</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{medicine.prescribedBy}</span>
            </div>
          )}
        </div>

        {schedule && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Schedule</h3>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Frequency</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{schedule.frequency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Times</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {schedule.scheduledTimes.map(formatTime).join(', ')}
              </span>
            </div>
          </div>
        )}

        <Button
          onClick={() => router.push(`/medicines/${id}/log`)}
          variant="secondary"
          className="w-full"
        >
          View Dose History
        </Button>

        <Button variant="danger" onClick={handleDelete} className="w-full">
          Delete Medicine
        </Button>
      </div>
    </div>
  );
}
