'use client';

import Button from '@/components/shared/Button';

interface AIOfflineFallbackProps {
  onMarkMissed: () => void;
  onTakeNow: () => void;
}

export default function AIOfflineFallback({ onMarkMissed, onTakeNow }: AIOfflineFallbackProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">📡</span>
          <span className="font-semibold text-gray-900 dark:text-white">AI Unavailable</span>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          AI assistance is currently unavailable. Please consult your doctor or caregiver for advice on missed doses.
        </p>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mt-3">
          <p className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
            <span className="shrink-0">⚠️</span>
            <span>Always consult your healthcare provider before making decisions about missed medications.</span>
          </p>
        </div>
      </div>

      <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
        <Button onClick={onTakeNow} className="flex-1">
          Take Now
        </Button>
        <Button variant="danger" onClick={onMarkMissed} className="flex-1">
          Mark Missed
        </Button>
      </div>
    </div>
  );
}
