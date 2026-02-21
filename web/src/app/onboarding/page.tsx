'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Button from '@/components/shared/Button';
import { useAppStore } from '@/store/appStore';
import { sendToNative } from '@/lib/bridge';
import { saveProfile } from '@/lib/storage';
import { nowISO } from '@/lib/dateUtils';
import { generateId } from '@/lib/uuid';
import { showToast } from '@/components/shared/Toast';
import type { UserProfile, Theme } from '@medicine/shared';

interface Step1 { name: string; dateOfBirth: string }
interface Step2 { emergencyContactName: string; emergencyContactPhone: string }
interface Step3 { caregiverName: string; caregiverPhone: string; enableBiometric: boolean; pin: string }
interface Step4 { theme: Theme }

export default function OnboardingPage() {
  const router = useRouter();
  const setProfile = useAppStore((s) => s.setProfile);
  const setTheme = useAppStore((s) => s.setTheme);
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<Step1 & Step2 & Step3 & Step4>>({});

  const step1Form = useForm<Step1>();
  const step2Form = useForm<Step2>();
  const step3Form = useForm<Step3>({ defaultValues: { enableBiometric: true } });

  const onStep1 = (d: Step1) => { setData((p) => ({ ...p, ...d })); setStep(1); };
  const onStep2 = (d: Step2) => { setData((p) => ({ ...p, ...d })); setStep(2); };

  const onStep3 = async (d: Step3) => {
    setData((p) => ({ ...p, ...d }));
    if (d.pin) {
      const encoder = new TextEncoder();
      const hashBuf = await crypto.subtle.digest('SHA-256', encoder.encode(d.pin));
      const pinHash = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');
      sendToNative({
        event: 'AUTH_SETUP',
        requestId: generateId(),
        payload: { enableBiometric: d.enableBiometric, pinHash },
        timestamp: nowISO(),
      });
    }
    setStep(3);
  };

  const onStep4 = async (theme: Theme) => {
    const now = nowISO();
    const profile: UserProfile = {
      id: generateId(),
      name: data.name ?? '',
      dateOfBirth: data.dateOfBirth ?? '',
      emergencyContactName: data.emergencyContactName ?? '',
      emergencyContactPhone: data.emergencyContactPhone ?? '',
      caregiverName: data.caregiverName,
      caregiverPhone: data.caregiverPhone,
      biometricEnabled: data.enableBiometric ?? false,
      theme,
      createdAt: now,
      updatedAt: now,
    };

    await saveProfile(profile);
    setProfile(profile);
    setTheme(theme);

    sendToNative({
      event: 'PROFILE_SAVE',
      requestId: generateId(),
      payload: profile,
      timestamp: nowISO(),
    });

    showToast('Profile saved!');
    router.push('/dashboard');
  };

  const steps = ['Personal', 'Emergency', 'Security', 'Theme'];

  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Welcome</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Let&apos;s set up your profile</p>

        <div className="flex gap-2 mt-6">
          {steps.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 pb-8">
        {step === 0 && (
          <form onSubmit={step1Form.handleSubmit(onStep1)} className="flex flex-col gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
              <input
                {...step1Form.register('name', { required: 'Name is required' })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
              {step1Form.formState.errors.name && <p className="text-red-500 text-xs mt-1">{step1Form.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth *</label>
              <input
                type="date"
                {...step1Form.register('dateOfBirth', { required: 'Date of birth is required' })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {step1Form.formState.errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{step1Form.formState.errors.dateOfBirth.message}</p>}
            </div>
            <Button type="submit" size="lg" className="w-full mt-4">Next</Button>
          </form>
        )}

        {step === 1 && (
          <form onSubmit={step2Form.handleSubmit(onStep2)} className="flex flex-col gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emergency Contact Name *</label>
              <input
                {...step2Form.register('emergencyContactName', { required: 'Required' })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emergency Contact Phone *</label>
              <input
                type="tel"
                {...step2Form.register('emergencyContactPhone', { required: 'Required' })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" onClick={() => setStep(0)} className="flex-1">Back</Button>
              <Button type="submit" className="flex-1">Next</Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={step3Form.handleSubmit(onStep3)} className="flex flex-col gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Caregiver Name</label>
              <input
                {...step3Form.register('caregiverName')}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Caregiver Phone</label>
              <input
                type="tel"
                {...step3Form.register('caregiverPhone')}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional"
              />
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <input
                type="checkbox"
                {...step3Form.register('enableBiometric')}
                className="w-5 h-5 rounded text-blue-600"
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Enable Biometric Lock</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Use fingerprint to unlock the app</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Set PIN (4 digits) *</label>
              <input
                type="password"
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]{4}"
                {...step3Form.register('pin', { required: 'PIN is required', pattern: { value: /^[0-9]{4}$/, message: 'Must be 4 digits' } })}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-[0.5em]"
              />
              {step3Form.formState.errors.pin && <p className="text-red-500 text-xs mt-1">{step3Form.formState.errors.pin.message}</p>}
            </div>
            <div className="flex gap-3 mt-4">
              <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button type="submit" className="flex-1">Next</Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4 mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred theme</p>
            {(['light', 'dark'] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => onStep4(t)}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors bg-white dark:bg-gray-800"
              >
                <div className={`w-10 h-10 rounded-full ${t === 'light' ? 'bg-yellow-400' : 'bg-indigo-600'}`} />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white capitalize">{t}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t === 'light' ? 'Bright and clear' : 'Easy on the eyes'}
                  </p>
                </div>
              </button>
            ))}
            <Button variant="secondary" onClick={() => setStep(2)} className="mt-2">Back</Button>
          </div>
        )}
      </div>
    </div>
  );
}
