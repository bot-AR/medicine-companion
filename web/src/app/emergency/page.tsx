'use client';

import { useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { useAppStore } from '@/store/appStore';
import { getProfile } from '@/lib/storage';

export default function EmergencyPage() {
  const { profile, setProfile } = useAppStore();

  useEffect(() => {
    (async () => {
      const p = await getProfile();
      if (p) setProfile(p);
    })();
  }, [setProfile]);

  return (
    <div>
      <PageHeader title="Emergency" back />
      <div className="p-4 space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
          <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Emergency Contact</h2>
          {profile ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Name:</strong> {profile.emergencyContactName}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Phone:</strong>{' '}
                <a href={`tel:${profile.emergencyContactPhone}`} className="text-blue-600 dark:text-blue-400 underline">
                  {profile.emergencyContactPhone}
                </a>
              </p>
              {profile.caregiverName && (
                <>
                  <hr className="border-red-200 dark:border-red-800 my-2" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <strong>Caregiver:</strong> {profile.caregiverName}
                  </p>
                  {profile.caregiverPhone && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong>Phone:</strong>{' '}
                      <a href={`tel:${profile.caregiverPhone}`} className="text-blue-600 dark:text-blue-400 underline">
                        {profile.caregiverPhone}
                      </a>
                    </p>
                  )}
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No emergency contact set. Complete onboarding to add one.
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">In case of emergency</h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5 list-disc list-inside">
            <li>Call your emergency contact listed above</li>
            <li>Call emergency services (911)</li>
            <li>Do not take extra medication without medical advice</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
