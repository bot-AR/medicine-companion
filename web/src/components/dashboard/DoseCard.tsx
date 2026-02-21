'use client';

import { formatTime } from '@/lib/dateUtils';
import type { DoseCardData } from '@/lib/scheduleUtils';
import Button from '@/components/shared/Button';

interface DoseCardProps {
  card: DoseCardData;
  onTake: (card: DoseCardData) => void;
  onMissed: (card: DoseCardData) => void;
  onSkip?: (card: DoseCardData) => void;
  highlighted?: boolean;
}

const statusStyles: Record<string, { bg: string; badge: string; label: string; icon: string }> = {
  pending: { bg: 'border-l-blue-500', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', label: 'Pending', icon: '⏳' },
  taken: { bg: 'border-l-green-500', badge: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', label: 'Taken', icon: '✅' },
  missed: { bg: 'border-l-red-500', badge: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', label: 'Missed', icon: '❌' },
  skipped: { bg: 'border-l-yellow-500', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', label: 'Skipped', icon: '⏭️' },
  snoozed: { bg: 'border-l-purple-500', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300', label: 'Snoozed', icon: '💤' },
};

export default function DoseCard({ card, onTake, onMissed, onSkip, highlighted }: DoseCardProps) {
  const style = statusStyles[card.status] ?? statusStyles.pending;
  const isPending = card.status === 'pending';

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border-l-4 ${style.bg} p-4 shadow-sm transition-all ${
        highlighted ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {formatTime(card.scheduledTime)}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
              {style.icon} {style.label}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {card.medicineName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {card.strength}
            {card.unit}
            {card.instructions ? ` — ${card.instructions}` : ''}
          </p>
        </div>
        {!isPending && (
          <span className="text-xl ml-2">{style.icon}</span>
        )}
      </div>

      {isPending && (
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={() => onTake(card)} className="flex-1">
            ✅ Take
          </Button>
          <Button size="sm" variant="danger" onClick={() => onMissed(card)} className="flex-1">
            ❌ Missed
          </Button>
          {onSkip && (
            <Button size="sm" variant="secondary" onClick={() => onSkip(card)} className="flex-1">
              ⏭️ Skip
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
