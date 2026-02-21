'use client';

import Link from 'next/link';
import type { Medicine } from '@medicine/shared';

interface MedicineCardProps {
  medicine: Medicine;
}

const formIcons: Record<string, string> = {
  tablet: '💊',
  capsule: '💊',
  liquid: '🧴',
  injection: '💉',
  patch: '🩹',
  other: '💊',
};

export default function MedicineCard({ medicine }: MedicineCardProps) {
  return (
    <Link
      href={`/medicines/${medicine.id}`}
      className="block bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">{formIcons[medicine.form] ?? '💊'}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {medicine.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {medicine.strength}{medicine.unit} &middot; {medicine.form}
          </p>
          {medicine.instructions && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
              {medicine.instructions}
            </p>
          )}
        </div>
        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </Link>
  );
}
