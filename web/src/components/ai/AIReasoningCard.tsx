'use client';

import type { AIResponse } from '@medicine/shared';
import Button from '@/components/shared/Button';

interface AIReasoningCardProps {
  result: AIResponse;
  onApprove: () => void;
  onDismiss: () => void;
  approveLabel?: string;
  dismissLabel?: string;
}

const confidenceColors: Record<string, string> = {
  low: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};

export default function AIReasoningCard({
  result,
  onApprove,
  onDismiss,
  approveLabel = 'Approve',
  dismissLabel = 'Dismiss',
}: AIReasoningCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/30 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="font-semibold text-gray-900 dark:text-white">AI Suggestion</span>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${confidenceColors[result.confidence]}`}>
          {result.confidence.charAt(0).toUpperCase() + result.confidence.slice(1)} Confidence
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            <span>📋</span> Why
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">{result.reasoning}</p>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            <span>💡</span> Suggestion
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{result.suggestion}</p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
          <p className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
            <span className="shrink-0">⚠️</span>
            <span>{result.disclaimer}</span>
          </p>
        </div>
      </div>

      <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
        <Button onClick={onApprove} className="flex-1">
          ✓ {approveLabel}
        </Button>
        <Button variant="secondary" onClick={onDismiss} className="flex-1">
          ✗ {dismissLabel}
        </Button>
      </div>
    </div>
  );
}
