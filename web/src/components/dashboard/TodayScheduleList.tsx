'use client';

import DoseCard from './DoseCard';
import type { DoseCardData } from '@/lib/scheduleUtils';

interface TodayScheduleListProps {
  cards: DoseCardData[];
  onTake: (card: DoseCardData) => void;
  onMissed: (card: DoseCardData) => void;
  onSkip?: (card: DoseCardData) => void;
  loading?: boolean;
  highlightedId?: string;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-14 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>
          <div className="h-5 w-36 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function TodayScheduleList({ cards, onTake, onMissed, onSkip, loading, highlightedId }: TodayScheduleListProps) {
  if (loading) return <LoadingSkeleton />;

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl block mb-3">💊</span>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No medicines scheduled for today.
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
          Add a medicine to get started.
        </p>
      </div>
    );
  }

  const pending = cards.filter((c) => c.status === 'pending');
  const completed = cards.filter((c) => c.status !== 'pending');

  return (
    <div className="space-y-3">
      {pending.length > 0 && (
        <div className="space-y-3">
          {pending.map((card) => (
            <DoseCard
              key={`${card.scheduleId}-${card.scheduledTime}`}
              card={card}
              onTake={onTake}
              onMissed={onMissed}
              onSkip={onSkip}
              highlighted={highlightedId === card.scheduleId}
            />
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-3">
          {pending.length > 0 && (
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide pt-2">
              Completed
            </p>
          )}
          {completed.map((card) => (
            <DoseCard
              key={`${card.scheduleId}-${card.scheduledTime}`}
              card={card}
              onTake={onTake}
              onMissed={onMissed}
              onSkip={onSkip}
            />
          ))}
        </div>
      )}
    </div>
  );
}
