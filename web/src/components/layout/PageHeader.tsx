'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  back?: boolean;
  right?: ReactNode;
}

export default function PageHeader({ title, back, right }: PageHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          {back && (
            <button
              onClick={() => router.back()}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h1>
        </div>
        {right && <div>{right}</div>}
      </div>
    </header>
  );
}
