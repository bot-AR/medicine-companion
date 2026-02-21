'use client';

interface AdherenceBarProps {
  percent: number;
  taken: number;
  total: number;
}

export default function AdherenceBar({ percent, taken, total }: AdherenceBarProps) {
  const color =
    percent >= 80 ? 'bg-green-500' : percent >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  const textColor =
    percent >= 80 ? 'text-green-600 dark:text-green-400' : percent >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
          Today&apos;s Adherence
        </span>
        <span className={`text-2xl font-bold ${textColor}`}>{percent}%</span>
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {taken} of {total} doses taken
        </span>
      </div>
      <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
