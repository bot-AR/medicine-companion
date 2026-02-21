'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import MedicineCard from '@/components/medicines/MedicineCard';
import { useMedicines } from '@/hooks/useMedicines';

export default function MedicinesPage() {
  const router = useRouter();
  const { medicines, loadMedicines } = useMedicines();
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadMedicines();
  }, [loadMedicines]);

  const filtered = medicines.filter(
    (m) =>
      m.isActive &&
      (m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.brandName?.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div>
      <PageHeader
        title="Medicines"
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

      <div className="p-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search medicines..."
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
        />

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">💊</div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No medicines yet</p>
            <button
              onClick={() => router.push('/medicines/add')}
              className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-2"
            >
              Add your first medicine
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((med) => (
              <MedicineCard key={med.id} medicine={med} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
