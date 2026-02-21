'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import Button from '@/components/shared/Button';
import type { MedicineForm as MedForm, FrequencyUnit } from '@medicine/shared';

interface FormValues {
  name: string;
  brandName: string;
  strength: number;
  unit: string;
  form: MedForm;
  frequency: FrequencyUnit;
  instructions: string;
  prescribedBy: string;
  startDate: string;
  endDate: string;
}

interface MedicineFormProps {
  onSubmit: (
    med: FormValues,
    times: string[],
  ) => Promise<void>;
}

export default function MedicineFormComponent({ onSubmit }: MedicineFormProps) {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormValues>({
    defaultValues: {
      unit: 'mg',
      form: 'tablet',
      frequency: 'daily',
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const [times, setTimes] = useState<string[]>(['08:00']);
  const [submitting, setSubmitting] = useState(false);

  const addTime = () => setTimes((t) => [...t, '12:00']);
  const removeTime = (i: number) => setTimes((t) => t.filter((_, idx) => idx !== i));
  const updateTime = (i: number, val: string) =>
    setTimes((t) => t.map((v, idx) => (idx === i ? val : v)));

  const freq = watch('frequency');

  const doSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      await onSubmit(data, times);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(doSubmit)} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Medicine Name *
        </label>
        <input
          {...register('name', { required: 'Name is required' })}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g. Metformin"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Brand Name
        </label>
        <input
          {...register('brandName')}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Optional"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Strength *
          </label>
          <input
            type="number"
            {...register('strength', { required: 'Required', valueAsNumber: true, min: 1 })}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="500"
          />
          {errors.strength && <p className="text-red-500 text-xs mt-1">{errors.strength.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Unit
          </label>
          <select
            {...register('unit')}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="mg">mg</option>
            <option value="ml">ml</option>
            <option value="mcg">mcg</option>
            <option value="IU">IU</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Form
          </label>
          <select
            {...register('form')}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="tablet">Tablet</option>
            <option value="capsule">Capsule</option>
            <option value="liquid">Liquid</option>
            <option value="injection">Injection</option>
            <option value="patch">Patch</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Frequency
          </label>
          <select
            {...register('frequency')}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="as_needed">As Needed</option>
          </select>
        </div>
      </div>

      {freq !== 'as_needed' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Scheduled Times
          </label>
          <div className="flex flex-col gap-2">
            {times.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="time"
                  value={t}
                  onChange={(e) => updateTime(i, e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {times.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTime(i)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addTime}
              className="text-sm text-blue-600 dark:text-blue-400 font-medium py-1"
            >
              + Add another time
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Instructions
        </label>
        <input
          {...register('instructions')}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g. Take with food"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Date *
          </label>
          <input
            type="date"
            {...register('startDate', { required: 'Required' })}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Date
          </label>
          <input
            type="date"
            {...register('endDate')}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Prescribed By
        </label>
        <input
          {...register('prescribedBy')}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Doctor name"
        />
      </div>

      <Button type="submit" size="lg" loading={submitting} className="w-full mt-2">
        Save Medicine
      </Button>
    </form>
  );
}
