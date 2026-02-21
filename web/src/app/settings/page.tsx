'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/shared/Button';
import { useAppStore } from '@/store/appStore';
import { getProfile, saveProfile } from '@/lib/storage';
import { sendToNative, sendRequest } from '@/lib/bridge';
import { nowISO } from '@/lib/dateUtils';
import { generateId } from '@/lib/uuid';
import { showToast } from '@/components/shared/Toast';
import type { Theme } from '@medicine/shared';

export default function SettingsPage() {
  const router = useRouter();
  const { profile, setProfile, theme, setTheme } = useAppStore();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await getProfile();
      if (p) {
        setProfile(p);
        setName(p.name);
        setDob(p.dateOfBirth);
        setEmergencyName(p.emergencyContactName);
        setEmergencyPhone(p.emergencyContactPhone);
        setBiometricEnabled(p.biometricEnabled);
      }
      setLoading(false);
    })();
  }, [setProfile]);

  const handleThemeChange = (t: Theme) => {
    setTheme(t);
    sendToNative({
      event: 'THEME_SET',
      requestId: generateId(),
      payload: { theme: t },
      timestamp: nowISO(),
    });
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    if (!name.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }
    const updated = {
      ...profile,
      name: name.trim(),
      dateOfBirth: dob,
      emergencyContactName: emergencyName.trim(),
      emergencyContactPhone: emergencyPhone.trim(),
      updatedAt: nowISO(),
    };
    await saveProfile(updated);
    setProfile(updated);
    setEditingProfile(false);
    showToast('Profile updated');

    try {
      await sendRequest('PROFILE_SAVE', updated);
    } catch { /* bridge unavailable */ }
  };

  const handleBiometricToggle = async () => {
    const newVal = !biometricEnabled;
    setBiometricEnabled(newVal);
    if (profile) {
      const updated = { ...profile, biometricEnabled: newVal, updatedAt: nowISO() };
      await saveProfile(updated);
      setProfile(updated);
    }
    try {
      await sendRequest('AUTH_SETUP', { enableBiometric: newVal });
    } catch { /* bridge unavailable */ }
    showToast(newVal ? 'Biometric enabled' : 'Biometric disabled');
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Settings" />
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm animate-pulse h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" />
      <div className="p-4 space-y-4">
        {/* Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Profile</h3>
            {profile && !editingProfile && (
              <button onClick={() => setEditingProfile(true)} className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Edit
              </button>
            )}
          </div>

          {profile && !editingProfile && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Name</span>
                <span className="text-gray-900 dark:text-white font-medium">{profile.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Date of Birth</span>
                <span className="text-gray-900 dark:text-white">{profile.dateOfBirth}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Emergency Contact</span>
                <span className="text-gray-900 dark:text-white">{profile.emergencyContactName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Phone</span>
                <span className="text-gray-900 dark:text-white">{profile.emergencyContactPhone}</span>
              </div>
            </div>
          )}

          {profile && editingProfile && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Full Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Date of Birth</label>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Emergency Contact Name</label>
                <input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Emergency Contact Phone</label>
                <input type="tel" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile} className="flex-1">Save</Button>
                <Button variant="secondary" onClick={() => setEditingProfile(false)} className="flex-1">Cancel</Button>
              </div>
            </div>
          )}

          {!profile && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No profile set up yet</p>
              <Button size="sm" onClick={() => router.push('/onboarding')}>Complete Setup</Button>
            </div>
          )}
        </div>

        {/* Security Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Security</h3>
          <button
            onClick={handleBiometricToggle}
            className="flex items-center justify-between w-full py-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🔐</span>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Biometric Lock</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Require fingerprint/face to open app</p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors ${biometricEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${biometricEnabled ? 'translate-x-5.5 ml-[22px]' : 'ml-0.5'}`} />
            </div>
          </button>
        </div>

        {/* Appearance Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">Appearance</h3>
          <div className="flex gap-3">
            {(['light', 'dark'] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => handleThemeChange(t)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium capitalize transition-colors ${
                  theme === t
                    ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <span>{t === 'light' ? '☀️' : '🌙'}</span>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Emergency Section */}
        <button
          onClick={() => router.push('/emergency')}
          className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🚨</span>
            <div>
              <h3 className="font-semibold text-red-600 dark:text-red-400">Emergency Information</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">View emergency contacts and instructions</p>
            </div>
          </div>
        </button>

        {/* About Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm space-y-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">About</h3>
          <div className="space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex justify-between">
              <span>App</span>
              <span className="text-gray-900 dark:text-white">Medicine Companion</span>
            </div>
            <div className="flex justify-between">
              <span>Version</span>
              <span className="text-gray-900 dark:text-white">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span>Purpose</span>
              <span className="text-gray-900 dark:text-white">Elderly medication safety</span>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mt-3">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              This app is not a substitute for professional medical advice. Always consult your healthcare provider.
            </p>
          </div>
        </div>
      </div>

      <div className="h-20" />
    </div>
  );
}
