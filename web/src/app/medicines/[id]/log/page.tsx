'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import { getAllDoseLogs, getAllMedicines } from '@/lib/storage';
import { formatDate } from '@/lib/dateUtils';
import type { DoseLog, Medicine } from '@medicine/shared';

const statusColors: Record<string, string> = {
  taken: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300',
  missed: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300',
  skipped: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300',
  pending: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
  snoozed: 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300',
};

export default function DoseLogPage() {
  const { id } = useParams<{ id: string }>();
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [medicine, setMedicine] = useState<Medicine | null>(null);

  useEffect(() => {
    (async () => {
      const meds = await getAllMedicines();
      setMedicine(meds.find((m) => m.id === id) ?? null);
      const allLogs = await getAllDoseLogs();
      setLogs(allLogs.filter((l) => l.medicineId === id).sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt)));
    })();
  }, [id]);

  return (
    <div>
      <PageHeader title={medicine ? `${medicine.name} History` : 'Dose History'} back />
      <div className="p-4">
        {logs.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-12">No dose logs yet</p>
        ) : (
          <div className="flex flex-col gap-2">
            {logs.map((log) => (
              <div key={log.id} className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(log.scheduledAt)}</p>
                  {log.loggedAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Logged: {formatDate(log.loggedAt)}</p>
                  )}
                  {log.aiSuggested && (
                    <p className="text-xs text-blue-500 mt-0.5">AI assisted</p>
                  )}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[log.status]}`}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
