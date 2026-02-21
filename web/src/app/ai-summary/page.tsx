'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import AIReasoningCard from '@/components/ai/AIReasoningCard';
import Button from '@/components/shared/Button';
import { useAI } from '@/hooks/useAI';
import { useSchedule } from '@/hooks/useSchedule';
import { useAppStore } from '@/store/appStore';
import { sendRequest } from '@/lib/bridge';
import { showToast } from '@/components/shared/Toast';

export default function AISummaryPage() {
  const router = useRouter();
  const { run, loading, result, offline } = useAI();
  const { todayCards, adherence, loadToday } = useSchedule();
  const profile = useAppStore((s) => s.profile);
  const [editing, setEditing] = useState(false);
  const [editedMsg, setEditedMsg] = useState('');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  useEffect(() => {
    if (todayCards.length === 0) return;
    const missed = todayCards
      .filter((c) => c.status === 'missed' || c.status === 'skipped')
      .map((c) => `${c.medicineName} at ${c.scheduledTime}`);
    run('draft_caregiver_message', {
      patientName: profile?.name ?? 'Patient',
      adherencePercent: adherence.percent,
      totalDoses: adherence.total,
      takenDoses: adherence.taken,
      missedDoses: missed,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayCards.length, adherence.percent, profile?.name, run]);

  useEffect(() => {
    if (result) setEditedMsg(result.suggestion);
  }, [result]);

  const handleShare = async () => {
    const msg = editing ? editedMsg : result?.suggestion ?? '';
    setSharing(true);
    try {
      await sendRequest('SEND_MESSAGE', { body: msg, title: 'Medicine Companion - Daily Summary' });
      showToast('Message shared');
    } catch {
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({ title: 'Medicine Companion', text: msg });
          showToast('Message shared');
        } catch {
          showToast('Share cancelled', 'info');
        }
      } else {
        await navigator.clipboard.writeText(msg);
        showToast('Copied to clipboard');
      }
    }
    setSharing(false);
    router.push('/dashboard');
  };

  return (
    <div>
      <PageHeader title="Caregiver Summary" back />
      <div className="p-4 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{adherence.taken}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Taken</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {todayCards.filter((c) => c.status === 'missed').length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Missed</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{adherence.percent}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Adherence</p>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center py-12">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Drafting summary...</p>
          </div>
        )}

        {!loading && result && !editing && (
          <div className="space-y-3">
            <AIReasoningCard
              result={result}
              onApprove={handleShare}
              onDismiss={() => router.push('/dashboard')}
              approveLabel={sharing ? 'Sharing...' : 'Approve & Share'}
              dismissLabel="Cancel"
            />
            <Button variant="ghost" onClick={() => setEditing(true)} className="w-full">
              Edit message before sharing
            </Button>
          </div>
        )}

        {!loading && result && editing && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Edit Message</label>
              <textarea
                value={editedMsg}
                onChange={(e) => setEditedMsg(e.target.value)}
                rows={8}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleShare} loading={sharing} className="flex-1">Share</Button>
              <Button variant="secondary" onClick={() => setEditing(false)} className="flex-1">Back to preview</Button>
            </div>
          </div>
        )}

        {!loading && offline && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">📡</span>
              <span className="font-semibold text-gray-900 dark:text-white">AI Unavailable</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Cannot generate AI summary right now. You can still share a basic report.
            </p>
            <Button
              onClick={async () => {
                const basicMsg = `Medicine Companion Report\n\nPatient: ${profile?.name ?? 'N/A'}\nAdherence: ${adherence.percent}%\nDoses taken: ${adherence.taken}/${adherence.total}\n\nPlease check in with your loved one.`;
                setEditedMsg(basicMsg);
                setEditing(true);
              }}
              className="w-full"
            >
              Create Basic Report
            </Button>
            <Button variant="secondary" onClick={() => router.push('/dashboard')} className="w-full">
              Back to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
